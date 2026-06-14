'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  activePlayers: number
  reassessmentDue: number
}

export function AssessmentComplianceChart({ activePlayers, reassessmentDue }: Props) {
  if (activePlayers === 0) {
    return (
      <div className="flex items-center justify-center h-28 text-text-muted text-xs">
        No player data
      </div>
    )
  }

  const overdue = Math.min(reassessmentDue, activePlayers)
  const onTrack = Math.max(0, activePlayers - overdue)
  const complianceRate = Math.round((onTrack / activePlayers) * 100)

  const data = [
    { name: 'On Track', count: onTrack,  fill: '#30D158' },
    { name: 'Overdue',  count: overdue,   fill: '#FF3B30' },
  ]

  const rateColor = complianceRate >= 80 ? 'text-status-green' : complianceRate >= 60 ? 'text-status-orange' : 'text-status-red'

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <p className="label-xs">Assessment Compliance</p>
      </div>
      <p className={`text-2xl font-mono font-bold mb-2 ${rateColor}`}>
        {complianceRate}%
      </p>
      <ResponsiveContainer width="100%" height={60}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 44, left: 4, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={64}
            tick={{ fill: '#AAAAAA', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 4 }}
            labelStyle={{ color: '#AAAAAA', fontSize: 11 }}
            itemStyle={{ fontSize: 12 }}
            formatter={(value: number) => [value, 'Players']}
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
