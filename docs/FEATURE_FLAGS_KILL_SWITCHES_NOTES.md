# Feature Flags and Kill Switches Implementation Notes

> Sprint 414–415 — Feature Flags + Kill Switches V1
> See also: `docs/feature-flags-and-kill-switches.md` (architecture doctrine)

---

## What Was Created in Sprints 414–415

Two new files:

### `src/lib/featureFlags/featureFlags.ts`

Environment-variable driven feature flags. All flags default to OFF.

**Exports:**
- `isDonnaEnabled()` — requires `ANTHROPIC_API_KEY`
- `isVoiceTranscriptionEnabled()` — requires `OPENAI_API_KEY`
- `isRealtimeVoiceEnabled()` — requires `OPENAI_REALTIME_API_KEY`
- `isTtsEnabled()` — requires `OPENAI_API_KEY`
- `isPlayerSummaryGenerationEnabled()` — requires `FEATURE_PLAYER_SUMMARY_GENERATION=1`
- `isBackgroundJobQueueEnabled()` — requires `FEATURE_BACKGROUND_JOB_QUEUE=1`
- `isPersistentIdempotencyEnabled()` — requires `FEATURE_PERSISTENT_IDEMPOTENCY=1`
- `isUtrSyncEnabled()` — requires `UTR_API_KEY`
- `isDevEnvironment()` — `NODE_ENV !== 'production'`
- `getAllFeatureFlags()` — returns all flag states as a map (used by diagnostics)

### `src/lib/killSwitches/killSwitches.ts`

Hard-coded kill switch checks. Kill switches BLOCK features when their env var is absent.

**Kill switch pattern:** Set `KILL_SWITCH_ALLOW_<NAME>=1` to allow the feature.

**Exports:**
- `isKillSwitchAllowed(name, requestId?)` — returns false if the kill switch is active
- `killSwitchBlockedMessage(name)` — user-visible message for blocked requests
- `getAllKillSwitchStates()` — returns all switch states (used by diagnostics)

---

## Difference Between Feature Flags and Kill Switches

| | Feature Flag | Kill Switch |
|---|---|---|
| Default state | OFF | BLOCKED |
| Enabling | Set env var to `1` or `true` | Set `KILL_SWITCH_ALLOW_*=1` |
| Purpose | Opt-in to new features | Emergency stop for risky features |
| Granularity | Per-feature | Per-subsystem |
| Who toggles | Developer / product | On-call engineer |
| Response to missing var | Feature is off | Feature is blocked, warning logged |

---

## Kill Switch Environment Variables

| Variable | Guards |
|---|---|
| `KILL_SWITCH_ALLOW_VOICE_PROCESSING` | All voice input (transcription + structuring) |
| `KILL_SWITCH_ALLOW_DONNA_INTELLIGENCE` | DONNA AI analysis |
| `KILL_SWITCH_ALLOW_AI_PROPOSED_ACTIONS` | Creating new AI proposed_actions |
| `KILL_SWITCH_ALLOW_ACTION_EXECUTION` | Executing approved proposed_actions |
| `KILL_SWITCH_ALLOW_PARENT_PORTAL_UPDATES` | Sending parent development updates |
| `KILL_SWITCH_ALLOW_UTR_SYNC` | External UTR data sync |
| `KILL_SWITCH_ALLOW_BACKGROUND_JOBS` | Background job dispatcher |

**Override for local dev only:** `ACADEMYOS_DISABLE_ALL_KILL_SWITCHES=1`
This override is blocked in `NODE_ENV=production`.

---

## How to Add a New Kill Switch

1. Add the name to the `KillSwitchName` union type in `killSwitches.ts`
2. Add the env var mapping to `KILL_SWITCH_ENV`
3. Add a user message to the `messages` map in `killSwitchBlockedMessage()`
4. Document the variable in this file and in `docs/feature-flags-and-kill-switches.md`
5. Add the variable to `.env.local.example` with a comment

---

## How to Gate a Server Action with a Kill Switch

```ts
import { isKillSwitchAllowed, killSwitchBlockedMessage } from '@/lib/killSwitches/killSwitches'

export async function structureCoachRecapAction(formData: FormData) {
  'use server'
  if (!isKillSwitchAllowed('voice_processing', requestId)) {
    return { ok: false, error: killSwitchBlockedMessage('voice_processing') }
  }
  // ... rest of action
}
```

---

## Diagnostics Console

All feature flags and kill switch states are visible at `/dev/diagnostics` (dev environment only).
This page calls `getAllFeatureFlags()` and `getAllKillSwitchStates()` at render time —
no caching, always live.

---

## Planned: DB-Backed Feature Flags (Sprint 421+)

The `academy_feature_flags` table defined in `docs/feature-flags-and-kill-switches.md`
will enable per-academy flag toggling without redeployment. When that table exists:

1. Add a DB flag check after the env-var check in `featureFlags.ts`
2. The DB flag can override the env-var flag (for per-academy rollout)
3. All flag toggles write to `audit_logs`
