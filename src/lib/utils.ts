import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 14) return 'Last week'
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 60) return 'Last month'
  return `${Math.floor(diffDays / 30)} months ago`
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Translate internal urgency to human label */
export function urgencyToLabel(urgency: string | null): {
  label: string
  color: 'red' | 'orange' | 'amber' | 'muted'
} {
  switch (urgency) {
    case 'immediate': return { label: 'Action needed', color: 'red' }
    case 'urgent':    return { label: 'Needs attention', color: 'orange' }
    case 'high':      return { label: 'Check in', color: 'amber' }
    default:          return { label: 'On track', color: 'muted' }
  }
}

/** Translate signal_type to human label */
export function signalToLabel(signalType: string): string {
  const map: Record<string, string> = {
    overtraining_risk:          'Load warning',
    reassessment_overdue:       'Assessment due',
    reassessment_approaching:   'Assessment coming up',
    utr_regression:             'Competition results dropped',
    score_regression:           'Progress slipped',
    score_improvement:          'Great progress',
    utr_improvement:            'Competition improving',
    curriculum_ready_to_advance:'Ready to move up',
    curriculum_skill_gap:       'Skill area needs work',
    benchmark_below_expectation:'Below expectations',
    benchmark_above_expectation:'Above expectations',
    cohort_below_average:       'Below peer group',
    cohort_above_average:       'Above peer group',
    injury_concern:             'Injury concern',
    load_overload_detected:     'Load warning',
    coach_priority_flagged:     'Coach flagged',
    coach_concern_flagged:      'Coach concern',
  }
  return map[signalType] ?? signalType.replace(/_/g, ' ')
}

/** Translate domain progression status to player-friendly label */
export function domainStatusToPlayerLabel(status: string): {
  label: string
  group: 'nailed' | 'building'
} {
  switch (status) {
    case 'complete':    return { label: 'Nailed it', group: 'nailed' }
    case 'in_progress': return { label: 'Getting there', group: 'building' }
    case 'regressed':   return { label: 'Back to work', group: 'building' }
    default:            return { label: 'Just started', group: 'building' }
  }
}

/** Translate domain status to parent-friendly label */
export function domainStatusToParentLabel(status: string): string {
  switch (status) {
    case 'complete':    return 'Strong'
    case 'in_progress': return 'Coming along'
    case 'regressed':   return 'Coming along'
    default:            return 'Just starting'
  }
}

/** Translate domain status to coach label */
export function domainStatusToCoachLabel(status: string): string {
  switch (status) {
    case 'complete':    return 'Complete'
    case 'in_progress': return 'Building'
    case 'regressed':   return 'Needs review'
    default:            return 'Working on'
  }
}

export function stageColor(stage: string): string {
  const map: Record<string, string> = {
    red_foundation:     '#EF4444',
    orange_development: '#F97316',
    green_performance:  '#22C55E',
    yellow_competitive: '#EAB308',
    high_performance:   '#8B5CF6',
  }
  return map[stage] ?? '#555555'
}

export function stageName(stage: string): string {
  const map: Record<string, string> = {
    red_foundation:     'Red Foundation',
    orange_development: 'Orange Development',
    green_performance:  'Green Performance',
    yellow_competitive: 'Yellow Competitive',
    high_performance:   'High Performance',
  }
  return map[stage] ?? stage
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
