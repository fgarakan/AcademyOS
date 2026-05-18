import { CheckCircle2, Circle, AlertTriangle, Lock } from 'lucide-react'

interface CheckItem {
  id: string
  label: string
  detail: string
  category: 'navigation' | 'drafting' | 'safety' | 'review' | 'display'
  risk: 'high' | 'medium' | 'low'
}

const FLOW_CHECKS: CheckItem[] = [
  // Navigation
  { id: 'nav-1', label: 'Builder landing page loads',             detail: '/director/curriculum/builder renders CurriculumSetupBuilder',                  category: 'navigation', risk: 'high' },
  { id: 'nav-2', label: 'Guided review navigation works',        detail: 'Start Guided Review → /director/curriculum/guided → levels load in order',       category: 'navigation', risk: 'high' },
  { id: 'nav-3', label: 'Map page loads with levels',            detail: '/director/curriculum/map renders CurriculumLevelMap and RelationshipMap',         category: 'navigation', risk: 'high' },
  { id: 'nav-4', label: 'Level detail page loads',               detail: '/director/curriculum/level/[id] renders CurriculumLevelBuilderShell',            category: 'navigation', risk: 'high' },
  { id: 'nav-5', label: 'Jump to level modal works',             detail: 'J shortcut or button opens modal, selecting a level routes correctly',           category: 'navigation', risk: 'medium' },
  { id: 'nav-6', label: 'Back navigation returns correctly',     detail: 'Back link from level page → builder, from guided → builder',                     category: 'navigation', risk: 'low' },

  // Drafting
  { id: 'draft-1', label: 'DONNA add drill draft flow works',    detail: 'Open → describe → submit → saveCurriculumDraftAction → proposed_actions row',   category: 'drafting', risk: 'high' },
  { id: 'draft-2', label: 'DONNA add gate draft flow works',     detail: 'Same pattern as drill — action_type: other, target_module: curriculum_builder', category: 'drafting', risk: 'high' },
  { id: 'draft-3', label: 'DONNA add fitness draft flow works',  detail: 'Same pattern — fitness content goes to Review Queue',                            category: 'drafting', risk: 'medium' },
  { id: 'draft-4', label: 'DONNA add mission draft flow works',  detail: 'Same pattern — mission content goes to Review Queue',                            category: 'drafting', risk: 'medium' },
  { id: 'draft-5', label: 'DONNA rewrite level draft works',     detail: 'Prompt chips + custom text → submitted to proposed_actions',                    category: 'drafting', risk: 'medium' },
  { id: 'draft-6', label: 'Correction panel saves draft',        detail: 'CurriculumDraftCorrectionPanel: edit → save → proposed_actions created',        category: 'drafting', risk: 'high' },
  { id: 'draft-7', label: 'Coach suggestion flow works',         detail: 'CoachCurriculumSuggestionPanel → submitCoachCurriculumSuggestion → queued',     category: 'drafting', risk: 'medium' },

  // Safety
  { id: 'safe-1', label: 'Non-director cannot draft changes',    detail: 'saveCurriculumDraftAction: role check blocks non-director/head-coach',          category: 'safety', risk: 'high' },
  { id: 'safe-2', label: 'No direct DB mutation on draft save',  detail: 'Only voice_commands and proposed_actions rows are written — never curriculum',  category: 'safety', risk: 'high' },
  { id: 'safe-3', label: 'Draft shows pending_review status',    detail: 'proposed_actions.status = pending_review after save — never auto-applied',       category: 'safety', risk: 'high' },
  { id: 'safe-4', label: 'Permission guard shows read-only UX',  detail: 'CurriculumEditPermissionGuard renders lock panel for non-director roles',         category: 'safety', risk: 'medium' },

  // Review queue
  { id: 'review-1', label: 'Curriculum drafts appear in Review Queue', detail: '/director/review → Curriculum / Sessions tab → CurriculumBuilderDraftCard', category: 'review', risk: 'high' },
  { id: 'review-2', label: 'Coach suggestions appear in Review Queue', detail: 'pendingCoachSuggestions renders CoachCurriculumSuggestionCard items',      category: 'review', risk: 'medium' },
  { id: 'review-3', label: 'Change queue shows in sidebar',            detail: 'CurriculumBuilderChangeQueue server component renders on builder page',     category: 'review', risk: 'medium' },

  // Display
  { id: 'disp-1', label: 'Level detail tabs all render',         detail: '8 tabs: overview, skills, drills, competition, fitness, gates, missions, language', category: 'display', risk: 'medium' },
  { id: 'disp-2', label: 'Empty states show with DONNA CTA',    detail: 'CurriculumLevelEmptyState shows actionable CTA when no content exists',           category: 'display', risk: 'low' },
  { id: 'disp-3', label: 'Impact preview panel shows estimate',  detail: 'CurriculumImpactPreviewPanel renders stat row + impact areas + safety note',      category: 'display', risk: 'low' },
  { id: 'disp-4', label: 'Source labels show on drills/gates',  detail: 'CurriculumSourceLabel shows seed/academy/donna chip on content items',            category: 'display', risk: 'low' },
  { id: 'disp-5', label: 'Search returns results and navigates', detail: 'CurriculumSearch: type 2+ chars, results grouped, keyboard nav, click routes',   category: 'display', risk: 'low' },
]

const CATEGORY_LABELS: Record<CheckItem['category'], string> = {
  navigation: 'Navigation',
  drafting:   'Drafting Flow',
  safety:     'Safety',
  review:     'Review Queue',
  display:    'Display',
}

const RISK_CONFIG: Record<CheckItem['risk'], { label: string; color: string }> = {
  high:   { label: 'Critical',  color: 'text-status-red' },
  medium: { label: 'Important', color: 'text-status-orange' },
  low:    { label: 'Nice-to-have', color: 'text-text-muted' },
}

const CATEGORIES = ['safety', 'navigation', 'drafting', 'review', 'display'] as const

interface Props {
  completedIds?: string[]
}

export function CurriculumFlowQAChecklist({ completedIds = [] }: Props) {
  const total = FLOW_CHECKS.length
  const completed = completedIds.filter(id => FLOW_CHECKS.some(c => c.id === id)).length

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
          <div
            className="h-full bg-lime rounded-full transition-all"
            style={{ width: `${total > 0 ? Math.round((completed / total) * 100) : 0}%` }}
          />
        </div>
        <p className="text-[11px] font-mono font-bold text-text-secondary shrink-0">
          {completed}/{total}
        </p>
      </div>

      {CATEGORIES.map(cat => {
        const items = FLOW_CHECKS.filter(c => c.category === cat)
        return (
          <div key={cat} className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-border">
              {cat === 'safety' && <Lock className="w-3 h-3 text-status-red" />}
              {cat !== 'safety' && <AlertTriangle className="w-3 h-3 text-text-muted" />}
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
                {CATEGORY_LABELS[cat]}
              </p>
            </div>
            {items.map(item => {
              const done = completedIds.includes(item.id)
              const risk = RISK_CONFIG[item.risk]
              return (
                <div key={item.id} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${done ? 'border-status-green/20 bg-status-green/[0.03]' : 'border-border bg-surface'}`}>
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-status-green shrink-0 mt-0.5" />
                    : <Circle className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-[12px] font-semibold ${done ? 'text-status-green' : 'text-text-secondary'}`}>
                        {item.label}
                      </p>
                      <span className={`text-[9px] font-semibold ${risk.color}`}>{risk.label}</span>
                    </div>
                    <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
