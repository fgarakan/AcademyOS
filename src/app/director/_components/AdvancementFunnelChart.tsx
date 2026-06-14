'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  activePlayers: number
  playersWithLevel: number
  advancementReadyCount: number
  stalledPlayerCount: number
}

export function AdvancementFunnelChart({
  activePlayers,
  playersWithLevel,
  advancementReadyCount,
  stalledPlayerCount,
}: Props) {
  if (activePlayers === 0) {
    return (
      <div className="flex items-center justify-center h-28 text-text-muted text-xs">
        No active players
      </div>
    )
  }

  const withLevel = Math.min(playersWithLevel, activePlayers)
  const coverageRate = Math.round((withLevel / activePlayers) * 100)

  const data = [
    { stage: 'Active',        count: activePlayers,        fill: '#0A84FF' },
    { stage: 'With Level',    count: withLevel,             fill: '#FF9500' },
    { stage: 'Ready',         count: advancementReadyCount, fill: '#C8FF00' },
    { stage: 'Stalled',       count: stalledPlayerCount,    fill: '#FF3B30' },
  ]

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <p className="label-xs">Player Pipeline</p>
        <span className="text-xs text-text-muted">{coverageRate}% with curriculum level</span>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 44, left: 4, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="stage"
            width={72}
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
