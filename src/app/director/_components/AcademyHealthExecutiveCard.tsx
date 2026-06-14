'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { AcademyHealthModelV2 } from '@/lib/donna/operating/academyHealthModelV2'

interface Props {
  health: AcademyHealthModelV2
}

function scoreColor(score: number): string {
  if (score >= 75) return '#30D158'
  if (score >= 60) return '#FF9500'
  return '#FF3B30'
}

export function AcademyHealthExecutiveCard({ health }: Props) {
  const domains = [
    { label: 'Players',       score: health.playerHealth.score,             issue: health.playerHealth.topIssue },
    { label: 'Coaches',       score: health.coachHealth.score,              issue: health.coachHealth.topIssue },
    { label: 'Parents',       score: health.parentHealth.score,             issue: health.parentHealth.topIssue },
    { label: 'Curriculum',    score: health.curriculumHealth.score,         issue: health.curriculumHealth.topIssue },
    { label: 'Assessments',   score: health.assessmentCompliance.score,     issue: health.assessmentCompliance.topIssue },
    { label: 'Review Queue',  score: health.recommendationThroughput.score, issue: health.recommendationThroughput.topIssue },
    { label: 'Attendance',    score: health.attendanceTrend.score,          issue: health.attendanceTrend.topIssue },
  ]

  const overallColor = scoreColor(health.overall)
  const trendArrow = health.trend === 'improving' ? '↑' : health.trend === 'declining' ? '↓' : '→'

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="label-xs">Academy Health Score</p>
          <h3 className="text-sm font-medium text-text-primary mt-0.5">
            {health.healthLabel} {trendArrow}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-4xl font-mono font-bold" style={{ color: overallColor }}>
            {health.overall}
          </span>
          <span className="text-text-muted text-sm ml-1">/100</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={168}>
        <BarChart data={domains} layout="vertical" margin={{ top: 0, right: 44, left: 4, bottom: 0 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="label"
            width={88}
            tick={{ fill: '#AAAAAA', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 4 }}
            labelStyle={{ color: '#AAAAAA', fontSize: 11 }}
            itemStyle={{ fontSize: 12 }}
            formatter={(value: number) => [`${value}/100`, 'Health score']}
          />
          <Bar
            dataKey="score"
            radius={2}
            maxBarSize={14}
            label={{ position: 'right', fill: '#555555', fontSize: 11 }}
          >
            {domains.map((d, i) => (
              <Cell key={i} fill={scoreColor(d.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {health.topFactors.filter(f => f.impact === 'negative').length > 0 && (
        <div className="mt-3 pt-3 border-t border-border space-y-1">
          {health.topFactors
            .filter(f => f.impact === 'negative')
            .slice(0, 2)
            .map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-status-red flex-shrink-0" />
                <p className="text-xs text-text-secondary">{f.label}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
