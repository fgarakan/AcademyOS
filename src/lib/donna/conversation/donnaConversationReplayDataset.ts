// Mega Sprint 2971–3000 — DONNA Live AI Conversation + Learning Router V1
// Part 7 — Conversation Replay Dataset
//
// In-memory store of user+DONNA conversation pairs from AI-assisted turns.
// Captures every live AI exchange for future training data analysis and quality audit.
//
// Circular buffer: oldest turns evicted when maxSize is reached.
// This store is process-scoped — does not persist between server restarts.
// DB persistence is a future sprint (after replay quality is validated).
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Never stores raw player names, guardian emails, or session scores.
//   - Export produces a JSON-serializable array ready for analysis.

// ── Turn type ─────────────────────────────────────────────────────────────────

export interface ReplayTurn {
  id: string
  capturedAt: string
  role: string
  userText: string
  donnaResponse: string
  aiAssisted: boolean
  aiSource: 'openai' | 'fallback' | 'not_called'
  conceptDetected: string | null
  brainConfidence: number
  finalConfidence: number
  dnaConflict: boolean
  dnaVerdict: 'pass' | 'flagged' | 'blocked'
  tokenCost: number
}

export interface ReplayDatasetStats {
  total: number
  aiAssisted: number
  openaiSuccesses: number
  fallbacks: number
  dnaConflicts: number
  avgTokenCost: number
}

// ── Store ─────────────────────────────────────────────────────────────────────

const MAX_REPLAY_TURNS = 200

class ConversationReplayDatasetStore {
  private turns: ReplayTurn[] = []
  private counter = 0

  capture(turn: Omit<ReplayTurn, 'id' | 'capturedAt'>): void {
    this.counter++
    const entry: ReplayTurn = {
      ...turn,
      id: `replay-${Date.now()}-${this.counter}`,
      capturedAt: new Date().toISOString(),
    }
    this.turns.push(entry)
    if (this.turns.length > MAX_REPLAY_TURNS) {
      this.turns.shift()
    }
  }

  export(): ReplayTurn[] {
    return [...this.turns]
  }

  stats(): ReplayDatasetStats {
    const total = this.turns.length
    const aiAssisted = this.turns.filter(t => t.aiAssisted).length
    const openaiSuccesses = this.turns.filter(t => t.aiSource === 'openai').length
    const fallbacks = this.turns.filter(t => t.aiSource === 'fallback').length
    const dnaConflicts = this.turns.filter(t => t.dnaConflict).length
    const totalTokens = this.turns.reduce((s, t) => s + t.tokenCost, 0)
    return {
      total,
      aiAssisted,
      openaiSuccesses,
      fallbacks,
      dnaConflicts,
      avgTokenCost: total > 0 ? Math.round(totalTokens / total) : 0,
    }
  }

  clear(): void {
    this.turns = []
    this.counter = 0
  }
}

export const donnaConversationReplayDataset = new ConversationReplayDatasetStore()
