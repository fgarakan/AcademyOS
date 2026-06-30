# AcademyOS — Architecture Constitution

> **Status:** LOCKED CONSTITUTION · **Version:** 1.0 · **Created:** 2026-06-30
>
> **This is the highest architectural authority in the codebase.** It outranks every
> other document, including `CURRENT_BUILD_TARGET.md`, `LOCKED_MODULES.md`, and any
> sprint plan. Where this document and the code disagree, **the code is wrong and must
> converge** — this file describes the architecture AcademyOS is *committed to becoming*,
> not a snapshot of what exists today.
>
> **The Amendment Rule:** An architectural change updates *this document first*, in the
> same pull request that changes the code. No exceptions. A PR that changes a load-bearing
> architectural fact without amending this file is, by definition, drift and must be rejected.

---

## 0. How to Use This Document

### 0.1 Authority hierarchy

```
ARCHITECTURE.md  (this file — permanent law)
   └─ Engineering Constitutions (§8)        — domain charters, all subordinate to this file
        └─ CURRENT_BUILD_TARGET.md          — what we build next, must conform to the above
             └─ Sprint plans / code         — implementation, may lag but may never contradict
```

If any lower document contradicts this one, this one wins and the lower document is stale.

### 0.2 The four labels

Every architectural statement in this document is tagged so intent is never ambiguous:

| Label | Meaning |
|---|---|
| 🔒 **LOCKED LAW** | Permanent. May only change via the Amendment Rule. Violating it is a defect. |
| 🟢 **CURRENT IMPLEMENTATION** | What the code does today that already conforms to the law. |
| 🔴 **CURRENT DEVIATION** | Where today's code violates the law. A convergence debt, not a precedent. |
| 🛠️ **REQUIRED CONVERGENCE** | The work that retires a deviation. Tracked here until done. |

**A deviation is never a license.** New code may not copy a deviation "because the rest of the
codebase does it that way." The law is the standard; the deviation is the backlog.

### 0.3 Implementation may lag; it may never contradict

This document deliberately describes target state. Sections carry explicit *Current deviation* notes
so the file doubles as a **convergence checklist**. When a deviation is retired, move its line from
🔴 to 🟢 and delete the 🛠️ entry. The document is healthy when the 🔴 list shrinks every quarter.

---

## 1. Vision

### 1.1 AcademyOS mission

AcademyOS is a **director-led, voice-capable operating system for sports academies.** It exists to
let a director run the entire academy — players, coaches, curriculum, sessions, assessments, parent
communication — as one coherent operating loop, where intent is captured by voice or text, confirmed
in the UI, structured in the database, and executed by the system.

> 🔒 **LOCKED LAW — Operating Model:** *Voice creates → UI confirms → Database structures → System executes.*
> Nothing mutates core academy data except through this loop.

### 1.2 DONNA mission

DONNA is the academy's **executive operating partner** — a continuous COO relationship, not a chat
session. DONNA maintains situational awareness, recommends the next action, and guides the director
to completion. DONNA proposes; humans approve; the system executes.

> 🔒 **LOCKED LAW — DONNA is an operating partner, not a chatbot.** Every interaction resumes an
> executive operating relationship; DONNA never "answers and leaves."

### 1.3 Deep System. Calm Surface.

The complexity of AcademyOS lives in the engine — context resolution, routing, curriculum
intelligence, tenant isolation. The **surface stays quiet**: few screens, one inbox, one canonical
action per intent, no cognitive overload. Depth is earned by the system, never paid by the user.

> 🔒 **LOCKED LAW:** Surface area is a cost. A feature that adds a screen, a nav item, or a second
> way to do one thing must justify the surface it spends. When in doubt, the surface stays calm.

### 1.4 DONNA owns verbs. Pages own nouns.

This is the load-bearing law of the entire interaction model.

- **Pages own nouns** — the data objects (a player, a template, a session, a curriculum level).
  A page is where you *view and edit* a noun. Creation, editing, saving, and completion of a noun
  happen on its page.
- **DONNA owns verbs** — the actions across nouns (recommend, prioritize, draft, explain, guide,
  navigate). DONNA prepares drafts and routes you to the page that owns the noun; DONNA never becomes
  the editor.

> 🔒 **LOCKED LAW:** DONNA guides, drafts, explains, and navigates. DONNA never renders the canonical
> editor for a noun and never performs CRUD from the sidebar. The page that owns the noun owns its
> mutation. (See §5.5, §10.)

---

## 2. Core Principles

Each principle is a law, with its rationale and how it is enforced.

### 2.1 Single source of truth
> 🔒 **LOCKED LAW:** Every domain has exactly one canonical owner — one nav config, one LLM client,
> one context builder, one memory store, one router, one builder per workflow. Two implementations of
> one concept is a defect, not a style choice.
- **Rationale:** Duplication means every fix must be applied N times; the system becomes unfalsifiable
  and unmaintainable.
- **Enforced by:** the "one source of truth per domain" guardrail (§10) and architecture certification.

### 2.2 Reuse before build
> 🔒 **LOCKED LAW:** Before creating a module, find the existing one. Convergence is by *reuse and
> deletion*, never by adding a parallel "canonical" layer on top of the old one.
- **Rationale:** AcademyOS's dominant historical failure mode is accretion — new canonical layers
  added without deleting predecessors.
- **Enforced by:** the Converge-by-Deletion rule (§8.1) — a new canonical module deletes or
  `@deprecated`-greps its predecessor in the same PR.

### 2.3 Fail closed
> 🔒 **LOCKED LAW:** Every security, permission, and safety decision defaults to *deny*. Missing role
> → least privilege. Missing key → safe fallback. Unknown route → no access. A failure never opens a door.
- **Enforced by:** middleware (`role ?? 'player'`, default-deny), kill switches (safe-off), the
  Security Constitution (§8.5).

### 2.4 Approval by default
> 🔒 **LOCKED LAW:** AI proposes → Director/Head Coach approves → System records → System executes.
> Core academy data is mutated only through the `proposed_actions` pipeline and
> `execute_approved_action()`. No AI path writes academy data directly.
- **Enforced by:** the approval-pipeline certification (§9), the `proposed_actions` validator.

### 2.5 Evidence over assumption
> 🔒 **LOCKED LAW:** Every claim, recommendation, KPI, and DONNA answer must trace to real data with
> provenance. Demo/seed data is labeled. Fabricated or unsourced certainty is prohibited.
- **Enforced by:** the trust-data guard, demo/live separation (§10), memory provenance (§5.6).

### 2.6 Conversation first
> 🔒 **LOCKED LAW:** The primary interface to the operating system is conversation (voice or text)
> that resolves to structured action — not a forest of forms. Forms exist to *confirm* structured
> intent, not to be the primary input.

### 2.7 Answer first. Evidence second.
> 🔒 **LOCKED LAW:** DONNA leads with the answer/recommendation, then offers the evidence. The
> director gets the decision-relevant conclusion first; the supporting data is available but never
> required to extract the point.

### 2.8 Charts are evidence, never navigation.
> 🔒 **LOCKED LAW:** A chart, KPI, or visualization is *evidence for a decision* — it is never the
> primary way to navigate or act. Action lives in the Approvals loop and on noun pages. A user must
> never have to read a chart to find the thing they need to do.

---

## 3. System Architecture

### 3.1 Target-state diagram

```
                ┌──────────────────────────────────────────────────────────┐
   Middleware   │  Auth + role (fail-closed) · covers ALL routes incl. /api │
                └──────────────────────────────────────────────────────────┘
   ┌───────────────┐  ┌──────────────────┐  ┌───────────────────────────────┐
   │ Role portals  │  │  One Nav Config  │  │   Design System (tokens only) │
   │ dir/coach/    │  │  (single source) │  │   <Card>, guardian-enforced   │
   │ player/parent │  └──────────────────┘  └───────────────────────────────┘
   └──────┬────────┘
          │ server components → typed Supabase (RLS-scoped, anon key)
          ▼
   ┌───────────────────────  DONNA OPERATING LAYER (one pipeline)  ──────────────┐
   │  resolveContext → classifyIntent(LLM) → buildPrompt → callLLM(one client)   │
   │      → proposeAction → APPROVAL GATE → execute_approved_action()            │
   │  memory store {source, confidence, verified, expires_at}                    │
   └─────────────────────────────────────────────────────────────────────────────┘
          │ all mutations
          ▼
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │  Database (Supabase/Postgres): RLS (SELECT-hoisted) · academy_id everywhere  │
   │  partitioned append tables · HNSW vectors · audit_logs on every mutation     │
   └─────────────────────────────────────────────────────────────────────────────┘

   Cross-cutting: APM/error tracking · structured logs · feature-flag registry ·
   kill switches · CI (lint + db:reset + behavioral certs + tests + secret-scan)
```

### 3.2 Frontend
- 🔒 **LOCKED LAW:** Server-first. Pages are React Server Components that query Supabase directly with
  the RLS-scoped client. Client components are used only where interactivity requires it (forms, live
  controls). Design tokens only — no off-palette colors, no raw card surfaces (use `<Card>`).
- 🟢 **Current implementation:** Most director pages are async server components matching the
  `players/[playerId]` reference; only 5 director pages are `'use client'`, all correctly form-shaped.
- 🔴 **Current deviation:** 241 raw card `<div>`s, 120 off-palette class instances (44 files), 305 hex
  literals. Nav has no enforced single source.
- 🛠️ **Required convergence:** `designSystemGuardian` banning off-palette classes/raw card divs; migrate
  hot files first (`_components/Donna*`, coach execution clients, template-builder cards).

### 3.3 Backend
- 🔒 **LOCKED LAW:** Business logic lives in typed server actions and `src/lib/backend/*`. Every server
  action authenticates the caller, is wrapped in a result guard returning `{ ok, error }`, and never
  throws raw to the client. All DB access is through the typed Supabase query builder (no string SQL).
- 🟢 **Current implementation:** 144 server actions; typed query builder throughout; no raw SQL found.
- 🔴 **Current deviation:** Only ~37% of server actions have try/catch; 50 raw `throw` sites can
  propagate to the client.
- 🛠️ **Required convergence:** a shared `withActionGuard()` wrapper, mandatory across `_actions`.

### 3.4 Database
See §4. 🔒 **LOCKED LAW:** Postgres via Supabase; RLS + `academy_id` on every table; append-heavy
tables partitioned with retention; vectors indexed with HNSW; `audit_logs` on every major mutation.

### 3.5 Workflow engine
- 🔒 **LOCKED LAW:** Every operational loop is `input → proposed_action → approval → execute → audit`.
  One canonical transformation per workflow; no duplicate builders. (See §6.)
- 🔴 **Current deviation:** Two parallel template builders on the same tables; six "needs attention"
  surfaces. (See §6, §10.)

### 3.6 DONNA operating layer
See §5. 🔒 **LOCKED LAW:** One pipeline, one brain, one LLM client. DONNA proposes; it never mutates
academy data outside the approval gate.

### 3.7 Context engine
- 🔒 **LOCKED LAW:** Exactly **one** context builder resolves the operating context for any DONNA turn,
  with a defined precedence (see §5.4). Context is assembled, not re-implemented per surface.
- 🔴 **Current deviation:** ~20 overlapping context engines/packets/resolvers across `lib/donna` and a
  parallel set in `components/assistant`.
- 🛠️ **Required convergence:** collapse to one `resolveContext()`; delete the rest behind deprecation greps.

### 3.8 Memory
See §5.6. 🔒 **LOCKED LAW:** One memory store. Every memory row carries `{source, confidence, verified,
expires_at}`. Unverified LLM-generated content is never retrieved as grounding.

### 3.9 Tool execution
- 🔒 **LOCKED LAW:** One tool/action registry defines what DONNA can do; every tool that mutates academy
  data routes through `proposed_actions` and `execute_approved_action()`.
- 🔴 **Current deviation:** Multiple action registries/dispatchers (`donnaActionRegistry`,
  `directorActionRegistry`, `donnaUIActionRegistry`, `actions/donnaActionRegistry`).
- 🛠️ **Required convergence:** one registry; the others deleted or re-exported from it.

### 3.10 Routing
- 🔒 **LOCKED LAW:** Intent routing is **model-led** — a single LLM classifier returns a typed route
  enum. Keyword fast-paths are permitted only as a latency optimization for the few highest-frequency
  intents, never as the primary mechanism.
- 🔴 **Current deviation:** Routing is 121 hardcoded English `lower.includes(...)` branches in the
  1,941-line `processDonnaMessage.ts`; the LLM is only a fallback.
- 🛠️ **Required convergence:** replace phrase ladders with one LLM intent classifier; keep ≤5 keyword
  fast-paths.

### 3.11 Certifications
See §8.6, §9. 🔒 **LOCKED LAW:** Certifications are **behavioral** — they execute real code and assert
on real outputs. A certification that asserts a hardcoded constant is prohibited.
- 🔴 **Current deviation:** Tautological `CONTRACT.x === true` assertions inflate the certified score;
  all 28 CI-gated certs are DONNA-conversation suites; no DB/RLS/role/PII/browser certs.

---

## 4. Data Architecture

### 4.1 Tenant isolation
- 🔒 **LOCKED LAW:** Every tenant-scoped table has an `academy_id` column. Isolation is enforced by RLS,
  not by application code. RLS predicates that call helper functions **must** wrap them in a scalar
  sub-select — `academy_id = (SELECT auth_academy_id())` — so Postgres hoists them to an InitPlan
  instead of re-evaluating per row.
- 🟢 **Current implementation:** `academy_id` + RLS is the consistent isolation primitive; service-role
  bypass is effectively absent from request paths (1 file vs 649 RLS-scoped call sites).
- 🔴 **Current deviation:** 265 bare `auth_academy_id()` + 250 bare role-helper calls in policies, **0**
  hoisted. This is a 2–100× per-row query tax at scale.
- 🛠️ **Required convergence:** codemod every policy to `(SELECT auth_*())`; add a tenant-isolation cert.

### 4.2 RLS
- 🔒 **LOCKED LAW:** Every table has RLS enabled **and at least one policy.** No deny-all tables. No
  `USING (true)` without a documented "shared reference data" intent comment. Self-scoped policies
  include `academy_id` wherever a user may belong to more than one academy.
- 🔴 **Current deviation:** `guardians` and `player_guardians` have RLS enabled but **zero policies**
  (deny-all); several `donna_*` self-scoped policies key only on `auth.uid()`.
- 🛠️ **Required convergence:** add academy-scoped policies to the two guardian tables; add an
  RLS-coverage cert (every table: RLS on + ≥1 policy).

### 4.3 Permissions
- 🔒 **LOCKED LAW:** Role hierarchy is `academy_director → head_coach/coach → player/parent`. A role
  reaches only its own route segment and data. Parent/player **never** see coach-internal notes,
  transcripts, or observations. Visibility flags (`is_parent_visible`, `is_player_visible`) default `false`.
- 🟢 **Current implementation:** middleware segment gating + `parentSafeResponseRules` + `visibilityControls`.
- 🔴 **Current deviation:** `/api` routes are excluded from the middleware matcher; ≥1 of 6 API routes
  lacks an auth check. No role-permission certification.
- 🛠️ **Required convergence:** per-route API auth + an API-auth cert + a role-permission cert.

### 4.4 Curriculum
- 🔒 **LOCKED LAW:** Curriculum is a versioned **Master Development Spine** (global reference) cloned/
  overlaid per academy. The global spine is tenant-isolated at read time; academy overrides never mutate
  the global spine. One curriculum model — no parallel duplicates.
- 🔴 **Current deviation:** acknowledged P0 multi-tenant RLS exposure on the global spine (deferred in
  prior build targets) and model duplication noted in the curriculum audit.
- 🛠️ **Required convergence:** harden global-spine RLS; collapse duplicate curriculum models.

### 4.5 Templates
- 🔒 **LOCKED LAW:** A template is a reusable plan owned by its template page. There is **one** class-
  template builder and **one** fitness-template builder. `template_blocks` is a distinct table from
  `session_blocks` and they are never merged.
- 🟢 **Current implementation:** `template_blocks`/`session_blocks` (and their `*_block_exercises`
  children) are correctly four separate tables.
- 🔴 **Current deviation:** Two parallel template builders — `templates/class|fitness/*` (DONNA-registry-
  only) vs the canonical `class-templates`/`fitness/templates`.
- 🛠️ **Required convergence:** delete the `templates/class|fitness` tree; repoint registry refs.

### 4.6 Sessions
- 🔒 **LOCKED LAW:** A session is an instance derived from a template (Template → Session is one canonical
  transformation). Session execution and actuals persist to the database, not only to client state.
- 🔴 **Current deviation:** Coach session block status persists to `localStorage`, not `session_blocks`
  (no status column); session actuals write only to `sessions.session_notes`.
- 🛠️ **Required convergence:** `session_blocks.status` column + a server action; a normalized
  `session_actuals` table.

### 4.7 Assessments
- 🔒 **LOCKED LAW:** Assessments are evidence-bearing records (`assessment_events`, `player_evidence_records`)
  feeding gate status. Gate progression and player level movement are **explicit director actions** —
  never automatic.
- 🟢 **Current implementation:** gate evidence writes to `player_gate_status` + `audit_logs`; no
  auto-promotion.

### 4.8 Parents
- 🔒 **LOCKED LAW:** Parents see only parent-safe, approved, sourced content via the guardian→player
  mapping. No internal coach content reaches the parent portal through any path.
- 🔴 **Current deviation:** `player_guardians` deny-all RLS (see §4.2) may force parent reads through
  non-standard paths.

### 4.9 Players
- 🔒 **LOCKED LAW:** The Player Profile is the central student object. **Players are minors** — their data
  is governed by the Minor Data Protection standard (§8.5): documented lawful basis, retention limits,
  and least-exposure defaults.
- 🔴 **Current deviation:** No privacy/COPPA/minor-data governance document exists; controls live in code
  with no governing standard.
- 🛠️ **Required convergence:** author the Minor Data Protection Standard; bind `parentSafeResponseRules`
  + `visibilityControls` + retention to it; add a minor-data visibility cert.

### 4.10 Coaches
- 🔒 **LOCKED LAW:** Coaches operate sessions and capture wrap-ups with minimal friction; coach-internal
  observations are private to staff until a director approves any parent/player-facing derivative.
- 🟢 **Current implementation:** coach wrap-up → `voice_notes` → director review; parent/player isolation verified.

---

## 5. DONNA Architecture

### 5.1 Executive Operating Layer
- 🔒 **LOCKED LAW:** DONNA is **one pipeline, one brain**:
  `resolveContext → classifyIntent(LLM) → buildPrompt → callLLM(one client) → proposeAction →
  approvalGate → execute_approved_action()`. Every entry point (floating widget, `/director/donna`,
  coach, voice, page panels, server actions) runs this same pipeline.
- 🔴 **Current deviation:** ~4 parallel brains — Anthropic `orchestrate()`, the OpenAI
  `processDonnaMessage` (1,941 lines, mostly exercised by certs), a strategic path, and a separate
  `components/assistant` stack the UI button actually uses.
- 🛠️ **Required convergence:** pick one brain; deprecate and delete the others; the ~580 redundant
  `lib/donna` files collapse to ~15–25.

### 5.2 Conversation ownership
- 🔒 **LOCKED LAW:** DONNA owns the conversation as a continuous executive relationship. Every interaction
  resumes the relationship (Operating Law: "never answer and leave"); there is one greeting/resume
  composer, not many.

### 5.3 Page ownership
- 🔒 **LOCKED LAW:** Pages own nouns and their editing. DONNA prepares drafts and navigates the director
  to the owning page; the **page** owns creation, edit, save, and completion. (See §1.4, §10.)

### 5.4 Workflow ownership & Context hierarchy
- 🔒 **LOCKED LAW:** Context is resolved by one builder with a fixed precedence:
  `explicit user intent → active page/noun → operating session/memory → academy reality snapshot →
  global defaults`. The RealitySnapshot (live academy facts) is the source of truth; refinement,
  completion, and presence layers are presentation-only and may never alter facts, recommendations,
  `requiresApproval`, `action`, or navigation.
- 🟢 **Current implementation:** RealitySnapshot + completion/presence layers are additive and fail-safe.
- 🔴 **Current deviation:** multiple competing context resolvers (see §3.7).

### 5.5 Guidance vs editing
- 🔒 **LOCKED LAW:** DONNA **guides** (recommends, drafts, explains, previews, navigates). DONNA never
  becomes the canonical editor and never performs CRUD from the sidebar. Page-owned workflows are never
  rendered as sidebar collectors. (Enforced by the `executiveWorkspaceGuardian` and the Executive
  Interaction Constitution, §7.)
- 🟢 **Current implementation:** `executiveWorkspaceGuardian` + `executiveWorkspace.baseline.json` enforce
  sidebar containment in CI (the one wired guardian).

### 5.6 Draft persistence
- 🔒 **LOCKED LAW:** Drafts are page-owned and session-scoped. DONNA-prepared drafts persist so a director
  can resume; they never become live data without passing the approval gate.

### 5.7 Tool orchestration
- 🔒 **LOCKED LAW:** One tool/action registry (§3.9). Every mutating tool routes through `proposed_actions`.
  DONNA's own writes target only DONNA-owned tables (memory, summaries, events), never academy domain tables.

### 5.8 OpenAI / model boundary
- 🔒 **LOCKED LAW:** There is **one** server-side LLM client. Provider and model come from configuration
  (model-agnostic). Every call has retry, timeout, a token/cost budget, usage logging, and a kill switch.
  **No code may `fetch` an LLM provider URL directly.** Secrets are server-only (never `NEXT_PUBLIC_`).
- 🟢 **Current implementation:** `llmApiClient.ts` (Anthropic) has retry/timeout/token-cap; secrets are
  server-only.
- 🔴 **Current deviation:** ≥5 ungoverned LLM call sites across **two** providers (raw `fetch` to OpenAI
  in 3 files + the Anthropic client); model IDs hardcoded in ≥7 files; only one path logs usage.
- 🛠️ **Required convergence:** one LLM client module; lint rule banning provider `fetch`; LLM-governance cert.

---

## 6. Workflow Architecture — Canonical Operational Loops

> 🔒 **LOCKED LAW for all loops:** `input → proposed_action → approval → execute_approved_action() → audit_logs`.
> Exactly **one canonical transformation per workflow.** No duplicate builders. No second confirm UI for
> the same DB action.

### 6.1 Onboarding
Director onboarding (`/director/onboarding/*`) is the single canonical flow (interview → programs/groups →
players/placement → level-gates → coaches/permissions → curriculum). Player onboarding
(`players/[playerId]/onboard`, `onboarding-review`, `development-intake`) is a distinct, legitimate flow.
🔴 *Deviation:* `/director/setup` is a dead redirect alias → delete.

### 6.2 Curriculum
One curriculum hub (`/director/curriculum`) with builder (canonical), map, guided, learning as sub-views.
🔴 *Deviation:* `curriculum/academy-version` orphan; nav points inconsistently (hub vs `/builder`). 🛠️ verify/fold; one nav target.

### 6.3 Template → Session
One canonical transformation from a template to a session instance.
🔴 *Deviation:* two template builders (§4.5). 🛠️ delete the duplicate tree; one builder per template type.

### 6.4 Coach Execution
Coach executes a session; block status and actuals persist to the database.
🔴 *Deviation:* block status persists to `localStorage` (§4.6). 🛠️ `session_blocks.status` + server action.

### 6.5 Coach Wrap-up
Guided wrap-up captures recap → `voice_notes` → structured draft → director review. Minimal friction;
coach-internal until director approves any parent-facing derivative.
🔴 *Deviation:* two coexisting recap UIs (Quick Note + Wrap-Up) create duplicate `voice_notes`. 🛠️ de-duplicate or clearly separate modes.

### 6.6 Assessments
Evidence records feed gate status; gate progression and level movement are explicit director actions (§4.7).

### 6.7 Approvals
> 🔒 **LOCKED LAW:** There is **one** "needs attention" surface — **Approvals** (`/director/review`). All
> proposed actions, suggestions, and exceptions converge there.
🔴 *Deviation:* six competing surfaces (`review` + `attention` + `signals` + `alerts` + `ai-suggestions` +
`improvement`). 🛠️ keep `review`; delete `alerts`; fold the rest into Approvals or Academy Health.

---

## 7. Executive Interaction Constitution (governing reference)

The locked **`docs/ux/ACADEMYOS_EXECUTIVE_INTERACTION_CONSTITUTION_V1.md`** governs all executive-surface
interaction and is incorporated here by reference. Its load-bearing laws — restated as 🔒 LOCKED LAW:

- The **page owns the work**; the **sidebar explains, previews, and navigates** — it never executes.
- Page-owned workflows are never rendered as sidebar collectors.
- DONNA presents Opinion · Tradeoff · Memory · Proactive by default, without magic phrases, and never
  alters facts or recommendations in its presentation layers.

🟢 **Current implementation:** enforced in CI by `executiveWorkspaceGuardian`.
🛠️ **Required convergence:** wire the *prose* UX/conversational constitutions
(`ACADEMYOS_UX_CONSTITUTION_V1`, `ACADEMY_INTERFACE_QUALITY_STANDARD`, `DONNA_UI_CONSTITUTION`,
`DONNA_CONVERSATIONAL_QUALITY_STANDARD`) to guardians/certs — they currently have no code teeth.

---

## 8. Engineering Constitutions

Each is a binding charter subordinate only to this document. Each names its enforcement mechanism.

### 8.1 Architecture Constitution
- 🔒 **Converge by deletion:** a new canonical module deletes or `@deprecated`-greps its predecessor in
  the same PR. No new "canonical" layer without removing the old one.
- 🔒 **One source of truth per domain** (§2.1).
- 🔒 **No duplicate builders; one canonical transformation per workflow** (§6).
- **Enforced by:** architecture certification + code review standard.

### 8.2 Executive Interaction Constitution
Governed by §7 and the locked V1 document. **Enforced by:** `executiveWorkspaceGuardian`.

### 8.3 DONNA Operating Constitution
- 🔒 One pipeline, one brain, one LLM client (§5.1, §5.8).
- 🔒 DONNA proposes; never mutates academy data outside the approval gate (§2.4, §5.7).
- 🔒 Memory carries provenance + TTL; unverified LLM content is never grounding (§5.6, §3.8).
- 🔒 Routing is model-led (§3.10).
- **Enforced by:** routing-constitution cert (exists), approval-pipeline cert, LLM-governance cert (new).

### 8.4 Database Constitution
- 🔒 RLS + `academy_id` on every table; predicates hoisted (`(SELECT auth_*())`).
- 🔒 Migrations are idempotent **and** reversible (paired down-script); seeds live in a separate path,
  never interleaved with schema; no fix-on-fix in production (squash pre-prod).
- 🔒 Append-heavy tables are partitioned with retention; vectors use HNSW; every major mutation writes `audit_logs`.
- **Enforced by:** migration-integrity cert + `db:reset` in CI + type-gen drift check.

### 8.5 Security Constitution
- 🔒 Fail closed everywhere (§2.3); **all** routes authenticated including `/api`.
- 🔒 Secrets server-only; no `NEXT_PUBLIC_` on sensitive values; no committed keys.
- 🔒 Service-role/RLS-bypass client is prohibited in request paths except where it validates `academy_id`
  explicitly and is documented.
- 🔒 **Minor Data Protection:** players are children — documented lawful basis, data-retention policy,
  least-exposure defaults, and parent/player content isolation are mandatory.
- **Enforced by:** API-auth cert, secret-scan in CI, minor-data visibility cert, tenant-isolation cert.

### 8.6 Certification Constitution
- 🔒 Certifications are **behavioral** — they execute real code and assert real outputs. Asserting a
  hardcoded constant (`CONTRACT.x === true`) is prohibited and must be deleted.
- 🔒 The certified set must cover the red lines: tenant isolation, RLS coverage, role permissions, API
  auth, demo/live, approval pipeline, migration integrity, LLM governance, minor-data visibility — not
  only DONNA conversation quality.
- **Enforced by:** the CI gate (§9) and code review.

---

## 9. Certification Requirements

> 🔒 **LOCKED LAW — every sprint must:**
> 1. Pass `tsc --noEmit`.
> 2. Pass the certification suite (behavioral; no tautologies).
> 3. **Preserve every constitution** in this document — no PR weakens a law.
> 4. Add **no duplicate architecture** (no second builder, router, context engine, nav, memory store).
> 5. **When fixing a regression, add a regression test** that fails before the fix and passes after.

**Target CI gate sequence** (current gate in 🟢; additions in 🛠️):

```
🟢 type-check
🛠️ lint                       (defined but currently ungated)
🟢 guard                      (expand from 1 → 6 guardians: tenant, demo/live, design, nav, API-auth, cognitive-load)
🛠️ db:reset + RLS/tenant/migration certs   (Postgres service container)
🛠️ type-gen drift = 0
🟢 certify                    (after purging tautologies; add behavioral DB/role/approval/demo/minor-data certs)
🛠️ test                       (Vitest unit + 1 Playwright smoke of the atomic loops)
🛠️ secret-scan
🟢 build
🛠️ live-LLM smoke            (nightly, secret-gated)
```

🔴 **Current deviation:** gate is `type-check → guard(1) → certify(28 DONNA-only) → build`; lint, db,
tests, secret-scan, type-gen drift, and live-LLM smoke are all absent; certified score inflated by
tautologies.

---

## 10. Guardrails (Permanent Rules)

Numbered, permanent, each with its enforcement mechanism. Violating any is a defect.

| # | 🔒 Guardrail | Enforced by |
|---|---|---|
| G1 | Page-owned workflows never render as sidebar collectors | `executiveWorkspaceGuardian` |
| G2 | Page editors stay on pages (the page owns its noun's CRUD) | `executiveWorkspaceGuardian` |
| G3 | DONNA guides; DONNA never becomes CRUD | executiveWorkspaceGuardian + approval cert |
| G4 | No duplicate builders | architecture cert + code review |
| G5 | One canonical transformation per workflow | architecture cert |
| G6 | One source of truth per domain (nav, LLM client, context, memory, router) | architecture cert |
| G7 | No demo/seed data renders without an explicit gate + banner | `demoLiveGuardian` (new) |
| G8 | Design tokens only — no off-palette classes, no raw card divs | `designSystemGuardian` (new) |
| G9 | No `fetch` to an LLM provider outside the one LLM client | lint rule |
| G10 | Every table has RLS + `academy_id`; every API route authenticates | RLS/API-auth certs |
| G11 | Every server action returns `{ ok, error }`; never throws raw to the client | `withActionGuard()` + lint |
| G12 | No demo/diagnostic page ships in the production build without a dev-only flag | `demoLiveGuardian` |

🔴 **Current deviations against guardrails:** G4 (two template builders), G6 (dead `navConfigs.ts` SoT +
3 hardcoded navs; multiple context engines/routers/memories), G7/G12 (demo/diagnostic pages shipped:
`demo`, `pilot-readiness`, `migration-verify`, `donna-coo-demo`, `dev/*`), G8 (token erosion), G9
(provider `fetch`), G10 (`/api` unguarded; deny-all guardian tables), G11 (63% of actions can throw).

---

## 11. Scaling Strategy

### 11.1 10,000 academies
- 🔒 Tenant isolation via hoisted RLS predicates (§4.1); `academy_id`-leading composite indexes; FK columns
  indexed. Middleware role/membership resolved from a **JWT claim**, not a per-request DB round-trip.
- 🔴 *Deviation:* middleware does 2–3 DB queries per request; RLS predicates un-hoisted; ~half of FKs unindexed.

### 11.2 Multi-sport
- 🔒 Sport-specific behavior is **configuration over code** — curriculum packs, prompt packs, assessment
  templates, and feature flags layered over one spine. No sport gets its own code branch.

### 11.3 Model-agnostic AI
- 🔒 One LLM client with provider+model from config (§5.8). Swapping or adding a model/provider is a config
  change, never a code change scattered across files. Model IDs never hardcoded.

### 11.4 Long-term memory
- 🔒 One memory store with `{source, confidence, verified, expires_at}`; director-verified provenance before
  any learning is retrievable as grounding; embeddings indexed with HNSW; retention/TTL enforced.
- 🔴 *Deviation:* ~30 memory modules; LLM "learnings" persisted without enforced provenance/TTL; no ANN index.

### 11.5 Versioning
- 🔒 Curriculum, templates, and schema are explicitly versioned; academy overrides reference a global
  version; migrations are reversible (§8.4).

### 11.6 Observability
- 🔒 Production error tracking + APM (Sentry/OTel) wired into one structured logger with `academy_id` +
  `request_id` correlation. AI telemetry (tokens, latency, provider, fallback rate, cost-per-academy) on
  **every** path. Per-academy SLOs and alerting. A cost dashboard with a hard LLM budget kill switch.
- 🔴 *Deviation:* no APM/error tracking; 566 raw `console.*`; structured logger in 11 files; usage telemetry
  from 1 of 144 actions.

### 11.7 Feature flags
- 🔒 One typed feature-flag registry (`src/lib/flags/`) with startup validation. Kill switches are
  fail-closed (safe-off). No scattered `process.env` reads; no dual-read footguns; no dead flags.
- 🟢 *Current:* kill switches are real and fail-closed. 🔴 *Deviation:* flags are scattered env reads; a
  server/`NEXT_PUBLIC_` dual-read footgun exists; dead `FEATURE_*` vars remain.

---

## 12. Future Evolution

Three explicit registries govern what may change and how.

### 12.1 Locked architecture (changes only via the Amendment Rule)
The operating model (§1.1); approval-by-default pipeline (§2.4); `proposed_actions` +
`execute_approved_action()` + `finalize_player_placement()` as sole mutation paths; RLS + `academy_id` on
every table; `template_blocks` ≠ `session_blocks`; DONNA-owns-verbs/pages-own-nouns (§1.4); one LLM client
(§5.8); one Approvals surface (§6.7); fail-closed security (§2.3); minors'-data protection (§8.5);
behavioral-only certification (§8.6).

### 12.2 Evolving implementation (catching up to this document)
The DONNA pipeline consolidation (4 brains → 1); RLS predicate hoisting; partitioning/retention; nav
consolidation; the six-inbox collapse; the template-builder de-duplication; observability rollout; the
feature-flag registry; the certification rebuild. These are 🔴 deviations on a convergence path — tracked
in this document until retired.

### 12.3 Experimental systems (sandboxed, never load-bearing)
Anything not yet promoted to §12.1 or §12.2 is experimental: it must be flag-gated, must not be a mutation
path for academy data, must not be the single source of truth for any domain, and must be deletable without
breaking a canonical loop. Demo/diagnostic surfaces live here and must be dev-flag-gated (G12).

> 🔒 **Closing law:** Implementation may lag this document; it may never contradict it. When the code and
> this constitution disagree, the code converges. Update this document *before* you change the architecture.
