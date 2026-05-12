'use client'

// ── Sound preference ───────────────────────────────────────────
const PREF_KEY = 'aos:soundEnabled'

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const stored = localStorage.getItem(PREF_KEY)
    // Default on for new users; they can mute immediately
    return stored === null ? true : stored === 'true'
  } catch {
    return false
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PREF_KEY, String(enabled))
  } catch {}
}

// ── AudioContext (lazy, singleton) ────────────────────────────
let _ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (_ctx) {
    if (_ctx.state === 'closed') {
      _ctx = null
    } else {
      if (_ctx.state === 'suspended') {
        _ctx.resume().catch(() => {})
      }
      return _ctx
    }
  }
  try {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    return _ctx
  } catch {
    return null
  }
}

// ── Reduced motion + enabled gate ────────────────────────────
function shouldPlay(): boolean {
  if (!isSoundEnabled()) return false
  if (typeof window === 'undefined') return false
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  } catch {}
  return true
}

// ── Core synthesizer ──────────────────────────────────────────
function tone(
  freq: number,
  duration: number,
  vol = 0.18,
  type: OscillatorType = 'sine',
  attack = 0.008,
  releaseAt = 0.45,
): void {
  const ac = getCtx()
  if (!ac) return
  try {
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, now)
    osc.connect(gain)
    gain.connect(ac.destination)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(vol, now + attack)
    gain.gain.setValueAtTime(vol, now + duration * releaseAt)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.start(now)
    osc.stop(now + duration + 0.01)
  } catch {}
}

// ── Named sounds ──────────────────────────────────────────────

/** Slide transition — soft descending layered tone */
export function soundSlide(): void {
  if (!shouldPlay()) return
  tone(432, 0.30, 0.15, 'sine', 0.006, 0.38)
  setTimeout(() => tone(576, 0.26, 0.06, 'sine', 0.005, 0.42), 22)
}

/** Draw complete — ascending two-note chime (available for future use) */
export function soundDraw(): void {
  if (!shouldPlay()) return
  tone(528, 0.45, 0.13, 'sine', 0.010, 0.45)
  setTimeout(() => tone(792, 0.45, 0.08, 'sine', 0.010, 0.50), 80)
}

/** Accent chime — bright single bell (available for future use) */
export function soundChime(): void {
  if (!shouldPlay()) return
  tone(880, 0.55, 0.11, 'sine', 0.005, 0.35)
}

/** Hover — barely-there tick */
export function soundHover(): void {
  if (!shouldPlay()) return
  tone(1100, 0.06, 0.04, 'sine', 0.002, 0.50)
}

/** Press — soft button click */
export function soundPress(): void {
  if (!shouldPlay()) return
  tone(300, 0.10, 0.10, 'sine', 0.002, 0.55)
}

/** Complete — warm ascending arpeggio (C5 E5 G5 C6) */
export function soundComplete(): void {
  if (!shouldPlay()) return
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((f, i) => {
    setTimeout(() => tone(f, 0.50, 0.14, 'sine', 0.010, 0.45), i * 90)
  })
}
