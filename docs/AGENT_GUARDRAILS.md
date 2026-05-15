# Agent Guardrails — AcademyOS

Rules that apply to every agent, every sprint, every session. No exceptions without explicit human approval in the sprint prompt.

**Last updated:** 2026-05-15

---

## Core Operating Model

> AI proposes → Director/Head Coach approves → System records → System executes

**DONNA is the assistant. Never use DANA.**

Every agent must operate within this model. No agent takes unilateral action that bypasses director approval on production data.

---

## Architecture Red Lines

These rules may never be crossed without explicit sprint approval. They exist in `docs/AI_BACKEND_RULES.md` and are repeated here.

| Red line | Why |
|---|---|
| Voice never directly mutates core data | All voice actions go through the `proposed_actions` pipeline |
| `template_blocks` and `session_blocks` are separate tables | Merging them would corrupt the template/session boundary |
| All tables have RLS | No table is created without a policy; no query bypasses RLS |
| `finalize_player_placement()` is the only player activation RPC | All other level writes are blocked |
| `execute_approved_action()` is the only execution path for approved actions | Bypass means unaudited mutations |
| All major mutations write to `audit_logs` | No silent state changes |

---

## Forbidden Files

No agent may modify these files unless the sprint prompt explicitly names them:

```
.env.local
src/lib/supabase/database.types.ts   (only updated via `supabase gen types`)
supabase/migrations/*                (only added when sprint explicitly allows a migration)
index.html
data/airtable-import/reports/*
data/airtable-import/*.csv
.next/
node_modules/
package.json
package-lock.json
```

---

## Never Do Without Explicit Sprint Approval

| Action | Risk |
|---|---|
| Install npm packages | Breaks lockfile; introduces untested dependencies |
| Create or modify database migrations | Schema changes are irreversible |
| Create tables without RLS | Data exposure risk |
| Use service role or bypass RLS in any query | Security breach |
| Expose parent/player data to unauthorized roles | Privacy violation |
| Trigger automatic player level movement | Level advancement requires director approval |
| Make external AI API calls | Unexpected cost and latency |
| Send communications (email, push, SMS, Slack) | Cannot unsend |
| Present fake/seed data as real | Data integrity violation |
| Hide mutations (bypass `proposed_actions` or `audit_logs`) | Audit failure |

---

## Stop-and-Ask Triggers

Any agent must stop and ask the human before proceeding when:

1. **Scope creep** — the task requires touching a file not named in the confirmed plan
2. **Locked module** — the task requires modifying a file listed in `docs/LOCKED_MODULES.md`
3. **Missing dependency** — a required server action, type, or migration does not exist
4. **Red line approach** — any implementation path would cross an architecture red line
5. **Ambiguous data model** — the correct table or column is unclear from the types
6. **Migration implied** — completing the task correctly requires a schema change
7. **Prior sprint regression** — implementing the task would break a feature from a prior sprint
8. **Auth/RLS gap** — the data query does not have a clear RLS policy to rely on

---

## Commit Rules

1. Never `git add .` or `git add -A` — stage only sprint-specific files by name
2. Never stage unrelated modified or untracked files
3. Never commit without explicit human instruction ("commit")
4. Never push unless the human explicitly asks to push
5. Never amend a published commit
6. Never force-push
7. Never bypass hooks (`--no-verify`)
8. Commit message format: `Sprint NN — Short description`
9. Co-author line (optional but standard): `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

---

## TypeScript Gate

Every sprint that touches source code must end with a clean TypeScript check:

```bash
npx tsc --noEmit
```

Do not mark a sprint complete while TypeScript errors exist in files touched by the sprint. Fix only errors caused by sprint changes — do not fix pre-existing errors in unrelated files unless the sprint explicitly includes a TypeScript cleanup task.

---

## DONNA Naming Rule

The executive assistant is named **DONNA**. Never write **DANA** in any file, comment, variable name, string, or document. If you see "DANA" in existing code, do not fix it unless the sprint explicitly includes a rename task — log it as a known issue instead.

---

## Design System Rules

All UI must match the implemented design system in `tailwind.config.ts` and `src/app/globals.css`. Do not use colors or tokens from `Academy_OS_Master_Build/packages/08_UI_UX_WIREFRAMES_AND_SCREEN_SPECS/DESIGN_SYSTEM.md` — those are from a different version and do not match.

| Token | Value | Correct use |
|---|---|---|
| `base` | `#0A0A0A` | Page background |
| `surface` | `#111111` | Card background |
| `lime` | `#C8FF00` | Primary accent, active states |
| `text-primary` | `#FFFFFF` | Headlines |
| `text-secondary` | `#AAAAAA` | Body |
| `text-muted` | `#555555` | Labels, meta |

Use `<Card>` from `src/components/ui` — never raw divs for card surfaces.

---

## Stale Docs Rule

Do not treat `Academy_OS_Master_Build/generated/` docs as current truth. Those were written before the app existed. Verify against actual files in `src/`.

---

## Source-of-Truth Hierarchy (Sprint 385+)

For screen definitions and build order, the Sprint 385 docs are source of truth:

1. `docs/PROTOTYPE_SCREEN_ADOPTION_MAP.md`
2. `docs/DONNA_SCREEN_CAPABILITY_MAP.md`
3. `docs/ROLE_ROUTE_MAP.md`
4. `docs/MODULE_MATURITY_MAP.md`
5. `docs/SCREEN_BACKEND_READINESS_MAP.md`

When any of these conflict with older documents (e.g., `BUILD_ORDER.md`, `UI_SCREEN_MAP.md`, `DATA_FLOW_MAP.md`), the Sprint 385 docs win.

---

*Last updated: Sprint 385.5*
