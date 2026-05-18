import { Database, Sparkles, Building2, HelpCircle } from 'lucide-react'

// ─── Source label ────────────────────────────────────────────────────────────

export type ContentSource = 'seed' | 'master' | 'academy' | 'donna' | 'unknown'

const SOURCE_CONFIG: Record<ContentSource, {
  label: string
  Icon: typeof Database
  chip: string
  text: string
}> = {
  seed:    { label: 'Seed curriculum',   Icon: Database,    chip: 'bg-status-blue/10 border-status-blue/20',   text: 'text-status-blue' },
  master:  { label: 'Master curriculum', Icon: Database,    chip: 'bg-status-blue/10 border-status-blue/20',   text: 'text-status-blue' },
  academy: { label: 'Academy custom',    Icon: Building2,   chip: 'bg-status-green/10 border-status-green/20', text: 'text-status-green' },
  donna:   { label: 'DONNA draft',       Icon: Sparkles,    chip: 'bg-lime/10 border-lime/20',                 text: 'text-lime' },
  unknown: { label: 'Unknown source',    Icon: HelpCircle,  chip: 'bg-surface border-border',                  text: 'text-text-muted' },
}

interface SourceProps {
  source: ContentSource | string | null | undefined
  size?: 'xs' | 'sm'
}

export function CurriculumSourceLabel({ source, size = 'xs' }: SourceProps) {
  const key = (source ?? 'unknown') as ContentSource
  const cfg = SOURCE_CONFIG[key] ?? SOURCE_CONFIG.unknown
  const { Icon } = cfg
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-[9px]'
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-3 h-3'

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${cfg.chip} ${cfg.text} ${textSize} font-semibold`}>
      <Icon className={`${iconSize} shrink-0`} />
      {cfg.label}
    </span>
  )
}

// ─── Confidence label ────────────────────────────────────────────────────────

export type ConfidenceLevel = 'high' | 'medium' | 'low'

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { label: string; chip: string; text: string; dot: string }> = {
  high:   { label: 'High confidence',   chip: 'bg-status-green/10 border-status-green/20',  text: 'text-status-green',  dot: '#30D158' },
  medium: { label: 'Medium confidence', chip: 'bg-status-orange/10 border-status-orange/20', text: 'text-status-orange', dot: '#FF9500' },
  low:    { label: 'Low confidence',    chip: 'bg-status-red/10 border-status-red/20',       text: 'text-status-red',    dot: '#FF3B30' },
}

interface ConfidenceProps {
  confidence: ConfidenceLevel | null | undefined
  size?: 'xs' | 'sm'
}

export function CurriculumConfidenceLabel({ confidence, size = 'xs' }: ConfidenceProps) {
  if (!confidence) return null
  const cfg = CONFIDENCE_CONFIG[confidence]
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-[9px]'

  return (
    <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded border ${cfg.chip} ${cfg.text} ${textSize} font-semibold`}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

// ─── Combined row (source + confidence) ─────────────────────────────────────

interface RowProps {
  source?: ContentSource | string | null
  confidence?: ConfidenceLevel | null
}

export function CurriculumSourceConfidenceRow({ source, confidence }: RowProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {source && <CurriculumSourceLabel source={source} />}
      {confidence && <CurriculumConfidenceLabel confidence={confidence} />}
    </div>
  )
}
