// Sprint 2891–2920 — DONNA Knowledge Promotion Engine V1
// Part 12 — Certification Suite
//
// 10 tests covering the full promotion pipeline:
//   1. High-score Brian learning becomes promotion candidate
//   2. Low-score player input does not auto-promote
//   3. Contradiction blocks promotion
//   4. Duplicate learning merges instead of creating new knowledge
//   5. Owner approval promotes knowledge
//   6. Rejected learning cannot be reused
//   7. Approved knowledge can be retrieved by DONNA
//   8. Academy-specific knowledge outranks global knowledge
//   9. Brian knowledge profile updates
//  10. Full traceability works
//
// Target: 100% pass

import type { LearningEntry } from '../learning/learningEntryModel'
import type { ContradictionReport } from '../learning/donnaLearningContradictionDetector'
import { checkPromotionEligibility } from './donnaPromotionEligibilityEngine'
import { createCandidate, computePromotionScore, inferTargetScope } from './knowledgePromotionCandidateModel'
import { applyApprovalAction } from './donnaKnowledgeApprovalWorkflow'
import { routeToKnowledgeRegistry } from './donnaKnowledgeTargetRouter'
import { donnaApprovedKnowledgeRegistry } from './donnaApprovedKnowledgeRegistry'
import { retrieveKnowledge, recordKnowledgeReuse } from './donnaKnowledgeReuseEngine'
import { buildBrianKnowledgePromotionProfile } from './brianKnowledgePromotionProfile'

// ── Test harness ──────────────────────────────────────────────────────────────

let passed = 0
let failed = 0
const failures: string[] = []

function test(name: string, fn: () => boolean | string): void {
  try {
    const result = fn()
    if (result === true) {
      passed++
      console.log(`  ✓ ${name}`)
    } else {
      failed++
      const reason = typeof result === 'string' ? result : 'returned false'
      failures.push(`${name}: ${reason}`)
      console.log(`  ✗ ${name} — ${reason}`)
    }
  } catch (err) {
    failed++
    const msg = err instanceof Error ? err.message : String(err)
    failures.push(`${name}: threw ${msg}`)
    console.log(`  ✗ ${name} — threw: ${msg}`)
  }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function mkEntry(overrides: Partial<LearningEntry> = {}): LearningEntry {
  const defaults: LearningEntry = {
    id: `le-cert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    academyId: 'academy-a1',
    createdAt: new Date().toISOString(),
    sourceType: 'coach_observation',
    sourceId: 'src-001',
    role: 'coach',
    conversationId: null,
    topic: 'Player readiness evaluation',
    topicDomain: 'player_development',
    concepts: ['readiness_issue'],
    summary: 'Players need a baseline fitness check before competitive placement',
    evidence: 'Multiple coaches reported that players placed without fitness baseline struggle in competition',
    examplePhrases: ['fitness check needed', 'baseline required'],
    confidence: 0.80,
    importance: 0.75,
    frequency: 2,
    sourceReliability: 0.75,
    learningScore: 80,
    status: 'approved',
    reviewRequired: false,
    approvedBy: 'Director',
    approvedAt: new Date().toISOString(),
    promotionEligible: true,
    promotedAt: null,
    clusterId: null,
    isDuplicate: false,
    canonicalEntryId: null,
    tags: [],
    academyDnaModelId: null,
    metadata: {},
  }
  return { ...defaults, ...overrides }
}

function noContradictions(_entryId: string): ContradictionReport {
  return { pairs: [], totalFound: 0, requiresReview: false, summary: 'No contradictions found' }
}

function withContradiction(entryIdA: string, entryIdB: string): ContradictionReport {
  return {
    pairs: [{
      entryIdA,
      entryIdB,
      sharedConcepts: ['readiness_issue'],
      contradictionScore: 0.85,
      reason: 'Conflicting statements about readiness criteria',
      resolution: 'needs_director_review',
      resolutionReason: 'Director must decide which framing is correct',
    }],
    totalFound: 1,
    requiresReview: true,
    summary: '1 contradiction pair requires director review',
  }
}

function promoteEntry(entry: LearningEntry, approverRole: 'owner' | 'academy_director' | 'brian_dabul' | 'head_coach', approverName: string) {
  const draft = {
    proposedTitle: `Knowledge: ${entry.topic}`,
    proposedBody: entry.summary,
    draftGeneratedBy: 'system' as const,
  }
  let candidate = createCandidate(entry, draft)
  // Status machine: candidate → in_review → approved
  candidate = { ...candidate, status: 'in_review' as const }
  const approvalResult = applyApprovalAction(candidate, {
    action: 'approve',
    approverName,
    approverRole,
  })
  if (!approvalResult.success) return { success: false, candidate, receipt: null, blockedReason: approvalResult.blockedReason }
  candidate = approvalResult.candidate
  const receipt = routeToKnowledgeRegistry(candidate, entry, approverName)
  return { success: receipt.success, candidate, receipt, blockedReason: receipt.blockedReason }
}

// ── Certification ─────────────────────────────────────────────────────────────

function runCertification(): void {
  console.log('\n═══ DONNA Knowledge Promotion Certification — Sprint 2891–2920 ═══\n')

  // Clear registry before each group of tests
  donnaApprovedKnowledgeRegistry.clear()

  // ── TEST 1: High-score Brian learning becomes promotion candidate ─────────────
  console.log('TEST 1 — High-score Brian direct learning becomes promotion candidate')
  {
    const brianEntry = mkEntry({
      id: 'le-brian-01',
      sourceType: 'brian_direct',
      role: 'director',
      topicDomain: 'coaching_philosophy',
      concepts: ['coach_execution_issue', 'session_quality'],
      summary: 'Brian teaches that every session must start with a clear focal point for the player',
      evidence: 'Brian stated: players need to know the one thing they are working on before the session starts',
      learningScore: 85,
      sourceReliability: 0.95,
      frequency: 3,
    })

    test('1a — Brian entry passes eligibility check', () => {
      const result = checkPromotionEligibility(brianEntry, noContradictions(brianEntry.id))
      if (!result.eligible) return `Expected eligible but got: ${result.summary}`
      return true
    })

    test('1b — Brian entry infers brian_philosophy_knowledge scope', () => {
      const scope = inferTargetScope(brianEntry)
      if (scope !== 'brian_philosophy_knowledge') return `Expected brian_philosophy_knowledge, got ${scope}`
      return true
    })

    test('1c — Brian entry promotion score gets +10 boost', () => {
      const score = computePromotionScore(brianEntry)
      if (score < 85) return `Expected score ≥ 85 (with boost), got ${score}`
      return true
    })

    test('1d — Candidate created with requiresBrianApproval=true', () => {
      const draft = { proposedTitle: 'Focal Point', proposedBody: brianEntry.summary, draftGeneratedBy: 'system' as const }
      const candidate = createCandidate(brianEntry, draft)
      if (!candidate.requiresBrianApproval) return 'Expected requiresBrianApproval=true'
      if (!candidate.requiresOwnerApproval) return 'Expected requiresOwnerApproval=true (brian_philosophy scope)'
      if (candidate.status !== 'candidate') return `Expected status=candidate, got ${candidate.status}`
      return true
    })
  }

  // ── TEST 2: Low-score player input does not auto-promote ──────────────────────
  console.log('\nTEST 2 — Low-score player input does not qualify for promotion')
  {
    const lowScoreEntry = mkEntry({
      id: 'le-low-01',
      sourceType: 'player_input',
      role: 'player',
      learningScore: 45,
      sourceReliability: 0.55,
      summary: 'Short note',
      evidence: 'Too brief',
    })

    test('2a — Low-score entry fails eligibility', () => {
      const result = checkPromotionEligibility(lowScoreEntry)
      if (result.eligible) return 'Expected NOT eligible but got eligible'
      return true
    })

    test('2b — Failed gates include learning_score', () => {
      const result = checkPromotionEligibility(lowScoreEntry)
      const scoreFailed = result.gates.find(g => g.name === 'learning_score' && !g.passed)
      if (!scoreFailed) return 'Expected learning_score gate to fail'
      return true
    })

    test('2c — Failed gates include source_reliability', () => {
      const result = checkPromotionEligibility(lowScoreEntry)
      const relFailed = result.gates.find(g => g.name === 'source_reliability' && !g.passed)
      if (!relFailed) return 'Expected source_reliability gate to fail'
      return true
    })
  }

  // ── TEST 3: Contradiction blocks promotion ────────────────────────────────────
  console.log('\nTEST 3 — Contradiction blocks promotion eligibility')
  {
    const entryA = mkEntry({ id: 'le-contra-a', concepts: ['readiness_issue'] })
    const contradictReport = withContradiction(entryA.id, 'le-contra-b')

    test('3a — Contradiction blocks eligibility', () => {
      const result = checkPromotionEligibility(entryA, contradictReport)
      if (result.eligible) return 'Expected NOT eligible (contradiction present)'
      return true
    })

    test('3b — no_unresolved_contradiction gate fails', () => {
      const result = checkPromotionEligibility(entryA, contradictReport)
      const gate = result.gates.find(g => g.name === 'no_unresolved_contradiction')
      if (!gate) return 'Gate not found'
      if (gate.passed) return 'Expected gate to fail'
      return true
    })

    test('3c — Entry with no contradictions passes the gate', () => {
      const cleanEntry = mkEntry({ id: 'le-contra-clean' })
      const result = checkPromotionEligibility(cleanEntry, noContradictions(cleanEntry.id))
      const gate = result.gates.find(g => g.name === 'no_unresolved_contradiction')
      if (!gate?.passed) return 'Expected no_unresolved_contradiction gate to pass'
      return true
    })
  }

  // ── TEST 4: Duplicate learning merges instead of creating new knowledge ───────
  console.log('\nTEST 4 — Duplicate learning routes to merge, not new knowledge entry')
  {
    const dupEntry = mkEntry({
      id: 'le-dup-01',
      isDuplicate: true,
      canonicalEntryId: 'le-original-01',
    })

    test('4a — Duplicate entry fails eligibility (not_duplicate gate)', () => {
      const result = checkPromotionEligibility(dupEntry)
      if (result.eligible) return 'Expected NOT eligible (is duplicate)'
      const gate = result.gates.find(g => g.name === 'not_duplicate' && !g.passed)
      if (!gate) return 'Expected not_duplicate gate to fail'
      return true
    })

    test('4b — Non-duplicate passes not_duplicate gate', () => {
      const original = mkEntry({ id: 'le-original-01', isDuplicate: false })
      const result = checkPromotionEligibility(original)
      const gate = result.gates.find(g => g.name === 'not_duplicate')
      if (!gate?.passed) return 'Expected not_duplicate gate to pass for original'
      return true
    })

    test('4c — Merge action archives the candidate', () => {
      const entry = mkEntry({ id: 'le-dup-02' })
      const draft = { proposedTitle: 'Dup', proposedBody: entry.summary, draftGeneratedBy: 'system' as const }
      let candidate = createCandidate(entry, draft)
      const result = applyApprovalAction(candidate, {
        action: 'merge',
        approverName: 'Director',
        approverRole: 'academy_director',
        mergeTargetKnowledgeId: 'ak-existing-001',
        reason: 'Already captured in existing knowledge',
      })
      if (!result.success) return `Merge action failed: ${result.blockedReason}`
      if (result.newStatus !== 'archived') return `Expected archived, got ${result.newStatus}`
      return true
    })
  }

  // ── TEST 5: Owner approval promotes knowledge ─────────────────────────────────
  console.log('\nTEST 5 — Owner approval promotes knowledge to registry')
  {
    donnaApprovedKnowledgeRegistry.clear()

    const entry = mkEntry({
      id: 'le-owner-01',
      sourceType: 'brian_direct',
      role: 'director',
      topicDomain: 'coaching_philosophy',
      concepts: ['coach_execution_issue'],
      learningScore: 88,
      sourceReliability: 0.95,
    })

    test('5a — brian_philosophy scope requires owner/brian approval', () => {
      const draft = { proposedTitle: 'Philosophy', proposedBody: entry.summary, draftGeneratedBy: 'system' as const }
      let candidate = createCandidate(entry, draft)
      const directorAttempt = applyApprovalAction(candidate, {
        action: 'approve',
        approverName: 'Head Coach',
        approverRole: 'head_coach',
      })
      if (directorAttempt.success) return 'Expected failure: head_coach cannot approve brian_philosophy scope'
      return true
    })

    test('5b — owner can approve brian_philosophy scope', () => {
      const draft = { proposedTitle: 'Philosophy', proposedBody: entry.summary, draftGeneratedBy: 'system' as const }
      let candidate = createCandidate(entry, draft)
      // Must go candidate → in_review → approved
      candidate = { ...candidate, status: 'in_review' as const }
      const result = applyApprovalAction(candidate, {
        action: 'approve',
        approverName: 'Brian Dabul',
        approverRole: 'owner',
      })
      if (!result.success) return `Owner approval failed: ${result.blockedReason}`
      if (result.newStatus !== 'approved') return `Expected approved, got ${result.newStatus}`
      return true
    })

    test('5c — approved candidate promotes to registry', () => {
      const draft = { proposedTitle: 'Focal Point Philosophy', proposedBody: entry.summary, draftGeneratedBy: 'system' as const }
      let candidate = createCandidate(entry, draft)
      // Must go candidate → in_review → approved
      candidate = { ...candidate, status: 'in_review' as const }
      const approvalResult = applyApprovalAction(candidate, {
        action: 'approve',
        approverName: 'Brian Dabul',
        approverRole: 'owner',
      })
      if (!approvalResult.success) return `Approval failed: ${approvalResult.blockedReason}`
      candidate = approvalResult.candidate
      const receipt = routeToKnowledgeRegistry(candidate, entry, 'Brian Dabul')
      if (!receipt.success) return `Route failed: ${receipt.blockedReason}`
      if (receipt.action !== 'created') return `Expected created, got ${receipt.action}`
      if (!receipt.registryEntryId) return 'No registry entry ID returned'
      return true
    })

    test('5d — un-approved candidate cannot be promoted', () => {
      const draft = { proposedTitle: 'Draft', proposedBody: entry.summary, draftGeneratedBy: 'system' as const }
      const candidate = createCandidate(entry, draft)  // status=candidate, not approved
      const receipt = routeToKnowledgeRegistry(candidate, entry, 'Brian Dabul')
      if (receipt.success) return 'Expected route to be blocked (not approved)'
      if (receipt.action !== 'blocked') return `Expected blocked, got ${receipt.action}`
      return true
    })
  }

  // ── TEST 6: Rejected learning cannot be reused ────────────────────────────────
  console.log('\nTEST 6 — Rejected learning is never used in knowledge retrieval')
  {
    donnaApprovedKnowledgeRegistry.clear()

    const rejectedEntry = mkEntry({
      id: 'le-reject-01',
      status: 'rejected',
      concepts: ['engagement_issue'],
      topicDomain: 'player_psychology',
    })

    test('6a — rejected entry is not eligible for promotion', () => {
      const result = checkPromotionEligibility(rejectedEntry)
      if (result.eligible) return 'Expected NOT eligible (status=rejected)'
      const gate = result.gates.find(g => g.name === 'status' && !g.passed)
      if (!gate) return 'Expected status gate to fail'
      return true
    })

    test('6b — rejected candidate cannot be approved', () => {
      const draft = { proposedTitle: 'Bad Draft', proposedBody: rejectedEntry.summary, draftGeneratedBy: 'system' as const }
      const candidate = createCandidate(rejectedEntry, draft)
      // Simulate: put candidate in rejected state
      const rejectedCandidate = { ...candidate, status: 'rejected' as const }
      const result = applyApprovalAction(rejectedCandidate, {
        action: 'approve',
        approverName: 'Director',
        approverRole: 'academy_director',
      })
      if (result.success) return 'Expected approve to fail on rejected candidate'
      return true
    })

    test('6c — retrieve returns nothing when registry is empty', () => {
      const result = retrieveKnowledge({
        academyId: 'academy-a1',
        concepts: ['engagement_issue'],
        topicDomain: 'player_psychology',
      })
      if (result.usedKnowledge) return 'Expected no knowledge to be retrieved from empty registry'
      return true
    })
  }

  // ── TEST 7: Approved knowledge can be retrieved by DONNA ─────────────────────
  console.log('\nTEST 7 — Approved and promoted knowledge is retrievable by DONNA')
  {
    donnaApprovedKnowledgeRegistry.clear()

    const entry7 = mkEntry({
      id: 'le-retrieve-01',
      concepts: ['focus_issue', 'session_quality'],
      topicDomain: 'session_execution',
      summary: 'Sessions with a clear focal point have measurably better player outcomes',
      evidence: 'Director observed higher engagement when session had a posted theme',
      learningScore: 82,
      sourceReliability: 0.80,
    })
    const { success, receipt } = promoteEntry(entry7, 'academy_director', 'Director')

    test('7a — entry promotes successfully', () => {
      if (!success) return `Promotion failed: ${receipt?.blockedReason ?? 'unknown'}`
      return true
    })

    test('7b — promoted knowledge is retrievable by concept', () => {
      const result = retrieveKnowledge({
        academyId: 'academy-a1',
        concepts: ['focus_issue'],
      })
      if (!result.usedKnowledge) return 'Expected knowledge to be found'
      if (result.items.length === 0) return 'Expected at least 1 item'
      return true
    })

    test('7c — retrieved item has source trace', () => {
      const result = retrieveKnowledge({
        academyId: 'academy-a1',
        concepts: ['focus_issue'],
      })
      const item = result.topResult
      if (!item) return 'No top result'
      if (!item.sourceTrace.sourceLearningEntryId) return 'Missing sourceLearningEntryId in trace'
      if (!item.sourceTrace.approvedBy) return 'Missing approvedBy in trace'
      if (!item.sourceTrace.sourceReliability) return 'Missing sourceReliability in trace'
      return true
    })

    test('7d — recording reuse increments reuseCount', () => {
      const result = retrieveKnowledge({ academyId: 'academy-a1', concepts: ['focus_issue'] })
      const entryId = result.topResult?.entry.id
      if (!entryId) return 'No entry ID to record reuse for'
      recordKnowledgeReuse([entryId])
      const updated = donnaApprovedKnowledgeRegistry.getEntry(entryId)
      if (!updated) return 'Entry not found after reuse'
      if (updated.reuseCount < 1) return `Expected reuseCount ≥ 1, got ${updated.reuseCount}`
      return true
    })
  }

  // ── TEST 8: Academy-specific knowledge outranks global knowledge ──────────────
  console.log('\nTEST 8 — Academy-specific knowledge outranks global knowledge in retrieval')
  {
    donnaApprovedKnowledgeRegistry.clear()

    // Promote a global entry first
    const globalEntry = mkEntry({
      id: 'le-global-01',
      concepts: ['grouping_issue'],
      topicDomain: 'group_management',
      summary: 'Global platform guidance on group composition',
      learningScore: 78,
    })
    const globalDraft = { proposedTitle: 'Global Grouping', proposedBody: globalEntry.summary, draftGeneratedBy: 'system' as const }
    let globalCandidate = createCandidate(globalEntry, globalDraft)
    // Override scope to global for test; must go through in_review → approved
    globalCandidate = {
      ...globalCandidate,
      targetScope: 'global_platform_knowledge_candidate' as const,
      status: 'in_review' as const,
    }
    const globalApproval = applyApprovalAction(globalCandidate, {
      action: 'approve',
      approverName: 'Platform Owner',
      approverRole: 'owner',
    })
    if (globalApproval.success) {
      routeToKnowledgeRegistry(globalApproval.candidate, globalEntry, 'Platform Owner')
    }

    // Promote academy-specific entry with same concept
    const academyEntry = mkEntry({
      id: 'le-academy-01',
      concepts: ['grouping_issue'],
      topicDomain: 'group_management',
      summary: 'Academy-specific grouping: players should be grouped by recent match performance not age',
      learningScore: 80,
    })
    const { success: acadSuccess } = promoteEntry(academyEntry, 'academy_director', 'Director')

    test('8a — both entries promote successfully', () => {
      if (!globalApproval.success) return 'Global approval failed'
      if (!acadSuccess) return 'Academy approval failed'
      return true
    })

    test('8b — academy-specific outranks global in retrieval', () => {
      const result = retrieveKnowledge({
        academyId: 'academy-a1',
        concepts: ['grouping_issue'],
        topicDomain: 'group_management',
      })
      if (!result.usedKnowledge) return 'No results returned'
      const top = result.topResult
      if (!top) return 'No top result'
      if (top.entry.scope === 'global_platform_knowledge_candidate') {
        return 'Global outranked academy-specific — expected academy to win'
      }
      return true
    })

    test('8c — includeGlobal=false excludes global entries', () => {
      const result = retrieveKnowledge({
        academyId: 'academy-a1',
        concepts: ['grouping_issue'],
        includeGlobal: false,
      })
      const globalItems = result.items.filter(i => i.entry.scope === 'global_platform_knowledge_candidate')
      if (globalItems.length > 0) return 'Global items returned when includeGlobal=false'
      return true
    })
  }

  // ── TEST 9: Brian knowledge profile updates ───────────────────────────────────
  console.log('\nTEST 9 — Brian knowledge profile builds correctly from promoted entries')
  {
    donnaApprovedKnowledgeRegistry.clear()

    const brianEntry1 = mkEntry({
      id: 'le-brian-profile-01',
      sourceType: 'brian_direct',
      role: 'director',
      topicDomain: 'coaching_philosophy',
      concepts: ['session_quality', 'coach_execution_issue'],
      summary: 'Every session must have a posted theme visible to all players',
      learningScore: 90,
      sourceReliability: 0.95,
    })
    const brianEntry2 = mkEntry({
      id: 'le-brian-profile-02',
      sourceType: 'brian_direct',
      role: 'director',
      topicDomain: 'coaching_philosophy',
      concepts: ['engagement_issue'],
      summary: 'Brian expects coaches to greet every player by name at session start',
      learningScore: 85,
      sourceReliability: 0.95,
    })
    const nonBrianEntry = mkEntry({
      id: 'le-non-brian-01',
      sourceType: 'coach_observation',
      role: 'coach',
      concepts: ['attendance_issue'],
      topicDomain: 'academy_operations',
      learningScore: 75,
    })

    promoteEntry(brianEntry1, 'owner', 'Brian Dabul')
    promoteEntry(brianEntry2, 'owner', 'Brian Dabul')
    promoteEntry(nonBrianEntry, 'academy_director', 'Director')

    const allActive = donnaApprovedKnowledgeRegistry.getActiveEntries()
    const profile = buildBrianKnowledgePromotionProfile(allActive, [brianEntry1, brianEntry2, nonBrianEntry])

    test('9a — profile has 2 Brian promoted entries', () => {
      if (profile.totalPromotedEntries !== 2) return `Expected 2 Brian entries, got ${profile.totalPromotedEntries}`
      return true
    })

    test('9b — BPKIS > 0 and ≤ 100', () => {
      const score = profile.brianPromotedKnowledgeInfluenceScore
      if (score <= 0 || score > 100) return `BPKIS out of range: ${score}`
      return true
    })

    test('9c — Brian concepts tracked', () => {
      if (profile.promotedConcepts.length === 0) return 'No promoted concepts in profile'
      const conceptNames = profile.promotedConcepts.map(c => c.concept)
      if (!conceptNames.includes('session_quality')) return 'Missing session_quality in Brian concepts'
      return true
    })

    test('9d — avg promotion score computed', () => {
      if (profile.avgPromotionScore <= 0) return 'avgPromotionScore is 0 or negative'
      return true
    })
  }

  // ── TEST 10: Full traceability works ──────────────────────────────────────────
  console.log('\nTEST 10 — Full traceability from learning entry to registry')
  {
    donnaApprovedKnowledgeRegistry.clear()

    const sourceEntry = mkEntry({
      id: 'le-trace-01',
      concepts: ['progression_issue'],
      topicDomain: 'player_development',
      summary: 'Players must demonstrate 3 consecutive consistent weeks before level promotion',
      evidence: 'Director observed that fast promotions lead to skill regression within 4 weeks',
      examplePhrases: ['3 weeks consistency', 'hold level', 'regression after fast promotion'],
      learningScore: 85,
      sourceReliability: 0.85,
    })

    const draft = {
      proposedTitle: 'Progression Consistency Gate',
      proposedBody: sourceEntry.summary,
      draftGeneratedBy: 'system' as const,
    }
    let candidate = createCandidate(sourceEntry, draft)
    // Status machine: candidate → in_review → approved
    candidate = { ...candidate, status: 'in_review' as const }
    const approvalResult = applyApprovalAction(candidate, {
      action: 'approve',
      approverName: 'Director',
      approverRole: 'academy_director',
    })
    candidate = approvalResult.candidate
    const receipt = routeToKnowledgeRegistry(candidate, sourceEntry, 'Director')

    test('10a — promotion receipt has full traceability', () => {
      if (!receipt.success) return `Promotion failed: ${receipt.blockedReason}`
      const trace = receipt.traceability
      if (!trace.sourceLearningEntryId) return 'Missing sourceLearningEntryId'
      if (!trace.sourceSummary) return 'Missing sourceSummary'
      if (trace.sourceEvidence.length === 0) return 'Missing sourceEvidence'
      if (!trace.approvedBy) return 'Missing approvedBy'
      if (!trace.approvedAt) return 'Missing approvedAt'
      if (!trace.promotedBy) return 'Missing promotedBy'
      if (!trace.promotedAt) return 'Missing promotedAt'
      if (!trace.candidateId) return 'Missing candidateId'
      if (trace.promotionScore <= 0) return 'promotionScore is 0'
      return true
    })

    test('10b — registry entry traces back to source learning entry', () => {
      if (!receipt.registryEntryId) return 'No registry entry ID'
      const regEntry = donnaApprovedKnowledgeRegistry.getEntry(receipt.registryEntryId)
      if (!regEntry) return 'Registry entry not found'
      if (regEntry.sourceLearningEntryId !== sourceEntry.id) {
        return `sourceLearningEntryId mismatch: ${regEntry.sourceLearningEntryId} !== ${sourceEntry.id}`
      }
      if (regEntry.sourceCandidateId !== candidate.id) {
        return `sourceCandidateId mismatch: ${regEntry.sourceCandidateId} !== ${candidate.id}`
      }
      return true
    })

    test('10c — registry entry preserves source evidence', () => {
      if (!receipt.registryEntryId) return 'No registry entry ID'
      const regEntry = donnaApprovedKnowledgeRegistry.getEntry(receipt.registryEntryId)
      if (!regEntry) return 'Registry entry not found'
      if (regEntry.sourceSummary !== sourceEntry.summary) return 'sourceSummary not preserved'
      if (regEntry.sourceEvidence.length === 0) return 'sourceEvidence not preserved'
      return true
    })

    test('10d — audit log records the promotion', () => {
      if (!receipt.registryEntryId) return 'No registry entry ID'
      const auditLog = donnaApprovedKnowledgeRegistry.getAuditLog(receipt.registryEntryId)
      if (auditLog.length === 0) return 'No audit log entries'
      const promotedLog = auditLog.find(a => a.action === 'promoted')
      if (!promotedLog) return 'No "promoted" audit entry found'
      return true
    })

    test('10e — retrieved knowledge carries source trace', () => {
      const result = retrieveKnowledge({
        academyId: 'academy-a1',
        concepts: ['progression_issue'],
        topicDomain: 'player_development',
      })
      if (!result.usedKnowledge) return 'No knowledge retrieved for traceability test'
      const item = result.topResult
      if (!item) return 'No top result'
      if (item.sourceTrace.sourceLearningEntryId !== sourceEntry.id) {
        return `Trace mismatch: expected ${sourceEntry.id}, got ${item.sourceTrace.sourceLearningEntryId}`
      }
      return true
    })
  }

  // ── Summary ───────────────────────────────────────────────────────────────────

  const total = passed + failed
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0

  console.log('\n═══ RESULTS ══════════════════════════════════════════════════════')
  console.log(`  Passed : ${passed}/${total} (${pct}%)`)
  console.log(`  Failed : ${failed}/${total}`)

  if (failures.length > 0) {
    console.log('\n  Failures:')
    for (const f of failures) {
      console.log(`    - ${f}`)
    }
  }

  if (pct === 100) {
    console.log('\n  ✓ DONNA Knowledge Promotion Engine V1 — 100% CERTIFIED')
  } else {
    console.log(`\n  ✗ Certification FAILED — ${100 - pct}% failing`)
    process.exit(1)
  }
}

runCertification()
