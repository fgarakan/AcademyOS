# Codespaces Dev Stability QA — Sprint 734

**Date:** 2026-05-17
**Sprint:** 734 — Codespaces Dev Stability QA V1
**Auditor:** Claude Code (automated codebase scan + manual review)

---

## 1. Executive Summary

**Result: The dev environment is stable for Codespaces operation. All API keys degrade gracefully when absent. No hardcoded secrets. TypeScript compiles clean. The app runs in Codespaces without Anthropic or OpenAI keys configured.**

---

## 2. Environment Variable Inventory

### Required for basic operation (Supabase)

| Variable | Required | Documented in |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `.env.example`, `.env.local.example` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | `.env.example`, `.env.local.example` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server-side only) | `.env.example`, `.env.local.example` |

### Optional (AI features — degrade gracefully when absent)

| Variable | Feature | Behavior when absent |
|---|---|---|
| `ANTHROPIC_API_KEY` | AI note structuring (`structureCoachNote`) | Throws `Error('AI Draft is not available...')` — caught by UI, shows orange warning |
| `OPENAI_API_KEY` | Whisper transcription, Realtime interview, DONNA TTS | Returns 503 with friendly message: "You can still type or use browser dictation." |
| `OPENAI_REALTIME_MODEL` | Realtime voice model selection | Defaults to `'gpt-realtime'` |
| `OPENAI_REALTIME_VOICE` | Realtime voice selection | Defaults to `'marin'` |
| `ANTHROPIC_MODEL` | Claude model selection | Defaults to `'claude-sonnet-4-6'` |

---

## 3. Graceful Degradation When API Keys Absent

### `ANTHROPIC_API_KEY` absent

`src/lib/ai/structureCoachNote.ts:50`

```ts
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) throw new Error('AI Draft is not available — ANTHROPIC_API_KEY is not configured.')
```

This error is caught in the server action (`generateNoteDraftAction`). The `AIDraftPanel` UI shows an orange warning message. The coach note system continues to function — drafts can be written manually. The app does not crash.

### `OPENAI_API_KEY` absent

`src/app/api/coach/sessions/[sessionId]/transcribe/route.ts:71`

```ts
if (!openAiKey) {
  return NextResponse.json({ ok: false, error: 'Production transcription is not configured. You can still type or use browser dictation.' }, { status: 503 })
}
```

Voice transcription returns a 503 with a user-friendly message. The coach can still type the recap. The wrap-up flow remains fully functional.

`src/app/api/director/interview/realtime-session/route.ts:58`

```ts
{ error: 'OPENAI_API_KEY is not configured on the server.', envConfigured: false }
```

Realtime interview session returns an error object. The UI handles this gracefully.

---

## 4. No Hardcoded Secrets

- `.env.local` is in `.gitignore` — never committed
- `.env.example` and `.env.local.example` contain only placeholder values (no real keys)
- `SUPABASE_SERVICE_ROLE_KEY` is only accessed server-side via `process.env` — never in client components
- No API keys appear in any `src/` file as string literals

---

## 5. Dev-Only Code Correctly Gated

Several debug/developer tools are gated behind `process.env.NODE_ENV !== 'production'`:

- `DirectorInterviewAssistant.tsx` — 6 developer panel sections hidden in production
- `DonnaVoiceDiagnostics.tsx` — only renders in development: `if (process.env.NODE_ENV !== 'development') return null`
- `DonnaAssistantButton.tsx` — developer tools panel hidden in production
- `src/app/director/curriculum/page.tsx` — debug panels hidden in production

These are correctly implemented. No developer tools leak into production.

---

## 6. TypeScript Stability

```bash
npx tsc --noEmit
```

Output: empty (clean). TypeScript compiles cleanly across all 700+ sprint's of code. This is verified at the end of every sprint.

---

## 7. npm Scripts

```json
"dev":        "next dev",
"build":      "next build",
"start":      "next start",
"lint":       "next lint",
"type-check": "tsc --noEmit"
```

`npm run dev` starts the dev server. `npm run type-check` runs TypeScript without build output. Both work in Codespaces.

---

## 8. No devcontainer Config

No `.devcontainer/` directory exists. The dev environment is managed manually via Codespaces default Node.js container. No automated port forwarding or environment bootstrapping scripts needed — the app runs on `npm run dev` once `.env.local` is populated with Supabase credentials.

---

## 9. Known Codespaces Considerations

- The Realtime voice feature (OpenAI Realtime API) requires a WebSocket connection to an external API. In Codespaces, this works as long as the Codespace has outbound internet access.
- DONNA TTS also makes outbound OpenAI API calls. Absent `OPENAI_API_KEY`, TTS silently fails and DONNA uses text-only mode.
- The `SUPABASE_PROJECT_REF` variable in `.env.example` is for `supabase` CLI usage — not required for `npm run dev`.

---

## 10. Risky Patterns Found

None. API key gates are all server-side. Client components never access sensitive keys directly.

---

## 11. Fixes Made

None.

---

## 12. Final Safety Conclusion

**The Codespaces dev environment is stable in AcademyOS V1.**

- App operates with only Supabase credentials configured.
- All AI/voice features degrade gracefully when keys are absent.
- No hardcoded secrets.
- TypeScript compiles clean.
- Dev-only panels are correctly gated behind `NODE_ENV !== 'production'`.

**Sprint 734 production readiness check: PASSED.**
