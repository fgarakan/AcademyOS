import Link from 'next/link'
import { ArrowLeft, Upload } from 'lucide-react'
import { PlayerImportClient } from './PlayerImportClient'

export default function PlayerImportPage() {
  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-3xl">
      <Link
        href="/director/players"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Players
      </Link>

      <div>
        <p className="page-eyebrow">Players</p>
        <h1 className="page-title">Player Import</h1>
        <p className="page-subtitle">Upload or paste player names, then review before anything is added.</p>
      </div>

      <PlayerImportClient />
    </div>
  )
}
