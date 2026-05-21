'use client'

import { X } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { CurriculumLevelDetailPanel } from '@/components/curriculum/CurriculumLevelDetailPanel'
import { CurriculumDraftEntryPanel } from './CurriculumDraftEntryPanel'
import { DonnaCurriculumNodeAddCard } from './DonnaCurriculumNodeAddCard'
import { CurriculumNodePreview } from './CurriculumNodePreview'
import { CurriculumVideoPanel } from './CurriculumVideoPanel'
import { CurriculumDrillDraftPanel } from './CurriculumDrillDraftPanel'
import { CurriculumSkillDraftPanel } from './CurriculumSkillDraftPanel'
import { CurriculumTacticalDraftPanel } from './CurriculumTacticalDraftPanel'
import { CurriculumMentalDraftPanel } from './CurriculumMentalDraftPanel'
import { CoachCueVideoPairingPanel } from './CoachCueVideoPairingPanel'
import { MediaRolePreviewPanel } from './MediaRolePreviewPanel'
import { NewPlayerAssessmentPanel } from './NewPlayerAssessmentPanel'
import { AssessmentReviewPanel } from './AssessmentReviewPanel'
import type {
  CurriculumLevel,
  CurriculumGate,
  CurriculumDrill,
  CurriculumCoachLanguage,
  CurriculumCompetitionTrack,
  CurriculumFitnessGuidance,
  CurriculumVolumeGuidance,
} from '@/lib/backend/curriculumExplorer'

interface Props {
  level: CurriculumLevel
  gates: CurriculumGate[]
  drills: CurriculumDrill[]
  coachLanguage: CurriculumCoachLanguage[]
  competition: CurriculumCompetitionTrack | null
  fitness: CurriculumFitnessGuidance | null
  volume: CurriculumVolumeGuidance | null
  tablesAvailable: boolean
  onClose: () => void
}

const STAGE_LABEL: Record<string, string> = {
  red_foundation:     'Red Ball',
  orange_development: 'Orange Ball',
  green_performance:  'Green Ball',
  yellow_competitive: 'Yellow Ball',
  high_performance:   'High Performance',
}

export function CurriculumNodeDrawer({
  level,
  gates,
  drills,
  coachLanguage,
  competition,
  fitness,
  volume,
  tablesAvailable,
  onClose,
}: Props) {
  const stageLabel = STAGE_LABEL[level.stage] ?? level.stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:w-[560px] border-l border-border bg-surface shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">{stageLabel}</p>
            <p className="text-sm font-semibold text-text-primary truncate">{level.display_name}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Scrollable body with sticky tabs */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="content">
            <div className="sticky top-0 bg-surface border-b border-border z-10">
              <TabsList className="px-5" scrollable>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
                <TabsTrigger value="donna">DONNA</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </div>

            <div className="px-5 pb-8">
              <TabsContent value="content" className="pt-4">
                <CurriculumLevelDetailPanel
                  level={level}
                  gates={gates}
                  drills={drills}
                  coachLanguage={coachLanguage}
                  competition={competition}
                  fitness={fitness}
                  volume={volume}
                  tablesAvailable={tablesAvailable}
                />
              </TabsContent>

              <TabsContent value="draft" className="pt-4">
                <div className="space-y-4">
                  <CurriculumDraftEntryPanel
                    levelId={level.id}
                    levelName={level.display_name}
                  />
                  <div className="pt-2 border-t border-border space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted px-1">
                      Extended Drafts
                    </p>
                    <CurriculumDrillDraftPanel
                      levelId={level.id}
                      levelName={level.display_name}
                    />
                    <CurriculumSkillDraftPanel
                      levelId={level.id}
                      levelName={level.display_name}
                    />
                    <CurriculumTacticalDraftPanel
                      levelId={level.id}
                      levelName={level.display_name}
                    />
                    <CurriculumMentalDraftPanel
                      levelId={level.id}
                      levelName={level.display_name}
                    />
                    <CoachCueVideoPairingPanel
                      levelId={level.id}
                      levelName={level.display_name}
                    />
                  </div>
                  <div className="pt-2 border-t border-border space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted px-1">
                      Assessment
                    </p>
                    <NewPlayerAssessmentPanel
                      levelId={level.id}
                      levelName={level.display_name}
                    />
                    <AssessmentReviewPanel
                      levelName={level.display_name}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="video" className="pt-4">
                <CurriculumVideoPanel
                  levelId={level.id}
                  levelName={level.display_name}
                />
              </TabsContent>

              <TabsContent value="donna" className="pt-4">
                <DonnaCurriculumNodeAddCard
                  levelId={level.id}
                  levelName={level.display_name}
                />
              </TabsContent>

              <TabsContent value="preview" className="pt-4">
                <CurriculumNodePreview
                  levelName={level.display_name}
                  stage={level.stage}
                  gateCount={gates.length}
                  drillCount={drills.length}
                />
                <MediaRolePreviewPanel levelName={level.display_name} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  )
}
