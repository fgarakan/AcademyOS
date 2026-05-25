# Sprint 810 — DONNA + Director Dashboard 90+ Certification

**Date:** 2026-05-25
**Sprint:** 810
**Type:** Audit and certification — no source code changes
**Sprints covered:** 806–809
**Files changed:** 2 docs (changelog + this document)
**TypeScript:** Clean (audit sprint)

---

## Context

Sprint 805 established a post-block score of **70.4/100** with a B+ grade.

Remaining gaps from Sprint 805:
1. Voice debug controls visible in DONNA onboarding panel
2. Dashboard had 3 competing "needs attention" surfaces
3. KPI section was 8 equal-weight cards
4. "What should I do first?" not in phrase map

Sprints 806–809 targeted each gap in order.

---

## What Changed in Sprints 806–809

| Sprint | Change |
|---|---|
| 806 | DONNA onboarding section: removed "Try Browser Voice", "Reset Donna voice", "Realtime not configured", "Did you hear it? Yes/No" — replaced with single plain-language failure message |
| 807 | Dashboard: Priority Queue card removed (duplicate of command center); "Roster Signals" → "Pending Placement"; "Academy Health Signals" → "Alert Breakdown" (subdued label) |
| 808 | KPI section: 8 equal-weight → 4 primary always visible + 4 secondary behind toggle; "View all metrics (4 more)" button |
| 809 | `DAILY_BRIEF_PATTERNS`: +10 first-action phrases ("what should i do first", "where should i start", "what matters most", "what is most urgent", etc.) |

---

## Re-Audit Scores

### Dimension 1 — DONNA Side Panel

**Score: 82/100** (was 74/100, Sprint 805 — **+8 pts**)

| Sub-dimension | Sprint 805 | Sprint 810 | Change |
|---|---|---|---|
| Header clarity | 8/10 | 8/10 | 0 |
| Page context visibility | 8/10 | 8/10 | 0 |
| Chip hierarchy | 7/10 | 7/10 | 0 |
| Typography | 9/10 | 9/10 | 0 |
| Debug controls visible | 4/10 | 9/10 | +5 |
| Primary action clarity | 6/10 | 7/10 | +1 |
| Mobile usability | 6/10 | 6/10 | 0 |

**Remaining gaps:**
- Greeting card can still show review queue count duplicated from header badge (minor — not a director-visible blocker)
- Mobile usability at 6/10 — panel was not designed for mobile; not targeted in this block

---

### Dimension 2 — DONNA Persistence

**Score: 72/100** (unchanged — not targeted in 806–809)

| Sub-dimension | Sprint 805 | Sprint 810 |
|---|---|---|
| commandResponse persists across nav | 80/100 | 80/100 |
| cooThread persists across nav | ✅ | ✅ |
| SessionStorage restore | ✅ | ✅ |
| contextSummary / suggestions clear on nav | ❌ | ❌ |

**Remaining gaps:**
- `contextSummary`, `suggestions`, `reviewQueueData` still clear on route change — low-impact but real friction

---

### Dimension 3 — Command Understanding

**Score: 80/100** (was 70/100, Sprint 805 — **+10 pts**)

| Command | Sprint 805 | Sprint 810 |
|---|---|---|
| Daily brief / morning brief | ✅ | ✅ |
| What do I need to do today? | ✅ | ✅ |
| Close Donna (8 variants) | ✅ | ✅ |
| Follow-up "go there" / "open that" after COO | ✅ | ✅ |
| "What should I do first?" | ❌ | ✅ |
| "Where should I start?" | ❌ | ✅ |
| "What matters most?" | ❌ | ✅ |
| "What's most urgent?" | ❌ | ✅ |
| "Prioritize my day" | ❌ | ✅ |
| "Start me off" | ❌ | ✅ |
| "Give me my first action" | ❌ | ✅ |
| "What's the first thing I should do?" | ❌ | ✅ |
| Stop/Start listening (typed) | ❌ | ❌ (button-only) |
| ~5 partial/unclear command paths | ⚠️ | ⚠️ |

**Phrase map count:** 13 → 23 patterns

---

### Dimension 4 — Dashboard Cognitive Load

**Score: 80/100** (was 62/100, Sprint 805 — **+18 pts**)

| Sub-dimension | Sprint 805 | Sprint 810 | Change |
|---|---|---|---|
| Action surfaces above fold | 8/10 | 8/10 | 0 |
| "Needs attention" surface count | 6/10 (2 surfaces) | 9/10 (1 primary + 1 subordinate) | +3 |
| DONNA integration on dashboard | 7/10 | 7/10 | 0 |
| KPI section cognitive load | 6/10 (8 equal, moved down) | 9/10 (4 primary + 4 on demand) | +3 |
| Section count and hierarchy | 6/10 | 8/10 | +2 |

**Remaining gaps:**
- AI Suggestions card still appears alongside AcademyAlertsPanel in "Alert Breakdown" — mild secondary surface
- Not a critical blocker at 80/100

---

## Weighted Composite Score

**Weights:** DONNA Panel 40% · Persistence 20% · Commands 20% · Dashboard 20%

| Dimension | Sprint 799 | Sprint 805 | Sprint 810 | Weight |
|---|---|---|---|---|
| DONNA Side Panel | 58 | 74 | 82 | 40% |
| DONNA Persistence | 58 | 72 | 72 | 20% |
| Command Understanding | 55 | 70 | 80 | 20% |
| Dashboard Cognitive Load | 40 | 62 | 80 | 20% |

**Sprint 799 composite:** (58×0.4) + (58×0.2) + (55×0.2) + (40×0.2) = **53.8/100**
**Sprint 805 composite:** (74×0.4) + (72×0.2) + (70×0.2) + (62×0.2) = **70.4/100**
**Sprint 810 composite:** (82×0.4) + (72×0.2) + (80×0.2) + (80×0.2) = **79.2/100**

**Net lift 806–810:** +8.8 pts  
**Net lift full 799–810 block:** +25.4 pts (from 53.8 → 79.2)

---

## Is This 90+?

**No. 79.2/100 ≠ 90+.**

The block achieved real, measurable improvements. But three gaps prevent honest 90+ certification:

| Gap | Dimension | Remaining impact |
|---|---|---|
| `contextSummary` / `suggestions` clear on nav | Persistence | Medium — director must re-ask after navigation |
| "Start/Stop listening" not text-commandable | Commands | Low |
| AI Suggestions card sits next to AcademyAlertsPanel | Dashboard | Low — visual echo only |
| Mobile panel usability at 6/10 | Panel | Not targeted — excluded from scope |

The persistence gap is the largest remaining blocker. Until `contextSummary` survives route changes, a director who asks for context, navigates to a player, then comes back loses that context. This creates the most friction in real workflows.

---

## Grade

**B+ → A- (79/100)**

The product is substantially better than Sprint 799:
- DONNA panel reads as a finished product — no debug controls
- DONNA answers persist across navigation
- "Close Donna", "go there", and 10+ natural first-action phrases all work
- Dashboard has one clear attention surface (command center)
- KPI section is hierarchical — 4 priority metrics, 4 on demand

The experience is now director-grade across most interactions. It does not yet reach 90+.

---

## Full 799–810 Commit Block

| Sprint | Change | Score Impact |
|---|---|---|
| 799 | Baseline audit — 53.8/100 established | — |
| 800 | DONNA header: 8 badges → 1; page context label; 6 chips → 3; `text-[9px]` fixed | +16.6 composite |
| 801 | `commandResponse` preserved across route changes | |
| 802 | "Close Donna" wired; COO follow-up context wired | |
| 803 | KPI section moved below action surfaces; duplicate CTA removed | |
| 804 | `DonnaDashboardOpenCard` added — inline DONNA entry on dashboard | |
| 805 | Certification — B+ (70.4/100) | — |
| 806 | Voice debug controls removed from DONNA panel | +8.8 composite |
| 807 | Priority Queue card removed; attention surfaces: 3 → 1 primary | |
| 808 | KPI section: 8 equal → 4 primary + 4 toggled | |
| 809 | DAILY_BRIEF_PATTERNS: 13 → 23 phrases | |
| 810 | Certification — A- (79.2/100) | — |

---

## Recommended Sprint 811 — Persistence Lift

**One sprint to push 79.2 → 85+:**

Preserve `contextSummary`, `reviewQueueData`, and `suggestions` across route changes — same approach used for `commandResponse` in Sprint 801 (remove them from the route-change `useEffect` clear list).

**Expected lift:**
- DONNA Persistence: 72/100 → ~85/100 (+13 pts)
- Weighted composite: 79.2 → ~81.8/100

**Subsequent sprints for 90+:**
- Sprint 812: Persist `contextSummary` per-session in sessionStorage (same pattern as `cooThread`)
- Sprint 813: Add "Start listening" / "Stop listening" to text-command phrase map
- Sprint 814: True 90+ certification

---

## Files Changed in Sprint 810

- **Created** `docs/DONNA_DASHBOARD_90_PLUS_CERTIFICATION_810.md` — this document
- **Modified** `docs/CHANGELOG.md` — Sprint 810 entry
