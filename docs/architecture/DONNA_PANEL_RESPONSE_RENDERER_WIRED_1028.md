# Wire DONNA Panel Response Renderer — Sprint 1028

**Date:** 2026-05-31
**Sprint:** 1028
**Status:** Complete

---

## UX problem solved

After Sprint 1011, the DONNA panel had three fragmented response areas:

1. **cooThread section** (Sprints 747-825, ~52 lines JSX) — inline chat bubbles with own scroll container and 3 refs
2. **DonnaWorkflowCards** — commandResponse + all workflow/draft state
3. **Sprint 1011 God Mode section** (~30 lines JSX) — loading dots + DonnaResponseCard

Three separate sections meant DONNA responses appeared in different visual zones based on which path triggered them — confusing and inconsistent.

---

## What changed

The cooThread section (lines 4190-4241) and the Sprint 1011 God Mode section (lines 4303-4331) are replaced with a single `<DonnaPanelResponseRenderer>` call.

**Removed:** ~82 lines of inline JSX across two sections  
**Added:** 12-line `<DonnaPanelResponseRenderer>` component call  
**Net change:** -70 lines of JSX in the panel render

---

## What was kept

`DonnaWorkflowCards` is **unchanged** — it continues to handle:
- commandResponse card (fallback/error answers)
- convState draft panels
- genericDraft, templateDraft
- dailyBrief, attentionReport
- communicationDraft, attendanceExceptionDraft
- onboarding suggestions
- contextSummary

Full commandResponse migration to the renderer is deferred to a future panel simplification sprint.

---

## New panel layout (after Sprint 1028)

```
DonnaInputPanel         ← input + chips + voice
DonnaPanelResponseRenderer  ← cooThread + God Mode loading + DonnaResponseCard
DonnaWorkflowCards      ← commandResponse + all drafts/workflow state
ActionPreviewCard       ← route_to_review action preview
[guide/explain/find/template modes...]
```

---

## What got simpler

- One DONNA response area instead of three
- No more duplicate bubble implementations (cooThread inline vs DonnaPanelResponseRenderer)
- DonnaResponseCard no longer directly imported into DonnaAssistantButton (it's an internal detail of the renderer)
- Three scroll refs (cooThreadScrollRef, cooThreadBottomRef, cooThreadWrapperRef) become unused null refs — their effects have null guards, no crash, but they can be cleaned up in a future pass

---

## What still needs visual QA

- Confirm cooThread bubbles render identically to the previous inline implementation
- Confirm God Mode loading dots appear in the correct position (below input, above workflow cards)
- Confirm DonnaResponseCard navigate/highlight callbacks still close the panel
- Confirm `suppressCommandResponseCard` logic in DonnaWorkflowCards still works (it reads from cooThread state, which is unchanged)
