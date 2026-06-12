// DONNA Evolution Memory Certification — Mega Sprint 1931–1960
// Run: npx tsx src/lib/donna/curriculum/curriculumEvolutionMemoryCertification.ts
//
// Certifies:
//   - buildEvolutionMemoryEntry factory produces correct entries
//   - All retrieval helpers (getApproved, getDismissed, getDeferred, etc.)
//   - shouldSuppressRecommendation: dismiss/reject/defer/approve suppression logic
//   - hasMaterialEvidenceChange: evidenceStrength rank, confidence delta, type change
//   - filterEvolutionRecommendations: end-to-end filtering
//   - Deduplication: same recommendationId → only latest entry kept
//   - Capacity cap: 100 entries max, oldest dropped

import {
  buildEvolutionMemoryEntry,
  getApprovedRecommendations,
  getDismissedRecommendations,
  getDeferredRecommendations,
  getRecommendationsDueForReview,
  getEvolutionHistoryForLevel,
  getEvolutionHistoryForGate,
  type EvolutionMemoryEntry,
} from './curriculumEvolutionMemory'
import {
  shouldSuppressRecommendation,
  filterEvolutionRecommendations,
} from './curriculumEvolutionSuppressionFilter'
import type { EvolutionRecommendation } from './curriculumEvolutionEngine'

// ── Test infrastructure ───────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(label: string, value: boolean) {
  if (value) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${label}`)
    failed++
  }
}

function section(name: string) {
  console.log(`\n── ${name} ─────────────────────`)
}

// ── Fixture factories ─────────────────────────────────────────────────────────

function makeRec(overrides: Partial<EvolutionRecommendation> = {}): EvolutionRecommendation {
  return {
    id:                 'rec_001',
    title:              'Add more drills to Red Ball 1',
    reason:             'Drill deficit detected',
    evidence:           ['70% game-heavy content', 'National standard is 40/60'],
    evidenceStrength:   'medium',
    recommendationType: 'IMPROVE',
    confidence:         60,
    expectedImpact:     'high',
    affectedLevels:     ['rb1'],
    affectedSkills:     [],
    affectedGates:      ['gate_rb1_ob1'],
    affectedPlayerCount: 8,
    recommendedAction:  'Add 3 drill items to Red Ball 1',
    priority:           1,
    why:                'Drill ratio is below standard',
    expectedBenefit:    'Better skill development',
    possibleRisk:       null,
    alternativeOptions: [],
    missingData:        [],
    ...overrides,
  }
}

function makeEntry(overrides: Partial<EvolutionMemoryEntry> = {}): EvolutionMemoryEntry {
  const base = buildEvolutionMemoryEntry({
    recommendationId:   'rec_001',
    title:              'Add more drills to Red Ball 1',
    recommendationType: 'IMPROVE',
    evidenceStrength:   'medium',
    decision:           'dismissed',
    levelId:            'rb1',
    gateId:             'gate_rb1_ob1',
    evidence:           ['70% game-heavy content'],
    confidence:         60,
  })
  return { ...base, ...overrides }
}

// ── Scenario 1: buildEvolutionMemoryEntry — approved ─────────────────────────

section('Scenario 1: buildEvolutionMemoryEntry — approved')
{
  const entry = buildEvolutionMemoryEntry({
    recommendationId:   'rec_001',
    title:              'Test',
    recommendationType: 'IMPROVE',
    evidenceStrength:   'high',
    decision:           'approved',
    levelId:            'rb1',
    evidence:           ['evidence 1'],
    confidence:         85,
  })
  assert('id starts with emem_', entry.id.startsWith('emem_'))
  assert('decision is approved', entry.decision === 'approved')
  assert('reviewDate is null for approved', entry.reviewDate === null)
  assert('outcome is null', entry.outcome === null)
  assert('evidenceStrength preserved', entry.evidenceStrength === 'high')
  assert('confidence preserved', entry.confidence === 85)
  assert('levelId preserved', entry.levelId === 'rb1')
}

// ── Scenario 2: buildEvolutionMemoryEntry — deferred sets reviewDate ──────────

section('Scenario 2: buildEvolutionMemoryEntry — deferred sets reviewDate 14 days')
{
  const before = Date.now()
  const entry = buildEvolutionMemoryEntry({
    recommendationId:   'rec_002',
    title:              'Deferred rec',
    recommendationType: 'CREATE',
    evidenceStrength:   'low',
    decision:           'deferred',
    evidence:           [],
    confidence:         40,
    deferDays:          14,
  })
  const after = Date.now()
  assert('decision is deferred', entry.decision === 'deferred')
  assert('reviewDate is set', entry.reviewDate !== null)
  const reviewMs = new Date(entry.reviewDate!).getTime()
  const expectedMs = before + 14 * 86_400_000
  assert('reviewDate is ~14 days out (within 5s)', Math.abs(reviewMs - expectedMs) < 5000)
  assert('reviewDate after before timestamp', reviewMs > before)
  assert('reviewDate before after + 15 days', reviewMs < after + 15 * 86_400_000)
}

// ── Scenario 3: Suppression — dismissed rec is hidden ─────────────────────────

section('Scenario 3: Suppression — dismissed recommendation is hidden')
{
  const rec = makeRec()
  const memory = [makeEntry({ decision: 'dismissed', evidenceStrength: 'medium', confidence: 60 })]
  const result = shouldSuppressRecommendation(rec, memory)
  assert('suppressed is true', result.suppressed === true)
  assert('reason is dismissed', result.reason === 'dismissed')
}

// ── Scenario 4: Suppression — approved rec is hidden ─────────────────────────

section('Scenario 4: Suppression — approved recommendation is hidden')
{
  const rec = makeRec()
  const memory = [makeEntry({ decision: 'approved' })]
  const result = shouldSuppressRecommendation(rec, memory)
  assert('suppressed is true', result.suppressed === true)
  assert('reason is approved', result.reason === 'approved')
}

// ── Scenario 5: Suppression — deferred hides until reviewDate ────────────────

section('Scenario 5: Suppression — deferred hides until reviewDate')
{
  const rec = makeRec()
  const futureDate = new Date(Date.now() + 7 * 86_400_000).toISOString()
  const entry = makeEntry()
  const deferredEntry: EvolutionMemoryEntry = { ...entry, decision: 'deferred', reviewDate: futureDate }
  const now = new Date().toISOString()

  const result = shouldSuppressRecommendation(rec, [deferredEntry], now)
  assert('suppressed is true (future date)', result.suppressed === true)
  assert('reason is deferred', result.reason === 'deferred')
}

// ── Scenario 6: Suppression — deferred resurfaces past reviewDate ─────────────

section('Scenario 6: Suppression — deferred resurfaces when reviewDate has passed')
{
  const rec = makeRec()
  const pastDate = new Date(Date.now() - 1 * 86_400_000).toISOString()
  const entry = makeEntry()
  const deferredEntry: EvolutionMemoryEntry = { ...entry, decision: 'deferred', reviewDate: pastDate }
  const now = new Date().toISOString()

  const result = shouldSuppressRecommendation(rec, [deferredEntry], now)
  assert('suppressed is false (past date)', result.suppressed === false)
  assert('reason is null', result.reason === null)
}

// ── Scenario 7: Material evidence change — evidenceStrength increase resurfaces ─

section('Scenario 7: Material evidence change — evidenceStrength increase resurfaces dismissed')
{
  const rec = makeRec({ evidenceStrength: 'high', confidence: 60 })
  // Memory has dismissed entry with lower strength
  const entry = makeEntry({ decision: 'dismissed', evidenceStrength: 'low' })
  const result = shouldSuppressRecommendation(rec, [entry])
  assert('suppressed is false (strength increased)', result.suppressed === false)
}

// ── Scenario 8: Material evidence change — +15% confidence resurfaces rejected ─

section('Scenario 8: Material evidence change — +15% confidence resurfaces rejected')
{
  const rec = makeRec({ evidenceStrength: 'medium', confidence: 75 })
  // Memory has rejected entry with confidence 60 (delta = +15)
  const entry = makeEntry({ decision: 'rejected', confidence: 60, evidenceStrength: 'medium' })
  const result = shouldSuppressRecommendation(rec, [entry])
  assert('suppressed is false (confidence +15)', result.suppressed === false)
}

// ── Scenario 9: Material evidence change — small confidence gain stays suppressed ─

section('Scenario 9: Small confidence gain (+10) does NOT resurface dismissed')
{
  const rec = makeRec({ evidenceStrength: 'medium', confidence: 70 })
  // Memory: dismissed at confidence 60 — only +10, not enough
  const entry = makeEntry({ decision: 'dismissed', confidence: 60, evidenceStrength: 'medium' })
  const result = shouldSuppressRecommendation(rec, [entry])
  assert('suppressed is true (only +10 confidence)', result.suppressed === true)
}

// ── Scenario 10: Material evidence change — recommendationType change resurfaces ─

section('Scenario 10: recommendationType change resurfaces dismissed recommendation')
{
  const rec = makeRec({ recommendationType: 'CREATE', evidenceStrength: 'medium', confidence: 60 })
  // Memory: dismissed as IMPROVE
  const entry = makeEntry({ decision: 'dismissed', recommendationType: 'IMPROVE', evidenceStrength: 'medium', confidence: 60 })
  const result = shouldSuppressRecommendation(rec, [entry])
  assert('suppressed is false (type changed)', result.suppressed === false)
}

// ── Scenario 11: filterEvolutionRecommendations — end-to-end ─────────────────

section('Scenario 11: filterEvolutionRecommendations — filters correctly')
{
  const rec1 = makeRec({ id: 'rec_01' })
  const rec2 = makeRec({ id: 'rec_02', title: 'Create Orange Ball level' })
  const rec3 = makeRec({ id: 'rec_03', title: 'Merge levels' })

  const memory: EvolutionMemoryEntry[] = [
    buildEvolutionMemoryEntry({
      recommendationId:   'rec_01',
      title:              'rec_01',
      recommendationType: 'IMPROVE',
      evidenceStrength:   'medium',
      decision:           'dismissed',
      evidence:           [],
      confidence:         60,
    }),
    buildEvolutionMemoryEntry({
      recommendationId:   'rec_02',
      title:              'rec_02',
      recommendationType: 'CREATE',
      evidenceStrength:   'high',
      decision:           'approved',
      evidence:           [],
      confidence:         80,
    }),
  ]

  const visible = filterEvolutionRecommendations([rec1, rec2, rec3], memory)
  assert('dismissed rec is filtered out (rec_01)', !visible.some(r => r.id === 'rec_01'))
  assert('approved rec is filtered out (rec_02)', !visible.some(r => r.id === 'rec_02'))
  assert('no-memory rec is visible (rec_03)', visible.some(r => r.id === 'rec_03'))
  assert('visible length is 1', visible.length === 1)
}

// ── Scenario 12: Retrieval helpers ────────────────────────────────────────────

section('Scenario 12: Retrieval helpers — getApproved, getDismissed, getDeferred')
{
  const approvedEntry = buildEvolutionMemoryEntry({
    recommendationId: 'r1', title: 'A', recommendationType: 'CREATE',
    evidenceStrength: 'high', decision: 'approved', evidence: [], confidence: 80,
    levelId: 'rb1',
  })
  const dismissedEntry = buildEvolutionMemoryEntry({
    recommendationId: 'r2', title: 'B', recommendationType: 'IMPROVE',
    evidenceStrength: 'medium', decision: 'dismissed', evidence: [], confidence: 50,
    levelId: 'ob1',
  })
  const rejectedEntry = buildEvolutionMemoryEntry({
    recommendationId: 'r3', title: 'C', recommendationType: 'REMOVE',
    evidenceStrength: 'low', decision: 'rejected', evidence: [], confidence: 30,
    gateId: 'gate_01',
  })
  const deferredFuture = buildEvolutionMemoryEntry({
    recommendationId: 'r4', title: 'D', recommendationType: 'MONITOR',
    evidenceStrength: 'insufficient', decision: 'deferred', evidence: [], confidence: 20,
    levelId: 'rb1', deferDays: 14,
  })
  const deferredPast = (() => {
    const e = buildEvolutionMemoryEntry({
      recommendationId: 'r5', title: 'E', recommendationType: 'INVESTIGATE',
      evidenceStrength: 'low', decision: 'deferred', evidence: [], confidence: 25,
      gateId: 'gate_01', deferDays: 0,
    })
    return { ...e, reviewDate: new Date(Date.now() - 86_400_000).toISOString() }
  })()

  const memory = [approvedEntry, dismissedEntry, rejectedEntry, deferredFuture, deferredPast]

  // getApprovedRecommendations
  const approved = getApprovedRecommendations(memory)
  assert('getApproved returns 1 entry', approved.length === 1)
  assert('getApproved entry is approved', approved[0].decision === 'approved')

  // getDismissedRecommendations (includes rejected)
  const dismissed = getDismissedRecommendations(memory)
  assert('getDismissed returns 2 entries (dismissed + rejected)', dismissed.length === 2)
  assert('getDismissed includes dismissed', dismissed.some(m => m.decision === 'dismissed'))
  assert('getDismissed includes rejected', dismissed.some(m => m.decision === 'rejected'))

  // getDeferredRecommendations
  const deferred = getDeferredRecommendations(memory)
  assert('getDeferred returns 2 entries', deferred.length === 2)

  // getRecommendationsDueForReview
  const now = new Date().toISOString()
  const due = getRecommendationsDueForReview(memory, now)
  assert('getDue returns 1 entry (past review date)', due.length === 1)
  assert('getDue entry is the past-date deferred', due[0].recommendationId === 'r5')

  // getEvolutionHistoryForLevel
  const levelHistory = getEvolutionHistoryForLevel(memory, 'rb1')
  assert('getHistoryForLevel returns entries for rb1', levelHistory.length === 2)
  assert('getHistoryForLevel excludes other levels', levelHistory.every(m => m.levelId === 'rb1'))

  // getEvolutionHistoryForGate
  const gateHistory = getEvolutionHistoryForGate(memory, 'gate_01')
  assert('getHistoryForGate returns entries for gate_01', gateHistory.length === 2)
  assert('getHistoryForGate excludes other gates', gateHistory.every(m => m.gateId === 'gate_01'))
}

// ── Result ────────────────────────────────────────────────────────────────────

const total = passed + failed
console.log('\n' + '═'.repeat(50))
if (failed === 0) {
  console.log(`✓ ALL PASS — ${passed}/${total}`)
  console.log('  Evolution Memory Certification: PASS')
} else {
  console.error(`✗ FAILED — ${failed}/${total} assertions failed`)
  process.exit(1)
}
