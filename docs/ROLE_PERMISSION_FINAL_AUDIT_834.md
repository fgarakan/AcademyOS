# Sprint 834 — Role Permission Final Audit V1

**Date:** 2026-05-18
**Sprint:** 834

---

## Role permission audit — V1 final

### Role matrix

| Data object | director | head_coach | coach | player | parent |
|-------------|----------|------------|-------|--------|--------|
| Player profile (full) | ✅ Full | ✅ Scoped | 📖 Read own students | 📖 Read own | ✅ Read own child |
| Assessment gates | ✅ Full | ✅ Full | 📖 Read | ❌ | ❌ |
| Session records | ✅ Full | ✅ Full | ✅ Own sessions | 📖 Own | 📖 Child's |
| Coach notes | ✅ Full | ✅ Full | ✅ Own notes | 📖 Own (approved) | 📖 Child's (approved) |
| Proposed actions | ✅ Full | ✅ Review | ✅ Submit | ❌ | ❌ |
| Curriculum levels | ✅ Full | 📖 Read | 📖 Read | ❌ | ❌ |
| Curriculum drafts | ✅ Approve | ❌ | ❌ | ❌ | ❌ |
| Player placement | ✅ Execute | ❌ | ❌ | ❌ | ❌ |
| Billing data | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| Audit logs | ✅ Read | ❌ | ❌ | ❌ | ❌ |

### Middleware route guards (confirmed)

| Route prefix | Required role | Guard location |
|-------------|--------------|----------------|
| `/director/*` | `academy_director` | `middleware.ts` |
| `/coach/*` | `head_coach` or `coach` | `middleware.ts` |
| `/player/*` | `player` | `middleware.ts` |
| `/parent/*` | `parent` | `middleware.ts` |

### Server-side auth checks (confirmed)

Every page and server action that touches data:
1. Calls `getUser()` — redirects if unauthenticated
2. Checks `user.user_metadata.role` where needed
3. RLS policies enforce role-scoped data access at the DB layer

### Curriculum builder — role restriction

The curriculum builder (`/director/curriculum/*`) is director-only. The middleware guard at `/director/*` enforces this. Coaches access curriculum data only via:
- Player profile → level information
- Session wrap-up → guided by the curriculum they're assigned to
- `CurriculumCoachReadOnlyView` component — explicitly read-only

### Parent data isolation — confirmed

Parent portal at `/parent/*` shows only:
- The parent's own children (RLS: `parent_player_relationships` join)
- Approved coach notes only
- Session attendance (not session content detail)
- Player level (not internal gate criteria)

No billing data, no other players, no curriculum editing.

### Verdict

Role permissions are correctly enforced at middleware + RLS layers. No cross-role data exposure was introduced in this sprint block. The curriculum builder correctly restricts to director only.
