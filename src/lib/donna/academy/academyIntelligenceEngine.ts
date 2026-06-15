// Mega Sprint 2561–2590 — DONNA Academy Intelligence Engine V1
//
// Pure TypeScript — no DB, no API, no React.
// Types, priority scoring, packet building, LLM section builder,
// and broad academy query detector.
//
// The AcademyIntelligencePacket is the DONNA equivalent of a live
// COO dashboard — academy-wide ranked queues built from real DB data.

// ── Question types ────────────────────────────────────────────────────────────

export type DirectorQuestionType =
  | 'attention'       // "who needs attention?", "who is at risk?"
  | 'focus'           // "what should I focus on?", "what is most important?"
  | 'defer'           // "what can wait?", "what should I ignore?"
  | 'advance'         // "which players are ready to advance?"
  | 'coach_support'   // "which coach needs support?"
  | 'parent_followup' // "which parents need a follow-up?"
  | 'risk'            // "what is our biggest risk?"
  | 'opportunity'     // "what is our biggest opportunity?"
  | 'status'          // "how is the academy?", "how are we doing?"

// ── Core packet types ─────────────────────────────────────────────────────────

export interface PrioritizedItem {
  playerName:         string
  playerRoute:        string
  score:              number
  urgency:            'immediate' | 'urgent' | 'medium' | 'low'
  title:              string
  reason:             string
  riskIfIgnored:      string
  recommendationType: string
  isOverdue:          boolean
  daysSince:          number
}

export interface AcademyIntelligencePacket {
  academyId:                string
  loadedAt:                 string
  playerCount:              number
  activeRecommendationCount: number
  attentionQueue:           PrioritizedItem[]   // top 10, score desc
  advancementCandidates:    Array<{ name: string; route: string }>
  parentFollowupQueue:      PrioritizedItem[]
  riskQueue:                PrioritizedItem[]
  pendingActionsCount:      number
  overallHealthSignal:      'on_track' | 'attention_needed' | 'critical'
}

// ── Raw DB shapes (internal) ──────────────────────────────────────────────────

export interface RawRecRow {
  id:                  string
  player_id:           string
  title:               string
  recommendation_type: string
  confidence_score:    number | null
  status:              string
  urgency:             string | null
  updated_at:          string
  expires_at:          string | null
}

export interface RawPlayerRow {
  id:        string
  full_name: string
}

export interface RawCurriculumStateRow {
  player_id:            string
  advancement_eligible: boolean | null
}

// ── Priority scoring ──────────────────────────────────────────────────────────

export function scoreRec(rec: RawRecRow): number {
  let score = 0

  const urgency = rec.urgency ?? 'medium'
  if (urgency === 'immediate') score += 40
  else if (urgency === 'urgent') score += 30
  else if (urgency === 'medium') score += 15
  else score += 5

  score += Math.round((rec.confidence_score ?? 0.7) * 15)

  const daysSince = Math.floor((Date.now() - new Date(rec.updated_at).getTime()) / 86400000)
  score += Math.min(daysSince * 2, 20)

  const type = rec.recommendation_type ?? ''
  if (type === 'risk_alert' || type === 'risk') score += 10
  if (type === 'advancement') score += 8
  if (type === 'parent_communication') score += 5
  if (type === 'blocked') score += 12

  if (rec.expires_at && new Date(rec.expires_at) < new Date()) score += 15

  return Math.min(score, 100)
}

// ── Packet builder ────────────────────────────────────────────────────────────

const RISK_MESSAGES: Record<string, string> = {
  risk_alert:            'Risk escalates without intervention.',
  risk:                  'Risk escalates without intervention.',
  advancement:           'Advancement window may close.',
  parent_communication:  'Parent relationship erodes without outreach.',
  assessment:            'Assessment data becomes stale.',
  curriculum:            'Curriculum gap widens.',
  blocked:               'Player progress is blocked.',
}

export function buildAcademyIntelligencePacket(
  academyId:        string,
  players:          RawPlayerRow[],
  curriculumStates: RawCurriculumStateRow[],
  recommendations:  RawRecRow[],
  pendingActionsCount: number,
): AcademyIntelligencePacket {
  const playerMap    = new Map<string, string>(players.map(p => [p.id, p.full_name]))
  const advancementSet = new Set<string>(curriculumStates.filter(s => s.advancement_eligible).map(s => s.player_id))

  const items: PrioritizedItem[] = recommendations.map(rec => {
    const playerName = playerMap.get(rec.player_id) ?? 'Unknown Player'
    const playerRoute = `/director/players/${rec.player_id}`
    const score       = scoreRec(rec)
    const daysSince   = Math.floor((Date.now() - new Date(rec.updated_at).getTime()) / 86400000)
    const isOverdue   = !!rec.expires_at && new Date(rec.expires_at) < new Date()
    const urgency     = (rec.urgency ?? 'medium') as PrioritizedItem['urgency']
    const riskIfIgnored = RISK_MESSAGES[rec.recommendation_type] ?? 'Item ages out of priority window.'

    return {
      playerName,
      playerRoute,
      score,
      urgency,
      title:              rec.title,
      reason:             `${rec.recommendation_type.replace(/_/g, ' ')} — ${daysSince}d pending`,
      riskIfIgnored,
      recommendationType: rec.recommendation_type,
      isOverdue,
      daysSince,
    }
  }).sort((a, b) => b.score - a.score)

  const attentionQueue    = items.slice(0, 10)
  const riskQueue         = items.filter(i => i.recommendationType === 'risk_alert' || i.recommendationType === 'risk').slice(0, 5)
  const parentFollowupQueue = items.filter(i => i.recommendationType === 'parent_communication').slice(0, 5)

  const advancementCandidates = players
    .filter(p => advancementSet.has(p.id))
    .map(p => ({ name: p.full_name, route: `/director/players/${p.id}` }))

  const hasImmediate = items.some(i => i.urgency === 'immediate')
  const hasUrgent    = items.some(i => i.urgency === 'urgent')
  const overallHealthSignal: AcademyIntelligencePacket['overallHealthSignal'] =
    hasImmediate              ? 'critical' :
    hasUrgent || pendingActionsCount >= 5 ? 'attention_needed' :
    'on_track'

  return {
    academyId,
    loadedAt:                  new Date().toISOString(),
    playerCount:               players.length,
    activeRecommendationCount: items.length,
    attentionQueue,
    advancementCandidates,
    parentFollowupQueue,
    riskQueue,
    pendingActionsCount,
    overallHealthSignal,
  }
}

// ── LLM section builder ───────────────────────────────────────────────────────

export function buildAcademyIntelligenceSection(packet: AcademyIntelligencePacket): string {
  const lines: string[] = []
  lines.push('\n## Academy Intelligence (live data)')
  lines.push(`Players: ${packet.playerCount} active | Open recommendations: ${packet.activeRecommendationCount} | Pending approvals: ${packet.pendingActionsCount}`)
  lines.push(`Academy health: ${packet.overallHealthSignal.replace(/_/g, ' ')}`)

  if (packet.attentionQueue.length > 0) {
    lines.push('\nTop attention items (priority order):')
    packet.attentionQueue.slice(0, 5).forEach((item, i) => {
      const overdueMark = item.isOverdue ? ' [OVERDUE]' : ''
      lines.push(`${i + 1}. ${item.playerName} — ${item.title} (${item.urgency}${overdueMark}, score ${item.score})`)
    })
  } else {
    lines.push('\nNo active attention items — academy is clear.')
  }

  if (packet.advancementCandidates.length > 0) {
    lines.push(`\nAdvancement candidates: ${packet.advancementCandidates.map(c => c.name).join(', ')}`)
  }

  if (packet.riskQueue.length > 0) {
    lines.push(`\nActive risks: ${packet.riskQueue.map(r => `${r.playerName} — ${r.title}`).join('; ')}`)
  }

  if (packet.parentFollowupQueue.length > 0) {
    lines.push(`\nParent follow-ups needed: ${packet.parentFollowupQueue.map(p => `${p.playerName} — ${p.title}`).join('; ')}`)
  }

  return lines.join('\n')
}

// ── Broad query detector ──────────────────────────────────────────────────────

const BROAD_QUERY_PATTERNS: Array<{ pattern: RegExp; type: DirectorQuestionType }> = [
  { pattern: /\b(who needs attention|who is at risk|who should i check on|who is struggling|who needs help)\b/i,                               type: 'attention' },
  { pattern: /\b(what should i focus on|what is most important|what do i prioriti[sz]e|where do i start|what do i do today|what should i do today|what (is|are) (my |the )?top priorities?)\b/i, type: 'focus' },
  { pattern: /\b(what can wait|what should i ignore|what is (the )?lowest priority|what is not urgent|what is least urgent|what (can|should) i defer)\b/i, type: 'defer' },
  { pattern: /\b(which players? (are |is )?ready to advance|who is ready to advance|advancement candidates|who can advance|ready for advancement)\b/i, type: 'advance' },
  { pattern: /\b(which coach needs? (support|help)|how are (my )?coaches|coach support)\b/i,                                                   type: 'coach_support' },
  { pattern: /\b(which parents? (need|require) (a )?follow.?up|parent follow.?up|who needs? a parent call|parent outreach)\b/i,                type: 'parent_followup' },
  { pattern: /\b(what is (our |the )?biggest risk|biggest risk|what are (our |the )?risks|academy risk|what risks? (do we have|are there))\b/i, type: 'risk' },
  { pattern: /\b(what is (our |the )?biggest opportunity|biggest opportunity|where (is there|are there) (an? )?opportunit)\b/i,                type: 'opportunity' },
  { pattern: /\b(how is the academy|how are we doing|academy (health|status|pulse)|how (is|are) things|academy overview|give me a (status|summary|overview))\b/i, type: 'status' },
]

export function detectBroadAcademyQuery(userInput: string): DirectorQuestionType | null {
  for (const { pattern, type } of BROAD_QUERY_PATTERNS) {
    if (pattern.test(userInput)) return type
  }
  return null
}
