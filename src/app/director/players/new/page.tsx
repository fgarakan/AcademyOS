import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
