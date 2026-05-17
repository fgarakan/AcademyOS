# Player Profile Mission Readiness Audit — Sprint 751

**Sprint:** 751
**Date:** 2026-05-17

---

## Purpose

Audit whether the player profile is ready to serve as a living development record for the pilot.

---

## Player Profile Tab Audit

### Overview tab

| Element | Status | Notes |
|---|---|---|
| Curriculum level badge | ✅ Live | Connected to `player_curriculum_states` |
| Development summary | ✅ Live | AI draft or manual; `source` label shown |
| Domain counts (strengths/needs) | ✅ Live | From gap engine |
| Advancement indicator | ✅ Live | Evidence-based, deterministic |

### Skill Path tab

| Element | Status | Notes |
|---|---|---|
| Level picker | ✅ Live | Director can assign level |
| Assignment card | ✅ Live | Shows current level detail |
| Gap guidance | ✅ Live | Training and knowledge gaps |
| Advancement signal | ✅ Live | Gate evidence count |
| Gates preview | ✅ Live | Evidence threshold, status |
| Q&A preview | ✅ Live | Director preview of player-facing answers |

### Competition tab

| Element | Status | Notes |
|---|---|---|
| UTR profile | ✅ Live | UTR history and trend |
| Trend chart | ✅ Live | Recharts sparkline |
| Match results | ✅ Live | Recent matches |
| Insights | ✅ Live | DONNA-structured from UTR data |

### Fitness / Load tab

| Element | Status | Notes |
|---|---|---|
| Volume signal | ✅ Live | Sessions per week |
| Domain mix | ✅ Live | Balance across domains |
| Intensity | ✅ Live | Effort rating from sessions |
| Fatigue risk | ✅ Live | Risk flag from load model |
| Trend | ✅ Live | 4-week trend |

### Notes tab

| Element | Status | Notes |
|---|---|---|
| Coach observations feed | ✅ Live | All observations for this player |
| Priority signals | ✅ Live | Top coach-flagged priorities |
| Evidence timeline | ✅ Live | Gate evidence entries |
| Voice note entry | ✅ Live | Quick capture to proposed_actions |
| Parent guidance preview | ✅ Live (draft only) | Labeled "Draft — not sent" |
| AI draft panel | ✅ Live | Degrades gracefully if no API key |

---

## Player Mission Readiness

A "player mission" is the set of things a player should be working on right now — level, gates, strengths to build on, areas to improve.

| Component | Surfaced in profile? | Location |
|---|---|---|
| Current level | ✅ | Overview tab + Skill Path header |
| What to work on (needs) | ✅ | Overview tab domain counts + Gap guidance |
| Next gate to pass | ✅ | Skill Path → Gates section |
| Evidence needed | ✅ | Gate evidence count + threshold |
| Coach priority for next session | ✅ | Notes → Priority signals |
| Parent-safe summary | ✅ | Notes → Parent guidance preview |

**All 6 player mission components are surfaced in the profile. ✅**

---

## Gaps

1. **Player cannot see their own profile** — `/player` requires `profile_id` linkage by a director or coach. Linker UI exists in the player import flow but manual setup still required.
2. **Player mission page** — No dedicated "Your mission this month" page in the player portal. The player sees a general development plan. A future "mission card" sprint could make this more engaging.
3. **Parent cannot see gate evidence detail** — Parent portal shows approved development plan only, not the raw gate evidence counts.

---

## Verdict

**Player profile mission readiness: READY for director use. Player self-access requires profile_id linkage.**

All 5 tabs are built, live, and data-complete. Player mission components are all surfaced. Coach observations feed correctly into the profile.

The player self-access gap is a known limitation (documented in KNOWN_LIMITATIONS.md) and does not block the pilot — Brian will use the director view of player profiles during the pilot.
