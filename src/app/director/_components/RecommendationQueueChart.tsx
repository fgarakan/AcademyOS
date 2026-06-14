'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  pendingWrapUps: number
  assessmentsInReview: number
  placementReviews: number
  oldestAgeDays: number | null
}

export function RecommendationQueueChart({
  pendingWrapUps,
  assessmentsInReview,
  placementReviews,
  oldestAgeDays,
}: Props) {
  const total = pendingWrapUps + assessmentsInReview + placementReviews

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-text-muted text-xs">
        Review queue is clear
      </div>
    )
  }

  const allRows = [
    { name: 'Session Recaps', count: pendingWrapUps,      fill: '#0A84FF' },
    { name: 'Assessments',    count: assessmentsInReview, fill: '#FF9500' },
    { name: 'Placements',     count: placementReviews,    fill: '#C8FF00' },
  ]
  const data = allRows.filter(r => r.count > 0)
  const chartHeight = Math.max(44, data.length * 24 + 20)

  const ageLabel = oldestAgeDays !== null && oldestAgeDays > 0
    ? `oldest ${oldestAgeDays}d`
    : null

  const ageColor = oldestAgeDays !== null && oldestAgeDays >= 7
    ? 'text-status-red'
    : 'text-status-orange'

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-1">
        <p className="label-xs">Review Queue</p>
        {ageLabel && (
          <span className={`text-xs ${ageColor}`}>{ageLabel}</span>
        )}
      </div>
      <p className="text-2xl font-mono font-bold text-text-primary mb-2">
        {total}
        <span className="text-sm text-text-muted font-normal ml-1.5">items pending</span>
      </p>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 44, left: 4, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={104}
            tick={{ fill: '#AAAAAA', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 4 }}
            labelStyle={{ color: '#AAAAAA', fontSize: 11 }}
            itemStyle={{ fontSize: 12 }}
            formatter={(value: number) => [value, 'Items']}
          />
          <Bar
            dataKey="count"
            radius={2}
            maxBarSize={14}
            label={{ position: 'right', fill: '#555555', fontSize: 11 }}
          >
            {data.map((_d, i) => (
              <Cell key={i} fill={data[i].fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
