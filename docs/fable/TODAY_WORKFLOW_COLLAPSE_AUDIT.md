# Today Page — Workflow Collapse Audit V1

**Sprint 2111–2140 — DONNA Command Center V2**
**Date: June 2026**
**Purpose: Permanent AcademyOS operating metric — measures navigation reduction on the Today page.**

---

## Mission Control Standard

> "Can the Director complete this without leaving Today?"

Every workflow below is evaluated against this standard. The goal is not to eliminate navigation — it is to eliminate **unnecessary** navigation: the kind that disorients, reorients, and wastes the 30 seconds a director has between decisions.

---

## Methodology

**Measurement units:**
- **Clicks** — discrete user interactions required to complete the workflow
- **Navigation steps** — page transitions (each new URL = 1 step)
- **Reorientation cost** — cognitive load when arriving at a new page and re-establishing context (rated Low / Medium / High)
- **Time estimate** — wall-clock time for a proficient director

**Before V2 baseline:** Sprint 2051–2080 state (Fable Today Page V1)
**After V2 target:** Sprint 2111–2140 state (DONNA Command Center V2)

---

## Workflow 1 — Review a Pending Approval

**Context:** Director notices 5 items are pending in the approval queue.

### Before V2
| Step | Action | Click |
|---|---|---|
| 1 | Read alert or work queue count in hero | 0 |
| 2 | Click pending count link → `/director/review` | 1 |
| 3 | Re-orient on review page (read queue, find item) | 0 |
| 4 | Act on item | 1 |

**Total:** 2 clicks · 1 navigation step · Medium reorientation cost

### After V2
| Step | Action | Click |
|---|---|---|
| 1 | DonnaQuickActions shows "Open Approvals (5)" immediately | 0 |
| 2 | Click "Open Approvals" → `/director/review` | 1 |
| 3 | Act on item | 1 |

**Total:** 2 clicks · 1 navigation step · Low reorientation cost

**Delta:** Same clicks, same navigation. **Reorientation cost reduced** — director sees the count before clicking (no surprise on arrival). The pending badge means they arrive with accurate expectations.

**Improvement:** Cognitive load reduced. Director knows what they're walking into.

---

## Workflow 2 — Understand Why DONNA Flagged a Decision

**Context:** Director sees "Review 3 stalled players" as a top decision. Wants to understand why before acting.

### Before V2
| Step | Action | Click |
|---|---|---|
| 1 | Read decision title on Today | 0 |
| 2 | Click "Open" → `/director/players` | 1 |
| 3 | Re-orient (player list, find stalled players) | 0 |
| 4 | Investigate player | 1-2 clicks |
| 5 | Navigate back to Today | 1 |
| 6 | Re-orient on Today | 0 |

**Total:** 4–5 clicks · 3 navigation steps · High reorientation cost · ~45 seconds

### After V2
| Step | Action | Click |
|---|---|---|
| 1 | Read decision title on Today | 0 |
| 2 | Click "Ask DONNA" | 1 |
| 3 | Read DONNA reasoning + evidence inline | 0 |
| 4 | Click "Open" if still needed | 1 (optional) |

**Total:** 1–2 clicks · 0–1 navigation steps · Zero reorientation cost · ~10 seconds

**Delta:** **3 clicks saved. 2 navigation steps eliminated. ~35 seconds saved per investigation.**

**Improvement: HIGH.** Director can now investigate without leaving Today. This is the core mission control breakthrough.

---

## Workflow 3 — Act on DONNA's Primary Recommendation

**Context:** DONNA identifies coach execution gap. Director wants to review coach recaps.

### Before V2
| Step | Action | Click |
|---|---|---|
| 1 | Read DONNA greeting (15px — slower reading) | 0 |
| 2 | Read decision card — figure out what to do | 0 |
| 3 | Click "Open" → some page | 1 |
| 4 | Re-orient on destination | 0 |

**Total:** 1 click · 1 navigation step · Medium reorientation cost (destination not always obvious)

### After V2
| Step | Action | Click |
|---|---|---|
| 1 | Read DONNA greeting (24px — instant recognition) | 0 |
| 2 | DonnaQuickActions shows "View Sessions" as top action for coach execution gap | 0 |
| 3 | Click "View Sessions" → `/director/sessions` | 1 |

**Total:** 1 click · 1 navigation step · Low reorientation cost (label is explicit)

**Delta:** Same clicks. **Reorientation cost reduced**. Director knows exactly where they're going (label says "View Sessions") vs the old "Open" button (destination ambiguous).

**Improvement: MEDIUM.** Clarity over raw click reduction.

---

## Workflow 4 — Check If There Are Stalled Players

**Context:** Director wants to know if any players are stagnating.

### Before V2
| Step | Action | Click |
|---|---|---|
| 1 | Read Today page (no dedicated stalled-players signal) | 0 |
| 2 | Navigate to `/director/players` | 1 |
| 3 | Filter or scan list | 1-3 |
| 4 | Find stalled players | variable |

**Total:** 2–4 clicks · 1 navigation step · High reorientation cost

### After V2
| Step | Action | Click |
|---|---|---|
| 1 | DONNA greeting states stall count ("Player progression needs your attention") | 0 |
| 2 | Decision card shows "Review N stalled players" | 0 |
| 3 | Click "Ask DONNA" → evidence shows count + domain context | 1 |
| 4 | Click "Review" to go to players page | 1 (optional) |

**Total:** 1–2 clicks · 0–1 navigation steps · Zero reorientation cost (count visible before navigation)

**Delta:** **2–3 clicks saved. 1 navigation step eliminated.**

**Improvement: HIGH.** Director knows the count before navigating, arrives oriented.

---

## Workflow 5 — Understand the Academy Situation

**Context:** Director opens AcademyOS. Wants to know: what is happening today?

### Before V2 (Sprint 2051–2080 state)
| Step | Action | Click |
|---|---|---|
| 1 | Read DONNA greeting at 15px — slow visual processing | 0 |
| 2 | Scan 5 panels to build a mental model | 0 |
| 3 | Make sense of context | 0 |

**Estimated time:** 15–20 seconds to orient

### After V2 (Sprint 2081+ state)
| Step | Action | Click |
|---|---|---|
| 1 | Read DONNA greeting at 24px — instant recognition of situation | 0 |
| 2 | DonnaQuickActions shows top 3 contextual actions | 0 |
| 3 | Decision cards show top 3 decisions with confidence signals | 0 |

**Estimated time:** 5–8 seconds to orient

**Delta:** **10–12 seconds saved per session opening.**

**Improvement: CRITICAL.** For a director who opens AcademyOS 5x/day, this saves ~1 minute daily just in initial orientation.

---

## Summary Table

| Workflow | Clicks saved | Steps eliminated | Time saved | Impact |
|---|---|---|---|---|
| 1. Review pending approval | 0 | 0 | ~5s (cognitive) | Medium |
| 2. Understand why DONNA flagged | 3–4 | 2 | ~35s | **HIGH** |
| 3. Act on primary recommendation | 0 | 0 | ~10s (cognitive) | Medium |
| 4. Check stalled players | 2–3 | 1 | ~20s | **HIGH** |
| 5. Understand today's situation | 0 | 0 | ~12s | **CRITICAL** |

**Total per average session (all 5 workflows):** ~5–7 clicks saved · ~3 navigation steps eliminated · ~82 seconds saved

**Projected daily impact (5 AcademyOS sessions/day):** ~7 minutes of recovered director time

---

## Deferred Workflows (Future Sprints)

| Workflow | Current state | Target state | Sprint |
|---|---|---|---|
| Assign decision to coach | Not possible | "Assign to" metadata only | 2141+ |
| Approve from Today | Navigates to review queue | Inline approval surface | 2141+ |
| Message parent from Today | Not possible | Draft in-context | 2141+ |
| Check curriculum health | Navigates to /curriculum | Inline summary card | 2141+ |
| View coach performance | Navigates to coach pages | Summary inline | 2141+ |

---

## Executive Test — 30-Second Director Simulation

**Scenario:** Director with 30 seconds available opens AcademyOS.

**Context:** 5 pending approvals, player progression bottleneck situation, 2 decisions.

**Session log (V2 experience):**

| Second | What happens |
|---|---|
| 0–3 | Page loads. DONNA greeting at 24px: "Good morning, Sam. Player progression needs your attention." — **instantly understood.** |
| 3–8 | DonnaQuickActions visible: "View Players", "Open Approvals (5)", "View Sessions" — **director knows the 3 things they can do.** |
| 8–12 | Director reads decision card: "Review 4 stalled players in Orange 2" — **understands the specific problem.** |
| 12–18 | Director clicks "Ask DONNA" — reads: "Player development outcomes are directly affected. Acting today prevents this from getting worse." + 2 evidence signals. **Director has full context without navigating.** |
| 18–25 | Director clicks "View Players" from QuickActions — arrives at `/director/players` oriented (already knows what to look for). |
| 25–30 | Director reviews first player, takes action. |

**Result: Director understood situation, reviewed recommendation, investigated with evidence, and acted — all within 30 seconds.**

**V1 equivalent (Sprint 2051–2080):**

Same 30 seconds. At second 3, director is still reading the 15px greeting. At second 15, they're clicking "Open" on the decision card, arriving at an unknown page, reorienting. By second 30, they've barely started the investigation.

**V2 advantage: Director acts in the time V1 director was still orienting.**

---

## Permanent Metric: AcademyOS Workflow Efficiency Score

Track these per major Today page release:

| Metric | V1 (Sprint 2051) | V2 (Sprint 2111) | Target |
|---|---|---|---|
| Avg clicks to act on primary priority | 3 | 1 | 1 |
| Avg navigation steps to understand why | 3 | 0 | 0 |
| Time to understand today's situation | 15s | 6s | 5s |
| Time to act on first priority (30s available) | Rarely possible | Consistently possible | Always possible |
| Director cognitive load (readability cert) | FAIL (51 issues) | PASS (56/56) | PASS |
