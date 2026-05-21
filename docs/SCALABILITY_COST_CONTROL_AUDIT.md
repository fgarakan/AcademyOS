# AcademyOS — Scalability & Cost Control Audit V1

**Sprint:** 400  
**Date:** 2026-05-21  
**Scope:** Pre-pilot architecture audit. Documentation only. No implementation.  
**Status:** Audit complete. No app code changed.

---

## A. Executive Summary

### Top 10 Scaling Risks

| # | Risk | Impact |
|---|---|---|
| 1 | **Zero rate limiting on any API route or server action** | Any user can spam DONNA commands, Whisper transcriptions, or TTS calls — direct AI cost explosion |
| 2 | **DONNA intelligence actions run 8+ synchronous DB queries + KPI computation per invocation** | donnaDirectorIntelligenceActions.ts (1,342 lines) fires up to 9 sequential Supabase queries every time a director asks DONNA anything |
| 3 | **54 `select('*')` queries in backend/action files** | Entire rows transferred on every read; payload doubles as schema grows |
| 4 | **No idempotency on any write action** | Double-submit or network retry creates duplicate proposed_actions, voice_commands, session records |
| 5 | **No caching anywhere except `revalidatePath`** | Every portal page load (player, parent, coach, director) re-runs all Supabase queries from scratch |
| 6 | **KPI engines (2,123 lines) run synchronously, inline with each DONNA intelligence request** | As player count grows, KPI computation time grows linearly — no background processing |
| 7 | **Dashboard views (`v_academy_priority_queue`, `v_recommendation_review_queue`) have no pagination limit by default** | At 100+ players these views scan the full academy dataset on every director dashboard load |
| 8 | **Voice transcription (OpenAI Whisper) and TTS (OpenAI) have no per-user or per-session limits** | A coach who leaves a recording loop running could generate hundreds of API calls |
| 9 | **Curriculum clone and curriculum population are fully synchronous server actions** | At 50+ curriculum levels these block the request for seconds; at 200+ levels they will time out |
| 10 | **No usage metering table** — AI calls, voice calls, and heavy reads are invisible | No data to set budgets, detect abuse, or produce per-academy cost reports |

### Top 10 Fastest Fixes (No Dependencies)

| # | Fix | Sprint |
|---|---|---|
| 1 | Add per-user Supabase row count guard before curriculum clone (abort if already cloned) | 401 |
| 2 | Add idempotency key to coach recap structuring action (use voiceNoteId as dedup key) | 401 |
| 3 | Add idempotency key to proposed_actions insert (unique constraint on voice_command_id per academy) | 401 |
| 4 | Narrow all `select('*')` in backend to explicit column lists | 401 |
| 5 | Add pagination (`.limit(50)`) to `v_recommendation_review_queue` and all dashboard view queries | 401 |
| 6 | Add `MAX_TEXT_LENGTH` guard to DONNA director command input (already exists for TTS — add to commands) | 401 |
| 7 | Add file-size + MIME guard to transcription route (already exists at 4 MB — lower to 2 MB for V1) | 401 |
| 8 | Add revalidatePath to all DONNA write actions that currently skip it | 401 |
| 9 | Add `processing_status = 'structured'` guard to structureCoachRecapAction (already exists — verify all paths hit it) | 401 |
| 10 | Add a usage_events table with no RLS (insert-only, append-only) to begin metering | 402 |

### What Must Happen Before Pilot

- Idempotency on coach recap structuring (double-tap protection)
- Idempotency on proposed_actions insert (no duplicate drafts)
- Pagination on all director dashboard view queries
- File size and rate guard on voice transcription route
- Text length guard on DONNA command input
- Confirm all DONNA write actions have `assertNotPreviewMode()` (current partial coverage)

### What Can Wait

- Full Redis/Upstash cache layer
- Background job queue (Supabase pg_cron, BullMQ, or Trigger.dev)
- AI cost metering dashboard
- Materialized view refresh scheduling
- Multi-academy cost reporting
- Media/video processing pipeline

### What Should NOT Be Overbuilt Yet

- Do not implement Redis or Upstash before usage data proves need
- Do not add a full queue system before sync paths actually timeout in practice
- Do not add ML-based rate limit tuning before V1 limits are proven
- Do not implement event-driven cache invalidation before TTL-only is shown insufficient

---

## B. Required Protection Layers

| Layer | Current State | V1 Need |
|---|---|---|
| **Debouncing** | None in server actions; UI components may debounce locally | Required for autosave, search, drag/drop, curriculum edits |
| **Rate limiting** | **Zero** across all routes and actions | Required before pilot for AI/voice routes |
| **Caching** | Only Next.js `revalidatePath` (invalidation, not cache) | Required for curriculum spine, exercise library, academy levels |
| **TTL strategy** | None defined | Required — see Section H |
| **Cache invalidation** | Ad-hoc `revalidatePath` calls in some actions | Formalize per module — see Section H |
| **Race-condition protection** | None — no version checks, no optimistic locking | Required for template edits, attendance, session generation |
| **Idempotency** | Partial: `processing_status` guards on recap structuring | Required on all write actions — see Section J |
| **Optimistic locking** | None | Required for concurrent template/curriculum edits |
| **Background jobs/queues** | None — all heavy computation is synchronous | Needed for curriculum clone, recap structuring, priority recalc |
| **Usage metering** | None | Required — no visibility into AI costs or heavy reads |
| **DB indexing** | Partial: curriculum tables have good indexes; dashboard views lack query-plan optimization | Audit needed |
| **AI cost control** | Max text length on TTS only | Required for all three AI services |
| **Observability** | Console logs only | Structured logging + slow-query detection needed |

---

## C. Route / Action Matrix

### API Routes

| Area | File | Route | Role | Classification | Risk | Rate Limit | Debounce | Cache | Queue | Metering | Idempotency | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DONNA TTS | `src/app/api/donna/tts/route.ts` | POST /api/donna/tts | Any auth | External AI call (OpenAI TTS) | **HIGH** | YES — per user/min | no | No (voice is transient) | No | YES | No | Has MAX_TEXT_LENGTH=500 guard. Missing per-user rate limit. Each call = OpenAI API cost. |
| Voice Transcription | `src/app/api/coach/sessions/[sessionId]/transcribe/route.ts` | POST /api/coach/sessions/:id/transcribe | coach/director | External AI call (OpenAI Whisper) + DB write | **HIGH** | YES — per user/hour | no | no | Future | YES | YES | Has 4 MB file guard. Missing per-user call limit. Each call = Whisper cost. No idempotency — retry sends audio twice. |
| Realtime Session | `src/app/api/director/interview/realtime-session/route.ts` | POST /api/director/interview/realtime-session | director | OpenAI Realtime session create | **HIGH** | YES — per academy/day | no | no | no | YES | No | Creates OpenAI realtime session — billing starts on creation. No limit on sessions per director or per day. |
| DONNA Brief | `src/app/api/donna/brief/route.ts` | GET /api/donna/brief | director | Heavy read (multiple Supabase queries) | MEDIUM | YES — per user/min | no | YES — 5 min TTL | no | no | no | Reads multiple tables on each request. No cache. Called on dashboard load. |
| DONNA Attention | `src/app/api/donna/attention/route.ts` | GET /api/donna/attention | director | Heavy read | MEDIUM | YES — per user/min | no | YES — 5 min TTL | no | no | no | Same pattern as brief. No cache. |
| Auth signout | `src/app/api/auth/signout/route.ts` | POST /api/auth/signout | Any | Auth mutation | LOW | no | no | no | no | no | no | Stable. |

### Server Actions — DONNA / Intelligence

| Area | File | Function | Role | Classification | Risk | Rate Limit | Debounce | Cache | Queue | Metering | Idempotency |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DONNA Director Intelligence | `src/app/director/_actions/donnaDirectorIntelligenceActions.ts` | Multiple (1,342 lines) | director/head_coach | 8+ DB queries + KPI computation per call | **HIGH** | YES — per user/min | no | YES — 10 min TTL | Future | YES | No |
| DONNA Context | `src/app/director/_actions/donnaContextActions.ts` | Multiple (1,159 lines) | director | Multiple reads, context assembly | **HIGH** | YES — per user/min | no | YES — 5 min TTL | no | YES | No |
| DONNA Draft Execution | `src/app/director/_actions/donnaDraftExecutionActions.ts` | Multiple (695 lines) | director | DB writes via proposed_actions | MEDIUM | YES — per user/hour | no | no | no | YES | YES — use action_id |
| DONNA Review Queue | `src/app/director/_actions/donnaReviewQueueActions.ts` | Multiple (544 lines) | director | Approve/reject mutations | MEDIUM | YES — per user/min | no | no | no | YES | YES |
| DONNA Attendance | `src/app/director/_actions/donnaAttendanceActions.ts` | Multiple (456 lines) | director | Attendance reads + draft writes | MEDIUM | YES — per user/min | no | no | no | no | YES |
| DONNA Object Resolution | `src/app/director/_actions/donnaObjectResolutionActions.ts` | Multiple (445 lines) | director | Multi-table reads for entity resolution | MEDIUM | YES — per user/min | no | YES — short TTL | no | no | No |
| DONNA Coach Intelligence | `src/app/director/_actions/donnaCoachIntelligenceAction.ts` | 316 lines | director | Multi-table reads for coach summary | MEDIUM | YES — per user/min | no | YES — 15 min TTL | no | YES | No |
| DONNA Level Movement | `src/app/director/_actions/donnaLevelMovementActions.ts` | Multiple | director | Level change writes via proposed_actions | **HIGH** | YES — per user/day | no | no | no | YES | YES — player+level |
| DONNA Curriculum Adjustment | `src/app/director/_actions/donnaCurriculumAdjustmentApplyActions.ts` | Multiple | director | Curriculum writes | **HIGH** | YES — per academy/day | no | no | no | YES | YES |

### Server Actions — Coach Session

| Area | File | Function | Role | Risk | Rate Limit | Idempotency | Notes |
|---|---|---|---|---|---|---|---|
| Structure Coach Recap | `src/app/coach/sessions/[sessionId]/structureCoachRecapAction.ts` | `structureCoachRecapAction` | coach/director | MEDIUM | YES — per voiceNote | YES — `processing_status='structured'` guard exists | Good: already has guard. Risk: concurrent calls before status update completes. |
| Save Wrap-Up Draft | `src/app/coach/sessions/[sessionId]/saveWrapUpDraftAction.ts` | N/A | coach | MEDIUM | no | No | Each call overwrites — race risk if two tabs open |
| Save Wrap-Up Observations | `src/app/coach/sessions/[sessionId]/saveWrapUpObservationsAction.ts` | N/A | coach | MEDIUM | no | No | Same race risk |
| Save Attendance Exception | `src/app/coach/sessions/[sessionId]/saveWrapUpAttendanceExceptionAction.ts` | N/A | coach | MEDIUM | no | YES (player+session unique) | Should enforce unique constraint |
| Session Actions | `src/app/coach/sessions/[sessionId]/actions.ts` | Multiple | coach | MEDIUM | no | No | Heavy reads for session workspace |

### Server Actions — Director Session/Template/Curriculum

| Area | File | Function | Risk | Rate Limit | Idempotency | Queue | Notes |
|---|---|---|---|---|---|---|---|
| Generate Lesson Plan Draft | `src/app/director/class-templates/[templateId]/generateLessonPlanDraftAction.ts` | N/A | **HIGH** | YES | YES — templateId | Future | Likely calls AI or runs heavy template logic |
| Populate Fitness Blocks | `src/app/director/fitness/templates/[templateId]/populateFitnessBlocksAction.ts` | N/A | MEDIUM | no | YES — templateId | Future | Writes many block rows in one action |
| Generate Session (fitness) | `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` | N/A | MEDIUM | no | YES | Future | Session creation should be idempotent |
| Create Class Template | `src/app/director/class-templates/createClassTemplateAction.ts` | N/A | MEDIUM | YES — per academy/hour | YES | no | Duplicates possible on double-submit |
| Create Class Template With Blocks | `src/app/director/class-templates/createClassTemplateWithBlocksAction.ts` | N/A | **HIGH** | YES | YES | Future | Multiple table writes — partial write risk |
| Save Assistant Template Draft | `src/app/director/class-templates/saveAssistantTemplateDraftAction.ts` | N/A | MEDIUM | no | No | no | Has `revalidatePath` — good |
| Create Voice Intake Draft | `src/app/director/command-center/createVoiceIntakeDraftAction.ts` | N/A | MEDIUM | YES — per user/min | YES | no | Inserts voice_commands + proposed_actions |
| Submit Director Command | `src/app/director/command-center/submitDirectorCommandAction.ts` | `submitDirectorCommandAction` | MEDIUM | YES — per user/min | YES | no | Deterministic parse (no AI). Good. |
| Director Review Actions | `src/app/director/review/actions.ts` | Multiple | **HIGH** | YES — per action | YES | no | Approval mutations — irreversible |
| Batch Review | `src/app/director/review/batchReviewActions.ts` | N/A | **HIGH** | YES — per academy/hour | YES | Future | Batch approve = many writes at once |
| Execute Voice Intake Draft | `src/app/director/review/executeVoiceIntakeDraftAction.ts` | N/A | **HIGH** | YES — per draft | YES — draftId | no | Must be idempotent — can only execute once |
| AI Note Structuring | `src/lib/actions/notes.ts` | `generateNoteDraftAction` | **HIGH** | YES — per user/hour | No | Future | Calls Anthropic API. Cost risk. No rate limit. |
| Curriculum Clone | `src/lib/actions/academyCurriculumClone.ts` | `createAcademyCurriculumCloneAction` | **HIGH** | YES — once per academy | YES — `alreadyExists` check | Future | Has guard. Synchronous. Slow at scale. |
| Curriculum Content Population | `src/lib/actions/curriculumContentPopulation.ts` | N/A | **HIGH** | YES — per academy/day | YES — templateId | Future | Many writes synchronously. No partial-write recovery. |
| Template Draft | `src/lib/actions/templateDraftAction.ts` | N/A | MEDIUM | no | No | no | Missing idempotency |
| Template Approval | `src/lib/actions/templateApprovalAction.ts` | N/A | **HIGH** | YES — per template | YES — templateId+status | no | Approval is irreversible |
| Player Import | `src/app/director/players/import/playerImportActions.ts` | N/A | **HIGH** | YES — per academy/day | YES — import batch hash | Future | Bulk insert — duplicates dangerous |

### Server Actions — Player / Parent

| Area | File | Function | Risk | Notes |
|---|---|---|---|---|
| Placement Draft | `src/app/director/placement/placementDraftAction.ts` | N/A | MEDIUM | No idempotency. Placement draft can be submitted twice. |
| Player Priority Recommendation | `src/app/director/players/[playerId]/priorityRecommendationAction.ts` | N/A | MEDIUM | Should be idempotent per player+period |
| Draft Development Summary | `src/app/director/players/[playerId]/draftSummaryUpdateAction.ts` | N/A | MEDIUM | Has audit trail. Could trigger parent notification — guard needed |
| AI Draft from Notes | `src/app/director/players/[playerId]/draftDevelopmentSummaryFromPlacementAction.ts` | N/A | **HIGH** | Likely calls Anthropic. No rate limit. |
| Request Private Lesson | `src/app/parent/requestPrivateLessonAction.ts` | N/A | MEDIUM | No idempotency. Parent can double-submit. |
| Guardian Linking | `src/app/director/players/[playerId]/guardianLinkingAction.ts` | N/A | MEDIUM | Should be idempotent per player+guardian |

---

## D. Recommended Rate Limits V1

| Endpoint / Action | Scope | Window | Limit | Hard/Soft | Fallback Message |
|---|---|---|---|---|---|
| POST /api/donna/tts | per user | per minute | 20 calls | Hard | "Voice output is temporarily throttled. Read the response above." |
| POST /api/coach/.../transcribe | per user | per hour | 10 calls | Hard | "You have reached the voice transcription limit for this hour. Type your note instead." |
| POST /api/director/interview/realtime-session | per academy | per day | 5 sessions | Hard | "Realtime interview sessions are limited. Contact support to increase." |
| GET /api/donna/brief | per user | per minute | 6 calls | Soft | Return stale cached value with staleness flag |
| GET /api/donna/attention | per user | per minute | 6 calls | Soft | Return stale cached value |
| DONNA director intelligence actions | per user | per minute | 10 calls | Soft | "DONNA is processing — try again in a moment." |
| `generateNoteDraftAction` (Anthropic) | per user | per hour | 15 calls | Hard | "AI drafting limit reached. Write your summary manually." |
| `submitDirectorCommandAction` | per user | per minute | 30 calls | Soft | "Command queue is busy — wait a moment." |
| `createClassTemplateWithBlocksAction` | per academy | per hour | 20 | Hard | "Template creation limit reached for this hour." |
| `createAcademyCurriculumCloneAction` | per academy | lifetime | 1 | Hard (already guarded) | "Curriculum already cloned for this academy." |
| `curriculumContentPopulation` | per academy | per day | 3 | Hard | "Curriculum population is limited. Contact support." |
| Batch review approve | per academy | per hour | 50 items | Hard | "Batch approval limit reached. Approve remaining items individually." |
| Player import | per academy | per day | 1 batch | Hard | "Only one import batch per day is allowed." |
| Parent private lesson request | per parent+player | per week | 2 | Soft | "Your request has been received. You can submit another next week." |

### Implementation approach for V1 (no Redis required):
Use a `rate_limit_events` table (append-only) with a short-lived composite index on `(user_id, action_key, window_start)`. Query count before executing the protected action. This is adequate for pilot scale (< 50 users).

---

## E. Recommended Cache Strategy V1

| Module | Cacheable | TTL | Invalidation Trigger | Cache Key Requirements | Safety Notes |
|---|---|---|---|---|---|
| **Global curriculum spine** | YES | 24 hours | New curriculum version published | `curriculum_version_id` | Never cache without version in key — curriculum changes propagate to all academies |
| **Academy levels** | YES | 1 hour | `academy_levels` update for this academy | `academy_id` | Include `is_active` filter in key |
| **Academy curriculum clone** | YES | 30 min | Override applied or rolled back | `academy_id + curriculum_version_id` | Must be re-read when override is applied |
| **Template library** | YES | 15 min | Template created, updated, archived, approved | `academy_id + status` | Never serve stale template to a session generation call |
| **Template blocks** | YES | 15 min | Block added/removed/edited | `template_id + updated_at` | Include source version in key |
| **Exercise/drill library** | YES | 1 hour | Exercise added or updated | `academy_id` | Safe to serve slightly stale |
| **Player portal summary** | YES | 5 min | Priority updated, summary updated, level changed | `player_id + viewer_role + visibility_scope` | MUST include viewer_role — parent sees different data than player |
| **Parent portal summary** | YES | 5 min | Same as player + guardian link changes | `guardian_id + player_id + show_to_parent=true` | Must enforce show_to_parent filter in cache key |
| **Coach today roster** | YES | 2 min | Session updated, attendance updated | `coach_id + date + academy_id` | Short TTL — live session state must be fresh |
| **Director dashboard** | YES | 5 min | Player updated, session updated, review queue changes | `academy_id + director_id` | Do not share across directors |
| **DONNA brief** | YES | 10 min | Any academy-wide write | `academy_id + director_id + date` | Acceptable to serve 10-min stale on brief |
| **DONNA attention signals** | YES | 5 min | Attendance updated, observations added | `academy_id + director_id` | Short TTL — attention items change during live sessions |
| **Session plan** | YES | 10 min | Session edited or blocks updated | `session_id + updated_at` | Serve stale with staleness warning if > 5 min |
| **Live session state** | NO | n/a | n/a | n/a | Never cache — must be real-time |
| **Attendance** | NO | n/a | n/a | n/a | Never cache — must be real-time during session |
| **Coach notes (observation feed)** | YES | 2 min | Note added, updated | `player_id + academy_id` | Short TTL — director expects recent notes |
| **Player priorities** | YES | 10 min | Priority added/updated/resolved | `player_id + academy_id` | OK to be slightly stale |
| **Player development summary** | YES | 15 min | Summary approved/updated | `player_id + show_to_student + show_to_parent` | Must not cache without visibility flags |
| **Curriculum gates/requirements** | YES | 30 min | Gate status updated | `player_id + level_id + academy_id` | Safe — gate checks are infrequent |
| **Permissions/auth/session state** | NO | n/a | n/a | n/a | Never cache auth — always call `supabase.auth.getUser()` |
| **Voice transcripts** | NO | n/a | n/a | n/a | Transient — store to DB only |
| **DONNA/AI context** | YES (partial) | Per-request sessionStorage | Tab close | `user_id + session_id` | Already implemented in donnaDraftPersistence.ts via sessionStorage |

### V1 Implementation: Next.js `unstable_cache`

For V1 (no Redis), use Next.js `unstable_cache` with `revalidate` options:
```ts
import { unstable_cache } from 'next/cache'
const getCurriculumSpine = unstable_cache(
  async (academyId: string) => { /* query */ },
  ['curriculum-spine'],
  { revalidate: 3600, tags: [`academy-${academyId}`] }
)
```
Invalidate with `revalidateTag('academy-${academyId}')` on mutations.

---

## F. Recommended Debounce Strategy V1

| UI/Action Area | Location | Debounce | Client-Only | Server-Safe | Race Notes |
|---|---|---|---|---|---|
| **Search / filter (players list)** | `/director/players` | 300ms | YES | no | Client-only. Do not fire server action on each keystroke. |
| **Search (exercise library, template browser)** | Various template pages | 300ms | YES | no | Client-only filter. |
| **Curriculum drag/drop (block reorder)** | Curriculum builder | 800ms | YES | Flush on drop-end | Drag events fire 60fps. Only persist final position. Batch position updates into one write. |
| **Template block edit (name, notes fields)** | Template builder | 1000ms | YES | Delayed write | Autosave on blur, not on keypress. Track dirty state client-side. |
| **Autosave (template draft)** | Template builder | 2000ms | YES | Write with updated_at check | Never autosave if server has newer version. Read `updated_at` before write. |
| **Curriculum level field edits** | Curriculum builder | 1000ms | YES | Same as template | Include `source_version` in write payload. Reject if stale. |
| **Voice transcript partials (STT)** | Coach voice input | 500ms | YES | no | Partial transcripts are display-only. Only send final segment to server. |
| **Coach observation text field** | Coach session wrap-up | 1000ms | YES | Autosave on blur | Risk: two coaches editing same observation. Add lock or last-write-wins with warning. |
| **DONNA command input bar** | Director DONNA panel | 400ms | YES — intent preview | no | Preview parsing client-side. Server action fires only on submit. |
| **Filter chips (review queue)** | Director review | 200ms | YES | no | Client-only filter. |
| **Session block edits** | Director session detail | 1000ms | YES | Delayed write | Same version-check pattern as template. |
| **Template population trigger** | Template builder DONNA panel | none — explicit submit | n/a | n/a | User must explicitly confirm before population runs. Never auto-trigger. |

---

## G. Background Job Candidates

| Job | Priority | Blocking? | Input | Output Target | Human Approval | Idempotency Key | Job Lock | Retry Strategy |
|---|---|---|---|---|---|---|---|---|
| **Structure coach recap** | HIGH | Currently blocking | voiceNoteId, sessionId | proposed_actions row | YES (director review) | voiceNoteId | YES — prevent double-structure | 3x with backoff |
| **Recalculate player priorities** | HIGH | Non-blocking | playerId, academyId | player_priorities table | YES (director review) | playerId + period | YES | 2x |
| **Generate parent summary draft** | HIGH | Non-blocking | playerId, academyId | proposed_actions row | YES (director review) | playerId + date | YES | 2x |
| **Generate session plan** | MEDIUM | Currently blocking | templateId, groupId, date | sessions + session_blocks | YES (director review) | templateId + groupId + date | YES | 2x |
| **Clone academy curriculum** | MEDIUM | Currently blocking | academyId, sourceVersionId | academy_curriculum_overrides | YES (director confirms) | academyId | YES — once per academy | 1x |
| **Populate template from curriculum** | MEDIUM | Currently blocking | templateId, academyId | template_block_exercises | Director review | templateId + version | YES | 2x |
| **Process voice note (STT)** | HIGH | Currently blocking (Whisper call) | audio bytes, sessionId | voice_notes row | NO (automatic) | audio hash | YES | 3x |
| **Process transcript structuring** | HIGH | Currently blocking | voiceNoteId | proposed_actions | YES | voiceNoteId | YES | 2x |
| **Process player import batch** | MEDIUM | Non-blocking | CSV batch, academyId | players table | YES (director review) | batch_hash | YES | 1x — manual retry |
| **Generate recommendation** | LOW | Non-blocking | playerId | player_recommendations | YES | playerId + date | no | 2x |
| **Analytics aggregation / KPI snapshot** | LOW | Non-blocking | academyId, date | cached_summaries or KPI snapshot table | NO | academyId + date | YES | 2x |
| **Parent/player digest generation** | LOW | Non-blocking | academyId, date | notification queue | NO | academyId + date | YES | 1x |
| **AI note structuring (Anthropic)** | MEDIUM | Currently blocking | noteText, coachId | ai_call_logs + draft payload | YES | noteId | YES | 2x |
| **Media/video processing** | LOW | Non-blocking | media URL, entityId | media_assets table | NO | mediaId | YES | 3x |

---

## H. TTL, Cache Invalidation, and Race-Condition Strategy (Per Module)

### Curriculum

| Concern | Detail |
|---|---|
| Cacheable data | Spine items, level definitions, requirements, gates, content items |
| TTL | 24h for global spine; 30min for academy clone |
| Invalidation triggers | `academy_curriculum_overrides` insert/update; `curriculum_versions` publish |
| Race-condition risk | **Director A applies override while Director B is viewing draft** — B sees stale snapshot |
| Idempotency need | Curriculum clone must be exactly once per academy |
| Optimistic locking | Override apply should check `source_version_id` matches current |
| Transaction/RPC | Override apply should be a DB transaction |
| Job lock | Curriculum population job must lock per `(academy_id, template_id)` |
| Implementation priority | Sprint 407 (source versioning) |

### Templates

| Concern | Detail |
|---|---|
| Cacheable data | Template metadata, block list, exercise assignments |
| TTL | 15 min |
| Invalidation triggers | Template update, block add/remove, exercise add/remove, approval |
| Race-condition risk | **Coach previews template while director edits blocks** — coach sees partially-written state |
| Idempotency need | `createClassTemplateWithBlocksAction` inserts multiple rows — partial failure leaves orphans |
| Optimistic locking | Template edit should include `updated_at` expected value; reject if stale |
| Transaction/RPC | Block population should be wrapped in a DB transaction |
| Implementation priority | Sprint 403 (debounce + batched saves) |

### Sessions

| Concern | Detail |
|---|---|
| Cacheable data | Session plan, block list — **NOT** live attendance |
| TTL | 10 min for plan; live state never cached |
| Invalidation triggers | Session update, block reorder, attendance change |
| Race-condition risk | **Coach submits attendance while director reviews** — double write to attendance |
| Idempotency need | Attendance exception must be unique per `(player_id, session_id)` |
| Optimistic locking | Session block reorder should check `updated_at` |
| Implementation priority | Sprint 401 |

### Attendance

| Concern | Detail |
|---|---|
| Cacheable data | None — never cache live attendance |
| Invalidation | n/a |
| Race-condition risk | **Double-submit on attendance exception** — creates two rows for same player+session |
| Idempotency need | Unique constraint on `(player_id, session_id)` for attendance exceptions |
| Transaction/RPC | Attendance batch submit should use a single RPC |
| Implementation priority | Sprint 401 |

### Coach Notes (Observations)

| Concern | Detail |
|---|---|
| Cacheable data | Observation feed list — short TTL only |
| TTL | 2 min |
| Invalidation | On note insert or update via `revalidatePath` (already wired) |
| Race-condition risk | **Coach edits note in two tabs** — last write wins, earlier changes lost |
| Idempotency | Need `updated_at` check before overwrite |
| Implementation priority | Sprint 401 |

### Player Priorities

| Concern | Detail |
|---|---|
| Cacheable data | Priority list, rank, urgency |
| TTL | 10 min |
| Invalidation | On `player_priorities` insert/update/resolve |
| Race-condition risk | **Two directors recalculate priorities simultaneously** — duplicates created |
| Idempotency | Priority recalculation job must lock per `(player_id, period)` |
| Implementation priority | Sprint 402 |

### Player Development Summary

| Concern | Detail |
|---|---|
| Cacheable data | Summary text, show_to_student, show_to_parent flags |
| TTL | 15 min |
| Invalidation | On summary approve/update |
| Race-condition risk | **AI draft generated from stale notes** — summary does not reflect recent observations |
| Idempotency | AI note structuring must capture `source_note_ids` at time of invocation |
| Source snapshot | Always record which notes were used to generate the draft |
| Implementation priority | Sprint 405 |

### Parent Portal

| Concern | Detail |
|---|---|
| Cacheable data | IDP parent view, parent support guide |
| TTL | 5 min |
| Invalidation | On summary update or priority change |
| Race-condition risk | Parent sees summary before `show_to_parent` is set to true |
| Safety | MUST always filter `show_to_parent = true` in every parent-facing query |
| Cache key | Must include `guardian_id + player_id + show_to_parent=true` |
| Implementation priority | Sprint 404 |

### Player Portal

| Concern | Detail |
|---|---|
| Cacheable data | IDP player view, mission list |
| TTL | 5 min |
| Invalidation | On priority update, level change, summary update |
| Race-condition risk | Player sees summary before `show_to_student` is set to true |
| Safety | MUST always filter `show_to_student = true` in every player-facing query |
| Cache key | `player_id + show_to_student=true` |
| Implementation priority | Sprint 404 |

### DONNA / AI Commands

| Concern | Detail |
|---|---|
| Cacheable data | Intelligence answers (soft cache with staleness flag) |
| TTL | 10 min for intelligence; 5 min for attention/brief |
| Invalidation | Any academy write should mark DONNA context stale |
| Race-condition risk | **Director submits command while previous command is still in proposed_actions** — creates duplicate |
| Idempotency | `voice_command_id` should be unique per `proposed_actions` insert |
| Cost risk | Every DONNA intelligence call assembles 8+ DB queries + KPI computation synchronously |
| Source snapshot | DONNA intelligence response must record which data version was used |
| Implementation priority | Sprint 402 (rate limit) + Sprint 407 (source versioning) |

### Voice Transcripts

| Concern | Detail |
|---|---|
| Cacheable data | None — transient |
| TTL | n/a |
| Race-condition risk | **Coach re-submits audio before processing completes** — two Whisper calls for same audio |
| Idempotency | Hash audio file on client; reject server-side if same hash already processed in last 30s |
| Cost risk | Whisper API is per-minute of audio. No limit currently. |
| Implementation priority | Sprint 401 |

### Imports

| Concern | Detail |
|---|---|
| Cacheable data | None |
| Race-condition risk | Same import file submitted twice — duplicate player rows |
| Idempotency | Hash import payload; unique constraint on `(academy_id, import_batch_hash)` |
| Job lock | Import job must lock per academy |
| Implementation priority | Sprint 401 |

---

## I. Proposed Future Tables

> Schema sketches only. No migrations in this sprint.

### `usage_events`
**Purpose:** Append-only log of all metered AI calls, voice calls, and heavy reads.
```sql
CREATE TABLE usage_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid NOT NULL REFERENCES academies(id),
  user_id       uuid NOT NULL REFERENCES profiles(id),
  user_role     text NOT NULL,
  event_type    text NOT NULL, -- 'ai_note_draft', 'whisper_transcribe', 'tts_call', 'donna_intelligence', 'realtime_session'
  model_used    text,          -- 'claude-sonnet-4-6', 'whisper-1', 'tts-1', etc.
  input_tokens  int,
  output_tokens int,
  audio_seconds int,
  cost_usd_micro int,          -- microdollars to avoid float
  duration_ms   int,
  metadata      jsonb,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX idx_usage_events_academy_date ON usage_events (academy_id, created_at);
CREATE INDEX idx_usage_events_user ON usage_events (user_id, event_type, created_at);
```
**Retention:** 90 days rolling. **Privacy:** No PII in metadata — entity IDs only.

### `rate_limit_events`
**Purpose:** Track rate-limit windows without Redis.
```sql
CREATE TABLE rate_limit_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_key   text NOT NULL,   -- 'user:uuid:action_key', 'academy:uuid:action_key'
  action_key  text NOT NULL,
  window_start timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX idx_rate_limit_scope_window ON rate_limit_events (scope_key, action_key, window_start);
```
**Retention:** 24 hours (purge via cron). **Privacy:** No PII — only hashed scope keys.

### `background_jobs`
**Purpose:** Track background job state for deduplication, retries, and monitoring.
```sql
CREATE TABLE background_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid REFERENCES academies(id),
  job_type      text NOT NULL,
  status        text NOT NULL DEFAULT 'pending', -- pending, running, complete, failed, cancelled
  idempotency_key text NOT NULL,
  payload       jsonb NOT NULL,
  result        jsonb,
  error_message text,
  attempt_count int DEFAULT 0,
  max_attempts  int DEFAULT 3,
  locked_at     timestamptz,
  locked_by     text,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (idempotency_key)
);
CREATE INDEX idx_background_jobs_status ON background_jobs (status, created_at);
CREATE INDEX idx_background_jobs_academy ON background_jobs (academy_id, job_type, status);
```

### `cached_summaries`
**Purpose:** Pre-computed summaries to reduce per-request DB load.
```sql
CREATE TABLE cached_summaries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      uuid NOT NULL,
  entity_type     text NOT NULL,  -- 'player_portal', 'parent_portal', 'director_dashboard', 'donna_brief'
  entity_id       uuid,
  viewer_role     text,
  visibility_scope text,
  cache_key       text NOT NULL UNIQUE,
  payload         jsonb NOT NULL,
  source_version  text,
  generated_at    timestamptz DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  is_stale        boolean DEFAULT false
);
CREATE INDEX idx_cached_summaries_key ON cached_summaries (cache_key, expires_at);
CREATE INDEX idx_cached_summaries_entity ON cached_summaries (academy_id, entity_type, entity_id);
```

### `ai_call_logs`
**Purpose:** Full audit trail of every AI API invocation with cost data.
```sql
CREATE TABLE ai_call_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      uuid NOT NULL,
  user_id         uuid NOT NULL,
  user_role       text NOT NULL,
  provider        text NOT NULL,   -- 'anthropic', 'openai'
  model           text NOT NULL,
  action_context  text NOT NULL,   -- 'note_structuring', 'donna_intelligence', 'whisper_transcribe', 'tts', 'realtime'
  input_tokens    int,
  output_tokens   int,
  audio_seconds   int,
  cost_usd_micro  int,
  duration_ms     int,
  success         boolean DEFAULT true,
  error_code      text,
  source_entity_id uuid,           -- playerId, sessionId, etc.
  source_entity_type text,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX idx_ai_call_logs_academy ON ai_call_logs (academy_id, created_at);
CREATE INDEX idx_ai_call_logs_user ON ai_call_logs (user_id, provider, created_at);
```

### `performance_audit_events`
**Purpose:** Log slow queries and expensive operations for index optimization.
```sql
CREATE TABLE performance_audit_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    text NOT NULL,   -- 'slow_query', 'large_payload', 'timeout'
  query_context text,
  duration_ms   int,
  row_count     int,
  payload_bytes int,
  academy_id    uuid,
  user_id       uuid,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX idx_perf_audit_type_date ON performance_audit_events (event_type, created_at);
```
**Retention:** 30 days. Log any query > 500ms or payload > 500 KB.

### `entity_versions`
**Purpose:** Source version tracking for curriculum, templates, and sessions to support optimistic locking and cache invalidation.
```sql
CREATE TABLE entity_versions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id    uuid NOT NULL,
  entity_type   text NOT NULL,   -- 'template', 'curriculum_level', 'session'
  entity_id     uuid NOT NULL,
  version_num   int NOT NULL DEFAULT 1,
  changed_by    uuid NOT NULL,
  change_type   text NOT NULL,   -- 'create', 'update', 'delete', 'approve', 'rollback'
  snapshot      jsonb,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (entity_id, version_num)
);
CREATE INDEX idx_entity_versions_entity ON entity_versions (entity_type, entity_id, version_num DESC);
CREATE INDEX idx_entity_versions_academy ON entity_versions (academy_id, entity_type, created_at);
```

### `idempotency_keys`
**Purpose:** Prevent double-execution of non-idempotent actions.
```sql
CREATE TABLE idempotency_keys (
  key           text PRIMARY KEY,
  action_type   text NOT NULL,
  academy_id    uuid NOT NULL,
  user_id       uuid NOT NULL,
  result_id     uuid,            -- ID of the created entity on success
  status        text NOT NULL DEFAULT 'pending', -- pending, success, failed
  created_at    timestamptz DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '24 hours'
);
CREATE INDEX idx_idempotency_keys_expires ON idempotency_keys (expires_at);
```
**Key format:** `{action_type}:{academy_id}:{entity_id_or_hash}`
**Expiry:** 24 hours for most actions; 7 days for imports.

### `job_locks`
**Purpose:** Prevent concurrent execution of background jobs.
```sql
CREATE TABLE job_locks (
  lock_key      text PRIMARY KEY,
  job_id        uuid NOT NULL,
  locked_by     text NOT NULL,
  locked_at     timestamptz DEFAULT now(),
  expires_at    timestamptz NOT NULL
);
CREATE INDEX idx_job_locks_expires ON job_locks (expires_at);
```
**Lock key format:** `{job_type}:{academy_id}:{entity_id}`
**Expiry:** 5 min for quick jobs; 30 min for curriculum clone.

---

## J. Implementation Roadmap — Next 6 Sprints

### Sprint 401 — Idempotency + Write Safety Layer V1
**Goal:** Prevent double-submit on the highest-risk write paths.  
**Files likely touched:**
- `src/app/coach/sessions/[sessionId]/structureCoachRecapAction.ts` — strengthen `processing_status` guard with transactional check
- `src/app/director/command-center/createVoiceIntakeDraftAction.ts` — add idempotency key on `voice_commands` insert
- `src/app/director/review/executeVoiceIntakeDraftAction.ts` — add `idempotency_keys` table check
- `src/app/director/players/[playerId]/guardianLinkingAction.ts` — unique constraint enforcement
- `src/app/parent/requestPrivateLessonAction.ts` — deduplicate per parent+player+week
- `src/lib/backend/dashboard.ts` — add `.limit(50)` to all view queries  
**Risk:** Low — guards are additive  
**Validation:** TypeScript clean; no duplicate proposed_actions on double-submit test

### Sprint 402 — Server Action Rate Limiting V1
**Goal:** Implement `rate_limit_events` table and protect all AI/voice routes.  
**Files likely touched:**
- New `src/lib/rateLimit/rateLimitGuard.ts` — Supabase-backed rate limit helper
- `src/app/api/donna/tts/route.ts`
- `src/app/api/coach/sessions/[sessionId]/transcribe/route.ts`
- `src/app/api/director/interview/realtime-session/route.ts`
- `src/lib/actions/notes.ts` (`generateNoteDraftAction`)
- New migration: `rate_limit_events` table  
**Risk:** Medium — must not block legitimate use  
**Validation:** 429 returned when limit exceeded; legitimate calls succeed

### Sprint 403 — Debounce + Batched Saves V1
**Goal:** Stop per-keystroke server calls from template and curriculum editors.  
**Files likely touched:**
- Template builder client components
- Curriculum builder block edit components
- Coach observation text field  
**Risk:** Low — client-side only for most cases  
**Validation:** Browser DevTools shows no server calls during typing; one save on blur

### Sprint 404 — Safe Cache Layer + TTL Rules V1
**Goal:** Cache curriculum spine, academy levels, exercise library, player/parent portal summaries.  
**Files likely touched:**
- `src/lib/backend/curriculum.ts` — wrap in `unstable_cache`
- `src/lib/backend/players.ts` — wrap portal reads
- `src/app/player/page.tsx` and `src/app/parent/page.tsx` — use cached reads
- New `src/lib/cache/cacheKeys.ts` — centralize cache key construction  
**Risk:** Medium — must not serve stale visibility-filtered data  
**Validation:** Cache key always includes `viewer_role` and `visibility_scope`

### Sprint 405 — AI/Voice Usage Metering V1
**Goal:** Log every AI call; surface cost data per academy; add soft budget alerts.  
**Files likely touched:**
- New `src/lib/metering/usageEvents.ts`
- `src/lib/ai/structureCoachNote.ts` — log each Anthropic call
- `src/app/api/coach/sessions/[sessionId]/transcribe/route.ts` — log each Whisper call
- `src/app/api/donna/tts/route.ts` — log each TTS call
- New migration: `usage_events` + `ai_call_logs`  
**Risk:** Low — append-only; no mutations to existing paths  
**Validation:** `usage_events` row created after each AI call; no regressions

### Sprint 406 — Background Job Queue Foundation V1
**Goal:** Move coach recap structuring and player priority recalculation to background jobs.  
**Files likely touched:**
- New `src/lib/jobs/jobQueue.ts` — Supabase-backed queue
- `src/app/coach/sessions/[sessionId]/structureCoachRecapAction.ts` — enqueue instead of execute inline
- New migration: `background_jobs` + `job_locks`  
**Risk:** Medium — changes user-visible flow (recap becomes async)  
**Validation:** Job row created; job executes within 30s; recap result appears in review queue

### Sprint 407 — Source Versioning + Cache Invalidation V1
**Goal:** Track entity versions; invalidate cache on version change; add optimistic locking to template edits.  
**Files likely touched:**
- New migration: `entity_versions`
- `src/lib/actions/templateDraftAction.ts` — check version before write
- `src/lib/actions/curriculumOverrideDraft.ts` — check source version
- `src/lib/cache/cacheKeys.ts` — include `source_version` in keys  
**Risk:** Medium — optimistic lock rejections need clear UX  
**Validation:** Stale edit rejected with clear message; version increments on every write

### Sprint 408 — Slow Query + Index Audit V1
**Goal:** Identify and fix the top 5 slowest query paths; add missing indexes.  
**Files likely touched:**
- New migration: indexes on `players(academy_id, is_active)`, `sessions(coach_id, scheduled_at)`, `proposed_actions(academy_id, status)`, `voice_notes(session_id, processing_status)`
- `src/lib/backend/dashboard.ts` — narrow `select('*')` to explicit columns
- `src/lib/backend/coachWorkspace.ts` — same  
**Risk:** Low — additive only  
**Validation:** Query plans checked; no full table scans on academy-scoped queries

---

## K. No-Code Validation

```
npx tsc --noEmit
```

Result: **Clean** — no TypeScript errors. No app code was changed in this sprint.

**Files changed in this sprint:**
- `docs/SCALABILITY_COST_CONTROL_AUDIT.md` — created (this file)
- `docs/CHANGELOG.md` — updated

**Files NOT changed:**
- No app code
- No generated types
- No migrations
- No RLS policies
- No `.claude/skills` files
- No untracked prototype/import/planning files

---

## Appendix — Quick Index of Key Findings

### No Rate Limiting Exists Anywhere
Grep confirms zero occurrences of `rateLimit`, `rate_limit`, or equivalent across `src/`. The only protection in place is:
- `MAX_FILE_BYTES = 4 MB` on transcription route
- `MAX_TEXT_LENGTH = 500` on TTS route
- Auth checks on all routes
- Role checks on director-only routes

### 54 `select('*')` Queries
Full list in backend files:
- `src/lib/backend/dashboard.ts` — 5 instances (all view queries)
- `src/lib/backend/coachWorkspace.ts` — 5 instances
- `src/lib/backend/players.ts` — 3+ instances
- `src/lib/backend/curriculum.ts` — 2 instances
- `src/lib/backend/director.ts` — 3 instances
- `src/lib/backend/notes.ts` — 2 instances
- `src/lib/templates/templateRepository.ts` — 5 instances
- `src/lib/backend/sessions.ts`, `assessments.ts`, `voice.ts` — various

### No Caching Infrastructure
The only cache-related code is `revalidatePath()` calls in ~8 action files. No `unstable_cache`, no Redis, no CDN headers configured for data endpoints.

### DONNA Intelligence Is the Single Largest Synchronous Compute Path
`donnaDirectorIntelligenceActions.ts` (1,342 lines) assembles results from:
- `profiles`
- `academy_memberships`
- `players` (full list)
- `sessions`
- `session_attendance`
- `player_development_signals`
- `player_requirement_progress`
- `coach_notes`

...and then runs 8 KPI engines (2,123 lines total) synchronously before returning. This is the highest-priority target for caching + background queuing.
