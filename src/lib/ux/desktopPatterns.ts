// Sprint 455 — Desktop Command Center Layout System V1
// Typed layout patterns for the director desktop command center.
// Pure constants. No React, no DB, no async.

// ── Layout region classes ─────────────────────────────────────────────────────

export const DESKTOP_LAYOUT = {
  // Three-column command center
  threeCol: {
    outer: 'grid grid-cols-[1fr_320px_280px] gap-4 h-full',
    primary: 'min-w-0 space-y-4',
    secondary: 'space-y-4',
    tertiary: 'space-y-4',
  },
  // Split-pane review (list + detail)
  splitPane: {
    outer: 'flex h-[calc(100vh-64px)] overflow-hidden',
    list: 'w-80 shrink-0 overflow-y-auto border-r border-border',
    detail: 'flex-1 overflow-y-auto p-6',
  },
  // Full-width with sidebar push
  withSidebar: {
    outer: 'flex min-h-screen',
    sidebar: 'w-60 shrink-0 border-r border-border overflow-y-auto',
    main: 'flex-1 min-w-0 overflow-y-auto',
  },
  // KPI dashboard grid
  kpiGrid: {
    twoCol: 'grid grid-cols-2 gap-4',
    threeCol: 'grid grid-cols-3 gap-4',
    fourCol: 'grid grid-cols-4 gap-4',
    responsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
  },
  // Standard page container
  page: 'p-6 max-w-7xl mx-auto space-y-6',
  pageWide: 'p-6 space-y-6',
} as const

// ── Side detail drawer ────────────────────────────────────────────────────────

export const SIDE_DRAWER = {
  overlay: 'fixed inset-0 z-40 bg-black/50',
  panel: 'fixed right-0 top-0 bottom-0 z-50 w-[480px] bg-surface border-l border-border overflow-y-auto flex flex-col',
  header: 'sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between',
  body: 'flex-1 px-6 py-4 space-y-4',
  footer: 'sticky bottom-0 bg-surface border-t border-border px-6 py-4 flex gap-3',
} as const

// ── Sticky DONNA panel ────────────────────────────────────────────────────────

export const DONNA_PANEL = {
  fixed: 'fixed right-6 bottom-6 z-50 w-[380px] max-h-[600px] flex flex-col bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden',
  header: 'flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-raised',
  messages: 'flex-1 overflow-y-auto px-4 py-3 space-y-3',
  input: 'px-4 py-3 border-t border-border',
} as const

// ── Activity feed ─────────────────────────────────────────────────────────────

export const ACTIVITY_FEED = {
  container: 'space-y-1',
  item: 'flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-surface-raised transition-colors',
  dot: 'mt-1.5 w-1.5 h-1.5 rounded-full bg-text-muted shrink-0',
  dotLime: 'mt-1.5 w-1.5 h-1.5 rounded-full bg-lime shrink-0',
  dotRed: 'mt-1.5 w-1.5 h-1.5 rounded-full bg-status-red shrink-0',
  dotOrange: 'mt-1.5 w-1.5 h-1.5 rounded-full bg-status-orange shrink-0',
  text: 'text-sm text-text-secondary leading-snug',
  time: 'text-xs text-text-muted mt-0.5',
} as const

// ── Approval workspace ────────────────────────────────────────────────────────

export const APPROVAL_WORKSPACE = {
  container: 'flex h-[calc(100vh-64px)]',
  queue: 'w-80 shrink-0 border-r border-border overflow-y-auto flex flex-col',
  queueHeader: 'sticky top-0 bg-surface border-b border-border px-4 py-3',
  queueItem: 'px-4 py-3 border-b border-border cursor-pointer hover:bg-surface-raised transition-colors',
  queueItemActive: 'px-4 py-3 border-b border-border bg-lime/5 border-l-2 border-l-lime',
  detail: 'flex-1 overflow-y-auto p-6 space-y-4',
  actions: 'flex gap-3 pt-4 border-t border-border',
} as const

// ── Section header patterns ────────────────────────────────────────────────────

export const SECTION_HEADERS = {
  pageTitle: 'text-xl font-semibold text-text-primary',
  sectionTitle: 'text-sm font-semibold text-text-secondary uppercase tracking-wide',
  groupTitle: 'text-xs text-text-muted uppercase tracking-widest',
} as const
