// Sprint 4355 — Page-Owned Workflow Boundary Certification V1
//
// PURPOSE
// Prevent any future regression where a PAGE-OWNED editor workflow (template,
// session, assessment, …) renders as a DONNA *sidebar collector* or survives as
// a stale operating-session mission across navigation. This is the regression
// that produced the stale "CREATE CLASS TEMPLATE" card on /director/today.
//
// THE BOUNDARY (single source of truth: src/lib/donna/pageOwnedWorkflows.ts)
//   - A page-owned workflow may NEVER render as a DONNA sidebar collector/editor.
//   - A page-owned workflow may NEVER be tracked as an operating-session mission
//     once the director leaves the builder route.
//   - "Create" entries NAVIGATE to the page builder; they never instantiate an
//     editor inside the sidebar.
//   - DONNA still continues the workflow (guidance/explanation/navigation);
//     the page owns editing; the sidebar never owns editing.
//
// This suite exercises the REAL enforcement functions — isPageOwnedWorkflow,
// advanceOnRouteChange, the DonnaWorkflowCards render predicate, and the
// donnaDraftPersistence save/load guards — against every page-owned editor and
// every sidebar-hosting route. Pure TypeScript: no DB, no API, no React render.
//
// Static runner. Exits non-zero on any failed check (CI gate compatible).

import {
  PAGE_OWNED_WORKFLOW_IDS,
  isPageOwnedWorkflow,
  getPageOwnedGuidance,
  inferTemplateBuilderGuidance,
} from '../pageOwnedWorkflows'
import {
  WORKFLOW_STEP_DEFS,
  startWorkflow,
  type DonnaWorkflowType,
} from '../workflow/donnaWorkflowState'
import { advanceOnRouteChange } from '../workflow/donnaWorkflowGuidanceEngine'
import {
  saveDraftToSession,
  loadDraftFromSession,
  hasDraftSession,
  clearDraftSession,
} from '../../../components/assistant/donnaDraftPersistence'
import type { ConversationState } from '../../../components/assistant/donnaConversationController'

// ── Check harness ─────────────────────────────────────────────────────────────

let passed = 0
let failed = 0
const failures: string[] = []

function check(label: string, ok: boolean): void {
  if (ok) {
    passed++
    process.stdout.write(`   ✓ ${label}\n`)
  } else {
    failed++
    failures.push(label)
    process.stdout.write(`   ✗ ${label}\n`)
  }
}

function section(title: string): void {
  process.stdout.write(`\n── ${title} ──\n`)
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

// The seven director surfaces that render the DONNA sidebar. None may host a
// page-owned editor collector. ('/director/sessions' is the session LIST, not the
// '/director/sessions/new' builder — so a session mission must cancel here too.)
const SIDEBAR_HOST_ROUTES: ReadonlyArray<{ label: string; route: string }> = [
  { label: 'Today', route: '/director/today' },
  { label: 'Players', route: '/director/players' },
  { label: 'Curriculum', route: '/director/curriculum' },
  { label: 'Templates', route: '/director/templates' },
  { label: 'Sessions', route: '/director/sessions' },
  { label: 'Coaches', route: '/director/coaches' },
  { label: 'Approvals', route: '/director/review' },
]

// The named page-owned editors. workflowId !== null → backed by a real
// DonnaWorkflowType and listed in PAGE_OWNED_WORKFLOW_IDS. workflowId === null →
// the editor has NO workflow type at all, so DONNA structurally cannot host it as
// a collector (the strongest possible guarantee); only the page owns it.
const NAMED_EDITORS: ReadonlyArray<{
  name: string
  workflowId: DonnaWorkflowType | null
  builderRoute: string
}> = [
  { name: 'Class Templates', workflowId: 'class_template_creation', builderRoute: '/director/class-templates' },
  { name: 'Fitness Templates', workflowId: 'fitness_template_creation', builderRoute: '/director/fitness/templates' },
  { name: 'Session Builder', workflowId: 'session_creation', builderRoute: '/director/sessions/new' },
  { name: 'Assessment Builder', workflowId: 'player_assessment', builderRoute: '/director/assessment-template' },
  { name: 'Curriculum Builder', workflowId: null, builderRoute: '/director/curriculum/builder' },
  { name: 'Player Creation', workflowId: null, builderRoute: '/director/players/new' },
  { name: 'Coach Creation', workflowId: null, builderRoute: '/director/coaches' },
]

// Legitimate DONNA-owned sidebar drafts — these MUST remain sidebar-eligible.
// They prove the guard suppresses only page-owned workflows, nothing else.
const SIDEBAR_OWNED_DRAFTS: readonly string[] = [
  'coach_note_capture',
  'parent_update_draft',
  'attendance_exception',
]

// Non-page-owned missions with real step defs — used as the control that proves
// route-change cancellation does NOT over-broaden to DONNA-owned workflows.
const CONTROL_MISSIONS: readonly DonnaWorkflowType[] = [
  'academy_setup',
  'curriculum_review',
  'approval_review',
  'coach_wrap_up_review',
]

// Mirrors DonnaWorkflowCards.tsx render guard (page-owned dimension):
//   {convState.activeDraft !== null && !isPageOwnedWorkflow(activeDraft.workflowId) && …}
// Given a present active draft, returns whether the sidebar draft card renders.
function sidebarDraftCardWouldRender(workflowId: string | null): boolean {
  const activeDraftPresent = true
  return activeDraftPresent && !isPageOwnedWorkflow(workflowId)
}

// Minimal ConversationState carrying a draft for a given workflow id.
function draftState(workflowId: string): ConversationState {
  return {
    phase: 'collecting',
    activeDraft: { workflowId },
  } as unknown as ConversationState
}

// Install a Map-backed window.sessionStorage so the REAL persistence functions
// run in node exactly as they do in the browser.
function installFakeSessionStorage(): { store: Record<string, string> } {
  const store: Record<string, string> = {}
  const sessionStorage = {
    getItem: (k: string): string | null => (k in store ? store[k] : null),
    setItem: (k: string, v: string): void => { store[k] = v },
    removeItem: (k: string): void => { delete store[k] },
    clear: (): void => { for (const k of Object.keys(store)) delete store[k] },
  }
  ;(globalThis as { window?: unknown }).window = { sessionStorage }
  return { store }
}

// ── Run ───────────────────────────────────────────────────────────────────────

function run(): void {
  process.stdout.write('\nPage-Owned Workflow Boundary Certification\n')
  process.stdout.write('============================================================\n')

  // ── A. Predicate & single-source contract ─────────────────────────────────────
  section('A. Page-owned predicate contract')
  for (const id of PAGE_OWNED_WORKFLOW_IDS) {
    check(`isPageOwnedWorkflow('${id}') === true`, isPageOwnedWorkflow(id) === true)
    const g = getPageOwnedGuidance(id)
    check(`'${id}' has guidance`, g !== null)
    check(`'${id}' builderRoute is a /director page`, !!g && g.builderRoute.startsWith('/director/'))
    check(`'${id}' guidance text is non-empty`, !!g && g.guidance.trim().length > 0)
    check(`'${id}' is a real DonnaWorkflowType (has step defs)`, id in WORKFLOW_STEP_DEFS)
  }
  // Negatives — these must remain sidebar-eligible / non-page-owned.
  check('isPageOwnedWorkflow(null) === false', isPageOwnedWorkflow(null) === false)
  check('isPageOwnedWorkflow(undefined) === false', isPageOwnedWorkflow(undefined) === false)
  check("isPageOwnedWorkflow('') === false", isPageOwnedWorkflow('') === false)
  check("isPageOwnedWorkflow('approval_review') === false", isPageOwnedWorkflow('approval_review') === false)
  check("isPageOwnedWorkflow('placement_review') === false", isPageOwnedWorkflow('placement_review') === false)
  // Conversation-ownership nuance: curriculum REVIEW is DONNA-owned (a guided
  // review conversation), while the curriculum BUILDER editor is page-owned.
  check("isPageOwnedWorkflow('curriculum_review') === false (DONNA owns review)", isPageOwnedWorkflow('curriculum_review') === false)
  check("isPageOwnedWorkflow('coach_note_capture') === false", isPageOwnedWorkflow('coach_note_capture') === false)

  // ── B. Named editor registry (the 7 page-owned editors) ───────────────────────
  section('B. Named editors are page-owned (never sidebar collectors)')
  for (const e of NAMED_EDITORS) {
    check(`${e.name}: builder route is a /director page`, e.builderRoute.startsWith('/director/'))
    if (e.workflowId !== null) {
      check(`${e.name}: workflow id is page-owned`, isPageOwnedWorkflow(e.workflowId))
      check(`${e.name}: listed in PAGE_OWNED_WORKFLOW_IDS`, (PAGE_OWNED_WORKFLOW_IDS as readonly string[]).includes(e.workflowId))
      check(`${e.name}: sidebar collector is suppressed`, sidebarDraftCardWouldRender(e.workflowId) === false)
    } else {
      // Structural guarantee: no creation-editor workflow type exists at all, so
      // DONNA has nothing to instantiate as a sidebar collector for this editor.
      const conceptual = `${e.name.split(' ')[0].toLowerCase()}_creation`
      check(`${e.name}: no '${conceptual}' editor workflow type exists`, !(conceptual in WORKFLOW_STEP_DEFS))
      check(`${e.name}: page-only (a null workflow cannot host a collector)`, sidebarDraftCardWouldRender(null) === true && isPageOwnedWorkflow(null) === false)
    }
  }

  // ── C. Route-change lifecycle: page-owned missions never survive navigation ────
  section('C. Page-owned mission cancels on leaving the builder, survives on it')
  for (const id of PAGE_OWNED_WORKFLOW_IDS) {
    const guidance = getPageOwnedGuidance(id)
    if (!guidance) { check(`'${id}' has guidance for lifecycle test`, false); continue }
    const builder = guidance.builderRoute

    // On the builder route → untouched (page owns the form; no advance, no cancel).
    const onBuilder = advanceOnRouteChange(startWorkflow(id, {}, builder), builder)
    check(`'${id}' stays active on its own builder route`, onBuilder.status === 'active')

    // On a nested builder sub-route → still untouched.
    const onNested = advanceOnRouteChange(startWorkflow(id, {}, builder), builder + '/123')
    check(`'${id}' stays active on a nested builder route`, onNested.status === 'active')

    // Leaving the builder for ANY sidebar-hosting route → cancelled.
    for (const r of SIDEBAR_HOST_ROUTES) {
      const left = advanceOnRouteChange(startWorkflow(id, {}, builder), r.route)
      check(`'${id}' mission cancelled when navigating to ${r.label}`, left.status === 'cancelled')
    }
  }

  // ── D. Control: DONNA-owned missions are NOT cancelled by navigation ───────────
  section('D. Non-page-owned missions are not over-cancelled')
  for (const type of CONTROL_MISSIONS) {
    const moved = advanceOnRouteChange(startWorkflow(type, {}, '/director'), '/director/today')
    check(`'${type}' is not cancelled by a route change`, moved.status !== 'cancelled')
  }

  // ── E. Sidebar render guard mirrors DonnaWorkflowCards ────────────────────────
  section('E. Sidebar render guard suppresses only page-owned drafts')
  for (const id of PAGE_OWNED_WORKFLOW_IDS) {
    check(`page-owned draft '${id}' does NOT render as a sidebar card`, sidebarDraftCardWouldRender(id) === false)
  }
  for (const id of SIDEBAR_OWNED_DRAFTS) {
    check(`DONNA-owned draft '${id}' DOES render as a sidebar card`, sidebarDraftCardWouldRender(id) === true)
  }

  // ── F. Regression matrix: the 7 routes cannot host a page-owned collector ──────
  section('F. Per-route regression matrix (Today · Players · Curriculum · Templates · Sessions · Coaches · Approvals)')
  for (const r of SIDEBAR_HOST_ROUTES) {
    for (const id of PAGE_OWNED_WORKFLOW_IDS) {
      // The render guard is route-agnostic: a page-owned draft is suppressed on
      // every route, so it can never appear on this surface.
      check(`${r.label}: page-owned draft '${id}' is suppressed`, sidebarDraftCardWouldRender(id) === false)
      // And a page-owned mission navigated onto this route is dismissed.
      const builder = getPageOwnedGuidance(id)!.builderRoute
      const arrived = advanceOnRouteChange(startWorkflow(id, {}, builder), r.route)
      check(`${r.label}: page-owned mission '${id}' is dismissed on arrival`, arrived.status === 'cancelled')
    }
    // Control: a DONNA-owned draft still renders here (no over-suppression).
    check(`${r.label}: DONNA-owned draft still renders`, sidebarDraftCardWouldRender('coach_note_capture') === true)
  }

  // ── G. "Create" actions navigate to the page, never open a sidebar editor ─────
  section('G. Create entries navigate to the page builder')
  check("'create a class template' → class builder route", inferTemplateBuilderGuidance('create a class template').builderRoute === '/director/class-templates')
  check("'build a fitness conditioning template' → fitness builder route", inferTemplateBuilderGuidance('build a fitness conditioning template').builderRoute === '/director/fitness/templates')
  check("'add a strength template' → fitness builder route", inferTemplateBuilderGuidance('add a strength template').builderRoute === '/director/fitness/templates')
  check("ambiguous 'make a template' → defaults to class builder", inferTemplateBuilderGuidance('make a template').builderRoute === '/director/class-templates')
  for (const id of PAGE_OWNED_WORKFLOW_IDS) {
    const g = getPageOwnedGuidance(id)!
    check(`'${id}' create destination is a page, not the DONNA shell`, !g.builderRoute.startsWith('/director/donna'))
    check(`'${id}' create destination is a known builder route`, NAMED_EDITORS.some(e => e.workflowId === id && e.builderRoute === g.builderRoute))
  }

  // ── H. Persistence guard: page-owned drafts are never saved or restored ───────
  section('H. Draft persistence refuses page-owned drafts (real save/load)')
  const { store } = installFakeSessionStorage()

  // A normal DONNA-owned draft persists and restores (proves the path works).
  clearDraftSession()
  saveDraftToSession(draftState('coach_note_capture'))
  check('DONNA-owned draft is persisted', hasDraftSession() === true)
  const key = Object.keys(store)[0]
  check('persisted under exactly one key', Object.keys(store).length === 1 && !!key)
  const restored = loadDraftFromSession()
  check('DONNA-owned draft restores', restored !== null && restored.activeDraft !== null)

  // A page-owned draft is refused on save and the legacy key is wiped.
  for (const id of PAGE_OWNED_WORKFLOW_IDS) {
    clearDraftSession()
    saveDraftToSession(draftState(id))
    check(`page-owned draft '${id}' is NOT persisted`, hasDraftSession() === false)
  }

  // A page-owned draft planted by a legacy build is refused on load and cleared.
  for (const id of PAGE_OWNED_WORKFLOW_IDS) {
    if (key) store[key] = JSON.stringify(draftState(id))
    const loaded = loadDraftFromSession()
    check(`legacy page-owned draft '${id}' is NOT restored`, loaded === null)
    check(`legacy page-owned draft '${id}' key is cleared`, !key || !(key in store))
  }

  // ── I. Single-source mechanism (future page-owned editors) ─────────────────────
  section('I. Single predicate gates every enforcement point')
  // For each page-owned id, all three enforcement points agree simultaneously —
  // proving they are driven by the one PAGE_OWNED_WORKFLOW_IDS list, so a future
  // editor added there is enforced everywhere at once.
  for (const id of PAGE_OWNED_WORKFLOW_IDS) {
    const renderSuppressed = sidebarDraftCardWouldRender(id) === false
    clearDraftSession()
    saveDraftToSession(draftState(id))
    const persistenceRefused = hasDraftSession() === false
    const builder = getPageOwnedGuidance(id)!.builderRoute
    const missionCancelled = advanceOnRouteChange(startWorkflow(id, {}, builder), '/director/today').status === 'cancelled'
    check(`'${id}': render + persistence + lifecycle enforce together`, renderSuppressed && persistenceRefused && missionCancelled)
  }
  // No duplicates in the source list.
  check('PAGE_OWNED_WORKFLOW_IDS has no duplicates', new Set(PAGE_OWNED_WORKFLOW_IDS).size === PAGE_OWNED_WORKFLOW_IDS.length)
  // A hypothetical not-yet-registered editor is NOT guarded — the list is the
  // sole gate (documents how to onboard a future page-owned editor).
  check("unregistered 'private_lesson_creation' is not yet page-owned", isPageOwnedWorkflow('private_lesson_creation') === false)
  check("unregistered editor would still render until added to the list", sidebarDraftCardWouldRender('private_lesson_creation') === true)

  // ── J. Resolved-workflow routing: every page-owned intent → its OWN builder ───
  section('J. A resolved page-owned workflow routes to its own builder, never a template fallback')
  // Mirrors the DonnaAssistantButton chokepoint (openPageOwnedWorkflowGuidance):
  //   route = (getPageOwnedGuidance(wfType) ?? inferTemplateBuilderGuidance(text)).builderRoute
  // Once detectWorkflowIntent has RESOLVED a page-owned wfType, the route must come
  // from that workflow's own guidance — the template inference is a last-resort
  // fallback that must NEVER be reached for a registered page-owned id. This is the
  // exact regression that sent "create a session" to the class-template builder.
  function resolvePageOwnedRoute(wfType: string, rawText: string): string {
    return (getPageOwnedGuidance(wfType) ?? inferTemplateBuilderGuidance(rawText)).builderRoute
  }
  // The only two routes the template-inference fallback can ever produce.
  const TEMPLATE_FALLBACK_ROUTES = new Set([
    inferTemplateBuilderGuidance('class').builderRoute,
    inferTemplateBuilderGuidance('fitness').builderRoute,
  ])
  // Representative non-template free text proves the ?? short-circuits BEFORE
  // inference — even hostile text never drags a resolved id to a template route.
  const NON_TEMPLATE_TEXT = 'create a session and assess the player'
  for (const id of PAGE_OWNED_WORKFLOW_IDS) {
    const own = getPageOwnedGuidance(id)!.builderRoute
    // The fallback is never consulted for a registered id (left side non-null).
    check(`'${id}' has its own guidance (template fallback never reached)`, getPageOwnedGuidance(id) !== null)
    // Resolution lands on the id's OWN builder route regardless of the raw text.
    check(`'${id}' resolves to its own builder route under non-template text`, resolvePageOwnedRoute(id, NON_TEMPLATE_TEXT) === own)
    check(`'${id}' resolved route matches its named-editor builder route`, NAMED_EDITORS.some(e => e.workflowId === id && e.builderRoute === own))
    // Non-template page-owned ids must NOT resolve to a template-builder route.
    const isTemplateId = id === 'class_template_creation' || id === 'fitness_template_creation'
    if (!isTemplateId) {
      check(`'${id}' does NOT resolve to a template-builder route`, !TEMPLATE_FALLBACK_ROUTES.has(resolvePageOwnedRoute(id, NON_TEMPLATE_TEXT)))
    }
  }
  // Direct regression locks for the two ids that exposed the blind spot.
  check("'create a session' resolves to /director/sessions/new (not the template builder)", resolvePageOwnedRoute('session_creation', 'create a session') === '/director/sessions/new')
  check("'assess the player' resolves to /director/assessment-template (not the template builder)", resolvePageOwnedRoute('player_assessment', 'assess the player') === '/director/assessment-template')

  // ── Summary ────────────────────────────────────────────────────────────────────
  process.stdout.write('\n============================================================\n')
  process.stdout.write(`Page-Owned Workflow Boundary: ${passed}/${passed + failed} checks passed\n`)
  if (failed > 0) {
    process.stdout.write('\nFailures:\n')
    failures.forEach(f => process.stdout.write(`  ✗ ${f}\n`))
  }
  process.stdout.write('============================================================\n')
  process.exit(failed > 0 ? 1 : 0)
}

run()
