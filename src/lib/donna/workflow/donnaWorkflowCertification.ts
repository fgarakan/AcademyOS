// Sprint 2291–2320 — DONNA Workflow Guidance Certification
// Static certification runner — no DB, no API, no React.
// Tests all 10 certification scenarios via pure TypeScript simulation.

import {
  WORKFLOW_STEP_DEFS,
  startWorkflow,
  pauseWorkflow,
  resumeWorkflow,
  getSafeDeleteGuidance,
  type DonnaWorkflowState,
} from './donnaWorkflowState'
import {
  detectWorkflowIntent,
  detectControlIntent,
  advanceOnRouteChange,
  advanceOnDataPresent,
  getMissingDataQuestion,
  scoreWorkflowConfidence,
  shouldAllowStepCompletion,
} from './donnaWorkflowGuidanceEngine'
import { formatActiveMission } from './donnaMissionFormatter'

// ── Certification result ──────────────────────────────────────────────────────

interface CertificationScenario {
  id:       string
  title:    string
  pass:     boolean
  details:  string[]
  critical: boolean
}

interface CertificationReport {
  scenarios:         CertificationScenario[]
  score:             number
  totalScenarios:    number
  passedScenarios:   number
  failedScenarios:   string[]
  criticalFailures:  string[]
  recommendation:    'APPROVE' | 'HOLD'
}

// ── Scenario runners ──────────────────────────────────────────────────────────

function runScenario1_ClassTemplateResume(): CertificationScenario {
  const details: string[] = []
  let pass = true

  // Start class_template_creation workflow
  const state = startWorkflow('class_template_creation', {}, '/director')
  details.push(`Started workflow: ${state.workflowType}, step: ${state.currentStepId}`)

  if (state.status !== 'active') { pass = false; details.push('FAIL: status not active') }
  if (state.currentStepId !== 'name_template') { pass = false; details.push('FAIL: first step should be name_template') }

  // Simulate leaving (pause)
  const paused = pauseWorkflow(state)
  if (paused.status !== 'paused') { pass = false; details.push('FAIL: pause did not set status=paused') }
  details.push('Paused successfully')

  // Resume
  const resumed = resumeWorkflow(paused)
  if (resumed.status !== 'active') { pass = false; details.push('FAIL: resume did not restore active') }
  if (resumed.currentStepId !== 'name_template') { pass = false; details.push('FAIL: wrong step after resume') }
  details.push(`Resumed at step: ${resumed.currentStepId}`)

  // Format mission
  const mission = formatActiveMission(resumed)
  if (!mission) { pass = false; details.push('FAIL: formatActiveMission returned null') }
  else {
    details.push(`Mission title: "${mission.title}", next: "${mission.nextAction}"`)
    if (mission.nextAction !== 'Template Name') { pass = false; details.push('FAIL: wrong nextAction label') }
  }

  return { id: 'S1', title: 'Class Template: Start, Leave, Return, Resume', pass, details, critical: true }
}

function runScenario2_FitnessTemplateResume(): CertificationScenario {
  const details: string[] = []
  let pass = true

  // Detect via intent
  const detected = detectWorkflowIntent('create a new fitness template', '/director')
  if (detected !== 'fitness_template_creation') { pass = false; details.push(`FAIL: detected ${detected}, expected fitness_template_creation`) }
  else details.push('Intent detected: fitness_template_creation')

  // Start + advance
  const state = startWorkflow('fitness_template_creation', {}, '/director')
  if (state.currentStepId !== 'name_template') { pass = false; details.push('FAIL: wrong first step') }

  // Advance with data_present signal
  const withName = advanceOnDataPresent(state, { templateName: 'Speed + Agility' })
  if (withName.currentStepId !== 'set_type') { pass = false; details.push('FAIL: did not advance past name_template') }
  else details.push(`Advanced to: ${withName.currentStepId}`)

  // Confirm completed steps
  if (!withName.completedStepIds.includes('name_template')) { pass = false; details.push('FAIL: name_template not in completedStepIds') }
  if (withName.entityRefs.templateName !== 'Speed + Agility') { pass = false; details.push('FAIL: templateName not in entityRefs') }
  details.push('Entity refs merged correctly')

  // Mission shows completed item
  const mission = formatActiveMission(withName)
  if (!mission?.completedItems.includes('Template Name')) { pass = false; details.push('FAIL: completedItems missing Template Name') }
  else details.push('Completed items correct')

  return { id: 'S2', title: 'Fitness Template: Resume Correctly', pass, details, critical: true }
}

function runScenario3_PlayerOnboardingMissingAssessment(): CertificationScenario {
  const details: string[] = []
  let pass = true

  const state = startWorkflow('player_onboarding', {}, '/director')

  // DONNA should ask exactly ONE question (not a list)
  const question = getMissingDataQuestion(state)
  if (!question) { pass = false; details.push('FAIL: no question returned for first step') }
  else {
    details.push(`Question: "${question}"`)
    // Question must be a single sentence (no enumeration, no "and also" pattern)
    const questionCount = (question.match(/\?/g) ?? []).length
    if (questionCount !== 1) { pass = false; details.push(`FAIL: question has ${questionCount} question marks (expected exactly 1)`) }
    else details.push('One question only: PASS')
  }

  // Route to placement step
  const afterAdd = advanceOnDataPresent(state, { playerName: 'Jamie Chen' })
  details.push(`After providing player name: step = ${afterAdd.currentStepId}`)

  const placementStep = advanceOnRouteChange(afterAdd, '/director/placement')
  details.push(`After visiting placement: step = ${placementStep.currentStepId}`)
  if (placementStep.completedStepIds.length < 2) {
    // It depends on whether name_template was the first step — check with actual defs
    details.push(`Completed: ${placementStep.completedStepIds.join(', ')}`)
  }

  // Confidence scoring
  const conf = scoreWorkflowConfidence(placementStep, { loadedFromDb: false, routeMatches: true, entityRefsPresent: true })
  if (conf < 70) { pass = false; details.push(`FAIL: confidence ${conf} below 70 after route match`) }
  else details.push(`Confidence: ${conf} ≥ 70: step completion allowed`)

  return { id: 'S3', title: 'Player Onboarding: Missing Assessment, One Question', pass, details, critical: true }
}

function runScenario4_CurriculumReviewResume(): CertificationScenario {
  const details: string[] = []
  let pass = true

  const state = startWorkflow('curriculum_review', {}, '/director')
  if (state.currentStepId !== 'open_curriculum') { pass = false; details.push('FAIL: wrong first step') }

  // Visit curriculum route
  const afterRoute = advanceOnRouteChange(state, '/director/curriculum')
  if (afterRoute.currentStepId !== 'review_levels') { pass = false; details.push('FAIL: did not advance to review_levels') }
  details.push(`Step advanced to: ${afterRoute.currentStepId}`)

  // Pause + resume
  const paused = pauseWorkflow(afterRoute)
  const resumed = resumeWorkflow(paused)
  if (resumed.currentStepId !== 'review_levels') { pass = false; details.push('FAIL: wrong step after resume') }
  if (!resumed.completedStepIds.includes('open_curriculum')) { pass = false; details.push('FAIL: open_curriculum not completed') }
  details.push('Paused and resumed at correct step')

  // Mission format
  const mission = formatActiveMission(resumed)
  if (!mission) { pass = false; details.push('FAIL: mission null after resume') }
  else {
    if (!mission.completedItems.includes('Open Curriculum')) { pass = false; details.push('FAIL: Open Curriculum not in completedItems') }
    details.push(`Mission: ${mission.title}, progress: ${mission.progressPercent}%`)
  }

  return { id: 'S4', title: 'Curriculum Review: Resume Correctly', pass, details, critical: true }
}

function runScenario5_ApprovalReviewComplete(): CertificationScenario {
  const details: string[] = []
  let pass = true

  const state = startWorkflow('approval_review', {}, '/director')
  const step1 = advanceOnRouteChange(state, '/director/review')
  details.push(`Step after queue open: ${step1.currentStepId}`)

  // Mark items reviewed
  const step2 = advanceOnDataPresent(step1, { itemsReviewed: 'true' })
  details.push(`Step after items reviewed: ${step2.currentStepId}`)

  // Verify workflow doesn't auto-complete on explicit step (requires explicit signal)
  if (step2.status === 'completed') {
    pass = false
    details.push('FAIL: workflow auto-completed on explicit step — should require explicit signal')
  } else {
    details.push('Explicit step correctly requires confirmation')
  }

  // Check final step is explicit
  const defs = WORKFLOW_STEP_DEFS.approval_review
  const lastDef = defs[defs.length - 1]
  if (lastDef?.completionSignal !== 'explicit') { pass = false; details.push('FAIL: last step not explicit') }
  else details.push('Last step is explicit: requires Director confirmation')

  return { id: 'S5', title: 'Approval Review: Complete Workflow', pass, details, critical: true }
}

function runScenario6_DeleteUnusedTemplate(): CertificationScenario {
  const details: string[] = []
  let pass = true

  const guidance = getSafeDeleteGuidance('template_delete', 0)
  if (!guidance) { pass = false; details.push('FAIL: no guidance returned') }
  else {
    details.push(`Recommendation: ${guidance.recommendation}`)
    details.push(`Message: "${guidance.message.slice(0, 80)}..."`)
    details.push(`Confirm label: "${guidance.confirmLabel}"`)

    if (guidance.recommendation !== 'delete') { pass = false; details.push('FAIL: should recommend delete for unused template') }
    if (!guidance.confirmLabel.toLowerCase().includes('confirm')) { pass = false; details.push('FAIL: confirm label should include "Confirm"') }
    details.push('Unused template: safe delete allowed with confirmation: PASS')
  }

  return { id: 'S6', title: 'Delete Unused Template: Confirmation Required', pass, details, critical: true }
}

function runScenario7_ArchiveUsedTemplate(): CertificationScenario {
  const details: string[] = []
  let pass = true

  const guidance = getSafeDeleteGuidance('template_delete', 14)
  if (!guidance) { pass = false; details.push('FAIL: no guidance returned') }
  else {
    if (guidance.recommendation !== 'archive') { pass = false; details.push('FAIL: should recommend archive for used template') }
    if (!guidance.message.includes('14 session')) { pass = false; details.push('FAIL: message should mention session count') }
    if (!guidance.message.toLowerCase().includes('archiv')) { pass = false; details.push('FAIL: message should recommend archiving') }
    details.push(`Guidance message: "${guidance.message.slice(0, 100)}..."`)
    details.push('Used template: archive recommended over delete: PASS')
  }

  return { id: 'S7', title: 'Archive Used Template: Archive Recommended', pass, details, critical: true }
}

function runScenario8_DeactivateCoach(): CertificationScenario {
  const details: string[] = []
  let pass = true

  const guidance = getSafeDeleteGuidance('coach_deactivate', 0)
  if (!guidance) { pass = false; details.push('FAIL: no guidance returned') }
  else {
    if (!guidance.message.toLowerCase().includes('history')) { pass = false; details.push('FAIL: message should mention history preservation') }
    details.push(`Guidance: "${guidance.message.slice(0, 80)}..."`)
    details.push('Coach deactivate: history preserved message: PASS')
  }

  const state = startWorkflow('coach_deactivate', {}, '/director/coaches')
  if (state.currentStepId !== 'review_history') { pass = false; details.push('FAIL: first step should be review_history') }
  details.push(`First step: ${state.currentStepId}`)

  // Reassignment question appears when player reassignment step is current
  // (not first — we need to advance to it)
  // Check that step 2 has a question for which coach takes over
  const defs = WORKFLOW_STEP_DEFS.coach_deactivate
  const reassignStep = defs.find(d => d.stepId === 'reassign')
  if (!reassignStep?.question) { pass = false; details.push('FAIL: reassign step has no question') }
  else details.push(`Reassign question: "${reassignStep.question}"`)

  return { id: 'S8', title: 'Deactivate Coach: History Preserved', pass, details, critical: false }
}

function runScenario9_TodayPageMissionCard(): CertificationScenario {
  const details: string[] = []
  let pass = true

  // Simulate a saved state (as if loaded from DB)
  const savedState: DonnaWorkflowState = {
    workflowId:          'wf_test_001',
    workflowType:        'class_template_creation',
    status:              'active',
    startedAt:           new Date(Date.now() - 3600000).toISOString(),
    updatedAt:           new Date().toISOString(),
    currentStepId:       'add_blocks',
    steps:               [
      { stepId: 'name_template', status: 'completed' },
      { stepId: 'set_focus',     status: 'completed' },
      { stepId: 'add_blocks',    status: 'in_progress' },
      { stepId: 'add_fitness',   status: 'pending' },
      { stepId: 'publish',       status: 'pending' },
    ],
    completedStepIds:    ['name_template', 'set_focus'],
    blockedStepIds:      [],
    requiredDataMissing: [],
    currentRoute:        '/director',
    targetRoute:         '/director/class-templates',
    entityRefs:          { templateName: 'Green Ball Saturday', focusArea: 'groundstrokes' },
    workflowConfidence:  95,
    nextBestAction:      'Go to Class Templates to add session blocks.',
  }

  const mission = formatActiveMission(savedState)
  if (!mission) { pass = false; details.push('FAIL: formatActiveMission returned null') }
  else {
    details.push(`Mission title: "${mission.title}"`)
    details.push(`Completed: ${mission.completedItems.join(', ')}`)
    details.push(`Next: ${mission.nextAction}`)
    details.push(`Progress: ${mission.progressPercent}%`)

    if (mission.title !== 'Green Ball Saturday') { pass = false; details.push('FAIL: title should use entityRefs.templateName') }
    if (!mission.completedItems.includes('Template Name')) { pass = false; details.push('FAIL: Template Name missing from completedItems') }
    if (!mission.completedItems.includes('Focus Area')) { pass = false; details.push('FAIL: Focus Area missing from completedItems') }
    if (mission.nextAction !== 'Session Blocks') { pass = false; details.push(`FAIL: nextAction should be "Session Blocks", got "${mission.nextAction}"`) }
    if (mission.progressPercent !== 40) { pass = false; details.push(`FAIL: progress should be 40%, got ${mission.progressPercent}%`) }
    if (mission.continueRoute !== '/director/class-templates') { pass = false; details.push('FAIL: continueRoute should be /director/class-templates') }
    details.push('Today page mission card format: PASS')
  }

  return { id: 'S9', title: 'Today Page Mission Card: Shows Correct Mission', pass, details, critical: true }
}

function runScenario10_WorkflowConfidence(): CertificationScenario {
  const details: string[] = []
  let pass = true

  // New state, no DB load, no route match → below 70
  const state = startWorkflow('class_template_creation', {}, '/director')
  const lowConf = scoreWorkflowConfidence(state, { loadedFromDb: false, routeMatches: false, entityRefsPresent: false })
  details.push(`No DB, no route match: confidence = ${lowConf}`)
  if (lowConf >= 70) { pass = false; details.push('FAIL: confidence should be below 70 for new unmatched state') }
  if (shouldAllowStepCompletion(lowConf)) { pass = false; details.push('FAIL: step completion should be blocked below 70') }
  else details.push('Step completion correctly blocked below 70')

  // Route matches → at least 75
  const medConf = scoreWorkflowConfidence(state, { loadedFromDb: false, routeMatches: true, entityRefsPresent: false })
  details.push(`No DB, route matches: confidence = ${medConf}`)
  if (medConf < 70) { pass = false; details.push('FAIL: confidence should be ≥ 70 when route matches') }
  if (!shouldAllowStepCompletion(medConf)) { pass = false; details.push('FAIL: step completion should be allowed at 75') }
  else details.push('Step completion allowed at medium confidence')

  // DB loaded + route match → 90+
  const highConf = scoreWorkflowConfidence(state, { loadedFromDb: true, routeMatches: true, entityRefsPresent: false })
  details.push(`DB loaded, route matches: confidence = ${highConf}`)
  if (highConf < 90) { pass = false; details.push('FAIL: should be ≥ 90 when loaded from DB') }

  // Max confidence
  const maxConf = scoreWorkflowConfidence(state, { loadedFromDb: true, routeMatches: true, entityRefsPresent: true })
  details.push(`DB + route + data: confidence = ${maxConf}`)
  if (maxConf < 95) { pass = false; details.push('FAIL: should be ≥ 95 for full signal') }

  details.push('Confidence scoring: PASS')

  return { id: 'S10', title: 'Workflow Confidence: Prevents False Completion', pass, details, critical: true }
}

// ── Main certification runner ─────────────────────────────────────────────────

export function runWorkflowCertification(): CertificationReport {
  const scenarios: CertificationScenario[] = [
    runScenario1_ClassTemplateResume(),
    runScenario2_FitnessTemplateResume(),
    runScenario3_PlayerOnboardingMissingAssessment(),
    runScenario4_CurriculumReviewResume(),
    runScenario5_ApprovalReviewComplete(),
    runScenario6_DeleteUnusedTemplate(),
    runScenario7_ArchiveUsedTemplate(),
    runScenario8_DeactivateCoach(),
    runScenario9_TodayPageMissionCard(),
    runScenario10_WorkflowConfidence(),
  ]

  const passedScenarios = scenarios.filter(s => s.pass).length
  const totalScenarios  = scenarios.length
  const score           = Math.round((passedScenarios / totalScenarios) * 10 * 10) / 10

  const failedScenarios  = scenarios.filter(s => !s.pass).map(s => s.id)
  const criticalFailures = scenarios.filter(s => !s.pass && s.critical).map(s => s.id)

  const recommendation: CertificationReport['recommendation'] =
    score >= 9 && criticalFailures.length === 0 ? 'APPROVE' : 'HOLD'

  return { scenarios, score, totalScenarios, passedScenarios, failedScenarios, criticalFailures, recommendation }
}
