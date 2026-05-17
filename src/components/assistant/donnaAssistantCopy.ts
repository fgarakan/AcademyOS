// DONNA — centralized public-facing assistant copy.
// These are the only canonical sources for DONNA's name, title, and key phrases.
// Import from here — never hardcode "Academy Assistant" or "Academy Setup Assistant" in JSX.

/** The assistant's name. */
export const DONNA_PUBLIC_NAME = 'DONNA'

/** Role descriptor shown alongside the name. */
export const DONNA_PUBLIC_TITLE = 'Director Operations Assistant'

/** Full label used in headers and aria-labels. */
export const DONNA_FULL_LABEL = 'DONNA — Director Operations Assistant'

/** Full label for the onboarding/interview setup context. */
export const DONNA_SETUP_LABEL = 'DONNA — Academy Setup Assistant'

/** Opening greeting spoken and shown on first panel open. */
export const DONNA_GREETING = "Hi, I'm DONNA, your Academy Assistant."

/** Activation helper shown below the panel header. */
export const DONNA_ACTIVATION_HELP = 'Review first. DONNA proposes — you approve.'

/** Safety reminder shown near voice input areas. */
export const DONNA_SAFETY_REMINDER =
  'DONNA can fill drafts by voice. Final saves and approvals still require the button.'

/** Label for the in-panel wake phrase listener button. */
export const DONNA_WAKE_LABEL = "Listen for 'Hey DONNA'"

/** Shown while wake phrase listener is active. */
export const DONNA_WAKE_ACTIVE_LABEL = "Listening for 'Hey DONNA'…"

/** Shown when wake phrase was detected and DONNA is ready for the command. */
export const DONNA_WAKE_DETECTED_LABEL = 'DONNA is listening.'

/** Voice output confirmation — positive. */
export const DONNA_HEARD_CONFIRM = 'I heard DONNA'

/** Voice output confirmation — negative. */
export const DONNA_NOT_HEARD_CONFIRM = 'I did not hear DONNA'
