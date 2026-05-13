'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Sparkles, X, Compass, BookOpen, Search, PenLine, ArrowRight, Mic, Layers,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { QuickCaptureDrawer } from '@/components/capture/QuickCaptureDrawer'
import { VoiceInputButton } from '@/components/assistant/VoiceInputButton'
import { TemplateDraftPanel } from '@/components/assistant/TemplateDraftPanel'
import type { TemplateDraft } from '@/components/assistant/templateDraftTypes'
import {
  isTemplateCreationIntent,
  parseTemplateDraft,
} from '@/components/assistant/templateDraftParser'

// ---------------------------------------------------------------------------
// Route context map — static guidance per director route
// ---------------------------------------------------------------------------

interface RouteContext {
  screen: string
  guidance: string
  nextAction: string
}

interface CommandResponse {
  message: string
  type: 'info' | 'honest'
  label?: string
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
  '/director/players/': {
    screen: 'Player Profile',
    guidance:
      "This profile shows the player's current level, active priorities, coach notes, and next recommended actions. Start with the action summary, then review the curriculum connection and coach evidence sections.",
    nextAction: "Review this player's next recommended action in the action summary card.",
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
      'Templates are reusable class blueprints. Assign a curriculum level, generate a lesson plan, and coaches can run it on court. Use Academy Assistant to draft a new template by voice or text.',
    nextAction: 'Create a template or assign a curriculum level to an existing one.',
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
    'What is this page?',
    'Explain this question.',
    'What should I do next?',
  ],
  '/director/onboarding/curriculum': [
    'What is this page?',
    'What should I do next?',
    'What happens when I approve this?',
  ],
  '/director/onboarding': [
    'What should I do next?',
    'Take me to curriculum setup.',
    'What is this page?',
  ],
  '/director/players/': [
    'What should I do next for this player?',
    'Explain this player profile.',
    'Capture a player note.',
  ],
  '/director/review': [
    'What needs approval?',
    'Explain this review item.',
    'Where should I start?',
  ],
  '/director/class-templates': [
    'Help me create an Orange 2 class template.',
    'Create a template with warm-up, rally skills, point play, and matches.',
    'Show me how to build a class template.',
  ],
  '/director/curriculum': [
    'Create a template from this curriculum level.',
    'Help me build an Orange 2 class template.',
    'Explain how curriculum connects to templates.',
  ],
  '/director': [
    'Help me create a class template.',
    'What should I build next?',
    'Brief me on what needs attention.',
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
// Mode config
// ---------------------------------------------------------------------------

type AssistantMode = 'guide' | 'explain' | 'find' | 'capture' | 'create_template'

interface ModeConfig {
  mode: AssistantMode
  label: string
  desc: string
  Icon: React.ElementType
}

const MODES: ModeConfig[] = [
  {
    mode: 'create_template',
    label: 'Create Template',
    desc: 'Draft a class template with Academy Assistant. Nothing saves until you approve.',
    Icon: Layers,
  },
  {
    mode: 'guide',
    label: 'Guide me',
    desc: 'See the suggested next step for this page.',
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
    desc: 'Save a player observation or capture a director thought.',
    Icon: PenLine,
  },
  {
    mode: 'explain',
    label: 'Explain this screen',
    desc: 'Understand what this page is for.',
    Icon: BookOpen,
  },
]

// Template creation quick-start examples — deterministic, no AI
const TEMPLATE_QUICK_STARTS = [
  'Create a template for Orange 2 with standard warm-up, dynamic warm-up, rally skills, point play, and matches.',
  'Build a Yellow 1 class with warm-up, technical work, point play, and match play.',
  'Create a 60-minute Red 2 template with warm-up, rally skills, and matches.',
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  academyId: string
  directorName?: string
}

export function DonnaAssistantButton({ academyId, directorName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [panelOpen, setPanelOpen] = useState(false)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [activeMode, setActiveMode] = useState<AssistantMode | null>(null)

  // Spoken greeting — fires once on first intentional panel open, never again in this session
  const hasGreetedRef = useRef(false)
  const [showGreeting, setShowGreeting] = useState(false)
  const firstName = directorName ? directorName.split(' ')[0] : null
  const greetingText = firstName
    ? `Hi ${firstName}, how can I help you today?`
    : 'Welcome. How can I help you today?'

  function speakGreeting() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(greetingText)
    utt.rate = 1.0
    utt.pitch = 1.0
    window.speechSynthesis.speak(utt)
  }

  // Voice-specific local state — transcript never sent to AI or written to DB
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null)
  const [typeInstead, setTypeInstead] = useState(false)
  const [typedText, setTypedText] = useState('')

  // Template creation state — all local until director explicitly approves and saves
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft | null>(null)
  const [fromVoiceCapture, setFromVoiceCapture] = useState(false)
  const [templateCommandInput, setTemplateCommandInput] = useState('')
  const [commandResponse, setCommandResponse] = useState<CommandResponse | null>(null)

  const ctx = resolveContext(pathname)
  const voicePrompts = resolveVoicePrompts(pathname)

  const closePanel = useCallback(() => {
    setPanelOpen(false)
    setActiveMode(null)
    setTemplateDraft(null)
    setFromVoiceCapture(false)
    setTemplateCommandInput('')
    setCommandResponse(null)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
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
    setTemplateDraft(null)
    setFromVoiceCapture(false)
    setTemplateCommandInput('')
    setCommandResponse(null)
  }, [pathname])

  function handleModeClick(mode: AssistantMode) {
    if (mode === 'capture') {
      setCaptureOpen(true)
      closePanel()
      return
    }
    if (mode === 'create_template') {
      setActiveMode('create_template')
      // If the type-instead area already has a template intent, auto-parse it
      if (typedText && isTemplateCreationIntent(typedText)) {
        setTemplateDraft(parseTemplateDraft(typedText))
        setFromVoiceCapture(false)
      }
      return
    }
    setActiveMode(prev => (prev === mode ? null : mode))
  }

  // Voice transcript stays local — detect template intent first, then navigation/info commands
  function handleVoiceTranscript(text: string) {
    setVoiceTranscript(text)
    setTypeInstead(false)
    if (isTemplateCreationIntent(text)) {
      setTemplateDraft(parseTemplateDraft(text))
      setFromVoiceCapture(true)
      setActiveMode('create_template')
      return
    }
    detectAndHandleCommand(text)
  }

  // Clicking a suggestion executes template intent or navigation/info commands;
  // unrecognized suggestions pre-fill the typed area for manual Send.
  function handleSuggestionClick(prompt: string) {
    if (isTemplateCreationIntent(prompt)) {
      setTemplateDraft(parseTemplateDraft(prompt))
      setFromVoiceCapture(false)
      setActiveMode('create_template')
      return
    }
    const handled = detectAndHandleCommand(prompt)
    if (!handled) {
      setTypeInstead(true)
      setTypedText(prompt)
    }
  }

  function handleParseTemplate() {
    const text = templateCommandInput.trim()
    if (!text) return
    setTemplateDraft(parseTemplateDraft(text))
    setFromVoiceCapture(false)
    setTemplateCommandInput('')
  }

  function handleCancelTemplate() {
    setTemplateDraft(null)
    setFromVoiceCapture(false)
    setTemplateCommandInput('')
    setActiveMode(null)
  }

  // Deterministic command detection — no AI, no API calls.
  // Navigation uses approved /director routes only. Returns true if command was recognized.
  function detectAndHandleCommand(text: string): boolean {
    const lower = text.toLowerCase().trim()

    // Navigation commands — approved routes only, most-specific first
    const NAV_COMMANDS: Array<{ patterns: string[]; href: string }> = [
      {
        patterns: ['take me to curriculum setup', 'go to curriculum setup', 'open curriculum setup'],
        href: '/director/onboarding/curriculum',
      },
      {
        patterns: ['continue setup', 'go to onboarding', 'go to setup', 'take me to onboarding', 'take me to setup'],
        href: '/director/onboarding',
      },
      {
        patterns: ['take me to review', 'go to review queue', 'go to review', 'open review queue', 'open review'],
        href: '/director/review',
      },
      {
        patterns: ['go to players', 'take me to players', 'show me players', 'open players'],
        href: '/director/players',
      },
      {
        patterns: ['go to templates', 'take me to templates', 'show me templates', 'go to class templates', 'open templates'],
        href: '/director/class-templates',
      },
      {
        patterns: ['go to sessions', 'take me to sessions', 'open sessions', 'show me sessions'],
        href: '/director/sessions',
      },
      {
        patterns: ['go to curriculum', 'take me to curriculum', 'open curriculum', 'show me curriculum'],
        href: '/director/curriculum',
      },
    ]

    for (const { patterns, href } of NAV_COMMANDS) {
      if (patterns.some(p => lower.includes(p))) {
        router.push(href)
        closePanel()
        return true
      }
    }

    // Go back — only within /director, not from the root dashboard
    if (lower.includes('go back') || lower === 'back') {
      if (pathname.startsWith('/director') && pathname !== '/director') {
        router.back()
        closePanel()
      } else {
        setCommandResponse({
          message: 'You are already at the main director screen.',
          type: 'honest',
          label: 'Not available',
        })
      }
      return true
    }

    // Capture a note — mirrors the "Capture a note" mode button
    if (
      lower.includes('capture a note') ||
      lower.includes('capture a player note') ||
      lower.includes('take a note') ||
      lower.includes('save a note')
    ) {
      setCaptureOpen(true)
      closePanel()
      return true
    }

    // Explain this page / screen
    if (
      lower.includes('what is this page') ||
      lower.includes('what page am i') ||
      lower.includes('explain this screen')
    ) {
      setCommandResponse({ message: ctx.guidance, type: 'info', label: 'About this page' })
      setActiveMode('explain')
      return true
    }

    // What should I do next
    if (
      lower.includes('what should i do next') ||
      lower.includes("what's next") ||
      lower.includes('guide me') ||
      lower === 'what do i do'
    ) {
      setCommandResponse({ message: ctx.nextAction, type: 'info', label: 'Suggested next step' })
      setActiveMode('guide')
      return true
    }

    // What needs approval / where should I start — maps to nextAction (route-aware)
    if (
      lower.includes('what needs approval') ||
      lower.includes('where should i start') ||
      lower.includes('where do i start')
    ) {
      setCommandResponse({ message: ctx.nextAction, type: 'info', label: 'Suggested next step' })
      setActiveMode('guide')
      return true
    }

    // What happens when I approve — curriculum-specific, honest elsewhere
    if (lower.includes('what happens when i approve') || lower.includes('what happens if i approve')) {
      setCommandResponse({
        message: pathname.startsWith('/director/onboarding/curriculum')
          ? "Approving curriculum setup confirms your academy's development spine. It connects players to levels, enables session planning, and activates the full Academy OS workflow."
          : ctx.guidance,
        type: 'info',
        label: 'About approval',
      })
      return true
    }

    // Explain this question — honest on interview page (step index not accessible from here)
    if (
      lower.includes('explain this question') ||
      lower.includes('explain the question') ||
      lower.includes('explain this q')
    ) {
      if (pathname.startsWith('/director/onboarding/interview')) {
        setCommandResponse({
          message:
            'This interview has 7 questions covering: your academy philosophy, player focus, development priorities, competition approach, parent communication style, coach operating style, and 90-day success vision. Answer one at a time using the on-screen form.',
          type: 'info',
          label: 'About this question',
        })
      } else {
        setCommandResponse({ message: ctx.guidance, type: 'info', label: 'About this page' })
      }
      return true
    }

    // Broad "explain this" catch-all — after specific "explain this question" is already handled above
    if (lower.startsWith('explain') || lower.includes('explain this')) {
      setCommandResponse({ message: ctx.guidance, type: 'info', label: 'About this page' })
      setActiveMode('explain')
      return true
    }

    // Honest fallbacks — commands that look functional but are not yet wired
    if (lower.includes('next question') || lower.includes('skip question')) {
      setCommandResponse({
        message: 'Direct question control is not wired yet. Use the on-screen Confirm button to move forward.',
        type: 'honest',
        label: 'Not available yet',
      })
      return true
    }

    if (lower.includes('confirm') && (lower.includes('answer') || lower.includes('this') || lower.includes('it'))) {
      setCommandResponse({
        message: 'Confirming your answer is handled by the on-screen button. Click Confirm in the interview form to move forward.',
        type: 'honest',
        label: 'Not available yet',
      })
      return true
    }

    return false
  }

  function handleCommandSubmit() {
    const text = typedText.trim()
    if (!text) return
    if (isTemplateCreationIntent(text)) {
      setTemplateDraft(parseTemplateDraft(text))
      setFromVoiceCapture(false)
      setActiveMode('create_template')
      setTypeInstead(false)
      return
    }
    const handled = detectAndHandleCommand(text)
    if (!handled) {
      setCommandResponse({
        message:
          'I didn\'t recognize that command. Try: "What is this page?", "What should I do next?", "Open review queue", or start a template with "Create a template for…"',
        type: 'honest',
        label: 'Not recognized',
      })
    }
    setTypeInstead(false)
    setTypedText('')
  }

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Floating trigger                                                      */}
      {/* ------------------------------------------------------------------ */}
      <button
        onClick={() => {
          setPanelOpen(true)
          if (!hasGreetedRef.current) {
            hasGreetedRef.current = true
            setShowGreeting(true)
            speakGreeting()
          }
        }}
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
              Ask by voice, type a command, or choose an action below.
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

          {/* ── Spoken greeting card — shown on first open, persists while panel is open ── */}
          {showGreeting && (
            <div
              className="rounded-xl px-3.5 py-3"
              style={{
                background: 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.18)',
              }}
            >
              <p
                className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                style={{ color: '#8b5cf6' }}
              >
                Academy Assistant
              </p>
              <p className="text-[13px] text-text-primary font-medium leading-snug">
                {greetingText}
              </p>
            </div>
          )}

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
                  {activeMode !== 'create_template' && (
                    <p className="text-[10px] text-text-muted mt-1.5 leading-snug">
                      To save, use "Capture a note" below.
                    </p>
                  )}
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
                    placeholder='Type a command or question — e.g. "What is this page?" or "Create a template for Orange 2."'
                    value={typedText}
                    onChange={e => setTypedText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleCommandSubmit()
                      }
                    }}
                    className="w-full rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleCommandSubmit}
                      disabled={!typedText.trim()}
                      className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50"
                    >
                      Send
                    </button>
                    <button
                      onClick={() => { setTypeInstead(false); setTypedText('') }}
                      className="text-[10px] text-text-muted underline underline-offset-2 hover:text-text-secondary transition-colors"
                    >
                      Cancel
                    </button>
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
                    &ldquo;{prompt}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Command response card ── */}
          {commandResponse && (
            <div
              className="rounded-xl px-3.5 py-3"
              style={{
                background:
                  commandResponse.type === 'honest'
                    ? 'rgba(255,149,0,0.06)'
                    : 'rgba(139,92,246,0.06)',
                border:
                  commandResponse.type === 'honest'
                    ? '1px solid rgba(255,149,0,0.2)'
                    : '1px solid rgba(139,92,246,0.18)',
              }}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                    style={{ color: commandResponse.type === 'honest' ? '#FF9500' : '#8b5cf6' }}
                  >
                    {commandResponse.label ?? (commandResponse.type === 'honest' ? 'Not available yet' : 'Academy Assistant')}
                  </p>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    {commandResponse.message}
                  </p>
                </div>
                <button
                  onClick={() => setCommandResponse(null)}
                  aria-label="Dismiss"
                  className="shrink-0 text-text-muted hover:text-text-primary transition-colors mt-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* ── Current screen context card ── */}
          {activeMode !== 'create_template' && (
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
          )}

          {/* ── Inline response: Guide me ── */}
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

          {/* ── Inline response: Explain this screen ── */}
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

          {/* ── Inline response: Find something ── */}
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

          {/* ── Template creation mode ── */}
          {activeMode === 'create_template' && (
            <>
              {/* "Nothing saves until you approve" notice */}
              <div
                className="rounded-lg px-3 py-2.5"
                style={{
                  background: 'rgba(139,92,246,0.05)',
                  border: '1px solid rgba(139,92,246,0.15)',
                }}
              >
                <p className="text-[11px] text-text-secondary leading-snug">
                  Academy Assistant can draft this template, but nothing is saved until you
                  approve.
                </p>
              </div>

              {/* Command input — shown when no draft exists yet */}
              {!templateDraft && (
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <textarea
                      rows={3}
                      placeholder='e.g. "Create a template for Orange 2 with warm-up, rally skills, point play, and matches."'
                      value={templateCommandInput}
                      onChange={e => setTemplateCommandInput(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleParseTemplate}
                        disabled={!templateCommandInput.trim()}
                        className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50"
                      >
                        Start Draft
                      </button>
                      <button
                        onClick={() => setActiveMode(null)}
                        className="btn-ghost text-xs px-3 py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Quick starts — deterministic examples, no AI */}
                  <div
                    className="rounded-xl px-3.5 py-3"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">
                      Quick starts
                    </p>
                    <div className="space-y-0.5">
                      {TEMPLATE_QUICK_STARTS.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setTemplateDraft(parseTemplateDraft(s))
                            setFromVoiceCapture(false)
                            setTemplateCommandInput('')
                          }}
                          className="w-full text-left text-[11px] text-text-secondary hover:text-text-primary
                            px-2.5 py-1.5 rounded-lg hover:bg-surface-raised transition-all leading-snug"
                        >
                          &ldquo;{s}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Live draft panel — shown once a draft exists */}
              {templateDraft && (
                <TemplateDraftPanel
                  draft={templateDraft}
                  onUpdateDraft={d => setTemplateDraft(d)}
                  onCancel={handleCancelTemplate}
                  fromVoice={fromVoiceCapture}
                />
              )}
            </>
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

        {/* Footer — capability summary */}
        <div
          className="px-4 py-3 shrink-0 space-y-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
            What I can do right now
          </p>
          <ul className="space-y-1">
            {[
              'Guide you through the current page',
              'Take you to approved Academy OS pages',
              'Capture notes',
              'Draft class templates for review',
              'Save only after your explicit approval',
            ].map(item => (
              <li key={item} className="flex items-start gap-1.5 text-[11px] text-text-muted">
                <span className="mt-px shrink-0" style={{ color: '#8b5cf6' }}>·</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-text-muted leading-snug">
            Some commands, like advancing setup questions by voice, still use the on-screen controls for safety.
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
