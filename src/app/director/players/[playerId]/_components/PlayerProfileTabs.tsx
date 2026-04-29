'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import type { ReactNode } from 'react'

interface PlayerProfileTabsProps {
  overview: ReactNode
  skillPath: ReactNode
  competition: ReactNode
  fitness: ReactNode
  notes: ReactNode
}

export function PlayerProfileTabs({
  overview,
  skillPath,
  competition,
  fitness,
  notes,
}: PlayerProfileTabsProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList scrollable>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="skill-path">Skill Path</TabsTrigger>
        <TabsTrigger value="competition">Competition</TabsTrigger>
        <TabsTrigger value="fitness">Fitness / Load</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="pt-6">{overview}</TabsContent>
      <TabsContent value="skill-path" className="pt-6">{skillPath}</TabsContent>
      <TabsContent value="competition" className="pt-6">{competition}</TabsContent>
      <TabsContent value="fitness" className="pt-6">{fitness}</TabsContent>
      <TabsContent value="notes" className="pt-6">{notes}</TabsContent>
    </Tabs>
  )
}
