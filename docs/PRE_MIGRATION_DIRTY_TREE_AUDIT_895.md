# Sprint 895 — Pre-Migration Dirty Tree Audit V1

**Date:** 2026-05-27
**Sprint:** 895
**Type:** Audit — full classification of all dirty working-tree files before migration readiness
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no code changes made)
**Status:** ✅ COMPLETE — all files classified, migration risk identified, Sprint 896 recommendation issued
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1
**Resolves:** Sprint 894 recommendation — audit working tree before next major build phase (migration + route wiring)

---

## Purpose

Before applying the 38 pending Supabase migrations and beginning Director Dashboard KPI + attention
queue route wiring, this sprint classifies every file in the dirty working tree so the next sprint
can proceed with a clear picture of what is staged, what is safe to leave unstaged, and what carries
migration or TypeScript risk.

---

## Section 1 — Summary Counts

| Category | Count |
|---|---|
| Modified (unstaged) files | 7 |
| Untracked source files | 2 |
| Untracked migration files | 38 |
| Untracked sprint docs | ~18 |
| Untracked data files | 9 |
| Untracked planning artifacts | 8+ |
| Untracked auto-generated | 1 |

---

## Section 2 — Modified Files (Unstaged)

All 7 modified files are from the **DONNA Guided Highlight / Directed Navigation** work (Sprints
817–820). None touch DB schema, server actions, or auth. All are TypeScript-clean.

### 2.1 — Sprint 817: Director Layout + CSS (`globals.css`, `layout.tsx`)

| File | Sprint | Change summary | TypeScript | Risk |
|---|---|---|---|---|
| `src/app/globals.css` | 817 | Adds `.donna-focus-ring` (teal glow + `donna-pulse` keyframe) and `.donna-focus-ring-warning` (amber glow + `donna-pulse-warning` keyframe) CSS utility classes | N/A — CSS only | None |
| `src/app/director/layout.tsx` | 817 | Imports `DonnaHighlightBanner` from `src/components/donna/DonnaHighlightBanner.tsx` (confirmed to exist); renders `<DonnaHighlightBanner />` at director layout level | ✅ Clean | None |

**Classification:** Intentional — Sprint 817 code, awaiting grouped commit with 817–820 block.
**Action:** Keep unstaged. Include in Sprint 817–820 grouped commit (future sprint).

---

### 2.2 — Sprint 818: Director Dashboard Focus Targets (`page.tsx`)

| File | Sprint | Change summary | TypeScript | Risk |
|---|---|---|---|---|
| `src/app/director/page.tsx` | 818 | Adds `data-donna-focus-id` HTML attributes to 7 dashboard sections: `today-command-center`, `todays-pulse`, `review-queue-card`, `player-attention-card`, `sessions-this-week-card`, `academy-metrics-section`, `alerts-placement-section` | ✅ Clean | None |

**Classification:** Intentional — Sprint 818 code, awaiting grouped commit.
**Action:** Keep unstaged. Include in Sprint 817–820 grouped commit.

---

### 2.3 — Sprint 819: Template Builder Focus Targets (`class-templates/page.tsx`, `class-templates/new/page.tsx`)

| File | Sprint | Change summary | TypeScript | Risk |
|---|---|---|---|---|
| `src/app/director/class-templates/page.tsx` | 819 | Adds `data-donna-focus-id` to: `create-template-button`, `template-list` | ✅ Clean | None |
| `src/app/director/class-templates/new/page.tsx` | 819 | Wraps create form in `data-donna-focus-id="create-template-form"` div | ✅ Clean | None |

**Classification:** Intentional — Sprint 819 code, awaiting grouped commit.
**Action:** Keep unstaged. Include in Sprint 817–820 grouped commit.

---

### 2.4 — Sprint 820: Player Directory Focus Targets (`players/page.tsx`, `PlayersDirectoryClient.tsx`)

| File | Sprint | Change summary | TypeScript | Risk |
|---|---|---|---|---|
| `src/app/director/players/page.tsx` | 820 | Adds `data-donna-focus-id` to: `player-directory-summary`, `players-missing-level`, `add-player-button` | ✅ Clean | None |
| `src/app/director/players/_components/PlayersDirectoryClient.tsx` | 820 | Adds `data-donna-focus-id="player-filter-bar"` to `SearchFilterBar` (confirmed at `src/components/ui/SearchFilterBar.tsx`); adds `data-donna-focus-id="player-list"` to table div | ✅ Clean | None |

**Classification:** Intentional — Sprint 820 code, awaiting grouped commit.
**Action:** Keep unstaged. Include in Sprint 817–820 grouped commit.

---

### 2.5 — Modified Files Summary

| File | Sprint | Classification | Stage now? | Future action |
|---|---|---|---|---|
| `src/app/globals.css` | 817 | Intentional | ❌ No | Sprint 817–820 grouped commit |
| `src/app/director/layout.tsx` | 817 | Intentional | ❌ No | Sprint 817–820 grouped commit |
| `src/app/director/page.tsx` | 818 | Intentional | ❌ No | Sprint 817–820 grouped commit |
| `src/app/director/class-templates/page.tsx` | 819 | Intentional | ❌ No | Sprint 817–820 grouped commit |
| `src/app/director/class-templates/new/page.tsx` | 819 | Intentional | ❌ No | Sprint 817–820 grouped commit |
| `src/app/director/players/page.tsx` | 820 | Intentional | ❌ No | Sprint 817–820 grouped commit |
| `src/app/director/players/_components/PlayersDirectoryClient.tsx` | 820 | Intentional | ❌ No | Sprint 817–820 grouped commit |

**None of the 7 modified files carry any migration risk, DB risk, or TypeScript risk.**

---

## Section 3 — Untracked Source Files

### 3.1 — `src/lib/donna/donnaFocusTarget.ts`

**Sprint:** 817
**What it is:** sessionStorage-backed DONNA focus target store. Exports `DonnaFocusTarget` interface,
`DonnaHighlightStyle` type, `DONNA_FOCUS_TARGET_KEY` constant, and focus target read/write utilities.
Used by `DonnaHighlightBanner` at runtime. TypeScript clean (confirmed via `npx tsc --noEmit`).

**Key types:**
```typescript
export type DonnaHighlightStyle = 'teal-glow' | 'warning'
export interface DonnaFocusTarget {
  route: string
  targetId: string
  label: string
  reason?: string
  sourceCommand?: string
  highlightStyle?: DonnaHighlightStyle
  expiresAt?: number
}
export const DONNA_FOCUS_TARGET_KEY = 'donna_focus_target'
```

**Classification:** Intentional — Sprint 817 code.
**Risk:** None. Pure client-side store. No DB, no server actions, no auth.
**Action:** Include in Sprint 817–820 grouped commit. Not safe to delete — `DonnaHighlightBanner` imports it.

---

### 3.2 — `src/components/assistant/DonnaAssistantButton.tsx`

> **Note:** This file appears as ` M` (modified, unstaged) in `git status --short`. It is not listed
> in the "Modified Files" section above because it was modified in Sprint 887 (write site conditional
> at line 3054: `lastIntentFamily: routing.intent === 'roster_attention' ? 'roster_attention' : 'coo_answer'`)
> and is on the **permanent do-not-stage list** for this sprint track.
>
> **Classification:** Intentional Sprint 887 change. Already accounted for in Sprint 887 sprint doc.
> Wait until all 887–890 follow-up resolver changes are bundled for a future DONNA resolver commit.
> **Action:** Do not stage. Keep unstaged.

---

## Section 4 — Untracked Migration Files

| Files | Count | Status |
|---|---|---|
| `supabase/migrations/001_extensions.sql` through `038_curriculum_mappings.sql` | 38 | Untracked |

### 4.1 — Migration Risk Assessment

**Source:** `docs/CURRENT_BUILD_TARGET.md` explicitly states: "Apply pending Supabase migrations" is
the **next major step** after the DONNA resolver track completes.

**Risk level:** ⚠️ HIGH — Migrations are irreversible if applied to a live Supabase instance. These
files define the entire schema (extensions, core identity, RLS helpers, players, assessments, exercises,
sessions, voice pipeline, proposed actions, coach notes, audit/versioning, functions/triggers, reporting
views, signal layer, UTR integration, player outcomes, time intelligence, load aggregation, decision
scoring, player priorities, recommendations, learning system, moat views, seed data, exercise intelligence,
recommendation reasoning, behavioral model, predictions, coaching output, model optimization, cohort
intelligence, competitive benchmarks, director control, data flywheel, security fixes, curriculum spine,
curriculum seed, curriculum mappings).

**Action:** Do NOT touch. Do NOT stage. Do NOT apply without explicit user direction + Supabase sprint
protocol. Require a dedicated `/supabase-sprint` when the user is ready.

### 4.2 — Migration File Inventory

| File | Description |
|---|---|
| `001_extensions.sql` | PostgreSQL extensions (pgcrypto, uuid-ossp, etc.) |
| `002_core_identity.sql` | Core identity tables (academies, profiles, roles) |
| `003_rls_helpers.sql` | RLS helper functions (auth.uid(), academy_id scoping) |
| `004_players.sql` | Players table + RLS |
| `005_assessments.sql` | Assessments table + RLS |
| `006_exercises_templates.sql` | Exercise library + template tables + RLS |
| `007_sessions.sql` | Sessions table + RLS |
| `008_voice_pipeline.sql` | Voice pipeline tables + RLS |
| `009_proposed_actions.sql` | proposed_actions table + RLS |
| `010_coach_notes.sql` | Coach notes table + RLS |
| `011_audit_versioning.sql` | Audit logs + versioning tables |
| `012_functions_triggers.sql` | Core functions (`finalize_player_placement`, `execute_approved_action`) + triggers |
| `013_reporting_views.sql` | Reporting views |
| `014_signal_layer.sql` | Signal layer tables + RLS |
| `015_utr_integration.sql` | UTR integration tables |
| `016_player_outcomes.sql` | Player outcomes tracking |
| `017_time_intelligence.sql` | Time intelligence views/functions |
| `018_player_load_aggregation.sql` | Player load aggregation |
| `019_decision_scoring.sql` | Decision scoring system |
| `020_player_priorities.sql` | Player priority ranking |
| `021_recommendations.sql` | Recommendations engine tables |
| `022_learning_system.sql` | Learning system tables |
| `023_moat_views.sql` | MOAT competitive views |
| `024_seed_data.sql` | Seed data (roles, reference tables) |
| `025_exercise_intelligence.sql` | Exercise intelligence layer |
| `026_recommendation_reasoning.sql` | Recommendation reasoning tables |
| `027_player_behavioral_model.sql` | Player behavioral model |
| `028_predictions.sql` | Predictions tables |
| `029_coaching_output.sql` | Coaching output tables |
| `030_model_optimization.sql` | Model optimization tables |
| `031_cohort_intelligence.sql` | Cohort intelligence views |
| `032_competitive_benchmarks.sql` | Competitive benchmark tables |
| `033_director_control.sql` | Director control tables + RLS |
| `034_data_flywheel.sql` | Data flywheel aggregation |
| `035_security_fixes.sql` | RLS security patches |
| `036_curriculum_spine.sql` | Curriculum spine tables |
| `037_curriculum_seed.sql` | Curriculum seed data |
| `038_curriculum_mappings.sql` | Curriculum mapping tables |

---

## Section 5 — Untracked Sprint Docs

These docs correspond to completed sprints that have not yet been committed. They should be committed
alongside their code blocks in future grouped commits.

| File | Sprint | Classification | Action |
|---|---|---|---|
| `docs/DONNA_NAVIGATE_HIGHLIGHT_RUNTIME_817.md` | 817 | Sprint doc — paired with Sprint 817 code | Include in Sprint 817–820 grouped commit |
| `docs/DIRECTOR_DAILY_COMMAND_FOCUS_TARGETS_818.md` | 818 | Sprint doc — paired with Sprint 818 code | Include in Sprint 817–820 grouped commit |
| `docs/TEMPLATE_BUILDER_GUIDED_NAVIGATION_819.md` | 819 | Sprint doc — paired with Sprint 819 code | Include in Sprint 817–820 grouped commit |
| `docs/PLAYER_DIRECTORY_GUIDED_NAVIGATION_820.md` | 820 | Sprint doc — paired with Sprint 820 code | Include in Sprint 817–820 grouped commit |
| `docs/DONNA_VOICE_SINGLETON_821.md` | 821 | Sprint doc — paired with Sprint 821 code | Include in Sprint 821 commit |
| `docs/DONNA_BUILDER_ASSISTANT_AUDIT_734.md` | 734 | Older audit doc | Include when committing Sprint 734 era docs |
| `docs/ONBOARDING_TEMPLATE_ARCHITECTURE_ALIGNMENT_AUDIT.md` | — | Architecture audit doc | Inspect next — check if superseded |
| `docs/PLAYER_PARENT_DEVELOPMENT_PROFILE_DEMO_SCRIPT.md` | — | Player profile demo script | Include in player profile commit block |
| `docs/PLAYER_PARENT_DEVELOPMENT_PROFILE_EXPERIENCE_AUDIT.md` | — | Player profile experience audit | Include in player profile commit block |
| `docs/PLAYER_PARENT_DEVELOPMENT_PROFILE_EXPERIENCE_QA.md` | — | Player profile experience QA | Include in player profile commit block |
| `docs/PLAYER_IMPORT_PARSER.md` | — | Player import parser spec | Include with player import feature commit |
| `docs/BRIAN_VOICE_DEMO_SCRIPT.md` | — | Voice demo script | Include in voice demo commit block |
| `docs/VOICE_INPUT_DEMO_LAYER_ARCHITECTURE.md` | — | Voice input demo architecture | Include in voice demo commit block |
| `docs/VOICE_INPUT_DEMO_QA.md` | — | Voice input demo QA | Include in voice demo commit block |
| `docs/VOICE_TEXT_INPUT_COMPONENT.md` | — | Voice text input component spec | Include in voice input component commit |
| `docs/curriculum/angles-curriculum-synthesis.md` | — | Curriculum research — synthesis | Include in curriculum commit block |
| `docs/curriculum/angles-master-spine.md` | — | Curriculum research — master spine | Include in curriculum commit block |
| `docs/curriculum/product-tool-exclusion-decision.md` | — | Curriculum product decision | Include in curriculum commit block |
| `docs/curriculum/source-research-aggregation.md` | — | Curriculum research aggregation | Include in curriculum commit block |

---

## Section 6 — Untracked Data Files

| File/Dir | Classification | Action |
|---|---|---|
| `data/airtable-import/*.csv` (8 files) | Import data from Airtable — coaches, players, sessions, exercises, programs, blocks, attendance, templates | Keep — needed for data import sprint; do not delete; do not commit unless a data-import sprint explicitly requests it |
| `data/player-import/academy_os_player_import_roster.csv` | Player roster import file | Same as above |

---

## Section 7 — Untracked Planning / Architecture Artifacts

| File/Dir | Classification | Action |
|---|---|---|
| `Academy_OS_Master_Build/` | Pre-app planning artifacts — stale relative to current code | Safe to ignore. Do not commit. Do not delete until user confirms no longer needed. |
| `prototype-reference/` | Prototype reference screenshots/assets | Safe to ignore. Do not commit. |
| `BUILD_ORDER.md` | Pre-app build order — may be superseded by `docs/CURRENT_BUILD_TARGET.md` | Inspect next — check if `CURRENT_BUILD_TARGET.md` fully supersedes |
| `DATA_FLOW_MAP.md` | Data flow diagram | Inspect next — may be useful as reference |
| `MULTI_TENANT_SECURITY_AUDIT.md` | Multi-tenant security audit | Inspect next — may have security-relevant items not in `AI_BACKEND_RULES.md` |
| `PLAYER_PROFILE_SPEC.md` | Player profile specification | Inspect next — check alignment with current player profile implementation |
| `PRODUCT_BLUEPRINT.md` | Product blueprint | Safe to ignore — superseded by implemented app |
| `README_BACKEND.md` | Backend README | Inspect next — may need to become `docs/README_BACKEND.md` |
| `ROLE_CONNECTION_MAP.md` | Role connection map | Inspect next — may be useful for onboarding |
| `UI_SCREEN_MAP.md` | UI screen map | Inspect next — check alignment with current route structure |

---

## Section 8 — Untracked Auto-Generated Files

| File | Classification | Action |
|---|---|---|
| `next-env.d.ts` | Next.js auto-generated TypeScript ambient declarations | Should be in `.gitignore`. Check `.gitignore` entry. If missing, add `next-env.d.ts` to `.gitignore`. Do not commit this file. |

---

## Section 9 — TypeScript Validation

```
npx tsc --noEmit
```

**Result:** Exit 0. No errors. No warnings.

All 7 modified files (Sprints 817–820) and `src/lib/donna/donnaFocusTarget.ts` are TypeScript-clean.
`DonnaHighlightBanner` (at `src/components/donna/DonnaHighlightBanner.tsx`) — confirmed to exist.
`SearchFilterBar` (at `src/components/ui/SearchFilterBar.tsx`) — confirmed to exist.

---

## Section 10 — Migration Readiness Impact

### Before applying migrations, the following must be committed or accounted for:

| Item | Risk if migrations applied with current state | Recommended pre-migration action |
|---|---|---|
| 7 modified Sprint 817–820 files | None — CSS/HTML attributes only, no schema dependency | May be committed before or after migrations; no conflict |
| `src/lib/donna/donnaFocusTarget.ts` | None — pure client-side code | May be committed before or after migrations; no conflict |
| 38 migration files | **These ARE the migration step** — applying them is the next build phase | Require explicit user command + `/supabase-sprint` protocol |
| Sprint docs (18+) | None — documentation only | May be committed at any time |
| Data import CSVs | None — static files | No action needed until data import sprint |
| Planning artifacts | None — not referenced by code | No action needed |

### Migration readiness verdict:
The working tree is **safe to proceed toward migration** — no uncommitted code carries schema
dependencies or conflicts with the 38 pending migration files. The Sprint 817–820 DONNA Guided
Highlight code is pure client-side and will work regardless of migration state.

**However:** Migrations must NOT be applied until the user explicitly initiates a `/supabase-sprint`.
The CURRENT_BUILD_TARGET.md says migration is next — but "next" means "next explicit user instruction,"
not "apply automatically."

---

## Section 11 — Grouped Commit Recommendations

### Group A — Sprint 817–820: DONNA Guided Highlight + Directed Navigation

**Commit message:** `Sprint 817-820 — DONNA Guided Highlight and Directed Navigation V1`

**Files to stage:**
```
src/app/globals.css
src/app/director/layout.tsx
src/app/director/page.tsx
src/app/director/class-templates/page.tsx
src/app/director/class-templates/new/page.tsx
src/app/director/players/page.tsx
src/app/director/players/_components/PlayersDirectoryClient.tsx
src/lib/donna/donnaFocusTarget.ts
docs/DONNA_NAVIGATE_HIGHLIGHT_RUNTIME_817.md
docs/DIRECTOR_DAILY_COMMAND_FOCUS_TARGETS_818.md
docs/TEMPLATE_BUILDER_GUIDED_NAVIGATION_819.md
docs/PLAYER_DIRECTORY_GUIDED_NAVIGATION_820.md
docs/CHANGELOG.md (Sprint 817–820 entry)
```

**Status:** Ready — all TypeScript clean. Requires user confirmation before staging.

---

### Group B — Sprint 887–890: DONNA Resolver + DonnaAssistantButton

**Commit message:** `Sprint 887-890 — DONNA Follow-Up Resolver Resolver Track V1`

**Files to stage:**
```
src/components/assistant/DonnaAssistantButton.tsx
src/lib/donna/donnaFollowUpResolver.ts  (already committed through Sprint 893 — verify)
docs/DONNA_ROSTER_ATTENTION_WRITE_SITE_887.md
docs/DONNA_ROSTER_ATTENTION_FOLLOW_UP_COPY_888.md
docs/DONNA_FOLLOW_UP_PATTERN_EXPANSION_889.md
docs/DONNA_REVIEW_ATTENTION_ELABORATION_HANDLERS_890.md
```

**Note:** `donnaFollowUpResolver.ts` was committed at Sprint 893. `DonnaAssistantButton.tsx` Sprint 887
change is the remaining unstaged file. Verify precise commit grouping before staging.

---

### Group C — Curriculum docs

**Commit message:** `docs — Curriculum research and synthesis V1`

**Files to stage:**
```
docs/curriculum/angles-curriculum-synthesis.md
docs/curriculum/angles-master-spine.md
docs/curriculum/product-tool-exclusion-decision.md
docs/curriculum/source-research-aggregation.md
docs/curriculum/research/ (directory)
docs/curriculum/source-files/ (directory)
```

---

### Group D — Migration (separate sprint)

**Do NOT stage or commit without explicit `/supabase-sprint` instruction.**

---

## Section 12 — File-by-File Action Table

| File | Classification | Action |
|---|---|---|
| `src/app/globals.css` | Intentional Sprint 817 | Keep unstaged — Sprint 817–820 commit |
| `src/app/director/layout.tsx` | Intentional Sprint 817 | Keep unstaged — Sprint 817–820 commit |
| `src/app/director/page.tsx` | Intentional Sprint 818 | Keep unstaged — Sprint 817–820 commit |
| `src/app/director/class-templates/page.tsx` | Intentional Sprint 819 | Keep unstaged — Sprint 817–820 commit |
| `src/app/director/class-templates/new/page.tsx` | Intentional Sprint 819 | Keep unstaged — Sprint 817–820 commit |
| `src/app/director/players/page.tsx` | Intentional Sprint 820 | Keep unstaged — Sprint 817–820 commit |
| `src/app/director/players/_components/PlayersDirectoryClient.tsx` | Intentional Sprint 820 | Keep unstaged — Sprint 817–820 commit |
| `src/lib/donna/donnaFocusTarget.ts` | Intentional Sprint 817 (untracked) | Keep unstaged — Sprint 817–820 commit |
| `src/components/assistant/DonnaAssistantButton.tsx` | Intentional Sprint 887 | Keep unstaged — Sprint 887–890 commit |
| `supabase/migrations/001–038_*.sql` | Pending migrations | Do NOT touch — requires `/supabase-sprint` |
| `docs/DONNA_NAVIGATE_HIGHLIGHT_RUNTIME_817.md` | Sprint 817 doc | Keep unstaged — Sprint 817–820 commit |
| `docs/DIRECTOR_DAILY_COMMAND_FOCUS_TARGETS_818.md` | Sprint 818 doc | Keep unstaged — Sprint 817–820 commit |
| `docs/TEMPLATE_BUILDER_GUIDED_NAVIGATION_819.md` | Sprint 819 doc | Keep unstaged — Sprint 817–820 commit |
| `docs/PLAYER_DIRECTORY_GUIDED_NAVIGATION_820.md` | Sprint 820 doc | Keep unstaged — Sprint 817–820 commit |
| `docs/DONNA_VOICE_SINGLETON_821.md` | Sprint 821 doc | Keep unstaged — Sprint 821 commit |
| `docs/DONNA_BUILDER_ASSISTANT_AUDIT_734.md` | Sprint 734 doc | Inspect next — include in 734-era docs commit |
| `docs/ONBOARDING_TEMPLATE_ARCHITECTURE_ALIGNMENT_AUDIT.md` | Architecture audit | Inspect next |
| `docs/PLAYER_PARENT_DEVELOPMENT_PROFILE_*.md` (3 files) | Player profile docs | Include in player profile commit block |
| `docs/PLAYER_IMPORT_PARSER.md` | Player import spec | Include in player import commit |
| `docs/BRIAN_VOICE_DEMO_SCRIPT.md` | Voice demo | Include in voice demo commit block |
| `docs/VOICE_INPUT_DEMO_*.md` (2 files) | Voice demo docs | Include in voice demo commit block |
| `docs/VOICE_TEXT_INPUT_COMPONENT.md` | Voice component spec | Include in voice input commit |
| `docs/curriculum/*.md` (4 files + dirs) | Curriculum research | Curriculum commit block |
| `data/airtable-import/*.csv` (8 files) | Import data | Keep — no commit until data import sprint |
| `data/player-import/*.csv` | Roster import | Keep — no commit until player import sprint |
| `Academy_OS_Master_Build/` | Stale planning | Ignore — do not commit |
| `prototype-reference/` | Prototype assets | Ignore — do not commit |
| `BUILD_ORDER.md` | Planning artifact | Inspect next |
| `DATA_FLOW_MAP.md` | Planning artifact | Inspect next |
| `MULTI_TENANT_SECURITY_AUDIT.md` | Security audit | Inspect next |
| `PLAYER_PROFILE_SPEC.md` | Player profile spec | Inspect next |
| `PRODUCT_BLUEPRINT.md` | Stale blueprint | Ignore — do not commit |
| `README_BACKEND.md` | Backend README | Inspect next |
| `ROLE_CONNECTION_MAP.md` | Planning artifact | Inspect next |
| `UI_SCREEN_MAP.md` | Planning artifact | Inspect next |
| `next-env.d.ts` | Auto-generated | Check `.gitignore` — should not be committed |

---

## Section 13 — Regressions Found

**None.** All dirty files are TypeScript-clean. No safety violations detected. No files have
schema dependencies that conflict with the pending migrations. All Sprint 817–820 code imports
confirmed to exist at their declared paths.

---

## Section 14 — Sprint 896 Recommendation

**Sprint 896 — DONNA Guided Highlight Grouped Commit V1**

Commit the Sprint 817–820 DONNA Guided Highlight block in a single grouped commit. Scope:
- All 7 modified source files (Sprints 817–820)
- `src/lib/donna/donnaFocusTarget.ts`
- Sprint docs: `docs/DONNA_NAVIGATE_HIGHLIGHT_RUNTIME_817.md`, `docs/DIRECTOR_DAILY_COMMAND_FOCUS_TARGETS_818.md`, `docs/TEMPLATE_BUILDER_GUIDED_NAVIGATION_819.md`, `docs/PLAYER_DIRECTORY_GUIDED_NAVIGATION_820.md`
- `docs/CHANGELOG.md` (Sprint 817–820 entry)

After this commit, the working tree will be significantly cleaner: only the Sprint 887 `DonnaAssistantButton.tsx` change, migration files, curriculum docs, and data files will remain untracked/modified.

**Alternative Sprint 896 — Begin Migration Sprint**

If user is ready to apply migrations, initiate `/supabase-sprint` with explicit apply-migrations instruction. The working tree is safe for this path as well.

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB changes | ✅ |
| No migrations applied | ✅ |
| No server action changes | ✅ |
| No context fetch changes | ✅ |
| No source code modified | ✅ |
| No pattern changes | ✅ |
| No resolver changes | ✅ |
| No handler changes | ✅ |
| TypeScript clean | ✅ |
| DonnaAssistantButton.tsx not staged | ✅ |
| donnaFollowUpResolver.ts not modified | ✅ |
| Migration files not touched | ✅ |

---

## Files Created

| File | Purpose |
|---|---|
| `docs/PRE_MIGRATION_DIRTY_TREE_AUDIT_895.md` | This sprint document |

## Files Modified

| File | Change |
|---|---|
| `docs/CHANGELOG.md` | Sprint 895 dated entry added |

## Files Read (not modified)

| File | Purpose |
|---|---|
| `docs/CURRENT_BUILD_TARGET.md` | Confirmed migration is next build phase |
| `docs/DONNA_NORMALIZER_FINAL_AUDIT_894.md` | Sprint 894 context |
| All 7 modified source files | Confirmed intent and Sprint attribution |
| `src/lib/donna/donnaFocusTarget.ts` | Confirmed content and intent |
| `src/components/donna/DonnaHighlightBanner.tsx` | Confirmed file exists |
| `src/components/ui/SearchFilterBar.tsx` | Confirmed file exists |
