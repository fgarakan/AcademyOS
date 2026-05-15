// Sprint 384 — DONNA Modularization
// The typed text input and Send button are part of DonnaVoiceLayer.tsx.
// They are rendered inside the primary voice card (lines 2894–2920 in the
// original DonnaAssistantButton) because the input visually belongs with
// the voice card and they share the same onCommandSubmit handler.
//
// If the input bar needs to be extracted independently in a future sprint
// (e.g. to move it to a bottom-docked position), extract from DonnaVoiceLayer
// and accept: typedText, onTypedTextChange, onCommandSubmit.
//
// Future agent owner: Input / command entry team.

export {}
