# Feature Flags and Kill Switches

> Part of the Trust Stack — see `trust-stack.md` for the root doctrine.
> Layer 6: Safe defaults protect.

This document defines the feature flag and kill switch architecture for AcademyOS. It covers: what kill switches exist today, how to add new ones, the safe-default rule, and the process for toggling them in production.

---

## Core Rule

When a kill switch is off, the feature is off. The system never fails into an active state. If the flag cannot be read, the feature is treated as disabled.

This applies to AI features, voice features, and any beta functionality. A missing environment variable or a null database row means the feature does not run — it does not mean "assume enabled."

---

## Two Types of Controls

### 1. Environment Variable Flags (Deployment-time)

These flags are set in `.env.local` (local) or the Vercel/hosting environment (production). They cannot be changed without a deployment. Use these for:
- Enabling AI subsystems that have external cost implications
- Enabling dev-only routes and tooling
- Toggling features that require infrastructure changes (e.g., a new external service)

Current env-variable flags:

| Variable | Effect when absent/false |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | App fails to start — required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | App fails to start — required |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev scripts and admin functions fail |
| `OPENAI_API_KEY` | Voice transcription and TTS are disabled |
| `ANTHROPIC_API_KEY` | DONNA note structuring is disabled |
| `OPENAI_REALTIME_API_KEY` | Realtime voice is disabled |
| `NODE_ENV=production` | Dev routes (`/dev/*`) are hidden |

### 2. Database-level Flags (Runtime)

These flags are stored in a database table and can be toggled without redeployment. Use these for:
- Academy-level feature rollout (enable a feature for one academy before all)
- Emergency kill switches to disable a feature without a deploy
- Per-role feature access controls

**Current state:** No database-level feature flag table exists yet. This is a gap identified in Sprint 400. The proposed table is `academy_feature_flags`.

Planned schema:

```sql
CREATE TABLE academy_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid REFERENCES academies(id) ON DELETE CASCADE,
  flag_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  enabled_for_roles text[] DEFAULT NULL, -- null = all roles
  notes text,
  toggled_by uuid REFERENCES profiles(id),
  toggled_at timestamptz DEFAULT now(),
  UNIQUE (academy_id, flag_key)
);
```

---

## Kill Switches in Use Today

These are the currently active kill switch patterns in the codebase:

### DONNA / Voice Processing

DONNA-related server actions check for the presence of the `ANTHROPIC_API_KEY` before making API calls. If the key is absent, the action returns a user-visible error and writes no proposed_action row.

Voice transcription checks for `OPENAI_API_KEY`. If absent, the upload endpoint returns an error and the audio is not retained.

### Dev Routes

The `/dev/*` routes check `process.env.NODE_ENV`:

```ts
if (process.env.NODE_ENV === 'production') {
  return <div>Not available</div>
}
```

These routes never render in production, even if a user navigates to the URL directly.

### Proposed Action Execution Guard

`execute_approved_action()` validates `action_type` against a registered list. Any unregistered action type is rejected without executing. This is a kill switch for unintended action types arriving in the queue.

---

## How to Add a New Kill Switch

### Environment-variable kill switch

1. Add the variable to `.env.local.example` with a comment explaining what it enables.
2. In the server action or route handler, check for the variable at the top of the function.
3. If absent: return a safe error; do not proceed.
4. Document it in this file under the relevant section.
5. Add it to the `release-safety-checklist.md` environment check.

```ts
// Example pattern
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  return { error: 'AI structuring is not configured for this environment.' }
}
```

### Database-level kill switch (once `academy_feature_flags` table exists)

1. Add a migration creating the flag row for the relevant academy.
2. In the server action, query the flag at the start:
   ```ts
   const { data: flag } = await db
     .from('academy_feature_flags')
     .select('enabled')
     .eq('academy_id', academyId)
     .eq('flag_key', 'voice_processing')
     .single()
   if (!flag?.enabled) return { error: 'Feature not available.' }
   ```
3. Log the flag toggle to `audit_logs` whenever it changes.
4. Document the flag key in this file.

---

## Safe Default Protocol

Every new feature must define its safe default state before it ships:

| Question | Required answer before shipping |
|---|---|
| What happens if the API key is missing? | Explicit error returned; no partial execution |
| What happens if the DB flag query fails? | Feature is treated as disabled |
| What happens if the feature is toggled off mid-request? | Request completes safely; no new executions start |
| What does the user see when a feature is disabled? | A clear, non-alarming message — never a crash |

Features that have not defined their safe default state are not ready to ship.

---

## Toggling Kill Switches in Production

Environment variable flags require a deployment. The process:
1. Update the environment variable in the hosting dashboard.
2. Trigger a redeployment.
3. Verify the feature is in the expected state post-deploy.
4. Log the change in `audit_logs` manually (until automated flag logging exists).

Database-level flags (once implemented) can be toggled via:
1. A Director-facing toggle in the admin panel (future sprint).
2. A direct SQL update by a Director or admin, logged to `audit_logs`.

Emergency disablement of a feature (e.g., a bug is causing incorrect AI outputs):
1. Set the database flag to `enabled = false` immediately.
2. If no database flag exists for that feature, remove the API key from the environment and redeploy.
3. Document the incident in the ops log.
4. Add a database flag for the feature before re-enabling it.

---

## Upcoming: Voice Processing Kill Switch

The voice processing pipeline (DONNA realtime, transcription, structuring) is the highest-risk external service in the system. Before Sprint 402 (rate limiting implementation), the following kill switches must be in place:

1. Per-academy `voice_processing_enabled` flag in `academy_feature_flags`
2. Per-session rate limit check before a voice session is opened
3. Hard cap on concurrent voice sessions per academy (enforced server-side)

These are planned but not yet implemented. See `docs/SCALABILITY_COST_CONTROL_AUDIT.md` for the full roadmap.
