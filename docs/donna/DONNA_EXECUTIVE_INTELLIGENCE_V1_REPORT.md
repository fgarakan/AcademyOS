# DONNA Executive Intelligence V1

**Mega Sprint 3841–3870** · 2026-06-24 · Verdict: **PASS** — DONNA now reasons over real academy truth.

> Mission: Executive DONNA is proven live; make her *useful*. She reached OpenAI but answered
> generically because the Executive Context Packet carried no academy-specific operating truth.
> Wire the already-loaded `DirectorDonnaContext` into the packet. No new architecture, no new
> OpenAI path, no new tables/migrations, no memory/COO work.

---

## Root cause (Objective 1)

`outstanding_decisions` is **required** context for `analyze`/`recommend`/`diagnose`/`decide`/
`approve`/`plan` (see `reasoningGoals.ts`), but `buildResolverStateFromLive` left it empty (only
a `legacy_next` entry when `requiresApproval`). It resolved **UNAVAILABLE**, so OpenAI received
`role + permissions + academy-name + page` — nothing else. That is the entire reason answers were
generic. The real signals were already loaded in the action (`loadDirectorDonnaContext`) and used
for Executive Presence, but never reached the packet.

### Context audit — BEFORE vs AFTER (real DB, academy 0001)

| Prompt | BEFORE sources / tokens | AFTER sources / tokens |
|---|---|---|
| What should I do today? | role, permissions, academy, available_actions / 39 | + **curriculum**, academy carries facts / 66 |
| Good morning Donna | role, permissions, page, academy / 30 | + **curriculum**, academy carries facts / 57 |

`ACADEMY` line, BEFORE: `Dabul Tennis Academy (high-performance-v1)`
`ACADEMY` line, AFTER: `Dabul Tennis Academy (high-performance-v1) — 54 active players, onboarding partial`
new `CURRICULUM` line, AFTER: `most blocked level: Orange 1 — Foundation (10 stalled)`

---

## Files changed (5) — wiring only

1. **`executive/executiveTypes.ts`** — `AcademyContext.operatingSummary?` (one-line live counts; no PII).
2. **`executive/contextResolver.ts`** — the `academy` source (required by every goal) appends `operatingSummary`.
3. **`executive/liveResolverAdapter.ts`** — derive from `DirectorDonnaContext`, **gated on `isLive`**:
   - `outstandingDecisions` ← `academyRisks` (urgency-ranked, human detail) + top 3 named `attentionItems`, deduped, capped 6; falls back to `recommendedActions`.
   - `academy.operatingSummary` ← players, coaches, pending reviews, today's sessions, missing wrap-ups, advancement-eligible, high-risk players, coverage gaps, onboarding readiness.
   - `curriculum` ← structural gaps + most-blocked level + >90d stalls (tenant-scoped).
4. **`executive/executiveLiveBridge.ts`** — thread `directorCtx` into `buildResolverStateFromLive`.
5. **`director/_actions/donnaLiveConversationAction.ts`** — pass the already-loaded `directorCtx` to `runExecutiveLive`.

No demo data is ever injected (gate on `directorCtx.isLive`), honoring the trust-data guard.

---

## Live validation (Objective 5) — restarted server, real director auth, flag=primary

6 prompts POSTed to the real `donnaLiveConversationAction` server action (id
`0bcf3d894112507c9feb2c221b2209422979090c`) over HTTP. Every turn:
`openaiRealCall=true · executivePathUsed=true · fallbackUsed=NO · contextSources=5 · ~109–121 packet tok`.

| Prompt | Response now cites |
|---|---|
| Good morning Donna | "stalled players in the Orange 1 level" → review Orange 1 performance data |
| What should I do today? | "**54 active players** … stalled **Orange 1 Foundation** … onboarding **partial**" → assign a coach to Orange 1 |
| What should I focus on? | "**10 players stalled in Orange 1**" → review coaching resources for Orange 1 |
| Who needs attention? | "**the 10 stalled players in Orange 1**" → review their profiles |
| Help me complete onboarding | "unblock Orange 1 for **10 players** … **54 active players**" |
| How is the academy doing? | "**54 active players**, but **10** in Orange 1 stalled; onboarding partial" |

### Before → After (same question, "What should I do today?")
- **Before (3811–3840):** "You should focus on approving reviews or assigning coaches today." *(generic — no academy referenced)*
- **After:** "Focus on addressing the stalled **Orange 1 Foundation** level by assigning a coach or creating a template. 54 active players… onboarding partial." *(academy-specific)*

---

## Remaining intelligence gaps

- **Quiet pilot academy:** academy 0001 currently has 0 pending reviews / risks / attention items,
  so `outstanding_decisions` stays **honestly empty** — the urgency-ranking logic is wired and will
  surface ranked decisions the moment the queue has items (verify on a busier tenant).
- `serializePacket` emits a **duplicate `AVAILABLE_ACTIONS`** line (pre-existing; minor token waste).
- `curriculum.levels` left `[]` (summary only) — level-name enumeration is a future add.
- The **strategic action** path (`donnaStrategicConversationAction`) does not run the executive layer; only the live action does (out of scope here).
- `coachCount = 0` is omitted by the zero-suppression in `operatingSummary` (covered indirectly by "onboarding partial").

---

## Scores

| Score | Before | After | Basis |
|---|---|---|---|
| **Executive Intelligence** | 35 | **78** | Real signals now in every packet; capped because decision-ranking is unexercised on this quiet tenant and curriculum levels aren't enumerated. |
| **Live DONNA (as-run with flag)** | 60 | **80** | Through the real server she now sounds operationally aware (cites players + the live bottleneck), not generic. (As-deployed remains gated on the flag being set — still unset in committed env.) |
| **God Mode (updated)** | 88 | **90** | Wiring closes the "generic advice" gap end-to-end live; remaining points need a busy-tenant decision-ranking proof + flag activation in deployment. |

**Verdict:** A director on academy 0001 asking "what should I do today?" now hears DONNA name the
**54 active players** and the **Orange 1 Foundation bottleneck (10 stalled)** and recommend
assigning a coach there — real priorities from live data, generated by OpenAI through the Executive
Layer with no fallback. "She understands my academy," not "generic AI advice."
