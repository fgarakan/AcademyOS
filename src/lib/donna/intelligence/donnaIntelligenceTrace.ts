// Mega Sprint 1385–1414 — DONNA Unified Intelligence Pipeline V1
// Intelligence trace: audit record of which engines fired in a single brain turn.
// Attached to UnifiedAnswer for debugging. Immutable update pattern (no mutation).
// Pure TypeScript — no DB, no React, no side effects.

export type EngineId =
  | 'entity_summary'
  | 'entity_evidence'
  | 'entity_timeline'
  | 'entity_relationships'
  | 'evidence_followup'

export interface IntelligenceTrace {
  startedAt:        string
  entityKind:       string | null
  entityId:         string | null
  entityName:       string | null
  enginesUsed:      EngineId[]
  confidenceSource: 'high_confidence_entity' | 'medium_confidence_entity' | 'memory_entity' | 'none'
  fallbackUsed:     boolean
  finishedAt:       string | null
  durationMs:       number | null
}

export function createTrace(params: {
  entityKind?:       string | null
  entityId?:         string | null
  entityName?:       string | null
  confidenceSource?: IntelligenceTrace['confidenceSource']
}): IntelligenceTrace {
  return {
    startedAt:        new Date().toISOString(),
    entityKind:       params.entityKind       ?? null,
    entityId:         params.entityId         ?? null,
    entityName:       params.entityName       ?? null,
    enginesUsed:      [],
    confidenceSource: params.confidenceSource ?? 'none',
    fallbackUsed:     false,
    finishedAt:       null,
    durationMs:       null,
  }
}

export function addEngineToTrace(trace: IntelligenceTrace, engine: EngineId): IntelligenceTrace {
  if (trace.enginesUsed.includes(engine)) return trace
  return { ...trace, enginesUsed: [...trace.enginesUsed, engine] }
}

export function finalizeTrace(trace: IntelligenceTrace, fallbackUsed?: boolean): IntelligenceTrace {
  const finishedAt = new Date().toISOString()
  const durationMs = new Date(finishedAt).getTime() - new Date(trace.startedAt).getTime()
  return {
    ...trace,
    fallbackUsed: fallbackUsed ?? trace.fallbackUsed,
    finishedAt,
    durationMs,
  }
}
