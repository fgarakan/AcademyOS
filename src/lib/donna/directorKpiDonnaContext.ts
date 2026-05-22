// Sprint 621 — DONNA KPI + Dashboard + Players context string builders
// Pure TypeScript — no DB calls, no server imports, no mutations.
// Accepts pre-computed values from server components and returns formatted DONNA prompt strings.

export interface KpiPageDonnaContext {
  activePlayers: number
  advancementReady: number
  atRiskCount: number
}

export function buildKpiPageDonnaPrompt(ctx: KpiPageDonnaContext, question: string): string {
  const signals = [
    `Active players: ${ctx.activePlayers}`,
    `Advancement ready: ${ctx.advancementReady}`,
    `Attention signals: ${ctx.atRiskCount} (absences or long level tenure)`,
  ].join('. ')
  return `Use the visible dashboard context and available academy signals. ${signals}. ${question}`
}

export interface DashboardDonnaContext {
  pendingWrapUps: number
  attentionCount: number
  pendingCount: number
  newRequests: number
  advancementReady: number
}

export function buildDashboardDonnaPrompt(ctx: DashboardDonnaContext): string {
  const parts: string[] = []
  if (ctx.pendingWrapUps > 0)
    parts.push(`${ctx.pendingWrapUps} coach wrap-up${ctx.pendingWrapUps !== 1 ? 's' : ''} missing`)
  if (ctx.attentionCount > 0)
    parts.push(`${ctx.attentionCount} player${ctx.attentionCount !== 1 ? 's' : ''} flagged for attention`)
  if (ctx.pendingCount > 0)
    parts.push(`${ctx.pendingCount} player${ctx.pendingCount !== 1 ? 's' : ''} awaiting placement`)
  if (ctx.newRequests > 0)
    parts.push(`${ctx.newRequests} new parent request${ctx.newRequests !== 1 ? 's' : ''}`)
  if (ctx.advancementReady > 0)
    parts.push(`${ctx.advancementReady} player${ctx.advancementReady !== 1 ? 's' : ''} ready to advance`)
  const context = parts.length > 0 ? parts.join('. ') : 'No urgent signals detected'
  return `Use the visible dashboard context and available academy signals. ${context}. What should I do first today?`
}

export interface PlayersPageDonnaContext {
  activePlayers: number
  missingCurriculumCount: number
  advancementReadyCount: number
}

export function buildPlayersPageDonnaPrompt(ctx: PlayersPageDonnaContext): string {
  const parts: string[] = [`Active players: ${ctx.activePlayers}`]
  if (ctx.missingCurriculumCount > 0)
    parts.push(`${ctx.missingCurriculumCount} without a curriculum level`)
  if (ctx.advancementReadyCount > 0)
    parts.push(`${ctx.advancementReadyCount} ready to advance`)
  return `Use the visible dashboard context and available academy signals. ${parts.join('. ')}. Who needs my attention? Which players are at risk or overdue for review?`
}
