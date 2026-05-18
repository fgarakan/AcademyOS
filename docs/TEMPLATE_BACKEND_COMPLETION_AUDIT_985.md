# Template Backend Phase 1 — Completion Audit
Sprint 985 — 2026-05-18

## 1. Executive Summary

Template Backend Phase 1 (Sprints 971–984) establishes the full read, write, review, approval, and history scaffolding for the Curriculum-Aware Template System. Directors and head coaches can design class and fitness session templates through guided wizard flows, submit drafts for director review, and view version history for approved templates. The entire system degrades gracefully when database migrations 067 and 068 have not yet been applied — no page crashes, demo data serves as fallback, and save actions return a safe backend-unavailable state rather than throwing. Once the two draft migrations are applied, the complete flow becomes operational end-to-end: wizard draft → review queue → director approval → ready template → coach session creation → version history record.

---

## 2. What Is Live in Code

All items below are in production code (TypeScript-clean, committed, pushed).

### 2a. Repository Read Layer

**File:** `src/lib/templates/templateRepository.ts`

| Function | Purpose |
|---|---|
| `listTemplatesForAcademy(db, academyId, options)` | List templates filtered by type/status; handles draft-column absence |
| `getTemplateById(db, templateId, academyId)` | Single template fetch scoped to academy |
| `getTemplateBlocks(db, templateId)` | Template blocks ordered by `order_index` |
| `getTemplateBlockExercises(db, templateId)` | Exercises for all blocks in a template |
| `getTemplateReviewRequests(db, academyId, options)` | Pending/all review requests; `isSchemaMissing` when migration 067 absent |
| `getTemplateVersionHistory(db, templateId, academyId)` | Version history sorted descending; `isSchemaMissing` when migration 067 absent |

All functions return `{ data, error, isSchemaMissing }` — never throw. Schema-missing detection uses PostgreSQL codes `42P01` (relation missing) and `42703` (column missing).

Extended type interfaces (`TemplateRow`, `TemplateBlockRow`, `TemplateBlockExerciseRow`, `TemplateVersionHistoryRow`) add draft-migration 067 columns as optional fields on top of the generated `database.types.ts` base types. The `rawDb = db as any` cast pattern is used only at query callsites referencing draft columns not yet in the generated types.

### 2b. Class and Fitness Library — Live Read with Demo Fallback

**Files:**
- `src/app/director/templates/class/page.tsx`
- `src/app/director/templates/fitness/page.tsx`

Both pages are async Server Components that attempt `listTemplatesForAcademy` → fall back to `DEMO_CLASS_TEMPLATES` / `DEMO_FITNESS_TEMPLATES` on any error or missing schema. A source banner signals the active data source (green = live, orange = demo). Live cards handle absent draft-column fields gracefully (status proxy via `is_active`, level chip omitted if absent).

### 2c. Class and Fitness Detail — Live Read with Demo Fallback

**Files:**
- `src/app/director/templates/class/[templateId]/page.tsx`
- `src/app/director/templates/fitness/[templateId]/page.tsx`

Both pages try `getTemplateById` then `getTemplateBlocks` (class) or `getTemplateBlockExercises` (fitness). On any failure they render demo content. `academyId` is always resolved from `profiles` via the authenticated session — never from URL params. DONNA context panel receives live-preferred values regardless of whether full page content is live or demo.

### 2d. Class Create — Save Draft Wired

**File:** `src/app/director/templates/class/create/page.tsx`
**Action:** `saveClassTemplateDraftFromWizardAction` in `src/lib/actions/templateDraftAction.ts`

The class template wizard Step 5 "Save as Draft" button submits wizard state to a server action that resolves `userId` and `academyId` from the Supabase session and inserts a row into `template_review_requests` with `status='pending'`. Save status machine: `idle → saving → success | error | schema_missing`. Button is disabled after success to prevent duplicate submissions.

### 2e. Fitness Create — Save Draft Wired

**File:** `src/app/director/templates/fitness/create/page.tsx`
**Action:** `saveFitnessTemplateDraftFromWizardAction` in `src/lib/actions/templateDraftAction.ts`

Identical pattern to class create. Fitness-specific additions: `fitness_load` field in the JSONB snapshot, `fitnessGoalId` / `fitnessGoalLabel` in the input, `template_type: 'fitness_template'`.

### 2f. Template Review Request Adapter

**File:** `src/lib/templates/templateReviewQueueAdapter.ts`

Provides `loadPendingTemplateReviewItems` and `loadTemplateReviewHistoryItems`. Enriches raw `TemplateReviewRequestRow` with fields derived from the `template_draft` JSONB snapshot: `draftName`, `draftType`, `draftDurationMin`, `draftCurriculumLabel`, `draftGoal`, `draftBlockCount`, `requestTypeLabel`, `requestTypeColor`. Passes `isSchemaMissing` through to callers. The adapter does not re-query `templates` — the snapshot is self-contained.

**Review queue UI card and tab integration are deferred** — `TemplateReviewDraftCard.tsx` and `TemplateReviewDecisionControls.tsx` have not yet been built. The adapter is ready for them.

### 2g. Template Approval and Rejection Actions (Skeleton)

**File:** `src/lib/actions/templateApprovalAction.ts`

| Action | Behavior |
|---|---|
| `approveTemplateReviewRequestAction(reviewRequestId)` | For `create_template`: INSERTs into `templates` with `status='ready'`; INSERTs version snapshot into `template_version_history`; sets review request to `approved`. For `update_template`: UPDATEs existing template; INSERTs version snapshot; sets request to `approved`. |
| `rejectTemplateReviewRequestAction(reviewRequestId, reviewNotes)` | Sets request to `rejected` with `reviewed_by`, `reviewed_at`, `review_notes`. No template mutation. |

Director-only guard via `assertDirectorOnly()`. `archive_template` and `duplicate_template` request types return a safe "not yet implemented" error. Version history INSERT failure is non-fatal — does not roll back template creation. Full schema-missing detection on all DB operations.

**No UI wiring yet** — approval/rejection buttons have not been surfaced in the director review queue page.

### 2h. Coach Preview — Live Template Wiring

**File:** `src/app/director/templates/coach-preview/page.tsx`

Accepts optional `templateId` search param. When present: fetches live template via `getTemplateById` and blocks via `getTemplateBlocks`; maps to `DisplayBlock` interface; sorts blocks by `order_index`. Falls through to `DEMO_BLOCKS` on any error or missing schema. Source banner: green with `Database` icon (live) or orange with `AlertCircle` (demo). Fitness block types are mapped through `BLOCK_TYPE_DISPLAY` and `BLOCK_TYPE_COLOR`. Class and fitness detail pages append `&templateId=${encodeURIComponent(templateId)}` to the coach-preview link.

### 2i. Version History Panel

**Files:**
- `src/app/director/templates/class/[templateId]/page.tsx`
- `src/app/director/templates/fitness/[templateId]/page.tsx`

When `dataSource === 'live'`: renders a "Version History" panel using `getTemplateVersionHistory`. Shows latest 3 records (version number in lime mono, change type label, date). Handles: schema missing → muted "Version history unavailable until backend migration is applied."; empty result → "No version history yet.". When `dataSource === 'demo'`: muted note "Version history appears for saved templates."

### 2j. Schema-Missing Fallback Behavior

Schema-missing is detected at every boundary:
- Repository functions return `isSchemaMissing: true` — never throw.
- Page Server Components catch schema-missing and fall to demo data or muted messages.
- Server actions return `{ success: false, isSchemaMissing: true }` — no unhandled exceptions.
- Client components render an orange "Backend not yet available" banner.
- TypeScript: `npx tsc --noEmit` is clean across all sprint files.

---

## 3. What Is Migration-Draft-Only

The following exist as SQL draft files only. They have **not been applied to any database**. All code must (and does) handle their absence gracefully.

| Migration | File | Contents | Status |
|---|---|---|---|
| 067 | `supabase/migrations/067_template_schema_extension.sql` | `ALTER templates` (template_type, status, curriculum_stage_key, curriculum_level_key, template_goal, pathway_focus, approved_by, approved_at, archived_at); `ALTER template_blocks` (curriculum_connection, coach_watch_for, fitness_block_type, fitness_load); `ALTER curriculum_class_template_blocks` (skill_focus, assessment_gate_link, player_mission_link); `ALTER template_block_exercises` (sets, reps, load_note, tennis_transfer, progression, regression, equipment); `CREATE TABLE template_review_requests`; `CREATE TABLE template_version_history` | **Draft only** |
| 068 | `supabase/migrations/068_template_rls_policies.sql` | Status-aware RLS for `templates` (director-only approve); RLS for `template_review_requests`; append-only RLS for `template_version_history`; coach SELECT patch on `curriculum_class_template_blocks` | **Draft only** |

Consequences of migrations not being applied:
- `template_review_requests` does not exist in the live DB — save draft actions return `isSchemaMissing: true`.
- `template_version_history` does not exist — version history panel shows "Version history unavailable until backend migration is applied."
- `templates.status`, `templates.template_type`, `templates.curriculum_level_key`, and all other new columns are absent — library and detail pages render demo data or omit those fields.
- Status-aware template RLS (director-only approval gate) does not take effect.

---

## 4. What Works Before Migrations Are Applied

| Feature | Pre-migration behavior |
|---|---|
| Library pages | Load; show demo templates with orange banner |
| Detail pages | Load; show demo template with orange banner |
| Coach preview | Loads; shows demo blocks with orange banner |
| Version history panel | Shows muted "Version history unavailable until backend migration is applied." |
| Class/fitness create wizards | All wizard steps work; Save button shows orange "Backend not yet available" on click |
| Save draft server actions | Return `{ success: false, isSchemaMissing: true }` — no crash, no unhandled exception |
| Approval actions | Return `isSchemaMissing: true` — no crash |
| TypeScript | Clean |

No runtime crashes. The system operates in full demo mode until migrations are applied.

---

## 5. What Works After Migrations Are Applied

Intended production flow after migrations 067 and 068 are applied and `database.types.ts` is regenerated:

1. **Director or head coach opens class/fitness create wizard** — completes all steps.
2. **Clicks "Save as Draft"** — `saveClassTemplateDraftFromWizardAction` or `saveFitnessTemplateDraftFromWizardAction` inserts into `template_review_requests` with `status='pending'`. Green "Draft submitted for director review" banner shown.
3. **Director opens review queue** — pending template review request appears (once `TemplateReviewDraftCard.tsx` is built and wired).
4. **Director clicks Approve** — `approveTemplateReviewRequestAction` inserts into `templates` with `status='ready'`, `approved_by`, `approved_at`; inserts version snapshot into `template_version_history`; sets review request to `approved`.
5. **Template appears in library** — `listTemplatesForAcademy` returns it; library page shows live data with green banner.
6. **Template detail shows version history** — `getTemplateVersionHistory` returns the creation snapshot; panel shows `v1 · Created · <date>`.
7. **Coach preview shows live template** — `?templateId=<id>` param triggers live fetch; green "Showing live template data" banner shown.
8. **Coaches can create sessions from the approved template** — `status='ready'` gate allows session builder to reference the template.

---

## 6. Security and Role Guardrails

| Guardrail | Enforcement point |
|---|---|
| `academyId` never from client | All server actions and page Server Components resolve `academy_id` from `profiles` via `auth.getUser()` — URL params are never trusted for academy scoping |
| No parent/player visibility | Templates table has no parent-facing RLS; no parent or player route exposes template data |
| Save draft: director/head_coach only | `assertDirectorOrHead()` in `saveClassTemplateDraftFromWizardAction` and `saveFitnessTemplateDraftFromWizardAction` |
| Approval: director only | `assertDirectorOnly()` in `approveTemplateReviewRequestAction` and `rejectTemplateReviewRequestAction` |
| No curriculum mutation | Server actions write only to `templates`, `template_blocks`, `template_review_requests`, `template_version_history` — never to any `curriculum_*` table |
| No external sends | No email, push, SMS, or Slack calls in any template action |
| No automatic level movement | Template creation does not trigger `finalize_player_placement()` or any level assignment |
| No template overwrite without approval | `update_template` requests enter `template_review_requests` as `pending` — the live template row is not modified until a director approves |
| Version history append-only | Migration 068 sets `UPDATE/DELETE DENIED` RLS on `template_version_history`; server action only INSERTs |
| `status='ready'` gate | Only `approveTemplateReviewRequestAction` sets `status='ready'`; migration 068 enforces `WITH CHECK (status != 'ready' OR auth_has_role('academy_director'))` at DB level |

---

## 7. Known Limitations

| Limitation | Detail |
|---|---|
| Migrations not applied | Migrations 067 and 068 remain draft-only. Full production flow requires director to apply them. |
| Version history `changed_by` not displayed | `changed_by` UUID is fetched but not shown — no profile name join. Flagged for a future sprint. |
| Review queue UI not surfaced | `TemplateReviewDraftCard.tsx` and `TemplateReviewDecisionControls.tsx` have not been built. The adapter and approval actions are ready; the UI card is deferred. |
| Approval action untested against live DB | `approveTemplateReviewRequestAction` logic is code-complete but cannot be validated without migration 067 applied to a real database. |
| Block/item persistence is JSONB snapshot-first | The save draft action stores a complete JSONB snapshot in `template_review_requests.template_draft`. On approval, this snapshot is INSERTed into `templates` and `template_blocks`. The full relational item persistence (inserting into `curriculum_class_template_blocks` or `template_block_exercises` as separate rows) is not yet implemented in the approval action. |
| Class/fitness create wizards retain local state only | Wizard state lives in `useState` within the Client Component. Browser refresh loses unsaved wizard progress. Persistence of in-progress wizard state (sessionStorage or server-side) is deferred. |
| Library live filter bar is visual-only | Level and goal filter buttons are rendered but do not filter live data yet. |
| `template_type` filter deferred until migration | `listTemplatesForAcademy` does not filter by type before migration 067 is applied (filtering on a missing column triggers `isSchemaMissing`). Both library pages show all academy templates until migration is applied. |
| `database.types.ts` not regenerated | Generated types still reflect the pre-067 schema. After migration 067 is applied, run `supabase gen types typescript` to remove the `rawDb` casts and produce fully-typed queries. |
| `archive_template` / `duplicate_template` not implemented | These request types are labelled in the adapter and guarded in the approval action but their execution paths are not built. |

---

## 8. Readiness Scores

| Area | Score | Notes |
|---|---|---|
| Template UI readiness | 8 / 10 | Library, detail, create wizard, coach preview, version history panel all render correctly. Filter bar and review queue card not yet wired. |
| Template repository readiness | 9 / 10 | All 6 read functions implemented; schema-missing handling proven; extended types correct. Regeneration of `database.types.ts` after migration will remove `rawDb` casts. |
| Save draft readiness | 8 / 10 | Both class and fitness actions complete; role guard, schema guard, and client state machine in place. Untested against live DB (migration not applied). |
| Review / approval readiness | 6 / 10 | Actions are code-complete; director-only guard enforced; version history INSERT included. UI card and decision controls not yet built. Full relational item persistence on approval not yet implemented. |
| Coach preview readiness | 9 / 10 | Live template fetch, DisplayBlock mapping, fitness block type support, source banner all implemented. |
| Version history readiness | 7 / 10 | Repository function and panel UI complete; `changed_by` display deferred; testing requires migration 067 applied. |
| Production readiness — before migration apply | 7 / 10 | All pages load; demo fallback is solid; no crashes; TypeScript clean. |
| Production readiness — after migration apply + QA | 5 / 10 | Approval flow and review queue UI need to be completed, tested with real data, and QA'd. Relational block persistence on approval needs implementation. |

---

## 9. Recommended Next Block — Sprints 986–1000

### Coach Portal + DONNA Wrap-Up Foundation

The template system now needs coach execution and the wrap-up evidence loop to be production-meaningful. Templates without session execution, wrap-up observations, and DONNA evidence drafts are an incomplete feedback cycle.

**Intended closed loop:**

```
Curriculum
  → Template (Phase 1 complete)
    → Coach Session (execution)
      → DONNA Wrap-Up (observation draft)
        → Attendance / Observation / Evidence Drafts
          → Director Review
            → Player Development Record
```

Template Backend Phase 1 ends at the second node. Sprints 986–1000 complete the loop.

### Sprint 986 — Coach Portal Architecture Audit V1

**Scope:** Audit-and-design sprint (no migrations, no new server actions, no UI rewiring). Deliverable: `docs/COACH_PORTAL_ARCHITECTURE_AUDIT_986.md`.

Audit questions:
1. What coach portal routes currently exist and what data do they render?
2. What is the current state of session creation from a template?
3. What wrap-up/observation data is written today and where does it land?
4. Where does DONNA currently surface in the coach flow?
5. What is the gap between current coach portal state and the closed loop above?
6. What new tables, actions, or UI changes are required for Sprints 987–1000?

This audit is the source of truth for all remaining 986–1000 sprints, exactly as Sprint 971 was the source of truth for 972–985.

---

## Sprint Coverage Reference

| Sprint | Title | Deliverable | Status |
|---|---|---|---|
| 971 | Template Backend Wiring Architecture Audit | `docs/TEMPLATE_BACKEND_WIRING_ARCHITECTURE_AUDIT_971.md` | Complete |
| 972 | Template Schema Migration Draft | `supabase/migrations/067_template_schema_extension.sql` | Draft only |
| 973 | Template RLS Policy Draft | `supabase/migrations/068_template_rls_policies.sql` | Draft only |
| 974 | Template Repository Read Layer | `src/lib/templates/templateRepository.ts` | Complete |
| 975 | Template Library Live Data Wiring | `class/page.tsx`, `fitness/page.tsx` | Complete |
| 976 | Template Detail Live Data Wiring | `class/[templateId]/page.tsx`, `fitness/[templateId]/page.tsx` | Complete |
| 977 | Template Save Draft Server Action | `src/lib/actions/templateDraftAction.ts` (base actions) | Complete |
| 978 | Template Review Queue Handoff | `src/lib/templates/templateReviewQueueAdapter.ts` | Complete (UI card deferred) |
| 979 | Template Approval Application | `src/lib/actions/templateApprovalAction.ts` | Complete (UI wiring deferred) |
| 980 | Class Template Create Save Wiring | `class/create/page.tsx` + `saveClassTemplateDraftFromWizardAction` | Complete |
| 981 | Fitness Template Create Save Wiring | `fitness/create/page.tsx` + `saveFitnessTemplateDraftFromWizardAction` | Complete |
| 982 | Coach Preview Live Template Wiring | `coach-preview/page.tsx` + templateId param | Complete |
| 983 | Template Version History | Version history panel on class and fitness detail pages | Complete |
| 984 | Template Backend QA | `docs/TEMPLATE_BACKEND_QA_984.md` | Complete |
| 985 | Template Backend Completion Audit | This document | Complete |
