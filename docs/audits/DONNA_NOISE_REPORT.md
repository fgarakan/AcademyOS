# DONNA Noise Report V1

**Sprint 2020A — June 2026**

> Every unnecessary recommendation destroys trust faster than no recommendation.
> Every false alarm conditions the director to ignore real ones.

---

## What Is Noise?

A noise signal is any DONNA output that:
- Appears when it should not
- Is too vague to act on
- Creates work instead of removing it
- A reasonable director would dismiss immediately
- Could be wrong without the director knowing

---

## Noise Category 1: Proxy Signal Conflation

### `parents-communication-gap` + `parents-overdue-updates` — same source, two signals

**Source:** Both fire from `parentUpdatesPendingApproval`.

**Problem:** `parentUpdatesPendingApproval` counts approvals pending in the review queue — items that haven't been director-approved for sending to parents. This is a workflow bottleneck, not a communication gap. A director who has approved all updates and sent them has zero pending — but the signal would show zero too, even if some parents haven't received an update in weeks.

**Noise type:** Semantic mismatch — signal name implies one thing, data measures another.

**Risk:** Director sees "23 parents without recent updates" and worries about a communication breakdown. The actual issue is 23 queued updates waiting for director approval — a different problem with a different solution.

**Recommendation:** Surface as one signal. Rename to reflect what it actually measures: "X parent updates awaiting your approval."

---

## Noise Category 2: Never-Firing Signals Still Generating Fallbacks

When certain situation types are detected (e.g., `player_progression_bottleneck`) but the specific data fields are zero, the engine generates fallback candidates like:

> "Investigate player progression bottleneck — load player progression data to identify which levels are blocking advancement."

**Problem:** This priority fires when the situation classifier has detected enough signals to classify the situation, but the individual signal fields are zero because data isn't loaded. The director sees a priority telling them to "load data" — which is meta-advice, not operational advice.

**Noise type:** Fallback priority reaching the surface.

**When it fires:** Any time a situation type is detected but the associated data fields are zeros (which is currently most of the time, given the hardcoded zeros in the data pipeline).

**Recommendation:** Add a pre-check: if the specific data fields supporting a situation type are all zero, do not generate operational priorities for that situation. Generate a single "data loading required" signal instead, or stay silent.

---

## Noise Category 3: Generic Decision Prompts Adding No Value

The `decisionPrompt` field on every `DirectorDecision` is intended to frame the decision as a binary choice. Current implementation:

- `immediate` urgency → "Act now or escalate?" (always)
- `players` domain → "Review now or defer to next session?"
- `coaches` domain → "Follow up now or schedule a check-in?"
- `curriculum` domain → "Approve the change or investigate further?"
- `parents` domain → "Send an update or schedule a conversation?"
- `system` domain → "Complete setup or continue without it?"

**Problem:** These prompts are domain-generic. A director with three `immediate` priorities sees three cards all asking "Act now or escalate?" — the prompt adds zero information.

**Noise type:** Visual clutter — space consumed by content that doesn't differentiate.

**Example of noise:** Priority is "Clear 12 outstanding session recaps." The decision prompt says "Follow up now or schedule a check-in?" The real binary is "Call the coaches directly or send a group message?" The current prompt is answerable without knowing anything about the specific situation.

**Recommendation:** Generate decision prompts from the specific priority content, not from domain/urgency buckets.

---

## Noise Category 4: Action Drafts Without Entity Context

`create_coach_note` and `create_player_note` generate drafts that navigate to a player profile to add a note. They require an `entityId` (a specific player ID) to be useful.

When generated from `buildDraftFromDecision`, `entityId = null`. The `baseRoute` is `/director/players/{entityId}?tab=notes`, which resolves to `/director/players?tab=notes` when entityId is null.

**Problem:** The draft says "Create Coach Note" but navigates to the player directory, not to a specific player. The director arrives at the player list, confused about what to do next.

**Noise type:** Action draft that does not complete its implied intent.

**Frequency:** Any decision in the `coaches` domain with no specific player ID generates this.

**Recommendation:** Do not generate `create_coach_note` or `create_player_note` drafts without a specific `entityId`. These actions require entity context.

---

## Noise Category 5: Curriculum Fallback Drafts When Setup Is Incomplete

`buildCurriculumDomainDrafts` generates "Complete X curriculum setup steps" when `incompleteSetupCount > 0`. On a new or early-stage academy, this fires constantly.

**Problem:** A director who has already decided they will complete curriculum setup later sees this draft on every curriculum page visit. There is no way to permanently dismiss it short of completing the setup.

**Noise type:** Persistent, low-urgency action draft that cannot be resolved without completing a multi-session task.

**Recommendation:** Add a snooze mechanism (7 days) for setup-related drafts, separate from permanent dismissal.

---

## Noise Category 6: WhatToIgnore Surfacing Low-Value Meta-Advice

The `whatToIgnore` output from `whatShouldIDoTodayEngine` includes items like:

> "Business metrics — fix curriculum structure before assessing growth capacity."
> "Philosophy preferences — align curriculum to existing identity before refining it further."

These appear on the director Today page in the `WhatCanWaitPanel`.

**Problem:** If business metrics and philosophy inputs are not loaded (which they currently aren't), then these "ignore" instructions are telling the director to ignore something they weren't going to see anyway. It looks like DONNA made a decision, but the decision was pre-empted by data absence.

**Noise type:** Meta-instruction for an action that was never going to happen.

**Recommendation:** Only surface `whatToIgnore` items when the ignored item had genuine potential to appear as a priority (i.e., its underlying data is loaded and non-zero).

---

## Noise Category 7: Returning Director Summary When Nothing Changed

The Returning Director Banner activates at `daysSinceLastVisit >= 14`. It populates `whatChanged` from today's wins + priorities + alerts. 

If an academy has been stable — no new problems, same ongoing situations — the `whatChanged` section may list the same persistent priorities that existed before the director left.

**Example:** A director returns after 3 weeks. The academy has had the same assessment backlog for months. `whatChanged` shows "Schedule 5 overdue player assessments" — which hasn't changed at all.

**Noise type:** False temporal framing — presenting persistent state as a recent change.

**Impact:** Erodes trust in the Returning Director Banner. If the director sees the same items they saw before they left labeled as "what changed," they will stop trusting the summary.

---

## Noise Category 8: Philosophy Drift Signal That Never Has Data

The philosophy drift system (`philosophySignals`) checks `drift.driftDetected && drift.driftSeverity === 'HIGH'`. 

The philosophy inputs are always built by `buildDefaultPhilosophyInputs()` which sets `driftDetected: false` and `driftSeverity: 'LOW'`. The philosophy drift signal can never fire with current data.

**Problem:** The signal infrastructure exists, all the code is correct, but the data never arrives. If a director happens to ask "why don't I see any philosophy drift warnings?" the answer is that no one has built the philosophy data loading.

**Noise type:** Silent absence — not a false positive, but a permanent gap that looks like "nothing to worry about."

**Risk:** Philosophy drift may be real at some academies (coaches teaching very differently from stated DNA) but DONNA will never surface it because the data layer doesn't exist.

---

## Noise Summary Table

| Noise Source | Type | Frequency | Severity | Fix Priority |
|---|---|---|---|---|
| Parent signal conflation (same data, two signals) | Semantic mismatch | Common | Medium | High |
| Fallback priorities reaching surface | Meta-advice | Common | High | High |
| Generic decision prompts | Content clutter | Always | Low | Medium |
| Entity-less note drafts | Broken action | When coach priorities fire | High | High |
| Persistent curriculum setup drafts | Alert fatigue | Always (new academies) | Medium | Medium |
| whatToIgnore for absent data | False decision | Always (when data missing) | Low | Low |
| Returning director static content as "change" | Trust erosion | On returning sessions | High | High |
| Philosophy drift never fires | Silent gap | Always | Medium | Medium (data gap first) |

---

## Signal Reduction Recommendation

If DONNA removed the 3 noisiest items (fallback priorities, entity-less note drafts, returning director static framing), trust would measurably improve. These are the highest-impact noise reductions available without any new data loading.
