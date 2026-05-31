# Internal Pilot Live Clickthrough QA — Sprint 1055

**Sprint:** 1055 — Internal Pilot Live Clickthrough QA V1
**Date:** 2026-05-31
**Type:** QA documentation — no code changes

---

## Golden path: Director (Brian Dabul)

### 1. Login → Dashboard

- URL: `/director`
- Expected: DirectorPrimaryActionHero (primary action, pending count)
- KPI grid below fold
- DONNA button visible (bottom right, desktop)
- Page should load in <3 seconds

### 2. DONNA voice session

- Click DONNA button → panel opens → header shows "Listening" within 1 second (if mic permitted)
- Speak: "What needs my attention today?"
- DONNA response appears in thread (DonnaPanelResponseRenderer)
- Mic resumes after response
- Click DONNA button again → panel minimizes (session preserved)

### 3. Review Queue

- URL: `/director/review`
- Subtitle: "Everything here waits for your decision. Nothing is applied until you approve it."
- All 8 tabs visible
- Open a pending wrap-up → approve → status changes

### 4. Player Directory

- URL: `/director/players`
- Player list renders with status badges
- DONNA attention chip: visible only if signals exist
- Click a player → profile loads

### 5. Player Profile

- URL: `/director/players/[id]`
- Header: name, level badge, or orange "No curriculum level" warning
- Overview tab: PlayerCommandCenterCard + action summary
- Curriculum level picker (Skill Path tab)

### 6. Class Templates

- URL: `/director/class-templates`
- No PageExplainerCard above template list
- "New Class Template" button visible + DONNA-focusable
- Template list shows lesson plan status

### 7. Sessions

- URL: `/director/sessions`
- "Sessions are generated from your templates and give coaches a structured plan to run on court."
- "New Session" CTA with data-donna-focus-id

---

## Golden path: Coach

### 1. Coach Home

- URL: `/coach`
- Greeting with first name
- Wrap-up alert if sessions need wrap-up
- Today's sessions list
- No DONNA body card (removed Sprint 1044)
- On-Court Capture section

### 2. Session Detail

- URL: `/coach/sessions/[id]`
- No "Snapshot notice"
- After Session: "Use Wrap-Up Session for your end-of-session recap."
- "Start Wrap-Up →" link visible

### 3. Wrap-Up

- URL: `/coach/sessions/[id]/wrap-up`
- 6 questions render
- Voice input buttons present
- Player name chips on standouts/attention questions
- Submit → success state: green checkmark, "Wrap-up submitted for review"
- No duplicate ShieldCheck box
- No "Ask DONNA" link in success state

---

## Golden path: Parent

- URL: `/parent`
- "{firstName}'s Journey" or "Parent Home" title
- Level card visible if curriculum assigned
- Mission card visible

## Golden path: Player

- URL: `/player`
- "{firstName}'s Development" or "Player Home" title
- Hero card, 4 path cards
- Mid-page DONNA chips
- No bottom "Ask DONNA CTA" card

---

## Pre-flight checklist

### Environment
- [ ] `OPENAI_API_KEY` set (for God Mode DONNA responses)
- [ ] Supabase connection active
- [ ] Brian's director account linked to Dabul Tennis Academy `academy_id`
- [ ] At least 3 demo players in DB with active status

### Pending migrations (if needed for demo)
- Migration 045: `curriculum_level_id` on templates (needed if Brian edits class templates)
- Migration 056: `session_block_exercises` RLS (needed if Brian creates sessions)
- See `docs/KNOWN_LIMITATIONS.md` for full list

### TypeScript
- [ ] `npx tsc --noEmit` passes clean (verified Sprint 1052–1054)

---

## Known issues for pilot (non-blocking)

1. **iOS voice auto-start**: requires manual tap — documented in Sprint 1054
2. **Player profile mobile**: not responsive below ~900px
3. **Two class template routes**: use `/director/class-templates` (live data), not `/director/templates/class` (demo data)
4. **Session template attachment**: cannot be changed after session creation
