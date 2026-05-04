'use client'

// Sprint 241 — Universal Voice Button UI V1
// Controlled voice/text intake panel. No DB writes. No proposed_actions. No AI calls.
// Props: role, contextLabel, value, onChange, onSubmit. Text fallback is always available.

import { ChevronRight, Mic, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { VoiceTextInput } from './VoiceTextInput'

export type VoiceIntakeRole = 'academy_director' | 'head_coach' | 'coach'

const ROLE_LABELS: Record<VoiceIntakeRole, string> = {
  academy_director: 'Director',
  head_coach: 'Head Coach',
  coach: 'Coach',
}

export interface VoiceIntakePanelProps {
  role: VoiceIntakeRole
  contextLabel: string
  value: string
  onChange: (value: string) => void
  onSubmit: (transcript: string) => void
  placeholder?: string
  examples?: string[]
  submitLabel?: string
  disabled?: boolean
}

export function VoiceIntakePanel({
  role,
  contextLabel,
  value,
  onChange,
  onSubmit,
  placeholder = 'Speak or type what you want done…',
  examples,
  submitLabel = 'Submit',
  disabled = false,
}: VoiceIntakePanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-lime" />
            <p className="label-xs">Voice Input</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full border border-lime/30 bg-lime/5 text-[10px] text-lime font-medium">
              {ROLE_LABELS[role]}
            </span>
            <span className="text-[10px] text-text-muted">{contextLabel}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <VoiceTextInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          minRows={3}
        />

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => onSubmit(value.trim())}
            disabled={disabled || !value.trim()}
            className="btn-lime text-xs px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitLabel}
          </button>
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <ShieldCheck className="w-3 h-3 text-lime shrink-0" />
            Review draft only — nothing changes until you approve
          </div>
        </div>

        {examples && examples.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Try these</p>
            <div className="space-y-1.5">
              {examples.map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => onChange(ex)}
                  className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border hover:border-lime/20 hover:bg-surface-raised transition-colors group text-xs text-text-secondary"
                >
                  {ex}
                  <ChevronRight className="w-3 h-3 text-text-muted group-hover:text-lime shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
