// Role-Specific Gap Guidance — Sprint 234
// Pure deterministic helper. No DB calls. No AI. No side effects. No writes.
// Translates IdpTrainingGap[] and IdpKnowledgeGap[] into role-appropriate guidance items.
// Caller passes already-detected gaps from detectTrainingGaps() and detectKnowledgeGaps().
// Output: RoleSpecificGapGuidance — consumed by GapGuidanceSummaryCard.
// Director and coach only. Player and parent never see gap guidance directly.

import type { IdpTrainingGap, IdpKnowledgeGap } from '@/lib/player/individualDevelopmentPlan'

// ── Role + priority types ─────────────────────────────────────────────────────

export type GapGuidanceRole = 'director' | 'coach'
export type GapGuidancePriority = 'act_now' | 'monitor' | 'informational'
export type GapGuidanceSource = 'training' | 'knowledge'

// ── Guidance item ─────────────────────────────────────────────────────────────

export interface GapGuidanceItem {
  gap_type: string
  source: GapGuidanceSource
  action: string
  rationale: string
  priority: GapGuidancePriority
  domain: string | null
}

// ── Input type ────────────────────────────────────────────────────────────────

export interface RoleGapGuidanceInput {
  player_id: string
  role: GapGuidanceRole
  training_gaps: IdpTrainingGap[]
  knowledge_gaps: IdpKnowledgeGap[]
}

// ── Output type ───────────────────────────────────────────────────────────────

export interface RoleSpecificGapGuidance {
  role: GapGuidanceRole
  player_id: string
  top_action: string | null
  items: GapGuidanceItem[]
  act_now: GapGuidanceItem[]
  monitor: GapGuidanceItem[]
  informational: GapGuidanceItem[]
}

// ── Priority sort order ───────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<GapGuidancePriority, number> = {
  act_now: 0,
  monitor: 1,
  informational: 2,
}

// ── Training gap → Director guidance ─────────────────────────────────────────

function trainingGapDirectorItem(gap: IdpTrainingGap): GapGuidanceItem | null {
  const { gap_type, severity, domain } = gap

  switch (gap_type) {
    case 'insufficient_data':
      return null

    case 'overload_risk':
      return severity === 'high'
        ? {
            gap_type, source: 'training', domain, priority: 'act_now',
            action: "Reduce session intensity this week and schedule a recovery block.",
            rationale: "Load is flagged as overloaded. Continuing at this level increases injury risk.",
          }
        : {
            gap_type, source: 'training', domain, priority: 'monitor',
            action: "Monitor load closely in the next 2–3 sessions.",
            rationale: "Fatigue score is elevated but not yet critical. Watch for further increases.",
          }

    case 'low_session_frequency':
      return severity === 'high'
        ? {
            gap_type, source: 'training', domain, priority: 'act_now',
            action: "Review attendance records and contact the family.",
            rationale: "No sessions recorded this week. Development continuity is at risk.",
          }
        : {
            gap_type, source: 'training', domain, priority: 'monitor',
            action: "Review the player's schedule — expected frequency is 2–3 sessions per week.",
            rationale: "One session this week is below the minimum for active development.",
          }

    case 'high_absence_rate':
      return severity === 'high'
        ? {
            gap_type, source: 'training', domain, priority: 'act_now',
            action: "Contact the family and review absences for a pattern.",
            rationale: "Three or more absences this week requires direct follow-up.",
          }
        : {
            gap_type, source: 'training', domain, priority: 'monitor',
            action: "Monitor attendance this week and flag if the pattern continues.",
            rationale: "Two absences this week. May be isolated or the start of a pattern.",
          }

    case 'domain_imbalance':
      return domain === 'Fitness'
        ? {
            gap_type, source: 'training', domain, priority: severity === 'medium' ? 'act_now' : 'informational',
            action: "Add a fitness session to the player's upcoming schedule.",
            rationale: "No fitness sessions in 28 days. Development requires cross-domain exposure.",
          }
        : {
            gap_type, source: 'training', domain, priority: 'informational',
            action: "Schedule a match-play or competitive scenario in the next session.",
            rationale: "No competition context in 28 days. Match exposure is part of holistic development.",
          }

    case 'undertraining':
      return {
        gap_type, source: 'training', domain, priority: 'monitor',
        action: "Review session scheduling — player is below minimum training load.",
        rationale: "Very low total training time this month. Minimum for active development is approximately 240 minutes.",
      }

    case 'gate_evidence_exposure':
      return {
        gap_type, source: 'training', domain, priority: 'monitor',
        action: "Increase session frequency to create gate demonstration opportunities.",
        rationale: "Multiple open gates with limited session exposure reduces advancement readiness.",
      }

    case 'load_declining':
      return {
        gap_type, source: 'training', domain, priority: 'informational',
        action: "Confirm whether the load reduction is planned or unintended.",
        rationale: "Declining load trend detected. May be a scheduled taper or an unplanned drift.",
      }

    default:
      return null
  }
}

// ── Training gap → Coach guidance ─────────────────────────────────────────────

function trainingGapCoachItem(gap: IdpTrainingGap): GapGuidanceItem | null {
  const { gap_type, severity, domain } = gap

  switch (gap_type) {
    case 'insufficient_data':
      return null

    case 'overload_risk':
      return severity === 'high'
        ? {
            gap_type, source: 'training', domain, priority: 'act_now',
            action: "Reduce intensity in today's session — focus on movement quality over volume.",
            rationale: "Load is flagged as overloaded. Prioritize recovery over performance today.",
          }
        : {
            gap_type, source: 'training', domain, priority: 'monitor',
            action: "Choose drills that allow recovery — avoid maximal effort today.",
            rationale: "Fatigue score is trending up. Give the player room to restore energy.",
          }

    case 'low_session_frequency':
      return severity === 'high'
        ? {
            gap_type, source: 'training', domain, priority: 'act_now',
            action: "Note the attendance gap and confirm the player will attend the next session.",
            rationale: "No sessions this week. Continuity matters for open gate progress.",
          }
        : {
            gap_type, source: 'training', domain, priority: 'monitor',
            action: "Reinforce the value of consistent attendance with the player.",
            rationale: "One session this week is below the expected development pace.",
          }

    case 'high_absence_rate':
      return severity === 'high'
        ? {
            gap_type, source: 'training', domain, priority: 'act_now',
            action: "Flag to the director and follow up with the player when they return.",
            rationale: "Three or more absences this week. Gate progress will stall without attendance.",
          }
        : {
            gap_type, source: 'training', domain, priority: 'monitor',
            action: "Note absences in your session recap and watch for continuation.",
            rationale: "Two absences this week. Monitor whether this becomes a recurring pattern.",
          }

    case 'domain_imbalance':
      return domain === 'Fitness'
        ? {
            gap_type, source: 'training', domain, priority: severity === 'medium' ? 'act_now' : 'informational',
            action: "Include a conditioning block in today's session.",
            rationale: "No fitness sessions in 28 days. Physical development is part of the programme.",
          }
        : {
            gap_type, source: 'training', domain, priority: 'informational',
            action: "Add a competitive element today — points play, games, or tie-breaks.",
            rationale: "No competitive context in 28 days. Players develop differently under match pressure.",
          }

    case 'undertraining':
      return {
        gap_type, source: 'training', domain, priority: 'monitor',
        action: "Make this session count — prioritize the highest-impact gate criteria.",
        rationale: "Very limited training time this month. Focus efforts on the most relevant advancement criteria.",
      }

    case 'gate_evidence_exposure':
      return {
        gap_type, source: 'training', domain, priority: 'act_now',
        action: "Target open gate criteria in today's drills and observe closely.",
        rationale: "Multiple gates open with limited session exposure. Use available time intentionally.",
      }

    case 'load_declining':
      return {
        gap_type, source: 'training', domain, priority: 'informational',
        action: "Check the player's energy and engagement at the session start.",
        rationale: "Load is declining this week. Gauge whether the player is disengaged or in a planned taper.",
      }

    default:
      return null
  }
}

// ── Knowledge gap → Director guidance ────────────────────────────────────────

function knowledgeGapDirectorItem(gap: IdpKnowledgeGap): GapGuidanceItem | null {
  const { gap_type, domain } = gap

  switch (gap_type) {
    case 'no_curriculum_level':
      return {
        gap_type, source: 'knowledge', domain, priority: 'act_now',
        action: "Assign a curriculum level to this player in the player profile.",
        rationale: "Without a level, coaching guidance, gates, and advancement readiness cannot be evaluated.",
      }

    case 'insufficient_data':
      return {
        gap_type, source: 'knowledge', domain, priority: 'act_now',
        action: "Complete curriculum configuration for this level — add gates, coach language, and drills.",
        rationale: "The assigned level has no curriculum content. Gap detection and advancement readiness are blocked.",
      }

    case 'no_coach_language':
      return {
        gap_type, source: 'knowledge', domain, priority: 'monitor',
        action: "Add coaching cues for this level in the curriculum settings.",
        rationale: "Coach language provides the bridge between curriculum structure and on-court guidance.",
      }

    case 'no_drills_available':
      return {
        gap_type, source: 'knowledge', domain, priority: 'monitor',
        action: "Add drills for this level in the curriculum builder.",
        rationale: "Players at this level have no structured practice vehicles linked to their advancement path.",
      }

    case 'domain_gap_cluster':
      return {
        gap_type, source: 'knowledge', domain, priority: 'informational',
        action: "Review gate distribution — consider adding cross-domain gates for balance.",
        rationale: "Over 70% of open gates are in one domain. Broader gate coverage supports well-rounded advancement.",
      }

    case 'many_open_gates':
      return {
        gap_type, source: 'knowledge', domain, priority: 'monitor',
        action: "Work with the coach to prioritize the top 2–3 gates for near-term focus.",
        rationale: "Many open gates can spread development effort too thin. A narrower target accelerates advancement readiness.",
      }

    case 'no_module_domain_match':
      return {
        gap_type, source: 'knowledge', domain, priority: 'informational',
        action: "Add a learning module aligned with the current gate domain focus.",
        rationale: "No learning content is aligned with the areas this player most needs to develop.",
      }

    default:
      return null
  }
}

// ── Knowledge gap → Coach guidance ───────────────────────────────────────────

function knowledgeGapCoachItem(gap: IdpKnowledgeGap): GapGuidanceItem | null {
  const { gap_type, domain } = gap

  switch (gap_type) {
    case 'no_curriculum_level':
      return {
        gap_type, source: 'knowledge', domain, priority: 'act_now',
        action: "Ask the director to assign a curriculum level before planning this player's sessions.",
        rationale: "Without a level assignment, advancement criteria and coaching cues are unavailable.",
      }

    case 'insufficient_data':
      return {
        gap_type, source: 'knowledge', domain, priority: 'monitor',
        action: "Check with the director — curriculum content for this level may need to be set up.",
        rationale: "No gates, drills, or coaching cues are configured for this level.",
      }

    case 'no_coach_language':
      return {
        gap_type, source: 'knowledge', domain, priority: 'informational',
        action: "Use general coaching principles — no specific cues are configured for this level yet.",
        rationale: "Coaching language for this level has not been added to the curriculum.",
      }

    case 'no_drills_available':
      return {
        gap_type, source: 'knowledge', domain, priority: 'informational',
        action: "Source or adapt drills relevant to the player's advancement criteria.",
        rationale: "No drills are currently linked to this level in the curriculum.",
      }

    case 'domain_gap_cluster':
      return {
        gap_type, source: 'knowledge', domain, priority: 'monitor',
        action: "Introduce varied domain work in sessions to avoid over-concentration.",
        rationale: "Open gates are clustered in one domain — broader exposure supports overall development.",
      }

    case 'many_open_gates':
      return {
        gap_type, source: 'knowledge', domain, priority: 'act_now',
        action: "Focus on 2–3 gates per session — avoid spreading attention too thin.",
        rationale: "With many gates open, targeted session planning improves advancement readiness.",
      }

    case 'no_module_domain_match':
      return {
        gap_type, source: 'knowledge', domain, priority: 'informational',
        action: "Suggest to the director that learning content aligned with current gate work would help this player.",
        rationale: "No learning module is aligned with the areas most relevant to this player's advancement.",
      }

    default:
      return null
  }
}

// ── Main builder ──────────────────────────────────────────────────────────────

export function buildRoleSpecificGapGuidance(input: RoleGapGuidanceInput): RoleSpecificGapGuidance {
  const { player_id, role, training_gaps, knowledge_gaps } = input

  const trainingFn = role === 'director' ? trainingGapDirectorItem : trainingGapCoachItem
  const knowledgeFn = role === 'director' ? knowledgeGapDirectorItem : knowledgeGapCoachItem

  const trainingItems = training_gaps
    .map(trainingFn)
    .filter((item): item is GapGuidanceItem => item !== null)

  const knowledgeItems = knowledge_gaps
    .map(knowledgeFn)
    .filter((item): item is GapGuidanceItem => item !== null)

  const items = [...trainingItems, ...knowledgeItems].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2),
  )

  const act_now = items.filter(i => i.priority === 'act_now')
  const monitor = items.filter(i => i.priority === 'monitor')
  const informational = items.filter(i => i.priority === 'informational')

  const top_action = act_now[0]?.action ?? monitor[0]?.action ?? null

  return { role, player_id, top_action, items, act_now, monitor, informational }
}

// ── Convenience builders ──────────────────────────────────────────────────────

export function buildDirectorGapGuidance(
  player_id: string,
  training_gaps: IdpTrainingGap[],
  knowledge_gaps: IdpKnowledgeGap[],
): RoleSpecificGapGuidance {
  return buildRoleSpecificGapGuidance({ player_id, role: 'director', training_gaps, knowledge_gaps })
}

export function buildCoachGapGuidance(
  player_id: string,
  training_gaps: IdpTrainingGap[],
  knowledge_gaps: IdpKnowledgeGap[],
): RoleSpecificGapGuidance {
  return buildRoleSpecificGapGuidance({ player_id, role: 'coach', training_gaps, knowledge_gaps })
}
