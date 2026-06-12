'use client'

// DONNA Curriculum Intelligence Engine V1 — Mega Sprint 1716–1745
// CurriculumRecommendationCard: surfaces 1–3 evidence-backed curriculum
// gap recommendations. Clicking "Build draft →" pre-fills DonnaCurriculumPanel.
//
// Cards are visually subordinate to the builder map — compact, quiet.
// Empty state is silent: nothing is shown when there are no recommendations.

import { Sparkles } from 'lucide-react'
import type { CurriculumRecommendation } from '@/lib/donna/curriculum/curriculumArchitect'
import type { CurriculumModificationIntent } from '@/lib/donna/curriculum/curriculumDraftObject'

// ── Content type labels ───────────────────────────────────────────────────────

const CONTENT_TYPE_LABELS: Record<string, string> = {
  drill:            'Drill',
  skill:            'Skill',
  game:             'Game',
  tactical:         'Tactical',
  assessment:       'Assessment',
  fitness:          'Fitness',
  mental_skill:     'Mental',
  progression:      'Progression',
  regression:       'Regression',
  coach_cue:        'Coach Cue',
  success_criteria: 'Success Criteria',
  player_mission:   'Player Mission',
  parent_guidance:  'Parent Guidance',
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  recommendations: CurriculumRecommendation[]
  onSelectRecommendation: (levelId: string, intent: CurriculumModificationIntent) => void
}

export function CurriculumRecommendationCard({ recommendations, onSelectRecommendation }: Props) {
  if (recommendations.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-3 h-3 text-lime shrink-0" aria-hidden="true" />
        <span className="text-[11px] uppercase tracking-widest text-[#555]">
          DONNA sees {recommendations.length} gap{recommendations.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {recommendations.map(rec => (
          <div
            key={rec.id}
            className="flex-1 rounded-xl border border-[#222] bg-[#111111] px-4 py-3 flex flex-col gap-2 hover:border-[#333] transition-colors"
          >
            {/* Level + type chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-[#1A1A1A] border border-[#222] text-[11px] text-[#AAAAAA]">
                {rec.levelName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-lime/5 border border-lime/15 text-[11px] text-lime/80">
                {CONTENT_TYPE_LABELS[rec.contentType] ?? rec.contentType}
              </span>
            </div>

            {/* Rationale */}
            <p className="text-[12px] text-[#AAAAAA] leading-snug">
              {rec.rationale}
            </p>

            {/* CTA */}
            <button
              onClick={() => onSelectRecommendation(rec.levelId, rec.prefillIntent)}
              className="self-start text-[12px] text-lime hover:text-lime/80 transition-colors mt-1"
            >
              Build draft →
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
