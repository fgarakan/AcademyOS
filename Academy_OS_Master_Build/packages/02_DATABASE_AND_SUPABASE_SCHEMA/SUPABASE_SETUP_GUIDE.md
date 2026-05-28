# SUPABASE SETUP GUIDE

## Prerequisites
- Supabase account at supabase.com
- Node.js 18+ installed
- Supabase CLI: `npm install -g supabase`

## Step 1: Create project

1. Go to supabase.com/dashboard
2. New Project → name: "academy-os", region: closest to users
3. Save the database password securely

## Step 2: Get credentials

From Project Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL` — project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server-only, never expose to client)

Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Step 3: Run migrations (in order)

Via Supabase SQL editor or CLI:

```bash
supabase db push
```

Or paste each file manually in the SQL editor:
1. `0001_core_schema.sql`
2. `0002_roles_permissions_rls.sql`
3. `0003_players_groups_profiles.sql`
4. `0004_assessments_placement.sql`
5. `0005_templates_sessions_exercises.sql`
6. `0006_coach_notes_observations.sql`
7. `0007_voice_commands_proposed_actions.sql`
8. `0008_audit_logs_versioning.sql`
9. `0009_seed_data.sql`
10. `0010_functions_triggers.sql`
11. `0011_views_reporting.sql`

## Step 4: Generate TypeScript types

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

## Step 5: Enable storage

Create storage buckets in Supabase dashboard:
- `voice-notes` — audio recordings (private, authenticated access only)
- `attachments` — general file attachments (private)

## Step 6: Create first admin user

1. Go to Authentication → Users → Invite User
2. Use your admin email
3. After confirming, insert their profile:

```sql
INSERT INTO profiles (id, academy_id, display_name, email)
VALUES (
  '[auth.users.id from previous step]',
  '00000000-0000-0000-0000-000000000001',  -- seed academy
  'Academy Director',
  'your@email.com'
);

INSERT INTO academy_memberships (academy_id, profile_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '[profile id]',
  'academy_director'
);
```

## Step 7: Verify RLS

Run the RLS testing queries in `RLS_TESTING_GUIDE.md`.

## Common issues

**"permission denied for table X"** — RLS policy missing or auth function not returning correct value. Check `auth_academy_id()` returns the right value for your user.

**"auth.uid() is null"** — not authenticated. Ensure JWT is being passed in request headers.

**Foreign key constraint error on profiles** — auth.users record doesn't exist yet. Create via Supabase Auth before inserting profile.
