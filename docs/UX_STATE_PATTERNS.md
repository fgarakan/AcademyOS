# UX State Patterns

> Sprint 457 — Loading / Error / Success States V1
> See also: `src/lib/ux/statePatterns.ts`, `src/components/ui/LoadingSkeleton.tsx`

---

## Loading States

### Skeleton Loaders

Use `<LoadingSkeleton>` or `<SkeletonCard>` from `src/components/ui` for page and section loads.

Rules:
- Never show a spinner for page-level loads — always skeleton
- Match the skeleton shape to the content it replaces
- Skeleton backgrounds: `bg-surface-raised` with `animate-pulse`

### Contextual Loading Labels

| Context | Label |
|---|---|
| Page load | "Loading" (skeleton only, no label) |
| DONNA thinking | "DONNA is thinking…" + pulsing lime dot |
| Voice recording | "Recording…" + elapsed time + pulsing ring |
| Voice transcribing | "Transcribing…" + spinner |
| Voice structuring | "Structuring…" + DONNA icon |
| Save | "Saving…" (in button, not separate UI) |
| Submit | "Submitting…" (button disabled, spinner in button) |

---

## Error States

### Page-Level Errors

Centered in main area:
- Heading: large, text-primary
- Body: text-secondary, helpful
- Request ID: label-xs, text-muted (always show when available)
- Retry button: btn-ghost
- Recovery link: btn-ghost

### Inline Section Errors

Small error block inside the section card:
- Short message
- Retry link if applicable
- Do NOT fill the whole page with a full-screen error for a single section

### DONNA Unavailable

"DONNA is temporarily unavailable. Try again in a moment."
- Show as an inline banner, not a full-page error
- Never prevent page from loading

### Voice Failed

"Recording could not be processed."
- Show below the voice input
- Offer: type instead | try again

---

## Success States

Use `<ToastProvider>` + `useToast()` from `src/components/ui/Toast.tsx`.

Toast variants:
- `success` — green dot, auto-dismiss after 2500ms
- `error` — red dot, no auto-dismiss
- `info` — blue dot, auto-dismiss after 3000ms

Important toasts:
| Action | Message | Duration |
|---|---|---|
| Draft saved | "Draft saved" | 2500ms |
| Action submitted | "Submitted for review" | 3000ms |
| Action approved | "Action approved" | 3000ms |
| Note captured | "Note captured" | 2500ms |
| Attendance marked | "Attendance marked" | 2500ms |
| Recap submitted | "Wrap-up submitted" | 3000ms |
| Badge awarded | "Badge awarded!" | 4000ms |

---

## Draft Saved Indicator

For long forms (session wrap-up, curriculum builder):

States:
1. No changes — nothing shown
2. Unsaved — "Unsaved changes" (orange dot + text)
3. Saving — "Saving…" (spinner)
4. Saved — "Saved" (checkmark)
5. Error — "Save failed" (red dot + retry link)

Position: top-right of the form card, or in sticky footer bar.

---

## DONNA Thinking State

Show when DONNA is generating a response.

Pattern:
- Three lime dots pulsing in sequence
- "DONNA is thinking…" label
- Show estimated time only if it will take > 3 seconds
- Never block the entire UI — show in the DONNA panel only

---

## Voice States

```
Idle      → (tap mic button)
Recording → pulsing red ring, elapsed time counter
Done      → (tap stop or auto-stop after silence)
Transcribing → spinner, "Transcribing…"
Structuring  → lime dots, "Structuring…"
Preview   → show transcript draft, confirm/cancel
```

Always show "Type instead" as fallback at any voice state.
