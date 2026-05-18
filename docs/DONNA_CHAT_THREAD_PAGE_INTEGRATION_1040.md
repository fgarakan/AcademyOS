# DONNA Chat Thread Page Integration — Sprint 1040

**Date:** 2026-05-18
**Sprint:** 1040 — DONNA Chat Thread Page Integration V1

---

## What changed

Made the ChatGPT-like DONNA thread visible with full context awareness in both Director and Coach surfaces.

### Files created
- `src/components/donna/DonnaContextSummaryCard.tsx` — new reusable component showing what DONNA can see: context items (KPI chips), data source labels with live/partial/demo status dots, confidence badge. Used above the chat shell on both director and coach DONNA pages.

### Files modified
- `src/app/director/donna/page.tsx` — integrated `DonnaContextSummaryCard` above the chat shell; added `ContextSummaryItem[]` and `ContextSourceLabel[]` computed from live `DirectorDonnaContext`.
- `src/app/coach/donna/page.tsx` — integrated `DonnaContextSummaryCard` above the chat shell; added coach-specific context items from `CoachDonnaContext`.

---

## DonnaContextSummaryCard

| Prop | Source | Purpose |
|---|---|---|
| `role` | parent | Controls accent color (lime=director, blue=coach) |
| `contextItems` | ctx fields | KPI chips: sessions today, pending reviews, etc. |
| `sourceLabels` | ctx.sourceLabels | Data source status (live / partial / demo / schema gap) |
| `confidence` | ctx.confidence | Confidence badge: High / Partial / Demo / Limited |
| `isLive` | ctx.isLive | Shows orange "Demo" pill when not live |

---

## Chat thread features (pre-existing in DonnaChatThread + DonnaVoiceReadyShell)

| Feature | Status | Notes |
|---|---|---|
| Director role scoping | Live | `role="director"` → director-only suggested questions |
| Coach role scoping | Live | `role="coach"` → coach-only suggested questions |
| Suggested questions | Live | Pre-built chips via `donnaSuggestedQuestions` |
| Role/source/confidence labels | Live | Per-message source note + confidence dot in `DonnaChatThread` |
| Boundary responses | Live | `donnaBoundaryResponses` fires when question is out-of-scope |
| Voice input | Live | `useVoiceDictation` in `DonnaVoiceReadyShell`; graceful fallback if unsupported |
| Session memory | Live | `donnaChatSessionMemory` records turns |
| Typing indicator | Live | `isTyping` state + spinner bubble |
| Auto-scroll | Live | `useEffect` scrolls to bottom on new messages |

---

## What requires real AI

The current chat thread uses `donnaSafeReadActions` (deterministic, keyword-based) rather than a live LLM. This means:
- Recognized keywords → structured answers
- Unrecognized queries → honest "I don't know" fallback
- No hallucination possible — all answers come from real context data

To enable true natural language: wire `ANTHROPIC_API_KEY` + an Edge Function that calls Claude with the DONNA context package.

---

## TypeScript

Clean (`npx tsc --noEmit` — no errors).
