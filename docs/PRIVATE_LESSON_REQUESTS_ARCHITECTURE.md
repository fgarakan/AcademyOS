# Private Lesson Requests — Architecture

**Sprint:** 151
**Date:** 2026-05-01

---

## Purpose

Allow academy directors to receive and manage private lesson requests from parents and players. Requests flow into a director queue. No automatic communication, no billing, no calendar events.

---

## Table: `private_lesson_requests`

**Migration:** `supabase/migrations/050_private_lesson_requests.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `academy_id` | uuid | NOT NULL, FK → academies |
| `player_id` | uuid | Nullable, FK → players |
| `parent_profile_id` | uuid | Nullable, FK → profiles |
| `requested_coach_id` | uuid | Nullable, FK → profiles |
| `requested_by_user_id` | uuid | Nullable, FK → profiles |
| `preferred_days` | text | Free text |
| `preferred_times` | text | Free text |
| `goal` | text | Parent/player's stated goal |
| `notes` | text | Additional context |
| `status` | text | See statuses below |
| `director_notes` | text | Internal director use only |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

## Status Values

| Status | Meaning |
|---|---|
| `new` | Just submitted, not yet reviewed |
| `reviewing` | Director is reviewing |
| `assigned` | Coach has been assigned |
| `scheduled` | Session has been scheduled (external) |
| `declined` | Request declined |
| `completed` | Private lesson completed |

---

## RLS

Directors and head coaches can SELECT, INSERT, UPDATE.

Parent write access is deferred until parent-player relationship is confirmed safe (Sprint 153 preview only, no live submit).

---

## Route

**Director queue:** `/director/private-lessons`

---

## Guardrails

- No automatic communication triggered on any status change.
- No billing records created.
- No calendar events created.
- Parent submission gated until parent-player relationship is verified safe.
- All mutations go through `privateLessonActions.ts` server actions with academy_id scoping.

---

## Data Limitations

- `parent_profile_id` and `player_id` are nullable to allow director-created requests.
- Parent portal submission is disabled in Sprint 153 (preview card only) until parent-player FK is clarified.
- `requested_coach_id` is not enforced as a real coach assignment — it is a preference only.
