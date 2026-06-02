import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { NewPlayerForm } from './NewPlayerForm'

export default function NewPlayerPage() {
  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-xl">
      <Link
        href="/director/players"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Players
      </Link>

      <div>
        <p className="page-eyebrow">Players</p>
        <h1 className="page-title">Add New Player</h1>
        <p className="page-subtitle">Player will be created with pending placement status. Assign a group and curriculum level from their profile.</p>
      </div>

      {/* DONNA guidance */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-lime/5 border border-lime/15">
        <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          {"Let's add the player's basic information first. After that, I'll guide you through parent contact, assessment, placement, and activation."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <p className="label-xs">Player details</p>
        </CardHeader>
        <CardContent className="pt-0">
          <NewPlayerForm />
        </CardContent>
      </Card>
    </div>
  )
}
