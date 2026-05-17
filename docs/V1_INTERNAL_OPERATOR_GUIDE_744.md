# AcademyOS V1 Internal Operator Guide

**Sprint:** 744
**Date:** 2026-05-17
**Audience:** Farshad Garakani (operator), future support staff

---

## 1. Environment Setup

### Required environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Admin operations (player import, service actions) |
| `ANTHROPIC_API_KEY` | Optional | AI note structuring, DONNA brief generation |
| `OPENAI_API_KEY` | Optional | Production voice transcription, TTS |

Without `ANTHROPIC_API_KEY`: AI draft panel shows orange warning; DONNA brief degrades to deterministic summary.
Without `OPENAI_API_KEY`: Voice transcription returns 503 with "You can still type" message; TTS silently disabled.

### Dev environment

```bash
npm install
cp .env.example .env.local
# Fill in Supabase URL + keys
npm run dev
```

### Supabase migrations pending live application

Before piloting with real data, apply these migrations in order if not yet applied:

1. `056_session_block_exercises_rls.sql`
2. `058_template_block_exercises_rls.sql`
3. `041_requirement_domains.sql` → `042` → `043` → `044` → `060_gate_status_repair.sql`
4. `061_curriculum_content_taxonomy.sql`
5. `062_class_template_content_junction.sql`

See `docs/KNOWN_LIMITATIONS.md` for full details.

---

## 2. Academy Setup (First Run)

### Step 1 — Create the academy record

Via Supabase dashboard → Table Editor → `academies`:
- Insert a row with `name`, `slug`, and any `settings` JSON (can be `{}`)
- Record the `id` UUID

### Step 2 — Create the director user

Via Supabase Auth → Users → Create user:
- Email + password
- Record the user `id` (UUID)

Then insert into `profiles`:
```sql
INSERT INTO profiles (id, email, full_name, role, academy_id)
VALUES ('<user-id>', '<email>', '<name>', 'academy_director', '<academy-id>');
```

Then insert into `academy_memberships`:
```sql
INSERT INTO academy_memberships (profile_id, academy_id, role, is_active)
VALUES ('<user-id>', '<academy-id>', 'academy_director', true);
```

### Step 3 — Import roster

Navigate to `/director/players/import`:
- Upload CSV (see `data/player-import/academy_os_player_import_roster.csv` for format)
- Click "Dry Run" — validates all rows
- Review results — fix any errors
- Click "Import Live" — writes to database
- Confirm player count in `/director/players`

### Step 4 — Set up curriculum

Navigate to `/director/onboarding/curriculum`:
- Select "Academy OS Starter Spine"
- Approve the spine
- Confirm active status in `/director/curriculum`

### Step 5 — Create coach accounts

Via Supabase Auth + `profiles` + `academy_memberships` (same pattern as director but `role: 'coach'`).

---

## 3. Demo Sandbox

Navigate to `/director/demo`:
- Click "Create Demo Sandbox" — seeds 6 demo players, group, template, session, curriculum version
- Click "Reset Demo Sandbox" — destroys and recreates all demo data
- Demo records are tagged `[DEMO]%` and cannot affect real player data

---

## 4. Review Queue Operations

The review queue at `/director/review` contains all pending proposed actions.

| Tab | What it shows | Director action |
|---|---|---|
| Wrap-ups | Coach session recaps | Approve → Apply (writes session notes) |
| Voice intake | Director voice commands | Approve → Execute |
| Curriculum | Curriculum override drafts | Approve |
| Level-up | Player advancement signals | Confirm (triggers `finalize_player_placement()`) |
| Parent drafts | Draft parent updates | Approve → (future: send) |
| Coach notes | Flagged observations | Review |
| Attendance | Attendance exceptions | Review |
| Other | Uncategorized | Review |

**Applying approved items:** "Approve" marks status. A separate "Apply" button executes via `execute_approved_action()`. Both steps are required.

---

## 5. Voice / AI Operations

### Voice intake (director command center)

- Navigate to `/director/command-center`
- Type or speak a command
- DONNA returns a structured response chip
- Any mutation creates a `proposed_action` in the review queue (never executes automatically)

### Coach voice wrap-up

- Coach opens session → taps "Coach Wrap-Up"
- Speaks or types notes → saves to `voice_notes`
- DONNA structures notes → creates `proposed_action` for director review

### AI note structuring

- Director player profile → Notes tab → "Draft with AI"
- Requires `ANTHROPIC_API_KEY`
- Degrades gracefully if key absent (orange warning, text entry still works)

---

## 6. Monitoring and Debugging

### Check pending review queue

```sql
SELECT action_type, status, created_at FROM proposed_actions
WHERE academy_id = '<academy-id>'
  AND status = 'pending_review'
ORDER BY created_at DESC;
```

### Check audit log

```sql
SELECT actor_id, action_type, entity_type, created_at FROM audit_logs
WHERE academy_id = '<academy-id>'
ORDER BY created_at DESC
LIMIT 50;
```

### Check player activation status

```sql
SELECT full_name, status, onboarding_status FROM players
WHERE academy_id = '<academy-id>'
ORDER BY full_name;
```

---

## 7. Safety Invariants — Never Override

1. No parent communication is ever sent automatically. All drafts require director approval.
2. No player level movement without explicit director action (`finalize_player_placement()`).
3. No AI content is written to player profiles without a human review step.
4. All server actions verify `getUser()` before touching data.
5. Preview / demo mode blocks all writes (`assertNotPreviewMode()`).

---

## 8. Support Escalation

| Issue | First step |
|---|---|
| Director can't log in | Check `profiles` and `academy_memberships` in Supabase |
| Review queue is empty | Check `proposed_actions` table for pending items |
| Voice fails (no transcript) | Check `OPENAI_API_KEY`; browser must be Chrome/Edge |
| AI draft shows warning | Check `ANTHROPIC_API_KEY` |
| Player data missing after import | Check import log in `/director/players/import` |
| Exercise library empty | Apply migration 056/058; check RLS policies |

Contact: farshadgarakani@proton.me
