import { cn } from '@/lib/utils'
import { stageColor, stageName } from '@/lib/utils'

interface LevelBadgeProps {
  stage: string
  levelName?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LevelBadge({ stage, levelName, size = 'md', className }: LevelBadgeProps) {
  const color = stageColor(stage)
  const name = stageName(stage)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        size === 'sm' && 'px-2 py-0.5 text-[11px]',
        size === 'md' && 'px-3 py-1 text-xs',
        size === 'lg' && 'px-4 py-1.5 text-sm',
        className
      )}
      style={{
        backgroundColor: `${color}18`,
        borderColor: `${color}40`,
        color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {levelName ?? name}
    </span>
  )
}
