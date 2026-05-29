# DONNA Safe UI Action Suggestions QA
**Sprint:** 924 | **Date:** 2026-05-29
**Method:** Static code analysis

---

## 1. Action Filtering

| Safety Class | Shown? | Notes |
|---|---|---|
| `always_safe` | ✅ | Navigate, expand, filter — no state change |
| `safe_with_context` | ✅ | Safe when role and page verified |
| `draft_to_review` | ✅ | Shown with "Creates draft" chip |
| `director_approval` | ✅ (approval section) | Shown with "Needs approval" chip + approval route note |
| `platform_required` | ❌ | Not shown — director scope |
| `always_blocked` | ❌ | Never shown |

---

## 2. Safety Checks

| Check | Result |
|---|---|
| High-risk actions auto-executed? | No — dispatcher returns `blocked` or `approval_routed` |
| Blocked actions shown as suggestions? | No — `always_blocked` filtered out |
| Approval-required actions clearly labeled? | Yes — orange "Needs approval" chip |
| Natural language examples shown? | Yes — "Try: [example]" for each action |

---

## 3. TypeScript

```
npx tsc --noEmit → clean (0 errors)
```
