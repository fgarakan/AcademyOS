'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export interface UtrHistoryPoint {
  captured_at: string
  utr_value: number
  utr_type: string
  delta_from_previous: number | null
}

interface Props {
  history: UtrHistoryPoint[]
}

function formatMonth(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  } catch {
    return dateStr
  }
}

export function UtrHistoryChart({ history }: Props) {
  if (history.length === 0) return null

  const sorted = [...history].reverse()
  const data = sorted.map(h => ({
    label: formatMonth(h.captured_at),
    value: h.utr_value,
    delta: h.delta_from_previous,
  }))

  const values = data.map(d => d.value)
  const min = Math.max(0, Math.floor(Math.min(...values)) - 0.5)
  const max = Math.ceil(Math.max(...values)) + 0.5

  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: '#7a8898', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[min, max]}
          tick={{ fill: '#7a8898', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickCount={4}
        />
        <Tooltip
          contentStyle={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: 4 }}
          labelStyle={{ color: '#AAAAAA', fontSize: 11 }}
          itemStyle={{ color: '#C8FF00', fontSize: 12 }}
          formatter={(value: number) => [value.toFixed(2), 'UTR']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#C8FF00"
          strokeWidth={2}
          dot={{ fill: '#C8FF00', r: 3, strokeWidth: 0 }}
          activeDot={{ fill: '#C8FF00', r: 5, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
