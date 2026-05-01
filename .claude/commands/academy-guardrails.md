# Academy Guardrails

Run this checklist before any commit or before declaring a sprint complete.

---

## Product operating model

Confirm every significant mutation follows:

> Voice/AI proposes → Director/Head Coach reviews → Director approves → System records → System executes

Flag any path where this chain is skipped or shortcut.

---

## Checklist

### Data safety
- [ ] No parent/player data exposed to unauthorized roles (parent sees only their child; player sees only themselves)
- [ ] academy_id scoping verified on every Supabase query (never trust client-provided academy_id)
- [ ] No row returned without an academy_id WHERE clause or RLS policy covering it
- [ ] No service role used in server actions or API routes
- [ ] No RLS bypass (`{ auth: false }` or service key) in new code

### Mutations and audit
- [ ] No hidden mutations — every important state change writes to `proposed_actions` or `audit_logs`
- [ ] Voice/AI-triggered changes create `proposed_actions` rows at `pending_review` status, never auto-apply
- [ ] Player level movement requires explicit director approval — no automatic promotion
- [ ] Evidence application requires approved proposed_actions — no direct upsert from UI
- [ ] `execute_approved_action()` is used for executing approved voice actions (not ad-hoc updates)
- [ ] `finalize_player_placement()` is used for activating players (not ad-hoc updates)

### Proposed actions pattern (when applicable)
- [ ] Draft created at `pending_review`
- [ ] `target_module`, `target_object_type`, `target_object_id` all set
- [ ] `proposed_payload` contains structured intent
- [ ] Duplicate prevention in place (check for existing pending draft before creating)
- [ ] Review card exists in director review queue
- [ ] Approve/Reject/Needs Clarification controls present
- [ ] Apply step is guarded (only runs on `approved` status)
- [ ] Audit log written on apply

### Communications
- [ ] No email, push, SMS, or Slack messages sent automatically
- [ ] No parent/player communications triggered without explicit director approval

### External services
- [ ] No AI API calls (Anthropic, OpenAI, etc.) unless sprint explicitly authorized them
- [ ] No third-party data sent without explicit user action

### Schema and packages
- [ ] No new migrations created unless sprint explicitly allowed them
- [ ] No packages installed or removed
- [ ] `database.types.ts` not manually edited
- [ ] All new tables have RLS enabled

### File scope
- [ ] Only sprint-named files were touched
- [ ] `.env.local` not modified
- [ ] `supabase/migrations/*` not modified (unless sprint allowed)
- [ ] `data/airtable-import/` not modified (unless sprint allowed)
- [ ] `index.html` not modified (unless sprint allowed)
- [ ] No unrelated files in `git status --short`

### TypeScript
- [ ] `npx tsc --noEmit` passes with 0 errors

---

## Output

For each item that fails, state:
- What failed
- Why it is a problem
- What the fix is

If all items pass, confirm:
> Guardrails passed. Sprint is safe to commit.
