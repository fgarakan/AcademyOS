// Donna Onboarding Flow — Sprint 290
// Defines the 2-step guided intro sequence for the floating assistant.
// No DB, no API, no async, no AI. Pure contract.

import { DONNA_FULL_LABEL } from './donnaAssistantCopy'

export interface DonnaOnboardingStep {
  id: string
  question: string          // shown on screen
  spokenText: string        // spoken by TTS (may differ for natural phrasing)
  fieldKey: string
  helperText: string
  required: boolean
  suggestedRoutes?: DonnaOnboardingSuggestedRoute[]
}

export interface DonnaOnboardingSuggestedRoute {
  label: string
  taskHint: string          // keyword phrase that routes to a task
}

// The assistant greeting text is the first spoken question — no separate greeting card needed.
export const ASSISTANT_DISPLAY_NAME = DONNA_FULL_LABEL

export const DONNA_ONBOARDING_STEPS: readonly DonnaOnboardingStep[] = [
  {
    id: 'greeting',
    question: "Hi, I'm Donna, your Academy Assistant. What's your name?",
    spokenText: "Hi, I'm Donna, your Academy Assistant. What's your name?",
    fieldKey: 'directorName',
    helperText: 'Optional — helps Donna address you correctly during setup.',
    required: false,
  },
  {
    id: 'first_action',
    question: 'What would you like to do first?',
    spokenText: 'What would you like to do first?',
    fieldKey: 'firstAction',
    helperText: 'You can create a class template, schedule a session, or review what needs attention.',
    required: false,
    suggestedRoutes: [
      { label: 'Create a class template', taskHint: 'create a class template' },
      { label: 'Create a session',        taskHint: 'create a session' },
      { label: 'Review what needs attention', taskHint: 'review queue' },
    ],
  },
]

/** Returns the spoken text for a given step index, or empty string if out of bounds. */
export function getOnboardingStepSpokenText(stepIndex: number): string {
  return DONNA_ONBOARDING_STEPS[stepIndex]?.spokenText ?? ''
}

/** Returns the screen question for a given step index, or empty string if out of bounds. */
export function getOnboardingStepQuestion(stepIndex: number): string {
  return DONNA_ONBOARDING_STEPS[stepIndex]?.question ?? ''
}

/** True while stepIndex is within the sequence. */
export function isOnboardingActive(stepIndex: number | null): stepIndex is number {
  return stepIndex !== null && stepIndex >= 0 && stepIndex < DONNA_ONBOARDING_STEPS.length
}
