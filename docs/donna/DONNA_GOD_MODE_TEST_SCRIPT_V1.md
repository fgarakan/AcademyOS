# DONNA God Mode Test Script V1

**Mega Sprint 4291–4320 — 2026-06-25**

A Director-facing script to test DONNA like a real COO inside the **God Mode Demo
Academy** (`demo_academy_godmode_v1`). Seed it, log in as the demo director, and walk the
ten turns below. Each turn lists the **expected DONNA behavior** given the seeded data.

## Setup

```bash
# One-time: apply migrations 084 (durable learning) + 085 (academy demo tagging)
# Then:
npm run demo:seed -- --confirm     # writes the demo academy
# Log in as: demo.director@godmode.test  (password printed by the seed)
# ... test ...
npm run demo:reset -- --confirm    # deletes ONLY the demo academy (cascade)
```

## The seeded reality (what DONNA should "know")

| Signal | Value | Source |
|---|---|---|
| Active players | 9 | 10 players, 1 in placement |
| In placement queue | 1 | Kai (new onboarding) |
| Missing curriculum level | 1 | Liam |
| Promotion candidates | 1 | Maya (advancement-eligible) |
| Without recent assessment | 2 | Ben (120d), Liam (never) |
| Needing attention | 3 | Sofia (stagnation), Ava (attendance), Noah (parent concern) |
| Pending parent approvals | 1 | Noah's reply |
| Pending coach approvals | 1 | Zoe's wrap-up |
| Onboarding | incomplete (6/7) | one step left |

## The ten turns

| # | Director says | Expected DONNA behavior |
|---|---|---|
| 1 | **Good morning Donna** | Operating-session resume + a proactive COO briefing: "I reviewed the academy. N things need attention today." Leads with the top priority. |
| 2 | **What should I do today?** | Executive Intelligence answer: top 3–5 ranked priorities with evidence; first = highest-leverage (clear approvals / finish onboarding), with why-now + next step. NOT generic chat. |
| 3 | **Who needs attention?** | Names the 3 flagged players (Sofia, Ava, Noah) with the reason each was flagged; offers to triage. |
| 4 | **Help me finish onboarding** | Detects onboarding is incomplete (6/7), names the remaining step, guides to it — step · why · what to do · outcome. |
| 5 | **Walk me through Curriculum Builder** | Page-aware guidance: where they are, why curriculum matters, exactly what to select, what it produces. Flags Liam (no level). |
| 6 | **Should I promote this player?** | For Maya: yes — cites advancement-eligible evidence; for an almost-ready player (Leo): not yet, names the gap. Decisive, evidence-backed. |
| 7 | **Which coach should take this session?** | Recommends a coach by specialty/load for the open session (Diego Red/Orange, Sara Green/Yellow, Tom HP). |
| 8 | **What am I missing?** | Surfaces the lower-ranked but real items not yet acted on (missed assessments: Ben/Liam; placement: Kai). |
| 9 | **What changed since last time?** | Operating-session continuity: references the prior turn's focus; if nothing changed, says so honestly. |
| 10 | **Continue** | Dialogue continuity — picks up the current thread without re-asking context. |

## The operating stories (interconnected, competing, with tradeoffs)

The demo is a living academy, not a record dump. Six scenarios thread the same entities
through competing executive decisions — this is what makes it a COO test, not a data test.

| Scenario | Competing priorities | The tradeoff DONNA must weigh |
|---|---|---|
| **Morning triage** | approvals vs onboarding vs placements vs Ava's retention | 2-min approvals first (unblock trust) → then Ava (higher stakes, slower) |
| **Promote Maya** | Maya is earned (62→81) + parent pushing vs Ben in Green is overdue/blind | Promote Maya AND reassess Ben so Green stays healthy |
| **Orange 2→3 bottleneck** | Leo one outcome short vs Sofia plateaued vs missing gate content | Fix the gate content first (systemic), then assess Leo, plan Sofia |
| **Diego overloaded** | Diego 9/8, quality slipping vs Sara underused but Red-weak | Shift a Green slot off Sara to free Diego for Red — don't put beginners on a non-specialist |
| **Save Ava** | retention risk + parent considering leaving vs overloaded Red coach | Parent call now + protect her session quality — Director time now vs a lost family later |
| **Stretch Emma to HP** | Emma improving fast vs Tom's scarce HP capacity + low patience | Trial HP block, confirm motivation before committing the slot |

**Coach personalities** (assignment tradeoffs): Diego (Red/Orange, overloaded 9/8),
Sara (Green/Yellow technical, underused 3/8, weak with Red), Tom (HP, scarce 4/5, low
patience). **Player journeys**: Maya improving (62→81), Sofia flat (58→59), Ava declining
(64→52) — decisions are evidenced by trend, not a single flag. **Parent situations**:
Maya's pushing for promotion, Ava's considering leaving (retention), Noah's concern raised.

### Live proof (real OpenAI, multi-step)
Across two turns DONNA weighed competing priorities and held a tradeoff:
> "What should I do today — and what is the tradeoff?" → *clear the queue first; the
> tradeoff is it may delay other tasks, but it unblocks parent + coach trust.*
> "Should I promote Maya before clearing the queue?" → *Promoting Maya first could delay
> urgent approvals — clear the queue first, then promote Maya* (citing 1 parent + 1 coach
> approval, 3 flagged players).

## What this proves

When DONNA answers turns 1–8 with **specific, evidence-backed, ranked** guidance drawn
from these real records — not generic chat — God Mode is real. The certification
(`donnaDemoAcademyGodModeCertification.ts`, 41/41) proves the data→signals→intelligence
path deterministically; this script is the human, in-browser confirmation.

## Remaining God Mode gaps (honest)

- **Unassigned sessions** aren't representable (`sessions.coach_id` is `NOT NULL`), so the
  "which coach is free?" signal is modeled via specialty, not an empty-coach count.
- **Attendance/parent signals** are stored as `player_development_signals` rows (real,
  counted) but typed with a generic `score_stagnation` enum + a descriptive title (no
  dedicated attendance enum yet).
- Turns 5–7 and 9 depend on page/entity context the Director supplies in the browser; the
  offline cert proves the signal/intelligence layer, not the literal screen walkthrough.
- Live execution requires migrations 084/085 applied + the seed run (DB access).
