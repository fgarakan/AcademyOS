# No Co-Author Commit Audit — Sprint 727

**Date:** 2026-05-17
**Sprint:** 727 — No Co-Author Commit Audit V1
**Auditor:** Claude Code (automated codebase scan + git log review)

---

## 1. Executive Summary

**Historical co-author footers exist in commits from Sprints 391–439. They will NOT be removed — rewriting published history is prohibited.**

**From Sprint 723 onward, all commits are single-line sprint commits with no co-author footer.** Sprints 723–727 confirmed clean.

This audit documents the current state, establishes the permanent forward rule, and closes the loop on the co-author audit requirement.

---

## 2. Historical Co-Author Footer Inventory

Git history contains `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` in commits from approximately Sprints 391–439 (based on git log scan). These footers were added by the default commit template active at that time.

**Total commits with co-author footers:** ~113 (across all of git history)
**Earliest affected sprint identified:** Sprint 391
**Latest affected sprint identified:** Sprint 439

---

## 3. Current State (Sprints 723–727)

| Sprint | Commit | Co-author footer |
|---|---|---|
| 723 | `e3d48cc` Sprint 723 — No Parent Sends Audit V1 | None |
| 724 | `c4bece4` Sprint 724 — No Level Movement Audit V1 | None |
| 725 | `29da2be` Sprint 725 — No Roster Mutation Audit V1 | None |
| 726 | `18f3cb3` Sprint 726 — No Migration Drift Audit V1 | None |
| 727 | this commit | None |

All current QA campaign commits are clean.

---

## 4. What Will NOT Be Done

- **No history rewrite** — `git rebase -i`, `git commit --amend`, or `git push --force` will not be used to remove co-author footers from historical commits. Rewriting published history risks data loss and is prohibited by the project git hygiene rules.
- **No force push** — prohibited under all circumstances.
- **No cherry-pick campaign** — not warranted for an audit trail concern.

---

## 5. Permanent Forward Rule — Commit Format

All future commits must follow this exact format:

```
git commit -m "Sprint NNN — Sprint Name"
```

**Never use:**
- `--author` changes
- `Co-Authored-By:` footer
- `Generated with Claude Code` footer
- `Generated with Anthropic` footer
- Any AI attribution footer of any kind
- heredoc commit bodies
- multi-line commit messages

**After every commit, verify with:**
```bash
git log -1 --format=%B
```

If the output contains `Co-Authored-By`, `Claude`, `Anthropic`, or `Generated with`, stop immediately and report before pushing.

---

## 6. Root Cause

The co-author footers in Sprints 391–439 were inserted by the default Claude Code commit template, which appended `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` to every heredoc commit. That commit style was explicitly removed from the project from Sprint 723 onward.

---

## 7. Verification Protocol (Permanent)

Before every push:

```bash
# 1. Check commit body
git log -1 --format=%B

# 2. Confirm: only a single line (the sprint title) appears
# 3. If any co-author line appears: do NOT push, report to Farshad
```

---

## 8. Final Safety Conclusion

**Historical co-author footers exist in older commits but are not being introduced by the current or future campaign.**

- Sprints 723–727 are confirmed clean.
- The permanent forward rule is documented here.
- No history rewrite will be performed.

**Sprint 727 production readiness check: PASSED.**
