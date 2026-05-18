import { Zap, ChevronRight } from 'lucide-react'

interface SkillRequirement {
  skill: string
  domain: string
  level: 'developing' | 'competent' | 'proficient' | 'mastered'
}

interface Props {
  requirements: SkillRequirement[]
  levelName: string
}

const LEVEL_CONFIG: Record<SkillRequirement['level'], { label: string; color: string; dotColor: string }> = {
  developing: { label: 'Developing',  color: 'text-status-orange', dotColor: 'bg-status-orange' },
  competent:  { label: 'Competent',   color: 'text-status-blue',   dotColor: 'bg-status-blue' },
  proficient: { label: 'Proficient',  color: 'text-lime',          dotColor: 'bg-lime' },
  mastered:   { label: 'Mastered',    color: 'text-status-green',  dotColor: 'bg-status-green' },
}

const DOMAINS = ['forehand', 'backhand', 'serve', 'volley', 'movement', 'tactics', 'mental']

export function SkillRequirementDisplay({ requirements, levelName }: Props) {
  if (requirements.length === 0) {
    return (
      <div className="rounded-xl border border-border border-dashed p-5 text-center">
        <p className="text-[12px] text-text-secondary">No skill requirements defined for {levelName}.</p>
      </div>
    )
  }

  const byDomain = DOMAINS.reduce<Record<string, SkillRequirement[]>>((acc, d) => {
    const hits = requirements.filter(r => r.domain === d)
    if (hits.length > 0) acc[d] = hits
    return acc
  }, {})

  return (
    <div className="space-y-3">
      {Object.entries(byDomain).map(([domain, reqs]) => (
        <div key={domain} className="rounded-xl border border-border bg-surface-raised overflow-hidden">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted capitalize">{domain}</p>
          </div>
          <div className="divide-y divide-border">
            {reqs.map((req, i) => {
              const cfg = LEVEL_CONFIG[req.level]
              return (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-text-muted shrink-0" />
                    <p className="text-[12px] text-text-primary">{req.skill}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                    <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
