'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Sparkles, X, Compass, BookOpen, Search, PenLine, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { QuickCaptureDrawer } from '@/components/capture/QuickCaptureDrawer'

// ---------------------------------------------------------------------------
// Route context map — static guidance per director route
// ---------------------------------------------------------------------------

interface RouteContext {
  screen: string
  guidance: string
  nextAction: string
}

const ROUTE_CONTEXT: Record<string, RouteContext> = {
  '/director': {
    screen: 'Dashboard',
    guidance:
      "This is your director overview. Start with anything that needs review, then check today's sessions and player priorities.",
    nextAction: 'Review what needs attention.',
  },
  '/director/onboarding/interview': {
    screen: 'Academy Setup Assistant',
    guidance:
      'Answer one question at a time. Your answers help Academy OS understand how your academy works.',
    nextAction: 'Complete the current question.',
  },
  '/director/onboarding/curriculum': {
    screen: 'Curriculum Setup',
    guidance:
      'Approve or customize your curriculum spine so Academy OS can connect players, levels, and sessions.',
    nextAction: 'Continue curriculum setup.',
  },
  '/director/onboarding': {
    screen: 'Academy Onboarding',
    guidance:
      "You're setting up the foundation of your Academy OS. Follow the Next Best Step card to keep moving.",
    nextAction: 'Continue your next setup step.',
  },
  '/director/review': {
    screen: 'Review Queue',
    guidance:
      'This is where important items wait for your approval before they affect players, parents, sessions, or curriculum.',
    nextAction: 'Start with Needs Approval.',
  },
  '/director/curriculum': {
    screen: 'Curriculum',
    guidance: "This is where your academy's development system lives.",
    nextAction: 'Continue curriculum setup or review your levels.',
  },
  '/director/players': {
    screen: 'Players',
    guidance:
      'This is where player profiles, levels, priorities, and development records live.',
    nextAction: 'Review players needing attention.',
  },
  '/director/sessions': {
    screen: 'Sessions',
    guidance: 'This is where session planning and coach execution connect.',
    nextAction: 'Review or create the next session.',
  },
  '/director/class-templates': {
    screen: 'Templates',
    guidance:
      'Templates help you organize repeatable class plans, training blocks, and session structures.',
    nextAction: 'Review or create a template.',
  },
}

const FALLBACK_CONTEXT: RouteContext = {
  screen: 'Academy OS',
  guidance:
    'I can help explain this page, point you to the next step, or capture a note.',
  nextAction: 'Ask what to do next.',
}

const QUICK_LINKS = [
  { label: 'Players',      href: '/director/players' },
  { label: 'Sessions',     href: '/director/sessions' },
  { label: 'Curriculum',   href: '/director/curriculum' },
  { label: 'Review Queue', href: '/director/review' },
  { label: 'Onboarding',   href: '/director/onboarding' },
]

function resolveContext(pathname: string): RouteContext {
  if (ROUTE_CONTEXT[pathname]) return ROUTE_CONTEXT[pathname]
  // Longest-prefix match so /director/onboarding/interview beats /director/onboarding
  const match = Object.keys(ROUTE_CONTEXT)
    .filter(k => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return match ? ROUTE_CONTEXT[match] : FALLBACK_CONTEXT
}

// ---------------------------------------------------------------------------
// Assistant modes
// ---------------------------------------------------------------------------

type AssistantMode = 'guide' | 'explain' | 'find' | 'capture'

interface ModeConfig {
  mode: AssistantMode
  label: string
  desc: string
  Icon: React.ElementType
}

const MODES: ModeConfig[] = [
  {
    mode: 'guide',
    label: 'Guide me',
    desc: 'See what to do next and why it matters.',
    Icon: Compass,
  },
  {
    mode: 'explain',
    label: 'Explain this screen',
    desc: 'Understand what this page is for.',
    Icon: BookOpen,
  },
  {
    mode: 'find',
    label: 'Find something',
    desc: 'Jump to players, sessions, curriculum, or review items.',
    Icon: Search,
  },
  {
    mode: 'capture',
    label: 'Capture a note',
    desc: 'Save a coach note, player observation, or director thought.',
    Icon: PenLine,
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  academyId: string
}

export function DonnaAssistantButton({ academyId }: Props) {
  const pathname = usePathname()
  const [panelOpen, setPanelOpen] = useState(false)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [activeMode, setActiveMode] = useState<AssistantMode | null>(null)

  const ctx = resolveContext(pathname)

  const closePanel = useCallback(() => {
    setPanelOpen(false)
    setActiveMode(null)
  }, [])

  // Escape closes the panel
  useEffect(() => {
    if (!panelOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closePanel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [panelOpen, closePanel])

  // Clear inline response on route change
  useEffect(() => {
    setActiveMode(null)
  }, [pathname])

  function handleModeClick(mode: AssistantMode) {
    if (mode === 'capture') {
      // Capture opens the existing QuickCaptureDrawer — no new DB logic
      setCaptureOpen(true)
      closePanel()
      return
    }
    setActiveMode(prev => (prev === mode ? null : mode))
  }

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Floating trigger — single bottom-right action button                */}
      {/* ------------------------------------------------------------------ */}
      <button
        onClick={() => setPanelOpen(true)}
        aria-label="Ask Academy Assistant"
        title="Ask Academy Assistant"
        className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center
          shadow-lg bg-surface border border-lime/20 text-lime
          hover:border-lime/40 hover:shadow-lime
          active:scale-95 transition-all duration-150"
      >
        <Sparkles className="w-[18px] h-[18px]" />
      </button>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile backdrop                                                      */}
      {/* ------------------------------------------------------------------ */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/50"
          onClick={closePanel}
          aria-hidden="true"
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Side panel                                                           */}
      {/* ------------------------------------------------------------------ */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Academy Assistant"
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[90vw] flex flex-col',
          'transition-transform duration-200 ease-out',
          panelOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none',
        )}
        style={{
          background: 'var(--bg-sidebar)',
          borderLeft: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 pt-5 pb-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
              <h2 className="text-sm font-semibold text-text-primary">Academy Assistant</h2>
            </div>
            <p className="text-[11px] text-text-muted leading-snug">
              Guidance, search, and quick capture for your academy.
            </p>
          </div>
          <button
            onClick={closePanel}
            aria-label="Close assistant"
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ml-2 mt-0.5
              text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

          {/* Current screen context card */}
          <div
            className="rounded-xl px-3.5 py-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">
              Current screen
            </p>
            <p className="text-sm font-semibold text-text-primary mb-1.5">{ctx.screen}</p>
            <p className="text-[12px] text-text-secondary leading-relaxed">{ctx.guidance}</p>
          </div>

          {/* Inline response: Guide me */}
          {activeMode === 'guide' && (
            <div
              className="rounded-xl px-3.5 py-3 border border-lime/15"
              style={{ background: 'var(--bg-surface)' }}
            >
              <p className="text-[10px] uppercase tracking-widest text-lime font-semibold mb-1.5">
                Suggested next step
              </p>
              <p className="text-[12px] text-text-secondary leading-relaxed">{ctx.nextAction}</p>
            </div>
          )}

          {/* Inline response: Explain this screen */}
          {activeMode === 'explain' && (
            <div
              className="rounded-xl px-3.5 py-3 border border-lime/15"
              style={{ background: 'var(--bg-surface)' }}
            >
              <p className="text-[10px] uppercase tracking-widest text-lime font-semibold mb-1.5">
                About this screen
              </p>
              <p className="text-[12px] text-text-secondary leading-relaxed">{ctx.guidance}</p>
            </div>
          )}

          {/* Inline response: Find something */}
          {activeMode === 'find' && (
            <div
              className="rounded-xl px-3.5 py-3 border border-border"
              style={{ background: 'var(--bg-surface)' }}
            >
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">
                Jump to
              </p>
              <div className="space-y-0.5">
                {QUICK_LINKS.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closePanel}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg
                      text-[12px] text-text-secondary hover:text-text-primary hover:bg-surface-raised
                      transition-all"
                  >
                    {link.label}
                    <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Mode buttons */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold px-0.5 pt-1">
              What would you like?
            </p>

            {MODES.map(({ mode, label, desc, Icon }) => (
              <button
                key={mode}
                onClick={() => handleModeClick(mode)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-150',
                  activeMode === mode
                    ? 'border-lime/25 text-text-primary'
                    : 'border-border text-text-secondary hover:border-border/60 hover:text-text-primary',
                )}
                style={{
                  background:
                    activeMode === mode
                      ? 'rgba(17,217,223,0.05)'
                      : 'var(--bg-surface)',
                }}
              >
                <div className="flex items-start gap-2.5">
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5 mt-0.5 shrink-0',
                      activeMode === mode ? 'text-lime' : 'text-text-muted',
                    )}
                  />
                  <div>
                    <p className="text-[12px] font-semibold leading-tight">{label}</p>
                    <p className="text-[11px] text-text-muted leading-snug mt-0.5">{desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <p className="text-[10px] text-text-muted text-center">
            Academy Assistant · V1 · More capabilities coming
          </p>
        </div>
      </aside>

      {/* Quick Capture drawer — opened from Capture mode */}
      <QuickCaptureDrawer
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        academyId={academyId}
      />
    </>
  )
}
