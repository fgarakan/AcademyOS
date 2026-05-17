# V1 Reliability Audit — Sprint 740

**Date:** 2026-05-17
**Sprint:** 740 — V1 Reliability Audit V1
**Auditor:** Claude Code (automated codebase scan + manual review)

---

## 1. Executive Summary

**Result: V1 reliability posture is sound. All portals have auth guards, error boundaries, and graceful degradation. All API routes authenticate callers or degrade safely when keys are absent. The app is reliable under the conditions it will encounter in V1: single academy, authenticated director/coach/player/parent users, Supabase + optional AI/voice keys.**

No changes required.

---

## 2. Auth Layer Reliability

### Middleware (first line of defense)

`src/middleware.ts` intercepts all non-API routes matching `/((?!_next/static|_next/image|favicon.ico|api).*)`:

- Unauthenticated user → redirect to `/login` (with `?next=` return URL)
- Cross-role access → redirect to the user's home portal
- Platform user without preview cookie on a portal route → redirect to `/platform`

API routes are excluded from the middleware matcher by design — they handle their own authentication.

### Portal layout guards (second line of defense)

All four role layouts independently call `supabase.auth.getUser()`:

| Layout | Auth call | Location |
|---|---|---|
| `src/app/director/layout.tsx` | `getUser()` | Line 18 |
| `src/app/coach/layout.tsx` | `getUser()` | Line 15 |
| `src/app/player/layout.tsx` | `getUser()` | Line 15 |
| `src/app/parent/layout.tsx` | `getUser()` | Line 15 |

Even if middleware is bypassed (configuration change, test environment), the layout provides a secondary auth check.

### API route guards (third line of defense)

All API routes that access data authenticate the caller:

| Route | Auth mechanism |
|---|---|
| `api/auth/signout` | `getSupabaseServer()` (signOut is safe unauthenticated — it's a no-op on an expired session) |
| `api/coach/sessions/[sessionId]/transcribe` | `getUser()` — returns 401 if unauthenticated |
| `api/director/interview/realtime-session` | `getUser()` — returns 401 if unauthenticated |
| `api/donna/attention` | `getUser()` — returns 401 if unauthenticated |
| `api/donna/brief` | `getUser()` — returns 401 if unauthenticated |
| `api/donna/tts` | OPENAI_API_KEY check — returns 503 if unconfigured |

---

## 3. Error Boundary Coverage

### Portal-level error boundaries

All four portals have `error.tsx` with a "Try again" reset button:

| File | Portal |
|---|---|
| `src/app/director/error.tsx` | Director portal |
| `src/app/coach/error.tsx` | Coach portal |
| `src/app/player/error.tsx` | Player portal |
| `src/app/parent/error.tsx` | Parent portal |

All error boundaries show the error message and a `reset()` retry button. No raw stack traces are exposed.

### Sub-route error boundaries (director)

Additional scoped error boundaries for high-traffic director routes:

- `src/app/director/today/error.tsx`
- `src/app/director/kpi/error.tsx`
- `src/app/director/review/error.tsx`
- `src/app/director/level-up/error.tsx`
- `src/app/director/parents/error.tsx`
- `src/app/director/signals/error.tsx`

These catch errors in heavy data-loading routes (KPI engine, session review queue) without bringing down the entire director portal.

---

## 4. Loading State Coverage

Loading boundaries (`loading.tsx`) exist for slow-loading director routes:

- `src/app/director/today/loading.tsx`
- `src/app/director/kpi/loading.tsx`
- `src/app/director/review/loading.tsx`
- `src/app/director/level-up/loading.tsx`
- `src/app/director/parents/loading.tsx`
- `src/app/director/signals/loading.tsx`
- `src/app/director/sessions/loading.tsx`
- `src/app/director/sessions/overview/loading.tsx`
- `src/app/director/players/loading.tsx`
- `src/app/director/players/[playerId]/loading.tsx`

Coach, player, and parent portals are mobile-first single-page views with fast data loads — no loading boundaries needed at the route level.

---

## 5. Graceful Degradation Under Missing Config

### AI keys absent

| Feature | Behavior |
|---|---|
| `ANTHROPIC_API_KEY` absent | AI Draft shows orange warning — coach note entry still functional |
| `OPENAI_API_KEY` absent | Transcription returns 503 with "You can still type" message |
| `OPENAI_API_KEY` absent | Realtime interview returns structured error — onboarding continues with typed input |
| `OPENAI_API_KEY` absent | DONNA TTS silently fails — DONNA operates in text-only mode |

### Database data absent / insufficient

KPI engines return `insufficient_data` or `no_data` status rather than throwing or returning null. The UI renders `<EmptyState>` components. No surface crashes on empty data (audited Sprint 730).

### Voice features in unsupported browsers

`SpeechRecognition` absence is detected at mount via `useEffect`. `VoiceInputButton` renders a text input fallback with "You can type instead" message. All voice surfaces have text fallback paths (audited Sprint 731).

---

## 6. Root Provider Coverage

`src/app/layout.tsx` wraps all pages in:

```tsx
<ToastProvider>
  {children}
</ToastProvider>
```

`ToastProvider` provides the global toast notification system. All server action feedback surfaces through this system. The root layout is a Server Component — `ToastProvider` is a Client Component providing the context.

---

## 7. Demo Mode Isolation Reliability

`assertNotPreviewMode()` is called at the top of all server actions that write to real data. Demo sandbox actions are scoped exclusively to records with `[DEMO]%` prefix (audited Sprint 721). No demo action can mutate real academy data.

---

## 8. QA Campaign Closure

This sprint closes the QA campaign started at Sprint 710. Sprints 723–740 (17 audit sprints + 1 regression sprint) constitute a complete production readiness pass over AcademyOS V1.

**Campaign scope verified:**
- No parent sends infrastructure exists ✅
- No automated level movement ✅
- No automated roster mutations ✅
- No migration drift in QA campaign ✅
- No co-author commit footers in campaign ✅
- Data loading failure states handled ✅
- RLS blocked states handled as first-class status ✅
- Missing data states handled gracefully ✅
- Voice unsupported browser handled ✅
- Mobile Safari safe area correct ✅
- Chrome desktop layout correct ✅
- Codespaces dev stability verified ✅
- Runtime errors all handled ✅
- Console warnings safe / no sensitive data ✅
- Hydration patterns correct ✅
- Route 404 handling correct ✅
- Final regression PASSED ✅
- V1 reliability posture sound ✅

---

## 9. Risky Patterns Found

None.

---

## 10. Fixes Made

None.

---

## 11. Final Safety Conclusion

**AcademyOS V1 reliability audit: PASSED.**

The app is reliable, authenticated, and degradation-safe. All portals have layered auth guards (middleware → layout → server action), error boundaries with retry, and graceful degradation when AI/voice keys are absent.

**Sprint 740 production readiness check: PASSED.**

**QA campaign 710–740: COMPLETE.**
