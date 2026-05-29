# Coach Wrap-Up 10/10 — Architecture

**Sprint:** 927 | **Date:** 2026-05-29

---

## Summary

Sprint 927 completes the DONNA-branded coach wrap-up flow (`/coach/sessions/[sessionId]/wrap-up`) to 10/10 production quality by adding voice input, roster-aware player name chips, and optional player observation drafts in the saved state.

---

## Files changed

| File | Change |
|---|---|
| `src/app/coach/sessions/[sessionId]/wrap-up/page.tsx` | Added roster query (group_memberships → players). Passes `roster` prop to WrapUpPageClient. |
| `src/app/coach/sessions/[sessionId]/wrap-up/WrapUpPageClient.tsx` | Voice input per question, player name chips (standouts/attention), optional observation draft form in saved state. |
| `src/app/coach/sessions/[sessionId]/execute/page.tsx` | Changed `wrapUpHref` from session detail to `/wrap-up` directly. |

---

## Architecture decisions

### Two wrap-up paths remain (intentional)

| Path | Use case | Voice | Player notes |
|---|---|---|---|
| `CoachWrapUpDrawer` | In-session use via drawer on session detail page | ✅ | ✅ |
| `WrapUpPageClient` (`/wrap-up`) | Post-session DONNA-branded standalone page | ✅ (Sprint 927) | ✅ (Sprint 927) |

Both paths write to the same `proposed_actions` pipeline (`session_wrap_up_v1`). The drawer is richer for in-session use; the page is cleaner for post-session use. Sprint 927 closes the feature gap between them.

### Voice input

`AudioRecorderButton` and `VoiceInputButton` are mounted per question step. Both append to the current textarea answer via `appendToAnswer(key, transcript)`. Neither records audio beyond the transcription request.

- `AudioRecorderButton` → server transcription endpoint (`/api/coach/sessions/[sessionId]/transcribe`). Falls back gracefully when `OPENAI_API_KEY` is not set.
- `VoiceInputButton` → browser `SpeechRecognition` API (Chrome/Edge only). Falls back to a calm note on unsupported browsers.

### Player name chips

Shown only on `standouts` and `attention` questions when `roster.length > 0`. Tapping a player chip appends their first name to the textarea with a smart separator (comma or space depending on current content). This is a UI convenience only — it does not select or lock a player; the coach retains full edit control.

### Player observation drafts (saved state)

- Shown only when roster is available and obsPhase is not 'saved'.
- Coach taps a player to cycle type: none → positive → needs_attention → none.
- Each selected player gets a short note input.
- Submitting calls `saveWrapUpObservationsAction` (existing, stable server action).
- Each observation becomes a `coach_observation_draft_v1` proposed_action with `status: pending_review`.
- Safety: validates auth, academy_id, role, and player membership server-side. No parent/player exposure.

### Execute → wrap-up routing

`execute/page.tsx` now sets `wrapUpHref = /coach/sessions/${sessionId}/wrap-up`. Previously pointed to session detail. After walking through session blocks in the execute view, the wrap-up CTA routes directly to the structured DONNA wrap-up page.

### Roster query safety

- Best-effort: wrapped in try/catch. Failure does not prevent wrap-up.
- Scoped to `academy_id` and `is_current = true` group members.
- Passed as a prop, not fetched client-side.
- If session has no `group_id` or group has no members, roster is `[]` and chips/observation section are hidden.

---

## Safety invariants

| Invariant | Status |
|---|---|
| No parent/player communication sent | ✅ — observations are `pending_review` only |
| No player level movement | ✅ — not touched |
| No curriculum mutation | ✅ — not touched |
| No roster change | ✅ — not touched |
| No placement change | ✅ — not touched |
| Sprint 904 approve/reject paths unchanged | ✅ — not touched |
| CoachWrapUpDrawer unchanged | ✅ — not touched |
| proposed_actions pipeline unchanged | ✅ — reuses existing actions |
| RLS / academy_id scoping | ✅ — server-side in saveWrapUpObservationsAction |
| Raw IDs not shown in UI | ✅ — only player first names displayed |

---

## Known limitations

- `AudioRecorderButton` requires `OPENAI_API_KEY` for server transcription. Falls back gracefully (coach can type or use browser dictation).
- `VoiceInputButton` is Chrome/Edge only. Falls back to a calm note.
- Player observation note field is a single short text input — not a full observation editor. Full player note editing is in the director review queue.
- Block completion still defaults to `completed` for all blocks (same as before Sprint 927). Block status tracking via localStorage execution client is not wired into the `/wrap-up` page flow (that is the drawer path).
