'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Sparkles, X, Compass, BookOpen, Search, PenLine, ArrowRight, Mic } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { QuickCaptureDrawer } from '@/components/capture/QuickCaptureDrawer'
import { VoiceInputButton } from '@/components/assistant/VoiceInputButton'

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
    guidance:
      "This is where your academy's development system lives. Start by reviewing the current spine, then continue setup or open the builder.",
    nextAction: 'Review your spine or open the Curriculum Builder to customize it.',
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
    'Use this assistant to guide setup, find pages, or capture a note.',
  nextAction: 'Ask what to do next.',
}

// ---------------------------------------------------------------------------
// Route-aware voice prompt suggestions
// ---------------------------------------------------------------------------

const VOICE_PROMPTS: Record<string, string[]> = {
  '/director/onboarding/interview': [
    'How should I answer this question?',
    'What happens after setup?',
    'Explain the current question.',
  ],
  '/director/onboarding/curriculum': [
    'What should I review first?',
    'Explain the curriculum spine.',
    'What happens when I approve this?',
  ],
  '/director/onboarding': [
    'What should I do next?',
    'Explain this onboarding step.',
    'What does curriculum setup unlock?',
  ],
  '/director/review': [
    'What needs approval?',
    'Explain this review item.',
    'Where should I start?',
  ],
  '/director': [
    'Brief me on what needs attention.',
    'What should I check first?',
    'Show me setup progress.',
  ],
}

const FALLBACK_PROMPTS = ['What should I do next?', 'Show me what needs attention.']

function resolveContext(pathname: string): RouteContext {
  if (ROUTE_CONTEXT[pathname]) return ROUTE_CONTEXT[pathname]
  const match = Object.keys(ROUTE_CONTEXT)
    .filter(k => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return match ? ROUTE_CONTEXT[match] : FALLBACK_CONTEXT
}

function resolveVoicePrompts(pathname: string): string[] {
  if (VOICE_PROMPTS[pathname]) return VOICE_PROMPTS[pathname]
  const match = Object.keys(VOICE_PROMPTS)
    .filter(k => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return match ? VOICE_PROMPTS[match] : FALLBACK_PROMPTS
}

// ---------------------------------------------------------------------------
// Quick links
// ---------------------------------------------------------------------------

const QUICK_LINKS = [
  { label: 'Players',      href: '/director/players' },
  { label: 'Sessions',     href: '/director/sessions' },
  { label: 'Curriculum',   href: '/director/curriculum' },
  { label: 'Review Queue', href: '/director/review' },
  { label: 'Onboarding',   href: '/director/onboarding' },
]

// ---------------------------------------------------------------------------
// Mode config — voice is the primary card, not a mode button
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
  {
    mode: 'explain',
    label: 'Explain this screen',
    desc: 'Understand what this page is for.',
    Icon: BookOpen,
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

  // Voice-specific local state — transcript never sent to AI or written to DB
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null)
  const [typeInstead, setTypeInstead] = useState(false)
  const [typedText, setTypedText] = useState('')

  const ctx = resolveContext(pathname)
  const voicePrompts = resolveVoicePrompts(pathname)

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

  // Clear all inline state on route change
  useEffect(() => {
    setActiveMode(null)
    setVoiceTranscript(null)
    setTypeInstead(false)
    setTypedText('')
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

  // Transcript stays local — displayed in panel only, never sent anywhere
  function handleVoiceTranscript(text: string) {
    setVoiceTranscript(text)
    setTypeInstead(false)
  }

  // Clicking a suggestion pre-fills the type-instead area as a reference script
  function handleSuggestionClick(prompt: string) {
    setTypeInstead(true)
    setTypedText(prompt)
  }

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Floating trigger — premium assistant identity, not a lime action    */}
      {/* ------------------------------------------------------------------ */}
      <button
        onClick={() => setPanelOpen(true)}
        aria-label="Ask Academy Assistant"
        title="Ask Academy Assistant"
        className={cn(
          'fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full',
          'flex items-center justify-center',
          'text-white',
          'shadow-[0_4px_16px_rgba(139,92,246,0.4)]',
          'hover:brightness-110 hover:-translate-y-0.5',
          'hover:shadow-[0_6px_22px_rgba(139,92,246,0.55)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-black',
          'active:scale-95 transition-all duration-200',
        )}
        style={{
          background: 'linear-gradient(135deg, #6d28d9, #4338ca)',
          border: '1px solid rgba(139,92,246,0.35)',
        }}
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
              <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: '#8b5cf6' }} />
              <h2 className="text-sm font-semibold text-text-primary">Academy Assistant</h2>
            </div>
            <p className="text-[11px] text-text-muted leading-snug">
              Ask by voice, find what you need, or capture a note.
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

          {/* ── Primary voice card ── */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(139,92,246,0.2)' }}
          >
            {/* Voice input area */}
            <div
              className="px-4 py-3.5"
              style={{
                background: 'linear-gradient(135deg, rgba(109,40,217,0.09), rgba(67,56,202,0.05))',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Mic className="w-3.5 h-3.5 shrink-0" style={{ color: '#8b5cf6' }} />
                <p className="text-sm font-semibold text-text-primary">Ask by voice</p>
              </div>
              <p className="text-[11px] text-text-muted leading-snug mb-3">
                Use voice to ask what to do next, explain this screen, or capture a director note.
              </p>

              {/* VoiceInputButton — browser SpeechRecognition only, no API, no DB write */}
              <VoiceInputButton
                onTranscript={handleVoiceTranscript}
                label="Start voice"
                appendMode={false}
              />

              {/* Voice transcript — displayed locally only */}
              {voiceTranscript && (
                <div
                  className="mt-3 rounded-lg px-3 py-2.5"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid rgba(139,92,246,0.18)',
                  }}
                >
                  <p
                    className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                    style={{ color: '#8b5cf6' }}
                  >
                    Voice captured
                  </p>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    {voiceTranscript}
                  </p>
                  <p className="text-[10px] text-text-muted mt-1.5 leading-snug">
                    To save, use "Capture a note" below.
                  </p>
                  <button
                    onClick={() => setVoiceTranscript(null)}
                    className="mt-1 text-[10px] text-text-muted underline underline-offset-2 hover:text-text-secondary transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Type instead */}
              {!typeInstead ? (
                <button
                  onClick={() => setTypeInstead(true)}
                  className="mt-2.5 text-[11px] text-text-muted hover:text-text-secondary underline underline-offset-2 transition-colors"
                >
                  Type instead
                </button>
              ) : (
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Type your question or note…"
                    value={typedText}
                    onChange={e => setTypedText(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  />
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => { setTypeInstead(false); setTypedText('') }}
                      className="text-[10px] text-text-muted underline underline-offset-2 hover:text-text-secondary transition-colors"
                    >
                      Cancel
                    </button>
                    <p className="text-[10px] text-text-muted">
                      Use "Capture a note" below to save.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Route-aware suggestions — hints only, no AI requests */}
            <div
              className="px-4 py-3"
              style={{
                borderTop: '1px solid rgba(139,92,246,0.1)',
                background: 'var(--bg-surface)',
              }}
            >
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">
                Suggested questions
              </p>
              <div className="space-y-0.5">
                {voicePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="w-full text-left text-[11px] text-text-secondary hover:text-text-primary
                      px-2.5 py-1.5 rounded-lg hover:bg-surface-raised transition-all leading-snug"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Current screen context card ── */}
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
              className="rounded-xl px-3.5 py-3"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid rgba(139,92,246,0.15)',
              }}
            >
              <p
                className="text-[10px] uppercase tracking-widest font-semibold mb-1.5"
                style={{ color: '#8b5cf6' }}
              >
                Suggested next step
              </p>
              <p className="text-[12px] text-text-secondary leading-relaxed">{ctx.nextAction}</p>
            </div>
          )}

          {/* Inline response: Explain this screen */}
          {activeMode === 'explain' && (
            <div
              className="rounded-xl px-3.5 py-3"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid rgba(139,92,246,0.15)',
              }}
            >
              <p
                className="text-[10px] uppercase tracking-widest font-semibold mb-1.5"
                style={{ color: '#8b5cf6' }}
              >
                About this screen
              </p>
              <p className="text-[12px] text-text-secondary leading-relaxed">{ctx.guidance}</p>
            </div>
          )}

          {/* Inline response: Find something */}
          {activeMode === 'find' && (
            <div
              className="rounded-xl px-3.5 py-3"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
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

          {/* ── Mode buttons ── */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold px-0.5 pt-1">
              What would you like?
            </p>

            {MODES.map(({ mode, label, desc, Icon }) => (
              <button
                key={mode}
                onClick={() => handleModeClick(mode)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150',
                  activeMode === mode
                    ? 'text-text-primary'
                    : 'text-text-secondary hover:text-text-primary',
                )}
                style={{
                  background:
                    activeMode === mode ? 'rgba(139,92,246,0.06)' : 'var(--bg-surface)',
                  border:
                    activeMode === mode
                      ? '1px solid rgba(139,92,246,0.2)'
                      : '1px solid var(--border)',
                }}
              >
                <div className="flex items-start gap-2.5">
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5 mt-0.5 shrink-0',
                      activeMode === mode ? 'text-violet-400' : 'text-text-muted',
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
          <p className="text-[10px] text-text-muted text-center leading-snug">
            Voice will become the fastest way to guide setup, capture notes, and ask what needs attention.
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
