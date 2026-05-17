# Academy Health Browser QA — Sprint 718

**Date:** 2026-05-17
**Method:** Static code analysis. Items marked `[BROWSER NEEDED]` require manual verification.
**TypeScript:** CLEAN

---

## Component Architecture

| Component | Location | Notes |
|---|---|---|
| `AcademyHealthBreakdown` | `src/app/director/_components/AcademyHealthBreakdown.tsx` | 491 lines. Drawer + badge + action links |
| `AcademyHealthBadgeWithDrawer` | Same file | Entry point — badge that opens drawer |
| `AcademyHealthDrawer` | Same file | Full breakdown UI |
| `AcademyHealthActionLinks` | `src/components/donna/AcademyHealthActionLinks.tsx` | Contextual action links |
| `academyHealthSourceMap.ts` | `src/lib/donna/academyHealthSourceMap.ts` | Static KPI definitions with availability status |
| `academyHealthLiveStatus.ts` | `src/lib/donna/academyHealthLiveStatus.ts` | Runtime DB probes |

---

## KPI Status Audit

| KPI | ID | Static Availability | Runtime Status |
|---|---|---|---|
| Player Attention Risk | `player_attention_risk` | `partial` | Live probe: `coach_observations` concern count → `partial` or `insufficient_data` |
| Group Health | `group_health` | `deferred` | `blocked_by_schema` (no live probe) |
| Coach Support Needed | `coach_support_needed` | `deferred` | `blocked_by_schema` (no live probe) |
| Parent Trust Coverage | `parent_trust_coverage` | `not_yet_built` | `blocked_by_schema` (no live probe) |
| Curriculum Bottleneck | `curriculum_bottleneck` | `not_yet_built` | `blocked_by_schema` (no live probe) |
| Wrap-Up Coverage Rate | `wrap_up_coverage_rate` | `partial` | Live probe: `voice_notes` with `session_id` → `partial` or `insufficient_data` |
| Review Queue Throughput | `review_queue_throughput` | `partial` | Live probe: `proposed_actions` with `approved_at` → `partial` or `blocked_by_schema` |

**Live probes: 3 of 7 KPIs probed at runtime.** All probes are read-only (`select` with `head: true` count only). All wrapped in `try/catch` — failure falls back to `insufficient_data` or `blocked_by_schema`.

---

## Status Labels Audit

| Status | Displayed As | UI Color |
|---|---|---|
| `live` | "live" | lime/green tone |
| `partial` | "partial" | amber/orange tone |
| `insufficient_data` | "Insufficient data" | muted |
| `blocked_by_rls` | "Access blocked" | red tone |
| `blocked_by_schema` | "Not yet built / blocked" | muted/gray |

**No fake certainty.** KPIs with `deferred` or `not_yet_built` availability surface as `blocked_by_schema`. The UI does not invent health scores for unavailable KPIs.

---

## Live Count Display

| Check | Result | Notes |
|---|---|---|
| Live count format | ✅ PASS | `{liveCount}/{totalDimensions} live` |
| All live indicator | ✅ PASS | `allLive` boolean — triggers "All dimensions are live" copy |
| DONNA message | ✅ PASS | Uses `DONNA_PUBLIC_NAME` constant — "DONNA answers reflect real-time academy data." |

---

## Drawer UX

| Check | Result | Notes |
|---|---|---|
| Drawer opens on badge click | ✅ PASS | `setIsOpen(true)` on button click |
| Drawer ARIA label | ✅ PASS | `aria-label="Academy Health Breakdown"` |
| Close button ARIA label | ✅ PASS | `aria-label="Close breakdown"` |
| Overlay close | ✅ PASS | Click on overlay triggers `onClose` |
| Close action | `[BROWSER NEEDED]` | Confirm drawer closes without error |

---

## Action Links Audit

| Action | Destination | Notes |
|---|---|---|
| View Coach Recaps | `/director/review` | Review queue — valid route |
| Review Players | `/director/players` | Players list — valid route |
| Open Review Queue | `/director/review` | Valid route |
| Review Suggestions | Not verified | `[BROWSER NEEDED]` |
| Assign Curriculum Levels | Not verified | `[BROWSER NEEDED]` |
| Place Players | `/director/placement` | Valid route (scaffolded) |
| View Today's Academy | `/director/today` | Valid route |

All action links navigate — no mutation on click.

---

## No Writes Confirmation

| Check | Result |
|---|---|
| `academyHealthLiveStatus.ts` comment | ✅ "Read-only. No writes. No migrations." |
| `AcademyHealthBreakdown.tsx` | ✅ No server action imports, no mutation calls |
| `AcademyHealthActionLinks.tsx` | ✅ Navigation only |
| All DB queries in health loader | ✅ `select` with `head: true` count — no inserts/updates |

---

## Missing Data States

| KPI State | UI Handling |
|---|---|
| `insufficient_data` | Downgraded status label shown |
| `blocked_by_schema` | "Not yet built" label — honest about future work |
| `blocked_by_rls` | "Access blocked" label — honest about permissions |
| DB probe fails (catch) | Falls back to `insufficient_data` — no crash |
| Academy Health score 0 | Rendered as 0 — no fake floor |

---

## DONNA Integration

| Check | Result | Notes |
|---|---|---|
| Health score in DONNA COO answers | ✅ PASS | `donnaCOOAnswerEngine.ts` uses `academyHealthScore` |
| DONNA honest response when no score | ✅ PASS | `insufficient_data` path returns honest response |
| NBA engine uses health score | ✅ PASS | `donnaNBAEngine.ts` flags score < 65 as action needed |

---

## Items Requiring Browser Verification

1. Academy Health badge visible on director dashboard
2. Badge shows correct live/partial count number
3. Drawer opens without hydration error
4. All 7 KPI rows render with correct status labels
5. `blocked_by_schema` KPIs show muted/honest label (not a fake metric)
6. Action links navigate correctly (no 404s)
7. Drawer closes on overlay click and close button
8. DONNA message inside drawer uses correct copy

---

## Issues Found

| Severity | Component | Issue | Action |
|---|---|---|---|
| LOW | Curriculum Bottleneck, Parent Trust Coverage | Both are `not_yet_built` — show `blocked_by_schema` label. Director may wonder what these will eventually do. | Add "coming in future release" tooltip or description. LOW priority for V1 — the blocked label is honest. |
| INFO | Review Queue Throughput | `applied_at` not available, so throughput is partial at best. Comment in code notes this correctly. | Future sprint: add `applied_at` to `proposed_actions` when persistence sprint is approved. |

---

## Summary

| Check Type | Count | Result |
|---|---|---|
| Static code checks passed | 22 | ✅ |
| Requiring browser verification | 8 | `[BROWSER NEEDED]` |
| KPIs with honest status labels | 7 of 7 | ✅ |
| DB writes from health layer | 0 | ✅ |
| Issues found | 2 (both LOW/INFO) | No blockers |

---

*Generated by Sprint 718 — Academy Health Browser QA V1.*
