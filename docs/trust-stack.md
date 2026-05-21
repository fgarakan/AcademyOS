# AcademyOS Trust Stack

> AI proposes. Human approves. System applies. Audit log records. Permissions constrain. Safe defaults protect. Logs explain.

This document defines the trust architecture that governs every data mutation, AI action, and user interaction in AcademyOS. It is the root document of the Trust Stack. All other trust-related docs (`permissions-matrix.md`, `ai-action-safety.md`, `audit-log-strategy.md`, etc.) are derived from the principles here.

---

## What the Trust Stack Is

The Trust Stack is a layered set of runtime guarantees that ensure:

1. No unauthorized actor can mutate academy data.
2. No AI action executes without an approved human decision.
3. Every meaningful mutation is attributable, reversible in the audit log, and explainable.
4. System failures default to the safe state (deny, not allow).

It is not a single file or a single feature. It is the structural discipline applied consistently across every layer of the system.

---

## The Seven-Layer Model

```
┌─────────────────────────────────────────────────────────────────────┐
│  Layer 7 — Logs Explain        (audit_logs, AI call metadata)       │
│  Layer 6 — Safe Defaults       (deny-first, no implicit elevation)  │
│  Layer 5 — Permissions         (RLS, server-side role checks)       │
│  Layer 4 — Audit               (audit_logs write on every mutation) │
│  Layer 3 — System Applies      (execute_approved_action only)       │
│  Layer 2 — Human Approves      (Director or Head Coach confirmation)│
│  Layer 1 — AI Proposes         (DONNA drafts, never executes)       │
└─────────────────────────────────────────────────────────────────────┘
```

Each layer is a hard boundary, not a soft convention. A request that bypasses any layer is a bug, not a shortcut.

---

## Layer 1 — AI Proposes

DONNA (the AI assistant layer) generates structured drafts and proposed actions. DONNA never writes to core data tables directly. All DONNA output is written to `proposed_actions` with `status = 'pending_review'`.

Rules:
- DONNA reads data; it does not update, insert, or delete it (except into `proposed_actions`).
- DONNA output is always tagged with `source = 'donna'` in `audit_logs`.
- DONNA cannot escalate its own permissions or impersonate a role.

See `donna-trust-modes.md` for the full DONNA trust surface.

---

## Layer 2 — Human Approves

No proposed action transitions from `pending_review` to `approved` without a human actor (Director or Head Coach) explicitly approving it in the UI. Approval is a signed, timestamped event.

Rules:
- Approval is a user action routed through a Server Action; it is never client-side-only.
- The approving user's `profile_id` is stored on the `proposed_actions` row.
- Bulk approval requires the same individual confirmation loop — no "approve all without reading."
- Parents and players cannot approve actions.

---

## Layer 3 — System Applies

The only path from an `approved` proposed action to a real mutation is `execute_approved_action()`. No other code path may execute approved actions.

Rules:
- `execute_approved_action()` is a PostgreSQL function protected by its own permission check.
- The function validates the action type, the actor, and the current `status` before proceeding.
- Execution is idempotent: calling it twice on the same action must produce the same result or reject the second call.

---

## Layer 4 — Audit Log Records

Every meaningful mutation writes a row to `audit_logs`. "Meaningful" means any creation, update, or deletion of data visible to users or that affects their experience.

Rules:
- `audit_logs` is append-only. Rows are never updated or deleted.
- Each log row contains: `actor_id`, `academy_id`, `entity_type`, `entity_id`, `action`, `payload_before`, `payload_after`, `source`, `created_at`.
- AI-sourced mutations include `source = 'donna'` and the `proposed_action_id`.
- Audit log writes must not be conditional on success — they happen in the same transaction as the mutation.

See `audit-log-strategy.md` for the full audit strategy.

---

## Layer 5 — Permissions Constrain

Row-Level Security (RLS) is the enforcement layer that ensures database queries only return and mutate data the calling identity is authorized to see or change.

Rules:
- Every table has RLS enabled. No exceptions.
- RLS policies are the source of truth for access control. Application-layer role checks are defense-in-depth only.
- Service role access (bypasses RLS) is reserved for: seed scripts, validation scripts, cron jobs, and Supabase Edge Functions with explicit justification.
- RLS policies are never modified inline during application development without a migration file.

See `permissions-matrix.md` for the full access surface by role.

---

## Layer 6 — Safe Defaults

When the system cannot determine the correct access decision, it denies. The Trust Stack never fails open.

Rules:
- A missing role claim → deny.
- A missing `academy_id` on a multi-tenant query → deny (never return cross-academy data).
- An unrecognized action type in `execute_approved_action()` → reject, do not no-op silently.
- A failed audit log write → roll back the mutation.
- An unauthenticated request to any non-public route → redirect to `/login`, not a 403 that leaks route structure.

---

## Layer 7 — Logs Explain

Every AI call, every approval event, every execution, and every failure must be reconstructible from the log record alone. A log entry that requires reading source code to understand is insufficient.

Rules:
- Log entries must include enough payload context to understand what changed, for whom, and why.
- AI call logs must record: model, input token count, output summary, latency, and any structured output hash.
- Failures must log the error message and the actor context — not just a generic "error occurred."
- Logs are queryable by `academy_id + entity_type + entity_id` to reconstruct a full history for any object.

See `debuggability-standard.md` for the full observability contract.

---

## What the Trust Stack Is Not

- It is not a user-facing feature. Users never see "the trust stack."
- It is not a performance layer. The Trust Stack adds overhead deliberately — that overhead is the cost of safety.
- It is not complete today. Layers 1–3 are fully implemented. Layers 4–7 are partially implemented. The gaps are documented in `docs/SCALABILITY_COST_CONTROL_AUDIT.md` and the `docs/trust-stack/` roadmap.

---

## Trust Stack Violations

A Trust Stack violation is any of the following:

| Violation | Example |
|---|---|
| AI mutates directly | DONNA writes to `players` without a `proposed_actions` row |
| Approval bypassed | A server action executes an action before status = 'approved' |
| Execution path bypassed | Code calls `UPDATE players SET ...` instead of `execute_approved_action()` |
| Audit log skipped | A session update has no `audit_logs` row |
| RLS missing on new table | A table is created without `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` |
| Cross-academy data leak | A query omits `.eq('academy_id', ...)` |
| Fail-open on auth | A missing session is treated as "public user" instead of redirect |

If you identify a Trust Stack violation, file it as a critical bug. Do not ship workarounds.

---

## Living Document

This document is updated whenever the Trust Stack model changes. All 12 Trust Stack documents reference it as the root. Cross-reference links:

- `permissions-matrix.md` — Layer 5 detail
- `ai-action-safety.md` — Layers 1–3 detail
- `audit-log-strategy.md` — Layer 4 detail
- `feature-flags-and-kill-switches.md` — Layer 6 detail
- `debuggability-standard.md` — Layer 7 detail
- `donna-trust-modes.md` — DONNA surface within Layers 1–2
- `ai-development-rules.md` — Engineering rules for AI features
- `data-classification.md` — What data lives at which trust level
- `cache-and-performance-principles.md` — Trust within caching and performance decisions
- `release-safety-checklist.md` — Pre-release verification gate
- `architecture-index.md` — Full doc index
