# Claude Code Hooks Plan

This document describes recommended hooks for Academy OS. No hooks are currently implemented.

Hooks are shell commands executed by Claude Code in response to events (tool calls, session stops, etc.). They are configured in `.claude/settings.json` or `.claude/settings.local.json`.

See the Claude Code docs for hook configuration: https://docs.anthropic.com/en/docs/claude-code/hooks

---

## Status

**Not implemented.** This is a documentation-only plan. Hooks will be implemented when the team is ready to enforce them automatically. Until then, the rules they would enforce are documented in `CLAUDE.md` and the command skills.

To implement a hook, add it to `.claude/settings.json` under `hooks`. You can also use the `/update-config` skill in Claude Code to configure hooks via settings.json.

---

## Recommended hooks

### 1. Post-edit TypeScript check

**Trigger:** After any file edit (PostToolUse on Write/Edit)
**Purpose:** Catch TypeScript errors immediately after each file change, not just at the end of the sprint.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsc --noEmit 2>&1 | tail -20"
          }
        ]
      }
    ]
  }
}
```

**Note:** This can be noisy during multi-file sprints. Consider enabling only when debugging TypeScript issues.

---

### 2. Protected file warning

**Trigger:** Before any write to a protected file (PreToolUse on Write/Edit)
**Purpose:** Warn before accidentally editing `.env.local`, `database.types.ts`, or migration files.

Protected paths to check:
- `.env.local`
- `src/lib/supabase/database.types.ts`
- `supabase/migrations/*`
- `index.html`
- `data/airtable-import/reports/*`
- `data/airtable-import/*.csv`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "echo $TOOL_INPUT | grep -E '(\\.env\\.local|database\\.types\\.ts|supabase/migrations|index\\.html|airtable-import)' && echo 'WARNING: Attempting to edit a protected file. Confirm this is intentional.' || true"
          }
        ]
      }
    ]
  }
}
```

---

### 3. Git status stop

**Trigger:** Before any commit (PreToolUse on Bash matching `git commit`)
**Purpose:** Run `git status --short` automatically before every commit to confirm staged files are expected.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo $TOOL_INPUT | grep 'git commit' && git status --short && echo 'Review staged files above before proceeding.' || true"
          }
        ]
      }
    ]
  }
}
```

---

### 4. Package install guard

**Trigger:** Before any `npm install` or `npm add` (PreToolUse on Bash)
**Purpose:** Block unintentional package installs during sprints.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo $TOOL_INPUT | grep -E 'npm install [^-]|npm add|yarn add|pnpm add' && echo 'BLOCKED: Package install requires explicit user approval.' && exit 1 || true"
          }
        ]
      }
    ]
  }
}
```

---

### 5. .env guard

**Trigger:** Before any write to `.env.local` or `.env*` files (PreToolUse on Write/Edit)
**Purpose:** Prevent accidental modification of environment variables.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "echo $TOOL_INPUT | grep -E '\\.env' && echo 'BLOCKED: .env file modification requires explicit user approval.' && exit 1 || true"
          }
        ]
      }
    ]
  }
}
```

---

### 6. database.types.ts guard

**Trigger:** Before any write to `database.types.ts` (PreToolUse on Write/Edit)
**Purpose:** Prevent manual edits to generated types. Types must only be updated via `supabase gen types`.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "echo $TOOL_INPUT | grep 'database.types.ts' && echo 'BLOCKED: database.types.ts must only be updated via supabase gen types, not manually.' && exit 1 || true"
          }
        ]
      }
    ]
  }
}
```

---

## Implementation notes

- Start with the package install guard and .env guard — lowest risk, highest value.
- The TypeScript check hook is most useful during active debugging sprints.
- The protected file warning hook provides a soft warning; to make it blocking, change `exit 1` to block on detection.
- All hooks use `|| true` at the end of non-blocking checks so they don't fail the tool call on a non-match.
- Test hooks locally before committing them to `.claude/settings.json` — a misconfigured hook can block all edits.

---

## How to implement a hook

1. Open `.claude/settings.json` (create if it doesn't exist)
2. Add the hook configuration from above
3. Test with a dry run on a non-critical file
4. Or use the `/update-config` skill in Claude Code to configure hooks interactively

The `.claude/settings.local.json` file (gitignored) is for personal/local hook overrides.
`.claude/settings.json` (committed) is for team-wide hooks.
