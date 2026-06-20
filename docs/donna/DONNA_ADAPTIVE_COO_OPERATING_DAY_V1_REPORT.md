# DONNA Adaptive COO Operating Day V1 — Report

**Mega Sprint 3301–3330**
**Date:** 2026-06-20
**Scope:** Operating behavior over the ONE DONNA pipeline (Sprint 3271–3300). No new intelligence engines, no new architecture, no dashboards, no migration. Pure TypeScript.

---

## Summary

This sprint proves DONNA can **operate an academy day** through the single canonical router, reducing the director to approve / reject / adjust / prioritize / override / ask-why / done. It adds a thin operating layer over existing engines: a proactive COO daily brief, an exception-based operating model, a strengthened approval guardrail, and a Director Input Burden Score.

- **`donnaAdaptiveCOOOperatingDayCertification.ts`: 144/144 — 100% CERTIFIED.**
- **Director Input Burden Score: 100/100 → `low_input`** (0 clarifications, 0 generic advice, 0 asks-to-find; 20/20 turns handled by ONE DONNA).
- `npx tsc --noEmit`: clean. DONNA cert suite: 32/33 (the 1 failure, `philosophyCertification`, is pre-existing and unrelated).

---

## Operating day simulation results (20 steps, all through the canonical router)

| # | Utterance | Stage | Operating behavior |
|---|---|---|---|
| 1 | Good morning, Donna. | `daily_brief` | Proactive COO brief |
| 2 | What happened overnight? | `daily_brief` | Proactive COO brief |
| 3 | What should I focus on first? | `focus_today` | Top priority + why + first action |
| 4 | Why? | `defer_to_brain` | Brain explains |
| 5 | Take me there. | `assumption` | Reality-grounded next step |
| 6 | Walk me through it. | `guided_completion` | Guided completion loop |
| 7 | Done. | `guided_completion` | Completion step |
| 8 | What's next? | `assumption` | Recommended next action |
| 9 | A coach called in sick. | `exception` | Coach-absence playbook |
| 10 | Two players are absent. | `exception` | Attendance-exception playbook |
| 11 | A parent is upset. | `exception` | Parent-concern playbook (draft → review) |
| 12 | Who needs attention? | `players` | Roster attention answer |
| 13 | What is blocking us? | `proactive` | Proactive notice |
| 14 | What should Brian do today? | `focus_today` | Priority brief |
| 15 | Draft the parent update. | `guided_completion` | Guided parent-update draft |
| 16 | Review level-up candidates. | `guided_completion` | Guided level-up review |
| 17 | Adjust today's session plan. | `defer_to_brain` | Brain drafts adjustment |
| 18 | Summarize coach wrap-ups. | `defer_to_brain` | Brain summarizes |
| 19 | What changed today? | `daily_brief` | End-of-day brief |
| 20 | Anything else before I leave? | `daily_brief` | End-of-day brief |

Every step verified: ONE pipeline used · reality considered · no fabricated facts · next action provided · approval preserved · completion offered (where applicable).

## Director Input Burden Score (Part 2)

| Metric | Value |
|---|---|
| Turns | 20 |
| Recommendations w/ next action | 13 |
| Completion offers | 20 |
| Handled without director search | 20 / 20 |
| Clarifications | 0 |
| Generic advice | 0 |
| Asked director to find something | 0 |
| **Score** | **100 / 100 → low_input** |

DONNA prefers *"I recommend we start here"* over *"What would you like to do?"* — every turn carried detection, explanation, routing, and a next action.

## Approval safety result (Part 5)

The router now blocks direct mutations via `detectDirectMutationRequest` (closing a real gap — the intent classifier alone missed several phrasings). All 6 certified mutation phrasings route to `safety_block` → review queue, never executed:
`Send the parent message now` · `Approve the promotion` · `Change his level to orange now` · `Publish the curriculum now` · `Assign a coach to Orange 2` · `Move this player up now`. Drafting ("draft a parent update", "adjust the session plan") is allowed — it becomes an approval-gated draft, not a direct change.

## What DONNA can run today

- **Proactive daily brief** (top priority · why · blocker · first action · approval needed) — available through the floating DONNA, built from the existing attention engine.
- **Exception-based operating** for coach absence, player absence, parent concern, missed wrap-up, level-up blocker, curriculum gap, session issue — each returns *what happened · why it matters · what's next · who approves · how to complete*.
- **Detection → explanation → prioritization → routing → drafting → guided completion → follow-up**, all through one pipeline reachable from every surface.

## What still requires director input

- **Approvals/judgment** — by design: send, approve, level change, coach assignment, publish, parent notify (review-first).
- Steps 4/5/17/18 (why / take-me-there / adjust-session / summarize-wrap-ups) defer to the brain rather than a dedicated deterministic engine — still ONE pipeline, but answer quality depends on the brain/OpenAI gateway.

## Where DONNA still feels like software

- Exception playbooks are deterministic templates (no specific live names/counts) — honest, but not yet personalized to *which* coach/sessions/parents (that needs the live signals below).
- The brief reuses demo context when not live; on a fresh academy it correctly says so rather than inventing data.

## Missing live signals

- Exception playbooks can't yet name the *specific* affected coach/sessions/players/parents — they recommend the surface to act on. Wiring per-exception live lookups (which sessions for the sick coach; which players absent) is the next increment.
- The brief's `realityGrounded` is gated on `ctx.isLive`; the floating panel loads `DirectorDonnaContext` on open (Sprint 3271–3300) but per-route freshness is still partial.

## Missing atomic-loop completion gaps

- `defer_to_brain` steps don't yet carry a deterministic completion target from the router (the brain provides it). Promoting "adjust session" and "summarize wrap-ups" to dedicated guided-completion workflows would close these.
- Durable learning persistence remains absent (in-memory) — DONNA does not yet remember across sessions.

## Next sprint recommendation

**"DONNA Operating Specificity V1" (wiring only):** make exception playbooks name the *specific* affected entities via live lookups (sick coach → today's sessions; absent players → attendance drafts; upset parent → the child + draft), and promote `adjust session` / `summarize wrap-ups` to guided-completion workflows. Then the previously-proposed **persistent learning migration** sprint so the operating day compounds over time.
