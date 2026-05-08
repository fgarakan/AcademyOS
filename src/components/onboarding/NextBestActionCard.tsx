import Link from 'next/link'
import { ArrowRight, Lightbulb, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

interface Props {
  title: string
  body: string
  actionLabel: string
  actionHref: string
  variant?: 'guide' | 'warning' | 'success' | 'info'
  className?: string
}

const VARIANT_STYLES = {
  guide: {
    wrapper: 'bg-lime/5 border-lime/20',
    icon: <Lightbulb className="w-4 h-4 text-lime shrink-0 mt-0.5" />,
    title: 'text-lime',
    body: 'text-text-secondary',
    btn: 'bg-lime text-base hover:bg-lime/90',
  },
  warning: {
    wrapper: 'bg-status-orange/5 border-status-orange/20',
    icon: <AlertTriangle className="w-4 h-4 text-status-orange shrink-0 mt-0.5" />,
    title: 'text-status-orange',
    body: 'text-text-secondary',
    btn: 'bg-status-orange text-white hover:bg-status-orange/90',
  },
  success: {
    wrapper: 'bg-status-green/5 border-status-green/20',
    icon: <CheckCircle2 className="w-4 h-4 text-status-green shrink-0 mt-0.5" />,
    title: 'text-status-green',
    body: 'text-text-secondary',
    btn: 'bg-status-green text-white hover:bg-status-green/90',
  },
  info: {
    wrapper: 'bg-status-blue/5 border-status-blue/20',
    icon: <Info className="w-4 h-4 text-status-blue shrink-0 mt-0.5" />,
    title: 'text-status-blue',
    body: 'text-text-secondary',
    btn: 'bg-status-blue text-white hover:bg-status-blue/90',
  },
}

export function NextBestActionCard({
  title,
  body,
  actionLabel,
  actionHref,
  variant = 'guide',
  className,
}: Props) {
  const s = VARIANT_STYLES[variant]
  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border ${s.wrapper} ${className ?? ''}`}>
      {s.icon}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-snug ${s.title}`}>{title}</p>
        <p className={`text-[11px] mt-0.5 leading-relaxed ${s.body}`}>{body}</p>
      </div>
      <Link
        href={actionHref}
        className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${s.btn}`}
      >
        {actionLabel}
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
