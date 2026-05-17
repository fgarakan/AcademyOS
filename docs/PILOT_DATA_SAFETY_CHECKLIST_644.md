# Pilot Data Safety Checklist V1

**Sprint:** 644
**Date:** 2026-05-17
**Purpose:** Data safety checklist for real academy pilot use — protecting player, parent, and coaching data

---

## Before the Pilot Starts

### Access and Authentication
- [ ] Director account created and email confirmed
- [ ] Coach accounts created (one per coach)
- [ ] Passwords communicated securely (not in plaintext email)
- [ ] All accounts use strong passwords (or magic link if configured)
- [ ] Role assignments verified: directors are `academy_director`, coaches are `coach`
- [ ] No shared accounts — each person has their own login
- [ ] No service role key or admin tokens exposed in the app

### Data Setup
- [ ] Demo players clearly marked (if using demo data)
- [ ] Real player roster imported and confirmed accurate
- [ ] No minor player data shared with unauthorized roles
- [ ] Parent/player data only visible to appropriate roles
- [ ] No sensitive data (home addresses, financials) entered into Academy OS (not in scope for V1)

### Supabase Configuration
- [ ] RLS is active on all tables (verified at sprint start)
- [ ] No public access policies on player, profile, or proposed_actions tables
- [ ] Service role is not used in any client-side code
- [ ] Anon key only used for unauthenticated endpoints (if any)
- [ ] Database connection uses SSL

---

## During the Pilot

### What Coaches Are Allowed to Enter
- [ ] Session wrap-up observations (text, voice transcript)
- [ ] Attendance records (present/absent/late)
- [ ] Player flags and notes for director review
- [ ] Parent communication suggestions (NOT sent — goes to review only)

### What Coaches Are NOT Allowed to Do
- [ ] Directly modify player profiles or development summaries
- [ ] Access other coaches' wrap-ups or notes
- [ ] Access parent or player portal data
- [ ] View any data outside their assigned players/groups

### What the Director Can Do
- [ ] Review and approve all coach submissions
- [ ] View all player profiles, sessions, and observations
- [ ] Approve parent update drafts (portal visibility only — no external send)
- [ ] Access Academy Health Score and COO intelligence panel
- [ ] Execute approved actions via the review queue

### What the Director Cannot Do (Guardrails)
- [ ] Send emails or SMS to parents (integration not configured)
- [ ] Auto-approve or auto-apply voice commands without review
- [ ] Automatically move a player to a different level
- [ ] Bypass the proposed_actions pipeline for any mutation

---

## External Send Safety

| Action | Status | Safety |
|---|---|---|
| Email to parents | Not configured | ✅ No sends possible |
| SMS to parents | Not configured | ✅ No sends possible |
| Push notifications | Not configured | ✅ No sends possible |
| Parent portal visibility | Configured (login required) | ✅ Only after director approval |
| Slack/third-party | Not configured | ✅ No sends possible |

**Confirmed: No external communication is possible during this pilot without explicit integration configuration by Farshad.**

---

## Data Retention and Privacy

- Player data is stored in Supabase (hosted infrastructure).
- All data is isolated per academy via `academy_id` on all tables.
- RLS policies ensure no cross-academy data leak.
- Data is not shared with any third parties.
- DONNA's intent classification is keyword-based — no player data leaves the system to an AI model during this pilot (no external AI API calls).
- If the pilot ends and data needs to be deleted, Farshad performs a manual deletion or the academy_id is tombstoned.

---

## Known Scope Limitations (Not Data Risks — Just Scope)

| Item | Status |
|---|---|
| HIPAA/medical data | Not in scope for V1 |
| Financial records | Not in scope for V1 |
| Legal documents or contracts | Not in scope for V1 |
| Video recordings | Not in scope for V1 |
| GPS or location tracking | Not in scope for V1 |

Academy OS V1 stores: player profiles, session records, coach notes/observations, attendance, and parent communication drafts only.

---

## Incident Response

If a data issue is identified during the pilot:

1. Stop the affected workflow immediately.
2. Message Farshad with a description of what happened.
3. Do not attempt to delete or modify data independently.
4. Farshad will investigate and respond within 2 hours for pilot-period issues.

---

## Sign-Off

Before the pilot goes live, Farshad should confirm:

- [ ] All accounts provisioned correctly
- [ ] RLS verified active
- [ ] No service role key exposed
- [ ] Demo data clearly marked (if present)
- [ ] External send integrations confirmed as not active
- [ ] Coach and director first-run guides distributed

**Checklist completed by:** Farshad Garakani
**Date:** 2026-05-17
