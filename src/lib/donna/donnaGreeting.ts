// Sprint 685 — Director greeting content + daily tracking
// Pure TS: no DB, no API. localStorage only. Director role only.
// donnaDailyGreeting.ts handles the coach greeting path separately.

const STORAGE_KEY = 'academyos:donna:lastDonnaGreetingDate:v1'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getTodayDonnaGreetingKey(): string {
  return todayKey()
}

export function shouldShowDailyDonnaGreeting(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(STORAGE_KEY) !== todayKey()
}

export function markDailyDonnaGreetingShown(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, todayKey())
}

function greetingWord(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 18) return 'Good afternoon'
  return 'Good evening'
}

function pageReentryText(name: string | null, pathname: string): string {
  const n = name ? `Hi ${name}` : 'Hi there'
  if (pathname.startsWith('/director/players')) {
    return `${n}. I can help you find which players need review, track development progress, or prepare a parent update.`
  }
  if (pathname.startsWith('/director/review')) {
    return `${n}. I can help you sort approvals, visibility risks, and parent-facing drafts.`
  }
  if (pathname.startsWith('/director/kpi')) {
    return `${n}. I can explain academy KPIs and what needs attention.`
  }
  if (pathname.startsWith('/director/curriculum')) {
    return `${n}. I can help inspect curriculum gaps or draft changes for review.`
  }
  if (pathname.startsWith('/director/signals')) {
    return `${n}. I can help interpret academy signals and attention items.`
  }
  if (pathname.startsWith('/director/placement')) {
    return `${n}. I can help review placement recommendations and onboarding signals.`
  }
  if (pathname.startsWith('/director/level-up')) {
    return `${n}. I can help review level movement readiness and approval items.`
  }
  return `${n}. I can help you understand what needs attention today.`
}

/**
 * Builds the opening greeting text for the director DONNA panel.
 * isFirstOpenToday should come from shouldShowDailyDonnaGreeting().
 */
export function buildDonnaOpeningGreeting(
  firstName: string | null,
  pathname: string,
  isFirstOpenToday: boolean,
): { primaryText: string; followUp: string } {
  if (isFirstOpenToday) {
    const salutation = firstName ? `${greetingWord()}, ${firstName}` : greetingWord()
    return {
      primaryText: `${salutation}. I'm ready to help you review today's priorities, player signals, coach follow-ups, and anything waiting for approval.`,
      followUp: 'Would you like me to walk you through what needs attention?',
    }
  }
  return {
    primaryText: pageReentryText(firstName, pathname),
    followUp: '',
  }
}
