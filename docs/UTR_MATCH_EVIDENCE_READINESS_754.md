# UTR and In-House Match Evidence Readiness — Sprint 754

**Sprint:** 754
**Date:** 2026-05-17

---

## Current UTR Integration State

| Capability | Status | Location |
|---|---|---|
| UTR history display | ✅ Live | Player profile Competition tab |
| UTR trend chart | ✅ Live | Recharts sparkline in Competition tab |
| UTR match results | ✅ Live | Recent matches list |
| UTR insights (DONNA) | ✅ Live | DONNA-structured insight from UTR data |
| UTR data source | Backend lib | `src/lib/backend/utr.ts` |
| Live UTR API connection | ⚠️ Depends on config | UTR data served from backend; requires UTR integration setup |

## In-House Match Evidence

| Capability | Status | Notes |
|---|---|---|
| Match results entry | ❌ Not built | No match entry UI |
| In-house tournament results | ❌ Not built | No tournament schema |
| Match evidence in gate records | ❌ Not built | Match performance not connected to gates |
| Competition screen | ❌ Not built | `/director/competition` route does not exist |

## Match Evidence Connection to Gates

Curriculum gates for Yellow Ball and High Performance levels require competitive match evidence:
- "3 wins against same-level opponents"
- "Consistent UTR progression over 6 weeks"
- "Played at least one USTA tournament"

None of these can be evaluated automatically in V1. Coaches and directors track them manually.

## Pilot Plan

- UTR history is visible in player profiles (Competition tab)
- In-house match results should be recorded as coach notes until a match entry UI is built
- Gate evidence from matches recorded manually via "Record Gate Evidence"
- `/director/competition` route for full competition management is a future sprint

## Verdict

**UTR display: LIVE in V1.**
**In-house match evidence and competition management: NOT BUILT in V1.**

UTR trend and match history display works. Competition route and match entry UI are V2+ work. Coaches can record match observations as notes and evidence manually.
