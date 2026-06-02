# Player Profile — DONNA UI Constitution QA

**Sprint:** Mega Sprint 1124-1130
**Standard:** `docs/architecture/DONNA_UI_CONSTITUTION.md`

---

## Constitution Requirements Check

| Requirement | Status | Notes |
|---|---|---|
| 1 primary job (understand development state + next step) | ✅ | Hero + Blueprint tab |
| 1 primary action visible | ✅ | "Review Missions" or "Review Level Readiness" in hero |
| DONNA brief at top | ✅ | `DonnaScreenBriefStatic` inside constitution hero |
| ≤5 visible data points (default) | ✅ | 5 signal cards in hero |
| Details behind expand/tabs | ⚠️ | Existing cards still visible below hero |

---

## PlayerProfileConstitutionHero

| Check | Expected | Status |
|---|---|---|
| Brief is computed from real data | Yes | ✅ |
| Brief names player by first name | Yes | ✅ |
| Brief names current level | Yes | ✅ |
| Brief names top priority | Yes | ✅ |
| Brief mentions missions when pending | Yes | ✅ |
| Brief flags old assessment (>60 days) | Yes | ✅ |
| 5 signal cards shown | current level, next target, top priority, missions, Ask DONNA | ✅ |
| Pending missions shows orange urgency | Yes | ✅ |
| Advancement eligible shows green + "Ready" | Yes | ✅ |
| Player status alert shown for non-active | Yes | ✅ |
| "Ask DONNA" chips dispatch `donna:open` event | Yes | ✅ |
| Primary action "Review Missions" links to missions tab | Yes — `?tab=missions` | ✅ |
| Primary action "Review Level Readiness" when eligible | Yes — `?tab=skill-path` | ✅ |
| No raw coach notes in hero | Confirmed — no observation content | ✅ |
| No parent/player unsafe content | Confirmed — director-only route | ✅ |
| Hero is Server Component | Yes — no 'use client' | ✅ |
| Mission counts fetched with try/catch | Yes — graceful fallback | ✅ |

---

## Safety checks

| Check | Expected |
|---|---|
| Parent portal cannot access player profile page | `/director` route, middleware-enforced |
| Hero shows zero missions gracefully | ✅ "0 active" |
| Hero shows no level gracefully | ✅ "—" placeholders |
| `AskDonnaInlinePrompt` is client-only dispatch | ✅ no server calls |

---

## Remaining gaps (not fixed in Sprint 1124)

| Gap | Notes |
|---|---|
| Existing overview cards below hero | Still visible — next sprint: wrap in `CollapsedDetailSection` |
| 9 tabs still all visible | Next sprint: group into 3 primary tabs + "More" |
| No `CollapsedDetailSection` on assessment history | Deferred |
| No `CollapsedDetailSection` on coach notes | Deferred |
