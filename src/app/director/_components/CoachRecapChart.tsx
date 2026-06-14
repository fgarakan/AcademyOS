'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  totalSessions: number
  missingRecaps: number
}

export function CoachRecapChart({ totalSessions, missingRecaps }: Props) {
  if (totalSessions === 0) {
    return (
      <div className="flex items-center justify-center h-28 text-text-muted text-xs">
        No sessions in last 30 days
      </div>
    )
  }

  const withNotes = Math.max(0, totalSessions - missingRecaps)
  const completionRate = Math.round((withNotes / totalSessions) * 100)

  const data = [
    { name: 'Complete', count: withNotes,    fill: '#30D158' },
    { name: 'Missing',  count: missingRecaps, fill: '#FF3B30' },
  ]

  const rateColor = completionRate >= 80 ? 'text-status-green' : completionRate >= 60 ? 'text-status-orange' : 'text-status-red'

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <p className="label-xs">Coach Recap Completion</p>
        <span className="text-xs text-text-muted">last 30 days</span>
      </div>
      <p className={`text-2xl font-mono font-bold mb-2 ${rateColor}`}>
        {completionRate}%
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
            formatter={(value: number) => [value, 'Sessions']}
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
