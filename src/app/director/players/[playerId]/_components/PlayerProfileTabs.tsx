'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import type { ReactNode } from 'react'

const VALID_TABS = ['overview', 'skill-path', 'competition', 'fitness', 'notes', 'session-history']

interface PlayerProfileTabsProps {
  overview: ReactNode
  skillPath: ReactNode
  competition: ReactNode
  fitness: ReactNode
  notes: ReactNode
  sessionHistory: ReactNode
}

export function PlayerProfileTabs({
  overview,
  skillPath,
  competition,
  fitness,
  notes,
  sessionHistory,
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
        <TabsTrigger value="skill-path">Skill Path</TabsTrigger>
        <TabsTrigger value="competition">Competition</TabsTrigger>
        <TabsTrigger value="fitness">Fitness / Load</TabsTrigger>
        {/* Sprint 849: data-donna-focus-id="player-notes-tab" gives DONNA a stable DOM anchor
            on the Notes tab trigger. This is always visible in the TabsList regardless of which
            tab is active — unlike player-active-priorities, player-priority-recommendation, and
            player-evidence-hub, which only exist in the DOM when the Notes tab is active. */}
        <TabsTrigger value="notes" data-donna-focus-id="player-notes-tab">Notes</TabsTrigger>
        <TabsTrigger value="session-history">Session History</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="pt-6">{overview}</TabsContent>
      <TabsContent value="skill-path" className="pt-6">{skillPath}</TabsContent>
      <TabsContent value="competition" className="pt-6">{competition}</TabsContent>
      <TabsContent value="fitness" className="pt-6">{fitness}</TabsContent>
      <TabsContent value="notes" className="pt-6">{notes}</TabsContent>
      <TabsContent value="session-history" className="pt-6">{sessionHistory}</TabsContent>
    </Tabs>
  )
}
