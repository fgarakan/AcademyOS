'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Keyboard } from 'lucide-react'

interface Shortcut {
  key: string
  label: string
  action: () => void
}

interface Props {
  onJumpToLevel?: () => void
  onSearch?: () => void
}

export function CurriculumKeyboardHintBar({ onJumpToLevel, onSearch }: Props) {
  const router = useRouter()

  const shortcuts: Shortcut[] = [
    { key: 'G', label: 'Guided Review', action: () => router.push('/director/curriculum/guided') },
    { key: 'M', label: 'Map',           action: () => router.push('/director/curriculum/map') },
    { key: 'J', label: 'Jump to level', action: () => onJumpToLevel?.() },
    { key: '/', label: 'Search',        action: () => onSearch?.() },
  ]

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't fire when typing in inputs/textareas
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
    if (e.metaKey || e.ctrlKey || e.altKey) return

    for (const s of shortcuts) {
      if (e.key.toUpperCase() === s.key.toUpperCase() || e.key === s.key) {
        e.preventDefault()
        s.action()
        return
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, onJumpToLevel, onSearch])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-1.5 text-text-muted">
        <Keyboard className="w-3 h-3" />
        <span className="text-[9px] uppercase tracking-widest font-semibold">Shortcuts</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-3 flex-wrap">
        {shortcuts.map(s => (
          <span key={s.key} className="flex items-center gap-1.5">
            <kbd className="inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-mono font-bold bg-surface-raised border border-border text-text-secondary leading-none">
              {s.key}
            </kbd>
            <span className="text-[10px] text-text-muted">{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
