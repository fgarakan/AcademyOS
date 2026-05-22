# Error States Audit — Sprint 666

**Date:** 2026-05-22
**Scope:** All error.tsx boundary files across all portals

---

## Standard Error Pattern

All error boundaries should match this structure:
```tsx
'use client'
import Link from 'next/link'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function XError({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
      <div className="w-12 h-12 rounded-full bg-status-red/10 border border-status-red/30 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-status-red" />
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-base font-semibold text-text-primary">Descriptive title</p>
        <p className="text-sm text-text-muted max-w-xs leading-relaxed">
          {error.message || 'Fallback message.'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border ...">
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
        [optional: <Link href="...">Back</Link>]
      </div>
    </div>
  )
}
```

---

## Audit Results

| File | Standard? | Issues Found | Fixed |
|---|---|---|---|
| `src/app/director/error.tsx` | ✓ Yes | — | — |
| `src/app/coach/error.tsx` | ✓ Yes | — | — |
| `src/app/parent/error.tsx` | ✓ Yes | — | — |
| `src/app/player/error.tsx` | ✓ Yes | — | — |
| `src/app/director/review/error.tsx` | ✓ Yes | — | — |
| `src/app/director/kpi/error.tsx` | ✓ Yes | — | — |
| `src/app/director/signals/error.tsx` | ✓ Yes | — | — |
| `src/app/director/level-up/error.tsx` | ✓ Yes | — | — |
| `src/app/director/today/error.tsx` | ✗ No | Card-wrapped layout, `AlertTriangle` icon, `btn-lime` reset | ✓ Fixed |
| `src/app/director/parents/error.tsx` | ✗ No | No icon, no RefreshCw, minimal text, raw `<a>` tag | ✓ Fixed |

---

## Changes Made (Sprint 666)

- `src/app/director/today/error.tsx` — Replaced card-wrapped layout + `AlertTriangle` with standard pattern: red circle icon box + `AlertCircle` + RefreshCw button + Dashboard link
- `src/app/director/parents/error.tsx` — Added icon, RefreshCw button, replaced raw `<a>` with `Link`, matched standard layout

---

## No Changes Needed

All 4 root-level portal error boundaries are already consistent. 4 of 6 director sub-route error files already match the standard.

---

*Audit complete. All error boundaries now consistent.*
