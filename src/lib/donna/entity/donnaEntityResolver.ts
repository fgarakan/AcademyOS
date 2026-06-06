// Mega Sprint 2291–2320 — DONNA Academy Entity Intelligence V1
// V2 comprehensive entity resolver. Supersedes entities/donnaEntityResolver.ts (V1 heuristic).
// Pure TypeScript — no DB calls, no React, no external packages.
// Supports: exact / partial / nickname / alias / initials / fuzzy (Levenshtein) matching.
// All entity kinds: player, coach, parent, group, curriculum_level, assessment, template, session.

import type {
  PlayerCurriculumStateSummary,
  GroupSummary,
  TemplateSummary,
  AssessmentSummary,
} from '@/lib/donna/extendedContextLoaders'
import {
  toConfidenceLevel,
  CONFIDENCE_LOW_THRESHOLD,
} from '@/lib/donna/intent/confidenceScoring'
import type { ConfidenceLevel } from '@/lib/donna/intent/confidenceScoring'

// ── Entity kinds ──────────────────────────────────────────────────────────────

export type EntityKind =
  | 'player'
  | 'coach'
  | 'parent'
  | 'group'
  | 'curriculum_level'
  | 'assessment'
  | 'template'
  | 'session'
  | 'workflow'

// ── Context shape ──────────────────────────────────────────────────────────────

export interface CoachSummary {
  coachId: string
  displayName: string
  firstName: string
  lastName: string
  role: 'head_coach' | 'coach' | 'assistant_coach'
}

export interface ParentSummary {
  parentId: string
  displayName: string
  firstName: string
  lastName: string
  linkedPlayerIds: string[]
}

export interface AcademyEntityContext {
  players:     PlayerCurriculumStateSummary[]
  groups:      GroupSummary[]
  templates:   TemplateSummary[]
  assessments: AssessmentSummary[]
  coaches?:    CoachSummary[]
  parents?:    ParentSummary[]
}

// ── Resolved entity ──────────────────────────────────────────────────────────

export interface ResolvedEntityV2 {
  kind:                EntityKind
  id:                  string | null
  displayName:         string
  route:               string | null
  confidence:          number
  confidenceLevel:     ConfidenceLevel
  reasoning:           string
}

// ── Result ────────────────────────────────────────────────────────────────────

export interface EntityResolveResult {
  entity:               ResolvedEntityV2 | null
  noEntityFound:        boolean
  needsDisambiguation:  boolean
  candidates:           ResolvedEntityV2[]
}

// ── Resolve options ───────────────────────────────────────────────────────────

export interface EntityResolveOptions {
  preferredKinds?: EntityKind[]
}

// ── Nickname map ──────────────────────────────────────────────────────────────

// Maps nickname → possible canonical first names. One-directional (nickname → formal).
const NICKNAME_MAP: Record<string, string[]> = {
  alex:    ['alexander', 'alexandra', 'alexis', 'alejandro'],
  ali:     ['alicia', 'alessia', 'aliyah', 'alice'],
  andy:    ['andrew'],
  ben:     ['benjamin'],
  bill:    ['william'],
  bob:     ['robert'],
  brad:    ['bradley'],
  charlie: ['charles'],
  chris:   ['christopher', 'christian'],
  dan:     ['daniel', 'daniella'],
  danny:   ['daniel'],
  drew:    ['andrew'],
  ed:      ['edward', 'edgar'],
  fred:    ['frederick'],
  jake:    ['jacob'],
  jo:      ['josephine', 'joanna', 'joseph'],
  joe:     ['joseph'],
  kat:     ['katherine', 'katrina', 'katelyn'],
  kate:    ['katherine', 'katrina', 'katelyn'],
  katie:   ['katherine', 'katelyn'],
  liz:     ['elizabeth'],
  beth:    ['elizabeth'],
  luke:    ['lucas'],
  max:     ['maximilian', 'maxine'],
  matt:    ['matthew'],
  mike:    ['michael', 'mikhail'],
  mickey:  ['michael'],
  nat:     ['natalia', 'natalie', 'nathaniel'],
  nick:    ['nicholas'],
  pat:     ['patrick', 'patricia'],
  rob:     ['robert'],
  sam:     ['samuel', 'samantha'],
  ted:     ['edward', 'theodore'],
  tim:     ['timothy'],
  tom:     ['thomas'],
  tony:    ['anthony'],
  will:    ['william'],
  zach:    ['zachary'],
}

// ── Curriculum level alias map ────────────────────────────────────────────────

interface LevelEntry {
  key:         string
  displayName: string
  route:       string
}

const LEVEL_ALIAS_ENTRIES: Array<{ patterns: string[]; entry: LevelEntry }> = [
  // Red Ball
  {
    patterns: ['rb1', 'r1', 'red1', 'red ball 1', 'red 1'],
    entry: { key: 'red_ball_1', displayName: 'Red Ball 1', route: '/director/curriculum?improve=red_ball_1' },
  },
  {
    patterns: ['rb2', 'r2', 'red2', 'red ball 2', 'red 2'],
    entry: { key: 'red_ball_2', displayName: 'Red Ball 2', route: '/director/curriculum?improve=red_ball_2' },
  },
  {
    patterns: ['rb3', 'r3', 'red3', 'red ball 3', 'red 3'],
    entry: { key: 'red_ball_3', displayName: 'Red Ball 3', route: '/director/curriculum?improve=red_ball_3' },
  },
  // Orange Ball
  {
    patterns: ['ob1', 'o1', 'orange1', 'orange ball 1', 'orange 1'],
    entry: { key: 'orange_ball_1', displayName: 'Orange Ball 1', route: '/director/curriculum?improve=orange_ball_1' },
  },
  {
    patterns: ['ob2', 'o2', 'orange2', 'orange ball 2', 'orange 2'],
    entry: { key: 'orange_ball_2', displayName: 'Orange Ball 2', route: '/director/curriculum?improve=orange_ball_2' },
  },
  {
    patterns: ['ob3', 'o3', 'orange3', 'orange ball 3', 'orange 3'],
    entry: { key: 'orange_ball_3', displayName: 'Orange Ball 3', route: '/director/curriculum?improve=orange_ball_3' },
  },
  // Green Dot
  {
    patterns: ['gd1', 'g1', 'green1', 'green dot 1', 'green 1', 'green ball 1'],
    entry: { key: 'green_dot_1', displayName: 'Green Dot 1', route: '/director/curriculum?improve=green_dot_1' },
  },
  {
    patterns: ['gd2', 'g2', 'green2', 'green dot 2', 'green 2', 'green ball 2'],
    entry: { key: 'green_dot_2', displayName: 'Green Dot 2', route: '/director/curriculum?improve=green_dot_2' },
  },
  {
    patterns: ['gd3', 'g3', 'green3', 'green dot 3', 'green 3', 'green ball 3'],
    entry: { key: 'green_dot_3', displayName: 'Green Dot 3', route: '/director/curriculum?improve=green_dot_3' },
  },
  // Yellow Ball
  {
    patterns: ['yb1', 'y1', 'yellow1', 'yellow ball 1', 'yellow 1'],
    entry: { key: 'yellow_ball_1', displayName: 'Yellow Ball 1', route: '/director/curriculum?improve=yellow_ball_1' },
  },
  {
    patterns: ['yb2', 'y2', 'yellow2', 'yellow ball 2', 'yellow 2'],
    entry: { key: 'yellow_ball_2', displayName: 'Yellow Ball 2', route: '/director/curriculum?improve=yellow_ball_2' },
  },
  // High Performance
  {
    patterns: ['hp1', 'highperf1', 'high performance 1', 'high perf 1'],
    entry: { key: 'high_performance_1', displayName: 'High Performance 1', route: '/director/curriculum?improve=high_performance_1' },
  },
  {
    patterns: ['hp2', 'highperf2', 'high performance 2', 'high perf 2'],
    entry: { key: 'high_performance_2', displayName: 'High Performance 2', route: '/director/curriculum?improve=high_performance_2' },
  },
  {
    patterns: ['hp3', 'highperf3', 'high performance 3', 'high perf 3'],
    entry: { key: 'high_performance_3', displayName: 'High Performance 3', route: '/director/curriculum?improve=high_performance_3' },
  },
]

// Stage-only (no level number) — lower confidence
const LEVEL_STAGE_PATTERNS: Array<{ re: RegExp; displayName: string; key: string }> = [
  { re: /\bred\s+ball\b/i,         displayName: 'Red Ball',          key: 'red_ball' },
  { re: /\borange\s+ball\b/i,      displayName: 'Orange Ball',       key: 'orange_ball' },
  { re: /\bgreen\s+(dot|ball)\b/i, displayName: 'Green Dot',         key: 'green_dot' },
  { re: /\byellow\s+ball\b/i,      displayName: 'Yellow Ball',       key: 'yellow_ball' },
  { re: /\bhigh\s+performance\b/i, displayName: 'High Performance',  key: 'high_performance' },
]

// ── Assessment type aliases ──────────────────────────────────────────────────

const ASSESSMENT_TYPE_PATTERNS: Array<{ type: string; patterns: string[] }> = [
  { type: 'intake',       patterns: ['intake', 'initial assessment', 'new player assessment'] },
  { type: 'quarterly',    patterns: ['quarterly', 'quarterly review'] },
  { type: 'placement',    patterns: ['placement', 'placing', 'placement assessment', 'placement recommendation'] },
  { type: 'reassessment', patterns: ['reassessment', 're-assessment', 'reassess', 'redo assessment'] },
  { type: 'competition',  patterns: ['competition assessment', 'comp assessment', 'tournament assessment'] },
  { type: 'mental',       patterns: ['mental assessment', 'mindset assessment', 'psychological assessment'] },
]

// ── Levenshtein distance (inline — no external packages) ─────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const row: number[] = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = row[j]
      row[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, row[j - 1], row[j])
      prev = temp
    }
  }
  return row[n]
}

function similarityRatio(a: string, b: string): number {
  if (a === b) return 1.0
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1.0
  return (maxLen - levenshtein(a, b)) / maxLen
}

// ── String utilities ───────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text.toLowerCase().trim()
}

function wordTokens(text: string): string[] {
  return text.toLowerCase().replace(/['''`]/g, '').match(/\b\w+\b/g) ?? []
}

// ── Curriculum level resolution ───────────────────────────────────────────────

function resolveCurriculumLevel(text: string): ResolvedEntityV2 | null {
  const lower = normalize(text)

  for (const { patterns, entry } of LEVEL_ALIAS_ENTRIES) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        return {
          kind:            'curriculum_level',
          id:              entry.key,
          displayName:     entry.displayName,
          route:           entry.route,
          confidence:      0.95,
          confidenceLevel: 'definitive',
          reasoning:       `Alias "${pattern}" → ${entry.displayName}`,
        }
      }
    }
  }

  for (const { re, displayName, key } of LEVEL_STAGE_PATTERNS) {
    if (re.test(lower)) {
      return {
        kind:            'curriculum_level',
        id:              key,
        displayName,
        route:           `/director/curriculum?stage=${key}`,
        confidence:      0.82,
        confidenceLevel: 'high',
        reasoning:       `Stage pattern → ${displayName} (no level number)`,
      }
    }
  }

  return null
}

// ── Player resolution ─────────────────────────────────────────────────────────

function resolvePlayers(
  text:    string,
  players: PlayerCurriculumStateSummary[],
): ResolvedEntityV2[] {
  const lower  = normalize(text)
  const tokens = wordTokens(text)
  const results: ResolvedEntityV2[] = []

  function makePlayer(p: PlayerCurriculumStateSummary, confidence: number, reasoning: string): ResolvedEntityV2 {
    return {
      kind:            'player',
      id:              p.playerId,
      displayName:     p.playerName,
      route:           `/director/players/${p.playerId}`,
      confidence,
      confidenceLevel: toConfidenceLevel(confidence),
      reasoning,
    }
  }

  for (const player of players) {
    const parts     = player.playerName.toLowerCase().split(/\s+/)
    const firstName = parts[0] ?? ''
    const lastName  = parts[parts.length - 1] ?? ''
    const fullName  = player.playerName.toLowerCase()

    // 1. Exact full name
    if (lower.includes(fullName)) {
      results.push(makePlayer(player, 0.98, `Exact full name "${player.playerName}"`))
      continue
    }

    // 2. Exact first name (whole word)
    if (tokens.includes(firstName) && firstName.length > 1) {
      results.push(makePlayer(player, 0.85, `Exact first name "${firstName}"`))
      continue
    }

    // 3. Exact last name (whole word)
    if (lastName.length > 2 && tokens.includes(lastName)) {
      results.push(makePlayer(player, 0.80, `Exact last name "${lastName}"`))
      continue
    }

    // 4. Possessive reference ("Jake's" → firstName)
    const possMatch = lower.match(/\b(\w+)'s?\b/)
    if (possMatch && possMatch[1] === firstName) {
      results.push(makePlayer(player, 0.82, `Possessive "${possMatch[0]}" → ${player.playerName}`))
      continue
    }

    // 5. Initials match (two lowercase letters = first+last initials)
    let initialsMatched = false
    for (const token of tokens) {
      if (/^[a-z]{2}$/.test(token)) {
        const fi = firstName[0] ?? ''
        const li = lastName[0] ?? ''
        if (token === fi + li || (token === fi + fi && fi !== '')) {
          results.push(makePlayer(player, 0.60, `Initials "${token.toUpperCase()}" → ${player.playerName}`))
          initialsMatched = true
          break
        }
      }
    }
    if (initialsMatched) continue

    // 6. Nickname → canonical first name
    let nicknameMatched = false
    for (const token of tokens) {
      const canonicals = NICKNAME_MAP[token] ?? []
      for (const canonical of canonicals) {
        if (firstName === canonical || firstName.startsWith(canonical) || canonical.startsWith(firstName)) {
          results.push(makePlayer(player, 0.75, `Nickname "${token}" → "${canonical}" → ${player.playerName}`))
          nicknameMatched = true
          break
        }
      }
      if (nicknameMatched) break
    }
    if (nicknameMatched) continue

    // 7. Fuzzy first name (Levenshtein, last resort)
    for (const token of tokens) {
      if (token.length >= 3 && firstName.length >= 3) {
        const sim = similarityRatio(token, firstName)
        if (sim >= 0.72 && sim < 1.0) {
          const conf = Math.min(0.50, sim * 0.60)
          results.push(makePlayer(player, conf, `Fuzzy "${token}" ≈ "${firstName}" (${Math.round(sim * 100)}% similar)`))
          break
        }
      }
    }
  }

  // Deduplicate — keep highest confidence per player
  const best = new Map<string, ResolvedEntityV2>()
  for (const r of results) {
    const key = r.id ?? r.displayName
    const prev = best.get(key)
    if (!prev || r.confidence > prev.confidence) best.set(key, r)
  }

  return Array.from(best.values()).sort((a, b) => b.confidence - a.confidence)
}

// ── Coach resolution ──────────────────────────────────────────────────────────

function resolveCoaches(
  text:   string,
  coaches: CoachSummary[],
): ResolvedEntityV2[] {
  if (coaches.length === 0) return []

  const lower  = normalize(text)
  const tokens = wordTokens(text)

  // "my head coach" / "the head coach"
  if (/\bhead\s*coach\b/i.test(lower)) {
    const hc = coaches.find(c => c.role === 'head_coach')
    if (hc) {
      return [{
        kind: 'coach', id: hc.coachId, displayName: hc.displayName, route: null,
        confidence: 0.78, confidenceLevel: 'high',
        reasoning: '"head coach" pattern → first head_coach',
      }]
    }
  }

  // "Coach [Name]" prefix
  const coachPrefixMatch = lower.match(/\bcoach\s+(\w+)/)
  const prefixName = coachPrefixMatch ? coachPrefixMatch[1] : null

  const results: ResolvedEntityV2[] = []

  for (const coach of coaches) {
    const first   = coach.firstName.toLowerCase()
    const last    = coach.lastName.toLowerCase()
    const display = coach.displayName.toLowerCase()

    if (lower.includes(display)) {
      results.push({
        kind: 'coach', id: coach.coachId, displayName: coach.displayName, route: null,
        confidence: 0.92, confidenceLevel: 'definitive',
        reasoning: `Full display name match "${coach.displayName}"`,
      })
      continue
    }

    if (prefixName && prefixName === first) {
      results.push({
        kind: 'coach', id: coach.coachId, displayName: coach.displayName, route: null,
        confidence: 0.90, confidenceLevel: 'definitive',
        reasoning: `"Coach ${prefixName}" prefix → ${coach.displayName}`,
      })
      continue
    }

    if (tokens.includes(first) && first.length > 2) {
      results.push({
        kind: 'coach', id: coach.coachId, displayName: coach.displayName, route: null,
        confidence: 0.68, confidenceLevel: 'medium',
        reasoning: `First name match "${first}" in coach roster`,
      })
      continue
    }

    if (last.length > 2 && tokens.includes(last)) {
      results.push({
        kind: 'coach', id: coach.coachId, displayName: coach.displayName, route: null,
        confidence: 0.62, confidenceLevel: 'medium',
        reasoning: `Last name match "${last}" in coach roster`,
      })
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence)
}

// ── Group resolution ──────────────────────────────────────────────────────────

function resolveGroups(
  text:   string,
  groups: GroupSummary[],
): ResolvedEntityV2[] {
  const lower = normalize(text)
  const results: ResolvedEntityV2[] = []

  for (const group of groups) {
    const name = group.name.toLowerCase()

    if (lower.includes(name)) {
      results.push({
        kind: 'group', id: group.groupId, displayName: group.name,
        route: `/director/sessions?group=${group.groupId}`,
        confidence: 0.88, confidenceLevel: 'high',
        reasoning: `Exact group name match "${group.name}"`,
      })
      continue
    }

    // Partial word match — require at least 2 matched words of length > 3
    const nameWords    = name.split(/\s+/).filter(w => w.length > 3)
    const inputWords   = lower.split(/\s+/)
    const matchedWords = nameWords.filter(w => inputWords.some(iw => iw.includes(w) || w.includes(iw)))
    if (matchedWords.length >= 2) {
      const ratio = matchedWords.length / Math.max(nameWords.length, 1)
      const conf  = 0.50 + ratio * 0.25
      results.push({
        kind: 'group', id: group.groupId, displayName: group.name,
        route: `/director/sessions?group=${group.groupId}`,
        confidence: conf,
        confidenceLevel: toConfidenceLevel(conf),
        reasoning: `Partial group name: matched [${matchedWords.join(', ')}] in "${group.name}"`,
      })
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence)
}

// ── Template resolution ───────────────────────────────────────────────────────

function resolveTemplates(
  text:      string,
  templates: TemplateSummary[],
): ResolvedEntityV2[] {
  const lower = normalize(text)
  const results: ResolvedEntityV2[] = []

  for (const tpl of templates) {
    const name  = tpl.name.toLowerCase()
    const route = tpl.templateType === 'fitness'
      ? `/director/fitness/templates/${tpl.templateId}`
      : `/director/class-templates/${tpl.templateId}`

    if (lower.includes(name)) {
      results.push({
        kind: 'template', id: tpl.templateId, displayName: tpl.name,
        route, confidence: 0.90, confidenceLevel: 'definitive',
        reasoning: `Exact template name match "${tpl.name}"`,
      })
      continue
    }

    const nameWords    = name.split(/\s+/).filter(w => w.length > 3)
    const inputWords   = lower.split(/\s+/)
    const matchedWords = nameWords.filter(w => inputWords.some(iw => iw.includes(w) || w.includes(iw)))
    if (matchedWords.length > 0 && nameWords.length > 0) {
      const ratio = matchedWords.length / nameWords.length
      const conf  = 0.45 + ratio * 0.35
      results.push({
        kind: 'template', id: tpl.templateId, displayName: tpl.name,
        route,
        confidence:      conf,
        confidenceLevel: toConfidenceLevel(conf),
        reasoning:       `Partial template name: matched [${matchedWords.join(', ')}] in "${tpl.name}"`,
      })
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence)
}

// ── Assessment type resolution ────────────────────────────────────────────────

function resolveAssessmentType(text: string): string | null {
  const lower = normalize(text)
  for (const { type, patterns } of ASSESSMENT_TYPE_PATTERNS) {
    if (patterns.some(p => lower.includes(p))) return type
  }
  return null
}

// ── Main resolver ─────────────────────────────────────────────────────────────

export function resolveEntityV2(
  text: string,
  ctx:  AcademyEntityContext,
  opts: EntityResolveOptions = {},
): EntityResolveResult {
  if (!text.trim()) {
    return { entity: null, noEntityFound: true, needsDisambiguation: false, candidates: [] }
  }

  const all: ResolvedEntityV2[] = []

  // Curriculum level — highest specificity first
  const levelEntity = resolveCurriculumLevel(text)
  if (levelEntity) all.push(levelEntity)

  // Players
  all.push(...resolvePlayers(text, ctx.players))

  // Coaches (graceful if not loaded)
  all.push(...resolveCoaches(text, ctx.coaches ?? []))

  // Groups
  all.push(...resolveGroups(text, ctx.groups))

  // Templates
  all.push(...resolveTemplates(text, ctx.templates))

  // Assessment type (only as a fallback — broad signal)
  const asmtType = resolveAssessmentType(text)
  if (asmtType) {
    const display = asmtType.charAt(0).toUpperCase() + asmtType.slice(1) + ' Assessment'
    all.push({
      kind: 'assessment', id: null, displayName: display, route: '/director/review',
      confidence: 0.68, confidenceLevel: 'medium',
      reasoning: `Assessment type pattern matched "${asmtType}"`,
    })
  }

  // Apply preferred-kind confidence boost (+0.10, capped at 1.0)
  const boosted = all.map(c => {
    if (opts.preferredKinds?.includes(c.kind)) {
      const conf = Math.min(c.confidence + 0.10, 1.0)
      return { ...c, confidence: conf, confidenceLevel: toConfidenceLevel(conf) }
    }
    return c
  })

  const sorted = boosted.sort((a, b) => b.confidence - a.confidence)

  if (sorted.length === 0) {
    return { entity: null, noEntityFound: true, needsDisambiguation: false, candidates: [] }
  }

  const top    = sorted[0]
  const second = sorted[1]

  // Ambiguity: two candidates of different kinds within 0.15 confidence, both above low threshold
  const isAmbiguous =
    second !== undefined &&
    second.confidence >= CONFIDENCE_LOW_THRESHOLD &&
    top.confidence - second.confidence < 0.15 &&
    top.kind !== second.kind

  if (isAmbiguous) {
    return {
      entity: null,
      noEntityFound: false,
      needsDisambiguation: true,
      candidates: sorted.slice(0, 3),
    }
  }

  if (top.confidence < CONFIDENCE_LOW_THRESHOLD) {
    return { entity: null, noEntityFound: true, needsDisambiguation: false, candidates: sorted.slice(0, 3) }
  }

  return {
    entity: top,
    noEntityFound: false,
    needsDisambiguation: false,
    candidates: sorted,
  }
}
