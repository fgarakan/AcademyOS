'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import type { ReactNode } from 'react'

const VALID_TABS = [
  'overview', 'skill-path', 'competition', 'fitness', 'notes', 'session-history',
  // Sprint 1113-1120: Development Center tabs
  'development', 'missions', 'assessments',
]

interface PlayerProfileTabsProps {
  overview: ReactNode
  skillPath: ReactNode
  competition: ReactNode
  fitness: ReactNode
  notes: ReactNode
  sessionHistory: ReactNode
  // Sprint 1113-1120: new tabs
  development?: ReactNode
  missions?: ReactNode
  assessments?: ReactNode
}

export function PlayerProfileTabs({
  overview,
  skillPath,
  competition,
  fitness,
  notes,
  sessionHistory,
  development,
  missions,
  assessments,
}: PlayerProfileTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') ?? ''
  const initialTab = VALID_TABS.includes(tabParam) ? tabParam : 'overview'

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <Tabs defaultValue={initialTab} onChange={handleTabChange}>
      <TabsList scrollable>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        {/* Sprint 1113-1120: Development Center as a prominent early tab */}
        {development !== undefined && (
          <TabsTrigger value="development">Blueprint</TabsTrigger>
        )}
        {missions !== undefined && (
          <TabsTrigger value="missions">Missions</TabsTrigger>
        )}
        {assessments !== undefined && (
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
        )}
        <TabsTrigger value="skill-path">Skill Path</TabsTrigger>
        <TabsTrigger value="competition">Competition</TabsTrigger>
        <TabsTrigger value="fitness">Fitness / Load</TabsTrigger>
        {/* Sprint 849: data-donna-focus-id="player-notes-tab" gives DONNA a stable DOM anchor */}
        <TabsTrigger value="notes" data-donna-focus-id="player-notes-tab">Notes</TabsTrigger>
        <TabsTrigger value="session-history">Session History</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="pt-6">{overview}</TabsContent>
      {development !== undefined && (
        <TabsContent value="development" className="pt-6">{development}</TabsContent>
      )}
      {missions !== undefined && (
        <TabsContent value="missions" className="pt-6">{missions}</TabsContent>
      )}
      {assessments !== undefined && (
        <TabsContent value="assessments" className="pt-6">{assessments}</TabsContent>
      )}
      <TabsContent value="skill-path" className="pt-6">{skillPath}</TabsContent>
      <TabsContent value="competition" className="pt-6">{competition}</TabsContent>
      <TabsContent value="fitness" className="pt-6">{fitness}</TabsContent>
      <TabsContent value="notes" className="pt-6">{notes}</TabsContent>
      <TabsContent value="session-history" className="pt-6">{sessionHistory}</TabsContent>
    </Tabs>
  )
}
