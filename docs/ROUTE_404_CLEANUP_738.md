# Route 404 Cleanup — Sprint 738

**Date:** 2026-05-17
**Sprint:** 738 — Route 404 Cleanup V1
**Auditor:** Claude Code (automated codebase scan + manual review)

---

## 1. Executive Summary

**Result: No broken internal routes found. All dynamic routes call `notFound()` when resources are missing. All static internal links point to existing route directories. No changes required.**

The app has no custom global `not-found.tsx` — users see Next.js's built-in default 404 page when a resource is not found. This is acceptable for V1. A branded custom 404 page is a V2 improvement item.

---

## 2. Static Route Link Audit

All internal `href="/..."` values in Link components were extracted and verified against the filesystem:

| Route | Exists |
|---|---|
| `/coach/players` | ✅ |
| `/coach/sessions` | ✅ |
| `/director` | ✅ |
| `/director/ai-suggestions` | ✅ |
| `/director/class-templates` | ✅ |
| `/director/class-templates/new` | ✅ |
| `/director/curriculum` | ✅ |
| `/director/curriculum/academy-version` | ✅ |
| `/director/curriculum/builder` | ✅ |
| `/director/curriculum/learning` | ✅ |
| `/director/fitness/templates` | ✅ |
| `/director/fitness/templates/new` | ✅ |
| `/director/kpi` | ✅ |
| `/director/onboarding` | ✅ |
| `/director/onboarding/curriculum` | ✅ |
| `/director/players` | ✅ |
| `/director/players/active` | ✅ |
| `/director/players/development-intake` | ✅ |
| `/director/players/import` | ✅ |
| `/director/players/new` | ✅ |
| `/director/players/onboarding-review` | ✅ |
| `/director/private-lessons` | ✅ |
| `/director/review` | ✅ |
| `/director/sessions` | ✅ |
| `/director/sessions/archive` | ✅ |
| `/director/sessions/new` | ✅ |
| `/director/signals` | ✅ |
| `/director/today` | ✅ |

**All 28 static internal routes exist. No dead links.**

---

## 3. Dynamic Route 404 Handling

All dynamic route segments call `notFound()` when the requested resource does not exist in the database:

| Route | `notFound()` call | Trigger |
|---|---|---|
| `/director/players/[playerId]` | `page.tsx:106, 109` | `playerError` or `!player` |
| `/director/sessions/[sessionId]` | `page.tsx:83` | `sessionError` or `!session` |
| `/director/class-templates/[templateId]` | `page.tsx:125` | `templateError` or `!templateRaw` |
| `/director/fitness/templates/[templateId]` | `page.tsx:66` | `templateError` or `!template` |
| `/director/coaches/[coachId]` | `page.tsx:36` | `!coachMembership` |
| `/coach/players/[playerId]` | `page.tsx:45` | `playerError` or `!player` |
| `/coach/sessions/[sessionId]` | `page.tsx:83` | `sessionError` or `!session` |

All 7 dynamic route pages correctly call `notFound()`. Next.js intercepts this call and renders a 404 response.

---

## 4. Dynamic Hrefs — Data-Sourced IDs

All dynamic `href={\`...\`}` patterns in Link components use IDs sourced directly from database query results:

- `/director/players/${player.player_id}` — from `player_profiles` query
- `/director/sessions/${session.id}` — from `daily_sessions` query
- `/director/class-templates/${template.id}` — from `class_templates` query
- `/director/coaches/${coach.profileId}` — from `academy_memberships` query

Since these IDs come from the database, they are always valid references to existing rows (within the same session). A player deleted between page load and link click would trigger `notFound()` in the dynamic route page — handled correctly.

---

## 5. Cross-Role and Unauthenticated Access

**Middleware (`src/middleware.ts`)** handles unauthorized access by redirect, not 404:

- Unauthenticated user on any route → redirect to `/login`
- Authenticated user accessing wrong-role route → redirect to their home portal
- Platform user on portal route without preview cookie → redirect to `/platform`

No role mismatch produces a 404. Users always land on a valid page.

---

## 6. No Custom Not-Found Page

No `src/app/not-found.tsx` exists. When `notFound()` is called from any dynamic route:

- Next.js returns HTTP 404
- The browser renders the built-in Next.js default 404 page (minimal, white, unbranded)

This is the current V1 behavior. It is not harmful — the user sees a clear 404 indicator. A branded `not-found.tsx` in the AcademyOS design system is a V2 improvement item.

---

## 7. Error Boundaries vs. 404 Boundaries

**Error boundaries** (`error.tsx`) exist at the portal and sub-route level:

- `src/app/director/error.tsx` — catches render errors in director portal
- `src/app/coach/error.tsx` — catches render errors in coach portal
- `src/app/player/error.tsx` — catches render errors in player portal
- `src/app/parent/error.tsx` — catches render errors in parent portal
- `src/app/director/today/error.tsx`, `kpi/error.tsx`, `review/error.tsx`, `level-up/error.tsx`, `parents/error.tsx`, `signals/error.tsx` — sub-route specific

**Loading boundaries** (`loading.tsx`) exist for slow-loading pages:

- `src/app/director/today/loading.tsx`, `kpi/loading.tsx`, `review/loading.tsx`, `level-up/loading.tsx`, `parents/loading.tsx`, `signals/loading.tsx`, `sessions/loading.tsx`, `sessions/overview/loading.tsx`, `players/loading.tsx`, `players/[playerId]/loading.tsx`

Error boundaries and loading states are distinct from 404 handling and are correctly deployed.

---

## 8. Risky Patterns Found

None.

---

## 9. Fixes Made

None.

---

## 10. Final Safety Conclusion

**No broken routes or missing 404 handlers in AcademyOS V1.**

- All 28 static internal links point to existing route directories
- All 7 dynamic route pages call `notFound()` when resource is missing
- Dynamic hrefs use database-sourced IDs only
- Cross-role access is handled by middleware redirect (not 404)
- No custom `not-found.tsx` — default Next.js 404 page used (acceptable for V1)

**Sprint 738 production readiness check: PASSED.**
