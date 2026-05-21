// Sprint 401 — Idempotency + Observability Foundation V1
// Structured server-side logger. No external dependencies, no external providers.
// Outputs JSON lines to stdout/stderr — compatible with Vercel log drain and any log aggregator.
// Server-side only — never import from client components.
//
// Do not log: transcripts, session notes, full payloads, tokens, secrets, or any L3 PII.
// See docs/debuggability-standard.md for the full safe-logging contract.

export type LogMeta = Record<string, unknown>

function serialize(level: string, event: string, meta?: LogMeta): string {
  return JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...(meta && Object.keys(meta).length > 0 ? meta : {}),
  })
}

export function logInfo(event: string, meta?: LogMeta): void {
  console.info(serialize('info', event, meta))
}

export function logWarn(event: string, meta?: LogMeta): void {
  console.warn(serialize('warn', event, meta))
}

export function logError(event: string, meta?: LogMeta): void {
  console.error(serialize('error', event, meta))
}

// createActionLogger binds base metadata (action name, requestId, etc.) to every log call.
// Usage:
//   const log = createActionLogger({ action: 'saveWrapUpDraftAction', requestId })
//   log.info('start', { sessionId, userId })
//   log.error('db_error', { message: err.message })
export function createActionLogger(baseMeta: LogMeta): {
  info(event: string, meta?: LogMeta): void
  warn(event: string, meta?: LogMeta): void
  error(event: string, meta?: LogMeta): void
} {
  return {
    info:  (event, meta) => logInfo(event,  { ...baseMeta, ...meta }),
    warn:  (event, meta) => logWarn(event,  { ...baseMeta, ...meta }),
    error: (event, meta) => logError(event, { ...baseMeta, ...meta }),
  }
}
