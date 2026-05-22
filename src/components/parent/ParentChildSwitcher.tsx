'use client'

// Sprint 619 — Parent Child Switcher UI V1
// Client component. Receives preloaded, server-verified ChildRelationshipRecord[] only.
// Does NOT fetch data. Does NOT read Supabase. Does NOT trust arbitrary child IDs.
//
// SAFETY CONTRACT:
//   The server validates the active childId BEFORE rendering this component.
//   This component only dispatches ?childId=... URL updates.
//   The server re-validates childId on every navigation — never on the client.
//
// SCHEMA LIMITATION (Sprint 617/618 audit):
//   player_guardians.display_order does not exist — ordering is positional (queryIndex).
//   This limitation is shown to the user transparently via the chip order.
//   Per-child permissions do not exist — all chips are selectable by default.

import { useRouter } from 'next/navigation'
import type { ChildRelationshipRecord } from '@/lib/parent/parentPlayerRelationshipModel'
import { getSafeChildDisplayLabel } from '@/lib/parent/parentPlayerRelationshipModel'

interface Props {
  records: ChildRelationshipRecord[]
  activeChildId: string | null
}

export function ParentChildSwitcher({ records, activeChildId }: Props) {
  const router = useRouter()

  // Render nothing for zero or one child — no switcher needed
  if (records.length <= 1) return null

  function handleSelect(playerId: string) {
    // Navigate to the same page with the selected child's ID in the URL.
    // The server re-validates this ID on the next render.
    // We only set childId — other params are intentionally reset on child switch.
    router.push(`?childId=${encodeURIComponent(playerId)}`)
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {records.map((record, index) => {
        const isActive = record.playerId === activeChildId
        const label = getSafeChildDisplayLabel(record, index)

        return (
          <button
            key={record.playerId}
            type="button"
            onClick={() => handleSelect(record.playerId)}
            aria-pressed={isActive}
            aria-label={`Switch to ${label}`}
            className={[
              'flex-none min-h-[36px] px-4 py-1.5 rounded-full text-xs font-semibold',
              'transition-colors whitespace-nowrap border',
              isActive
                ? 'bg-lime text-base border-lime'
                : 'bg-surface-raised border-border text-text-secondary hover:border-lime/30 hover:text-text-primary',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
