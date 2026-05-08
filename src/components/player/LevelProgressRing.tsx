interface Props {
  percent: number
  size?: number
  label?: string
  sublabel?: string
  className?: string
}

export function LevelProgressRing({
  percent,
  size = 56,
  label,
  sublabel,
  className,
}: Props) {
  const clamped = Math.min(100, Math.max(0, percent))
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDash = (clamped / 100) * circumference
  const cx = size / 2
  const cy = size / 2

  return (
    <div className={`flex flex-col items-center gap-1 ${className ?? ''}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="4"
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#C8FF00"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          className="transition-all duration-700"
        />
      </svg>
      {label && (
        <p className="text-xs font-mono font-bold text-lime leading-none -mt-1">{label}</p>
      )}
      {sublabel && (
        <p className="text-[10px] text-text-muted leading-none">{sublabel}</p>
      )}
    </div>
  )
}
