# AcademyOS V1 Release Notes

**Sprint:** 743
**Date:** 2026-05-17
**Version:** V1.0 — Dabul Tennis Academy Pilot Release

---

## What Is AcademyOS V1?

AcademyOS V1 is a director-led, voice-capable operating system for a single tennis academy. It connects player development, session delivery, and coach wrap-up into a structured, review-first workflow.

**Operating model:**
> Voice creates → UI confirms → Database structures → System executes only when approved

---

## What Is Complete in V1

### Director Portal (`/director`)

| Feature | Status |
|---|---|
| Director dashboard — Academy Vital Signs, Priority Queue, Alerts, Today's Sessions | Live |
| DONNA daily brief — AI-structured "what needs attention" | Live (deterministic + AI) |
| Academy Health — composite KPI with sub-signals | Live (partial data at pilot start) |
| KPI engine — attendance, engagement, wrap-up rates | Live |
| Review queue — 8 tab types (wrap-ups, voice intake, curriculum, level-up, parent drafts, coach notes, attendance, other) | Live |
| Player directory (`/director/players`) — search, filter, curriculum level badge | Live |
| Player profile — 5 tabs: Overview, Skill Path, Competition, Fitness/Load, Notes | Live |
| Player development summary, gap guidance, advancement signals | Live |
| Curriculum explorer — 15 levels, 152+ drills, evidence-based gates | Live |
| Curriculum setup — starter spine, director customization, voice override | Live |
| Session directory — list + detail with curriculum context | Live |
| Class template library with lesson plan generation | Live |
| Coach recap review — approve, apply, reject | Live |
| Voice intake — speak → structure → review → approve | Live |
| Director command center — DONNA natural language interface | Live (deterministic V1) |
| Onboarding interview — director setup via realtime AI | Live |
| Demo sandbox — isolated demo data, reset any time | Live |
| Player import — CSV dry-run + live import | Live |
| Player development intake — strengths, needs, priorities | Live |

### Coach Portal (`/coach`)

| Feature | Status |
|---|---|
| Today's sessions — list with curriculum context | Live |
| Session detail — before/during view with class briefing | Live |
| Coach wrap-up drawer — 7-question guided flow | Live |
| Voice session recap — speak or type | Live |
| Player observation entry | Live |
| Adaptive session suggestions — rule-based, approve before apply | Live |

### Player Portal (`/player`)

| Feature | Status |
|---|---|
| Live development plan — what to work on, what level | Live (requires profile_id link) |
| Learning module Q&A preview | Live |
| Mini challenge + engagement prompt | Live |

### Parent Portal (`/parent`)

| Feature | Status |
|---|---|
| Live development plan parent view — why it matters, how to support | Live (requires guardian link) |
| Player progress summary | Live |

---

## What Is Not In V1

| Feature | Status | When |
|---|---|---|
| Parent communication send | Not built — draft only | V2 |
| Automatic level movement | Not built — director confirms manually | V2 |
| Automated roster mutation | Not built | V2 |
| Court / billing / CRM integration | Not built | Phase 4+ |
| Platform owner multi-academy view | Built (platform_roles) | Pilot: not used |
| Voice execution routing (all 15 action types) | 11 of 15 covered | Sprint 250+ |
| Player portal for players without profile_id | Requires manual link | Setup required |
| Parent portal for parents without guardian link | Requires director setup | Setup required |
| Director configuration screen | Not built | Phase 4+ |
| Production TTS (ElevenLabs) | Browser speechSynthesis only | V2 |
| Production STT beyond browser SpeechRecognition | OPENAI_API_KEY required | Config |

---

## Safety Architecture Summary

All V1 mutations follow this chain:

1. **DONNA proposes** — voice or AI creates a draft in `proposed_actions` with `status: 'pending_review'`
2. **Director reviews** — the review queue presents the draft with source, confidence, and risk
3. **Director approves** — explicit action required; no automatic approval
4. **System applies** — `execute_approved_action()` is the only function that executes; writes to `audit_logs`

**Invariants that cannot be broken:**
- `NEVER_AUTOMATIC` array in `structureVoiceIntake.ts` — lists all behaviors DONNA must never automate
- `finalize_player_placement()` — only path to activate a player
- `execute_approved_action()` — only path to execute an approved action
- `assertNotPreviewMode()` — blocks writes in preview/demo mode

---

## Known Limitations at Pilot Start

1. Real STT requires `OPENAI_API_KEY` in server environment (browser SpeechRecognition is V1 fallback)
2. `player_gate_status` table partially applied — gate evidence confirmation deferred to Sprint 107+
3. `template_block_exercises` RLS policy requires migration 058 applied to live Supabase
4. Player portal requires `profile_id` linkage by director or coach before player can log in
5. Parent portal requires `guardian` record and `player_guardians` linkage

---

## Pilot Scope

- **Academy:** Dabul Tennis Academy
- **Director:** Brian Dabul
- **Phase:** Single academy, live data after roster import
- **Data:** Demo sandbox available for walkthrough; real data after CSV import
- **Support contact:** Farshad Garakani

---

## V1 is production-safe for:

- A single academy director running the system solo
- Real session data capture by coaches
- Director review and approval of proposed actions
- Player profile building from imported roster
- Curriculum spine active and connected to sessions and players
