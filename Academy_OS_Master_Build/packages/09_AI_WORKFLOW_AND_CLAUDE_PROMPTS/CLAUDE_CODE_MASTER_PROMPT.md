# CLAUDE CODE MASTER PROMPT
**Use this at the start of every Claude Code session working on Academy OS**

---

## Session startup prompt

```
Read the following files and confirm you understand the current state:

1. Academy_OS_Master_Build/ACADEMY_OS_MASTER_ORG.md
2. Academy_OS_Master_Build/MISSING_ITEMS_AND_DECISIONS.md
3. Academy_OS_Master_Build/BUILD_ORDER.md

Then tell me:
- Current build phase
- Top 3 open decisions blocking V1
- What you recommend working on today

Do not start building until I confirm the task.
```

---

## Locked architecture rules (include in every session)

```
LOCKED RULES — enforce these in every response:

1. Voice never directly mutates core data.
   Always: voice → transcript → intent → proposed action → approval → execution → audit

2. Human approval is required before any action executes.
   AI recommends. Humans decide. Always.

3. Template default order ≠ session runtime order.
   Changing a session block does NOT change the template.

4. RLS must exist on every table. No table without row level security.

5. All changes must write audit_logs with source_type.

6. Never skip the proposed_actions pipeline for voice commands.

7. Use Manus UI as default reference: https://angles-os-mbgpiq3v.manus.space/
   Match it unless there is a specific reason to diverge.

If you are about to do something that violates these rules, stop and ask.
```

---

## Task execution prompt template

```
Context:
- We are building: [feature name]
- Package reference: packages/[XX_PACKAGE_NAME]/[FILE.md]
- Current phase: Phase [N] — [phase name]

Task:
[Specific task description]

Rules:
- Respect locked architecture (voice pipeline, approval, audit log)
- Match Manus UI reference where applicable
- Write full files when editing code (no partial edits to SQL)
- Update relevant package README and CHANGELOG after changes
- Test after any schema change

Do not:
- Add features beyond what is specified
- Skip approval flows
- Bypass RLS
- Assume unresolved decisions are resolved

Output expected:
[SQL migration / TypeScript file / React component / documentation]
```

---

## NO DRIFT RULES

These rules must be followed in every session:

**Never:**
- Allow voice input to directly create/modify database records without going through the proposed_actions pipeline
- Merge template_blocks and session_blocks (they are separate by design)
- Skip audit_logs for placement, voice, or major state changes
- Build parent portal features in V1 (deferred to V2)
- Assume multi-academy is needed in V1 (deferred to V3, but add academy_id columns)
- Remove `voice_command_id` columns from tables that might be voice-triggered

**Always:**
- Add `academy_id` to every new table
- Add `created_by` and `updated_by` to every entity table
- Use `update_updated_at()` trigger on every table with `updated_at`
- Check `MISSING_ITEMS_AND_DECISIONS.md` before assuming something is decided
- Reference Manus UI for every screen you build

---

## Daily build prompt

```
Today's task: [describe what you want to build]

Start by:
1. Confirming this is in Phase [N] build order (BUILD_ORDER.md)
2. Reading the relevant package spec
3. Checking MISSING_ITEMS_AND_DECISIONS.md for anything blocking this task
4. Showing me your implementation plan before writing code

Then build it. After building:
5. Update the relevant package README (status: Draft → In Progress)
6. Add entry to DATABASE_CHANGELOG.md if schema changed
7. Write tests or acceptance criteria
```

---

## Frontend build prompt

```
Build the [screen name] screen for Academy OS.

Design reference: https://angles-os-mbgpiq3v.manus.space/
Also reference: app.html in the repo root (functional prototype showing exact interactions)

Spec reference: packages/08_UI_UX_WIREFRAMES_AND_SCREEN_SPECS/[SCREEN_SPEC.md]

Requirements:
- Match Manus dark premium OS design language
- Desktop: split-pane layout where appropriate
- Mobile: separate simplified flow
- Include loading, empty, and error states
- All CTAs must be clear
- Status indicators must be visible

Data:
- Use Supabase client for all queries
- Apply RLS-appropriate queries (see Package 02)
- Never expose service role key on client

Voice integration point:
- "Tell the OS" button in top nav routes to voice command screen
- Approval actions must use proposed_actions pattern
```

---

## Schema review prompt

```
Review this SQL migration for Academy OS.

Check for:
1. Missing academy_id column
2. Missing RLS policy
3. Missing audit log integration
4. Missing updated_at trigger
5. Any direct mutation that should go through proposed_actions
6. Any table that needs voice_command_id
7. Foreign key constraints correct
8. Indexes on frequently queried columns

Reference: packages/02_DATABASE_AND_SUPABASE_SCHEMA/ for pattern

Flag issues. Do not fix silently.
```
