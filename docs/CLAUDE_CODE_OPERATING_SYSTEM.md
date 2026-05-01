# Claude Code Operating System — Academy OS

This document explains how to use Claude Code effectively for Academy OS sprints.

---

## What was set up

### Project commands (invokable skills)

Located in `.claude/commands/`. Each file becomes a `/command-name` slash command.

| Command | File | Purpose |
|---|---|---|
| `/academy-sprint` | `.claude/commands/academy-sprint.md` | Full sprint execution workflow |
| `/academy-guardrails` | `.claude/commands/academy-guardrails.md` | Product safety checklist |
| `/supabase-sprint` | `.claude/commands/supabase-sprint.md` | Supabase-specific sprint protocol |
| `/review-queue-workflow` | `.claude/commands/review-queue-workflow.md` | proposed_actions patterns |
| `/voice-workflow` | `.claude/commands/voice-workflow.md` | Voice-first workflow patterns |

### Subagents

Located in `.claude/agents/`. These are read-only specialist agents you can ask Claude to spawn during a sprint.

| Agent | File | Purpose |
|---|---|---|
| `schema-auditor` | `.claude/agents/schema-auditor.md` | Read-only DB schema review |
| `guardrail-auditor` | `.claude/agents/guardrail-auditor.md` | Read-only product safety review |

### Rules loaded automatically

`CLAUDE.md` is loaded at the start of every Claude Code session. It now contains:
- Session start protocol
- Sprint execution protocol
- Git hygiene rules
- Security and product guardrails
- Protected files list
- TypeScript validation requirement
- Available commands reference

---

## Running a sprint

### Standard single sprint

```
/academy-sprint Sprint 43 — Voice Attendance Exception Drafts V1
```

Claude will:
1. Read all required docs
2. State a plan and wait for confirmation
3. Implement only the confirmed files
4. Run TypeScript check
5. Update CHANGELOG.md
6. Provide `git add` and commit message
7. Stop — waiting for you to confirm commit

### Sprint with Supabase review

If the sprint touches DB queries or schema:

```
/supabase-sprint
/academy-sprint Sprint 46 — Fitness Template Block Exercise Population V1
```

Run `/supabase-sprint` first to load the Supabase-specific rules into context, then `/academy-sprint`.

### Sprint with safety pre-check

To run the guardrail checklist on completed sprint work before committing:

```
/academy-guardrails
```

Run this after `/academy-sprint` has finished but before you say "commit."

---

## Running a batch of sprints

For multiple consecutive sprints in one session:

```
Run Sprints 43, 44, and 45 using /academy-sprint. Stop before commit after each sprint.
Use /academy-guardrails after each sprint before proceeding to the next.
```

Claude will complete one sprint at a time, stop for confirmation after each one. You can then say "continue to the next sprint" or adjust as needed.

---

## Using subagents

### Schema auditor

Ask Claude to run the schema auditor before a sprint that touches DB queries:

```
Before we start Sprint 46, run the schema-auditor agent to confirm no migration is needed.
```

Claude will spawn a read-only agent that inspects migrations, types, and the planned queries, then report whether the sprint can proceed without schema changes.

### Guardrail auditor

Ask Claude to run the guardrail auditor after a sprint completes:

```
Run the guardrail-auditor agent on the Sprint 49 changes before we commit.
```

Claude will spawn a read-only agent that checks for parent/player visibility leaks, automatic mutations, missing audit trails, and other safety violations.

---

## Commit strategy

Claude will never commit automatically. After each sprint:

1. Claude provides the exact `git add` command (listing files by name — never `git add .`)
2. Claude provides the exact commit message
3. You review and say "commit" if satisfied
4. Claude runs the commit

Commit message format: `Sprint NN — Short description`

### What to do if TypeScript fails

Claude will fix only errors in files it touched. If there are pre-existing TypeScript errors in other files, Claude will note them but will not fix them (doing so would be scope creep). You can run a separate "fix TS errors" session if needed.

---

## Stop conditions

Claude must stop and wait for your input when:
- The plan has been stated (before any code is written)
- TypeScript check is complete (before CHANGELOG update or commit suggestion)
- Sprint report is complete (before git add is run)
- Any sprint requires a migration (database schema change)
- Any sprint requires a package install
- Any ambiguous scope is discovered mid-sprint
- A protected file would need to be touched

---

## Git hygiene rules

Always enforced:
- `git add` lists specific files by name — never `git add .` or `git add -A`
- Unrelated modified files are never staged
- Commits happen only on explicit user instruction
- No force-push, no `--no-verify`

---

## Protected files and directories

Never touched without explicit sprint permission:

```
.env.local
src/lib/supabase/database.types.ts
supabase/migrations/*
index.html
data/airtable-import/reports/*
data/airtable-import/*.csv
.next/
node_modules/
```

---

## Example sprint sequence

For Sprints 43–45 (attendance exception workflow):

```
/academy-sprint Sprint 43 — Voice Attendance Exception Drafts V1
```

Claude states plan → you confirm → Claude implements → TypeScript passes → Claude stops.

You review the output, then:

```
/academy-guardrails
```

Claude runs safety checklist. If PASS:

```
commit
```

Claude runs `git add` and commit. Then:

```
/academy-sprint Sprint 44 — Attendance Exception Director Review Queue V1
```

Repeat for each sprint.

---

## Updating this system

If you want to change sprint behavior:
- Edit `.claude/commands/academy-sprint.md` to change the execution workflow
- Edit `.claude/commands/academy-guardrails.md` to add/remove safety checks
- Edit `CLAUDE.md` to change session-wide rules
- Edit `.claude/agents/schema-auditor.md` or `guardrail-auditor.md` to change subagent behavior

Changes take effect immediately in the next Claude Code session.
