// Sprint 384 — DONNA Modularization
// Documents why the panel shell was not extracted as a standalone component.
//
// The panel container (aside) and the floating trigger button are tightly
// coupled to DonnaAssistantButton because:
//
//   1. The trigger button on-click performs draft restore (loadDraftFromSession),
//      onboarding init (setOnboardingStep), review queue prefetch
//      (getDonnaReviewQueueAction), and recommendation evaluation — all of which
//      close over 15+ state setters.
//
//   2. closePanel() resets 25+ state values and calls realtimeDisconnect, stopServerTts,
//      and stopWakeListening — it cannot be passed as a prop without prop explosion.
//
//   3. The Escape key listener (useEffect on panelOpen) is bound to closePanel.
//
// Future path: Migrate panel state to a dedicated context (DonnaPanelContext)
// with a useReducer for open/close and a useEffect for key listeners. Then
// DonnaPanelShell can be a pure layout component that reads from context.
//
// Future agent owner: Panel layout / UX shell team.

export {}
