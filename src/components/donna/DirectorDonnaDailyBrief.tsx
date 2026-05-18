'use client'

// Sprint 1005 — Director DONNA Daily Brief V1
// Structured daily brief panel for the director.
// Shows sessions, missing wrap-ups, exceptions, drafts, risks, and recommended actions.
// Accepts pre-fetched counts; clearly labels live vs demo.
// No DB writes. Display only.

import Link from 'next/link'
import { AlertCircle, CheckCircle2, Clock, Users, ClipboardList, Sparkles, ShieldCheck, Database } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BriefSection {
  id: string
  title: string
  items: BriefItem[]
  priority: 'high' | 'normal' | 'low'
  emptyLabel?: string
}

export interface BriefItem {
  text: string
  href?: string
  badge?: string
  badgeColor?: string
}

export interface DirectorDonnaDailyBriefProps {
  date: string
  todaySessions: number
  missingWrapUps: number
  attendanceExceptions: number
  unrosteredPlayers: number
  observationDrafts: number
  parentSafeDrafts: number
  templateDrafts: number
  evidenceDrafts: number
  academyRisks: string[]
  recommendedActions: BriefItem[]
  isLive: boolean
}

// ── Priority colors ────────────────────────────────────────────────────────────

const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-status-red',
  normal: 'bg-status-orange',
  low:    'bg-text-muted/40',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DirectorDonnaDailyBrief({
  date,
  todaySessions,
  missingWrapUps,
  attendanceExceptions,
  unrosteredPlayers,
  observationDrafts,
  parentSafeDrafts,
  templateDrafts,
  evidenceDrafts,
  academyRisks,
  recommendedActions,
  isLive,
}: DirectorDonnaDailyBriefProps) {

  const sections: BriefSection[] = [
    {
      id: 'sessions',
      title: 'Sessions Today',
      priority: 'normal',
      emptyLabel: 'No sessions scheduled.',
      items: todaySessions > 0 ? [
        { text: `${todaySessions} session${todaySessions !== 1 ? 's' : ''} scheduled today`, href: '/director/today' },
      ] : [],
    },
    {
      id: 'wrapups',
      title: 'Missing Wrap-Ups',
      priority: missingWrapUps > 0 ? 'high' : 'normal',
      emptyLabel: 'All coaches submitted wrap-ups.',
      items: missingWrapUps > 0 ? [
        {
          text: `${missingWrapUps} coach wrap-up${missingWrapUps !== 1 ? 's' : ''} not yet submitted`,
          href: '/director/review',
          badge: String(missingWrapUps),
          badgeColor: 'bg-status-red/15 text-status-red',
        },
      ] : [],
    },
    {
      id: 'attendance',
      title: 'Attendance Issues',
      priority: attendanceExceptions > 0 ? 'high' : 'low',
      emptyLabel: 'No attendance exceptions.',
      items: [
        ...(attendanceExceptions > 0 ? [{
          text: `${attendanceExceptions} attendance exception${attendanceExceptions !== 1 ? 's' : ''} pending review`,
          href: '/director/review',
          badge: String(attendanceExceptions),
          badgeColor: 'bg-status-orange/15 text-status-orange',
        }] : []),
        ...(unrosteredPlayers > 0 ? [{
          text: `${unrosteredPlayers} unrostered player${unrosteredPlayers !== 1 ? 's' : ''} flagged`,
          href: '/director/review',
        }] : []),
      ],
    },
    {
      id: 'drafts',
      title: 'Drafts Awaiting Approval',
      priority: (observationDrafts + parentSafeDrafts + templateDrafts + evidenceDrafts) > 0 ? 'high' : 'low',
      emptyLabel: 'No drafts awaiting approval.',
      items: [
        ...(observationDrafts > 0 ? [{ text: `${observationDrafts} observation draft${observationDrafts !== 1 ? 's' : ''}`, href: '/director/review' }] : []),
        ...(parentSafeDrafts > 0 ? [{ text: `${parentSafeDrafts} parent-safe summary draft${parentSafeDrafts !== 1 ? 's' : ''}`, href: '/director/review' }] : []),
        ...(templateDrafts > 0 ? [{ text: `${templateDrafts} template draft${templateDrafts !== 1 ? 's' : ''}`, href: '/director/templates' }] : []),
        ...(evidenceDrafts > 0 ? [{ text: `${evidenceDrafts} curriculum evidence draft${evidenceDrafts !== 1 ? 's' : ''}`, href: '/director/review' }] : []),
      ],
    },
    {
      id: 'risks',
      title: 'Academy Risks',
      priority: academyRisks.length > 0 ? 'normal' : 'low',
      emptyLabel: 'No risks flagged.',
      items: academyRisks.map(r => ({ text: r })),
    },
  ]

  const totalPending = missingWrapUps + attendanceExceptions + observationDrafts + parentSafeDrafts + templateDrafts + evidenceDrafts

  return (
    <div className="rounded-2xl border border-lime/15 bg-surface overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-lime/15 border border-lime/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-lime" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary">Daily Brief</span>
            {totalPending > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-status-red/15 text-status-red">{totalPending} pending</span>
            )}
          </div>
          <p className="text-[10px] text-text-muted">{date}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] ${isLive ? 'border-status-green/20 bg-status-green/5 text-status-green' : 'border-status-orange/20 bg-status-orange/5 text-status-orange'}`}>
          {isLive ? <Database className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {isLive ? 'Live' : 'Demo'}
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y divide-border">
        {sections.map((section) => (
          <div key={section.id} className="px-4 py-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[section.priority]}`} />
              <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">{section.title}</span>
            </div>
            {section.items.length === 0 ? (
              <div className="flex items-center gap-2 pl-3.5">
                <CheckCircle2 className="w-3 h-3 text-status-green shrink-0" />
                <span className="text-xs text-text-muted">{section.emptyLabel}</span>
              </div>
            ) : (
              <ul className="pl-3.5 space-y-1">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    {item.href ? (
                      <Link href={item.href} className="text-xs text-text-secondary hover:text-text-primary transition-colors duration-100 leading-snug">{item.text}</Link>
                    ) : (
                      <span className="text-xs text-text-secondary leading-snug">{item.text}</span>
                    )}
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${item.badgeColor}`}>{item.badge}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Recommended actions */}
      {recommendedActions.length > 0 && (
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[10px] uppercase tracking-widest text-lime mb-2">Recommended Actions</p>
          <div className="space-y-1">
            {recommendedActions.map((action, i) => (
              <div key={i}>
                {action.href ? (
                  <Link href={action.href} className="text-xs text-lime/80 hover:text-lime transition-colors duration-100">{action.text}</Link>
                ) : (
                  <span className="text-xs text-text-secondary">{action.text}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-start gap-2.5 px-4 py-3 border-t border-border bg-surface-raised">
        <ShieldCheck className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-relaxed">Nothing changes until you review and approve. All drafts require director action in the Review Queue.</p>
      </div>

    </div>
  )
}
