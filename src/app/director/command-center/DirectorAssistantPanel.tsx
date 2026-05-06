'use client'

import { useState } from 'react'
import { ClipboardList, Users, AlertTriangle, Calendar, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { AssistantActionCard } from '@/components/assistant/AssistantActionCard'
import type { RiskLevel } from '@/components/assistant/AssistantActionCard'

interface Props {
  pendingWrapUpsCount: number
  pendingPlacementsCount: number
  assessmentDueCount: number
  pendingReviewCount: number
}

interface AssistantSuggestion {
  id: string
  icon: React.ReactNode
  question: string
  response: (props: Props) => AssistantResponse
}

interface AssistantResponse {
  summary: string
  why: string
  whatWillChange?: string
  visibility?: string
  riskLevel?: RiskLevel
  action: { label: string; href: string }
  safetyNote?: string
}

const SUGGESTIONS: AssistantSuggestion[] = [
  {
    id: 'review_today',
    icon: <ClipboardList className="w-4 h-4" />,
    question: 'What needs review today?',
    response: ({ pendingReviewCount, pendingWrapUpsCount }) => ({
      summary: pendingReviewCount === 0
        ? 'No pending drafts. The review queue is clear.'
        : `${pendingReviewCount} item${pendingReviewCount !== 1 ? 's' : ''} waiting for your review — including ${pendingWrapUpsCount > 0 ? `${pendingWrapUpsCount} coach wrap-up${pendingWrapUpsCount !== 1 ? 's' : ''}` : 'pending drafts'}.`,
      why: 'Coach wrap-ups and other drafts require director review before anything becomes official.',
      whatWillChange: 'Each item you approve updates the relevant record. Rejected items are discarded.',
      visibility: 'Director only until approved.',
      riskLevel: 'medium' as RiskLevel,
      action: { label: 'Open Review Queue', href: '/director/review' },
      safetyNote: 'Nothing changes until you approve each item.',
    }),
  },
  {
    id: 'wrap_ups',
    icon: <ClipboardList className="w-4 h-4" />,
    question: 'Show pending coach wrap-ups',
    response: ({ pendingWrapUpsCount }) => ({
      summary: pendingWrapUpsCount === 0
        ? 'No coach wrap-ups waiting. All recent sessions have been reviewed.'
        : `${pendingWrapUpsCount} coach wrap-up${pendingWrapUpsCount !== 1 ? 's' : ''} submitted and waiting for your review.`,
      why: 'Coaches submitted their end-of-session notes. Review to approve attendance, observations, and flags.',
      whatWillChange: 'Approved wrap-ups update session records and may flag players for follow-up.',
      visibility: 'Coach + Director (internal). Not shared with parents or players.',
      riskLevel: 'medium' as RiskLevel,
      action: { label: 'Review Wrap-Ups', href: '/director/review' },
      safetyNote: 'Coach notes are internal — not shared with parents or players until approved.',
    }),
  },
  {
    id: 'attendance_concerns',
    icon: <AlertTriangle className="w-4 h-4" />,
    question: 'Show players with attendance concerns',
    response: () => ({
      summary: 'Players with 2 or more absences in the last 30 days are flagged in Signals.',
      why: 'Attendance patterns are an early indicator of engagement or family challenges.',
      whatWillChange: 'Viewing signals does not change any records.',
      visibility: 'Director only.',
      riskLevel: 'low' as RiskLevel,
      action: { label: 'View Signals', href: '/director/signals' },
    }),
  },
  {
    id: 'assessment_due',
    icon: <Users className="w-4 h-4" />,
    question: 'Show players needing assessment',
    response: ({ assessmentDueCount }) => ({
      summary: assessmentDueCount === 0
        ? 'No players are currently flagged as reassessment due.'
        : `${assessmentDueCount} player${assessmentDueCount !== 1 ? 's' : ''} flagged as reassessment due.`,
      why: 'Overdue assessments prevent curriculum progression and accurate coaching.',
      visibility: 'Director + Head Coach.',
      riskLevel: 'medium' as RiskLevel,
      action: { label: 'View Players', href: '/director/players' },
      safetyNote: 'Reassessments require explicit director or head coach initiation.',
    }),
  },
  {
    id: 'pending_placements',
    icon: <Users className="w-4 h-4" />,
    question: 'Show new players awaiting placement',
    response: ({ pendingPlacementsCount }) => ({
      summary: pendingPlacementsCount === 0
        ? 'All players have been placed. No pending placements.'
        : `${pendingPlacementsCount} player${pendingPlacementsCount !== 1 ? 's' : ''} created and waiting for placement to be completed.`,
      why: 'New players cannot join groups or receive coaching plans until placement is done.',
      visibility: 'Director only.',
      riskLevel: 'medium' as RiskLevel,
      action: { label: 'View Players', href: '/director/players' },
      safetyNote: 'Players activate only after placement is finalised by a director.',
    }),
  },
  {
    id: 'curriculum',
    icon: <BookOpen className="w-4 h-4" />,
    question: 'Help me customise curriculum',
    response: () => ({
      summary: 'Curriculum customisation tools are in the Curriculum Explorer.',
      why: 'Curriculum levels, drills, and progressions can be viewed and customised per academy.',
      whatWillChange: 'Changes to curriculum levels affect all players assigned to that level.',
      visibility: 'Director only.',
      riskLevel: 'high' as RiskLevel,
      action: { label: 'Open Curriculum Explorer', href: '/director/curriculum' },
      safetyNote: 'Curriculum changes are director-only and do not affect ongoing sessions immediately.',
    }),
  },
  {
    id: 'sessions',
    icon: <Calendar className="w-4 h-4" />,
    question: 'Create a session from a template',
    response: () => ({
      summary: 'Session generation is available from the Sessions screen. Choose a template and schedule a date.',
      why: 'Sessions generated from templates preserve block structure and coach notes.',
      whatWillChange: 'A new session is created in planned state. Blocks are copied from the template.',
      visibility: 'Director + assigned Coach.',
      riskLevel: 'low' as RiskLevel,
      action: { label: 'Go to Sessions', href: '/director/sessions' },
      safetyNote: 'Generating a session does not notify coaches automatically.',
    }),
  },
]

export function DirectorAssistantPanel({
  pendingWrapUpsCount,
  pendingPlacementsCount,
  assessmentDueCount,
  pendingReviewCount,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const props = { pendingWrapUpsCount, pendingPlacementsCount, assessmentDueCount, pendingReviewCount }
  const activeSuggestion = SUGGESTIONS.find(s => s.id === activeId)
  const activeResponse = activeSuggestion ? activeSuggestion.response(props) : null

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-lime/70 mb-0.5">Academy OS Assistant</p>
          <p className="text-sm font-semibold text-text-primary">Ask what needs attention</p>
          <p className="text-xs text-text-muted mt-0.5">
            Select a question for a deterministic answer and direct action link. No AI required.
          </p>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveId(activeId === s.id ? null : s.id)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                activeId === s.id
                  ? 'border-lime/40 bg-lime/10 text-lime'
                  : 'border-border text-text-secondary hover:border-lime/20 hover:text-text-primary bg-surface-raised'
              }`}
            >
              <span className={activeId === s.id ? 'text-lime' : 'text-text-muted'}>{s.icon}</span>
              {s.question}
            </button>
          ))}
        </div>

        {/* Response card using AssistantActionCard */}
        {activeResponse && activeSuggestion && (
          <AssistantActionCard
            suggestedAction={activeResponse.summary}
            why={activeResponse.why}
            whatWillChange={activeResponse.whatWillChange}
            visibility={activeResponse.visibility}
            riskLevel={activeResponse.riskLevel}
            primaryAction={activeResponse.action}
            safetyNote={activeResponse.safetyNote}
            onDismiss={() => setActiveId(null)}
          />
        )}
      </CardContent>
    </Card>
  )
}
