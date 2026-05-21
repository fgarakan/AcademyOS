// Sprint 454 — Mobile Interaction Pattern System V1
// Typed constants and helpers for mobile UX patterns.
// No React, no DB, no async. Used by components and docs alike.

// ── Tap target standards ──────────────────────────────────────────────────────

// Minimum tap target per WCAG 2.5.8 recommendation: 24×24px. Preferred: 44×44px.
export const TAP_TARGET = {
  minimumPx: 24,
  preferredPx: 44,
  iconButtonClass: 'min-w-[44px] min-h-[44px] flex items-center justify-center',
  listItemClass: 'min-h-[48px] flex items-center',
  bottomTabClass: 'flex-1 flex flex-col items-center gap-1 py-3 px-2',
} as const

// ── Bottom sheet config ────────────────────────────────────────────────────────

export interface BottomSheetConfig {
  id: string
  title: string
  description?: string
  maxHeightVh: number       // 0-100; 85 = 85vh
  isDismissible: boolean
  hasHandle: boolean
}

export function makeBottomSheetConfig(
  id: string,
  title: string,
  opts?: Partial<Omit<BottomSheetConfig, 'id' | 'title'>>,
): BottomSheetConfig {
  return {
    id,
    title,
    description: opts?.description,
    maxHeightVh: opts?.maxHeightVh ?? 85,
    isDismissible: opts?.isDismissible ?? true,
    hasHandle: opts?.hasHandle ?? true,
  }
}

// ── Standard mobile sheet definitions ─────────────────────────────────────────

export const MOBILE_SHEETS = {
  DONNA_QUICK_ASK: makeBottomSheetConfig('donna-quick-ask', 'Ask DONNA', {
    maxHeightVh: 75,
    description: 'Ask anything about the academy',
  }),
  ATTENDANCE_MARK: makeBottomSheetConfig('attendance-mark', 'Mark Attendance', {
    maxHeightVh: 90,
    description: 'Mark session attendance',
  }),
  QUICK_CAPTURE: makeBottomSheetConfig('quick-capture', 'Quick Capture', {
    maxHeightVh: 70,
    description: 'Capture a coach note or curriculum idea',
  }),
  PLAYER_WATCH_FOR: makeBottomSheetConfig('player-watch-for', 'Watch-For', {
    maxHeightVh: 60,
    description: 'View player watch-fors for this session',
  }),
  APPROVAL_REVIEW: makeBottomSheetConfig('approval-review', 'Review Action', {
    maxHeightVh: 85,
    description: 'Review and approve or reject a proposed action',
  }),
} as const

// ── Floating action button patterns ──────────────────────────────────────────

export type FabAction =
  | 'voice_capture'
  | 'ask_donna'
  | 'quick_note'
  | 'mark_attendance'
  | 'start_recap'

export interface FabConfig {
  action: FabAction
  label: string
  ariaLabel: string
  className: string
}

export const FAB_CONFIGS: Record<FabAction, FabConfig> = {
  voice_capture: {
    action: 'voice_capture',
    label: 'Record',
    ariaLabel: 'Start voice capture',
    className: 'fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-lime text-base flex items-center justify-center shadow-lg',
  },
  ask_donna: {
    action: 'ask_donna',
    label: 'Ask',
    ariaLabel: 'Ask DONNA',
    className: 'fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-lime text-base flex items-center justify-center shadow-lg',
  },
  quick_note: {
    action: 'quick_note',
    label: 'Note',
    ariaLabel: 'Add quick note',
    className: 'fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-surface-raised border border-border text-text-primary flex items-center justify-center shadow-lg',
  },
  mark_attendance: {
    action: 'mark_attendance',
    label: 'Attendance',
    ariaLabel: 'Mark attendance',
    className: 'fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-status-green text-base flex items-center justify-center shadow-lg',
  },
  start_recap: {
    action: 'start_recap',
    label: 'Recap',
    ariaLabel: 'Start session recap',
    className: 'fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-lime text-base flex items-center justify-center shadow-lg',
  },
}

// ── Sticky action bar classes ─────────────────────────────────────────────────

export const STICKY_ACTION_BAR = {
  container: 'sticky bottom-0 left-0 right-0 z-30 bg-surface border-t border-border p-4 flex gap-3',
  primaryButton: 'btn-lime flex-1',
  secondaryButton: 'btn-ghost flex-1',
  dangerButton: 'btn-danger flex-1',
} as const

// ── Mobile form patterns ──────────────────────────────────────────────────────

export const MOBILE_FORM = {
  fullScreen: 'fixed inset-0 z-50 bg-base flex flex-col',
  header: 'flex items-center gap-3 p-4 border-b border-border',
  body: 'flex-1 overflow-y-auto p-4 space-y-4',
  footer: 'p-4 border-t border-border flex gap-3',
  fieldGroup: 'space-y-2',
  label: 'label-xs',
  input: 'w-full bg-surface-raised border border-border rounded-lg px-3 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50',
  textarea: 'w-full bg-surface-raised border border-border rounded-lg px-3 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 resize-none min-h-[100px]',
} as const
