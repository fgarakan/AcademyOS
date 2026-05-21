# Engineering Module Registry

**Last updated:** Sprint 402
**Audience:** Engineering
**Purpose:** Canonical registry of every `src/lib/` module — purpose, inputs/outputs, risk level, and owner.
**Related docs:** `docs/visual-system/08_MODULE_DEPENDENCY_MAP.md`, `docs/architecture-index.md`
**When to update:** When a new module is created, deprecated, or significantly changed.

---

## How to Read This Registry

Each module entry includes:
- **Purpose:** What the module does
- **Key exports:** Main functions/types used by the rest of the app
- **Risk level:** Low / Medium / High — based on data sensitivity and external surface
- **Status:** Active / Planned / Deprecated
- **Notes:** Caveats, known issues, planned changes

---

## Infrastructure Modules

### `src/lib/supabase/`
**Purpose:** Supabase client initialization and generated TypeScript types.
**Key exports:** `getSupabaseServer()`, `getSupabaseBrowser()`, `database.types.ts` (generated)
**Risk:** High — server.ts uses session cookies; never use service role in application code
**Status:** Active
**Notes:** `database.types.ts` is generated via `npx supabase gen types typescript`. Do not edit manually. Regenerate after every migration.

### `src/lib/observability/`
**Purpose:** Structured logging and request tracing. Sprint 401.
**Key exports:** `createRequestId()`, `getSafeRequestMeta()`, `createActionLogger()`, `logInfo/Warn/Error()`
**Risk:** Low — no external service; console output only
**Status:** Active
**Notes:** No log drain connected yet. SAFE_KEYS allowlist prevents PII leakage.

### `src/lib/idempotency/`
**Purpose:** Duplicate submission guards and idempotency key utilities. Sprint 401.
**Key exports:** `assertNonEmptyString()`, `assertUuidLike()`, `isDuplicateSubmissionWindow()`, `createIdempotencyKey()`, `createContentHash()`
**Risk:** Low — no external surface; in-process helpers
**Status:** Active
**Notes:** Time-window guards are best-effort. DB-backed idempotency planned in Sprint 412.

### `src/lib/rateLimit/`
**Purpose:** Rate limit policy definitions and in-process rate limit helper. Sprint 403.
**Key exports:** `RATE_LIMIT_POLICIES`, `checkRateLimit()`, `RateLimitPolicy`
**Risk:** Medium — in-process only; not reliable across serverless instances
**Status:** Active (foundation)
**Notes:** Reliable rate limiting requires a DB-backed store. Documented in RATE_LIMITING_IMPLEMENTATION_NOTES.md.

### `src/lib/cache/`
**Purpose:** Cache key builders, TTL policy definitions, revalidation helpers. Sprint 405–406.
**Key exports:** `buildCacheKey()`, `TTL_POLICIES`, `revalidatePlayerPath()`, `revalidateSessionPath()`
**Risk:** Medium — stale cache can expose wrong data to wrong tenant
**Status:** Active (foundation)
**Notes:** Cache keys must include academy_id. No cross-tenant cache entries ever.

---

## AI / Voice Modules

### `src/lib/donna/`
**Purpose:** DONNA AI assistant — context packs, action types, KPI summaries, conversation building.
**Key exports:** `coachDonnaContext.ts`, `directorDonnaContext.ts`, `academyHealthContextPackage.ts`, `donnaActionTypes.ts`
**Risk:** High — external AI calls, KPI computation, proposed_action creation
**Status:** Active
**Notes:** DONNA never writes to core data tables. 8+ sequential DB queries per intelligence call. 2,123+ lines of synchronous KPI computation. Background job queue planned (Sprint 409).

### `src/lib/voice/`
**Purpose:** Voice intake structuring, command routing, role guardrails.
**Key exports:** `structureVoiceIntake.ts`, `voiceDestinationRouter.ts`, `voiceRoleGuardrails.ts`
**Risk:** High — processes coach voice input, routes to DONNA or direct storage
**Status:** Active
**Notes:** Raw audio never stored. Transcripts stored in voice_transcripts (RLS protected).

---

## Domain / KPI Modules

### `src/lib/kpi/`
**Purpose:** KPI computation engines for academy health, development velocity, attendance, curriculum coverage, etc.
**Key exports:** `attendanceKpiEngine.ts`, `developmentHealthKpiEngine.ts`, `coachExecutionKpiEngine.ts`, `donnaKpiSummaryEngine.ts`, +(7 more)
**Risk:** High — 2,123+ lines of synchronous computation; called inline with DONNA intelligence
**Status:** Active
**Notes:** Sprint 400 audit identified these as the highest scalability risk. Optimization and background job migration planned.

### `src/lib/templates/`
**Purpose:** Template repository, curriculum-template links, session preview.
**Key exports:** `templateRepository.ts`, `curriculumTemplateLinks.ts`, `templateReviewQueueAdapter.ts`
**Risk:** Medium — templates affect session generation
**Status:** Active
**Notes:** TemplateRow/TemplateBlockRow are type aliases after Sprint 399 fix.

### `src/lib/curriculum/`
**Purpose:** (via templates) Curriculum spine, block recommendations, fitness exercises.
**Risk:** Low-Medium
**Status:** Active

### `src/lib/player/` and `src/lib/players/`
**Purpose:** Player placement, priorities, import processing.
**Key exports:** `placement/`, `player-import/`
**Risk:** High — `finalize_player_placement()` is the only function that activates a player
**Status:** Active
**Notes:** `finalize_player_placement()` must never be called outside the placement flow.

---

## Coach / Session Modules

### `src/lib/session-planning/`
**Purpose:** Session plan generation from templates.
**Risk:** Medium
**Status:** Active

### `src/lib/wrap-up/`
**Purpose:** Session wrap-up utilities.
**Risk:** Medium
**Status:** Active
**Notes:** Sprint 401 added duplicate guards to wrap-up actions.

### `src/lib/coach/`
**Purpose:** Coach-specific data access and DONNA context loading.
**Risk:** Medium
**Status:** Active

---

## Portal / Parent Modules

### `src/lib/parent/`
**Purpose:** Parent-facing data access and summary display.
**Risk:** High — parent-safe content must never include internal notes
**Status:** Active
**Notes:** All parent-visible data requires `show_to_parent = true` flag. Never bypass this check.

### `src/lib/portal/`
**Purpose:** Demo portal data access (Sprint 399).
**Key exports:** `getDemoPortalFoundation()`, `DEMO_ACADEMY_ID`, `DEMO_PLAYER_ID`
**Risk:** Low (demo data only)
**Status:** Active (demo only)
**Notes:** DEMO_ONLY. Do not use in production paths.

---

## Planned Modules (Not Yet Created)

| Module | Sprint | Purpose |
|---|---|---|
| `src/lib/featureFlags/` | Sprint 414 | Per-academy feature flag helpers |
| `src/lib/killSwitches/` | Sprint 415 | Global and per-academy kill switches |
| `src/lib/audit/` | Sprint 413 | Audit log write helpers |
| `src/lib/jobs/` | Sprint 410 | Background job types and stubs |
| `src/lib/versioning/` | Sprint 411 | Optimistic locking helpers |
| `src/lib/donna/contextPacks/` | Sprint 418 | Typed context pack builders |
| `src/lib/donna/drafts/` | Sprint 419 | Draft queue types |
| `src/lib/usage/` | Sprint 407 | AI/voice usage metering |

---

## Module Health Summary

| Module | Risk | Has rate limiting | Has observability | Has idempotency | Audit logged |
|---|---|---|---|---|---|
| donna/ | High | ❌ (planned) | Partial | ❌ (planned) | Partial |
| voice/ | High | ❌ (planned) | Partial | ❌ (planned) | Partial |
| kpi/ | High (perf) | N/A | ❌ | N/A | N/A |
| templates/ | Medium | N/A | ❌ | ❌ | Partial |
| player/ | High | N/A | ❌ | N/A | Partial |
| parent/ | High (vis) | N/A | ❌ | N/A | ❌ |
| observability/ | Low | N/A | Self | N/A | N/A |
| idempotency/ | Low | N/A | N/A | Self | N/A |
| rateLimit/ | Medium | Self | ❌ | N/A | N/A |
| cache/ | Medium | N/A | N/A | N/A | N/A |
