# V1 Launch Decision Checklist — Sprint 756

**Sprint:** 756
**Date:** 2026-05-17

---

## Purpose

The final go/no-go checklist before AcademyOS V1 goes live for the Dabul Tennis Academy pilot.

---

## Go Criteria

Mark each item ✅ when confirmed. No item may be ❌ on launch day.

### Infrastructure

- [ ] Supabase project is live and accessible
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set in production environment
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in production environment
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in production environment
- [ ] Application deploys without build errors
- [ ] `npx tsc --noEmit` passes clean

### Database

- [ ] Director account created in Supabase Auth
- [ ] Director `profiles` row exists with correct `academy_id`
- [ ] Director `academy_memberships` row active with `academy_director` role
- [ ] Coach account(s) created
- [ ] Coach `profiles` and `academy_memberships` rows correct
- [ ] At least one `academies` row exists

### Pilot-blocking migrations (apply if not yet applied)

- [ ] `056_session_block_exercises_rls.sql` applied
- [ ] `058_template_block_exercises_rls.sql` applied
- [ ] Migration 041 → 044 → 060 applied (gate status repair)

### Safety invariants

- [ ] `assertNotPreviewMode()` confirmed in server actions (Sprint 721 passed)
- [ ] No parent send button visible in any director or coach screen
- [ ] No automated level movement possible from UI
- [ ] Demo sandbox data does not appear in real director view

### Demo readiness

- [ ] Demo sandbox created and all 5 status cards show green
- [ ] Voice demo tested in Chrome with microphone
- [ ] "Open Demo Session" link works and leads to correct session page
- [ ] Brian Voice Demo Script tested end-to-end

### Pilot materials

- [ ] Brian has received login credentials
- [ ] Brian has received one coach test account
- [ ] Brian has the demo sandbox link
- [ ] Farshad has the operator guide (`docs/V1_INTERNAL_OPERATOR_GUIDE_744.md`)
- [ ] First check-in call scheduled (Week 1)

---

## No-Go Conditions

Any of these conditions stops the launch:

- Director cannot log in
- Demo sandbox creation fails
- TypeScript errors in production build
- Safety invariant check fails (parent sends, auto level movement)
- Supabase RLS blocking director from reading own players

---

## Sign-Off

When all go criteria are met and no no-go conditions exist:

> "AcademyOS V1 is GO for Dabul Tennis Academy pilot."

Record the date, who confirmed, and any outstanding minor gaps.

**Date:** _____________
**Confirmed by:** _____________
**Outstanding minor gaps:** _____________
