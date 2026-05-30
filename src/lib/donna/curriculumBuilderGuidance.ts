// Sprint 973 — DONNA Curriculum Builder Guidance V1
// Deterministic guidance for curriculum builder decisions.
// Pure TypeScript — no DB calls, no API calls, no React, no mutations.
//
// Guides directors through:
//   - understanding the curriculum structure (levels, stages, gates)
//   - knowing what to edit first
//   - understanding draft/review behavior
//   - safe edit boundaries
//   - what requires approval
//   - global vs academy curriculum permissions
//
// Usage:
//   const text = buildCurriculumBuilderGuidance('explain_curriculum')

// ── Intent types ──────────────────────────────────────────────────────────────

export type CurriculumBuilderGuidanceIntent =
  | 'explain_curriculum'       // What is the curriculum? / Explain this page
  | 'explain_levels'           // What are levels? / Explain the level tree
  | 'explain_gates'            // What are gates? / How does a player advance?
  | 'what_to_edit_first'       // What should I edit first? / Where do I start?
  | 'draft_review_behavior'    // How does the draft work? / Do changes apply immediately?
  | 'global_vs_academy'        // What is global vs academy curriculum? / Can I edit global content?

// ── Guidance text ─────────────────────────────────────────────────────────────

const GUIDANCE: Record<CurriculumBuilderGuidanceIntent, string> = {
  explain_curriculum: `The Curriculum Builder is where you manage your academy's development pathway — the structured sequence of levels, skills, and milestones that players move through. Each level has a set of drills, gates, and content items. The curriculum spine defines what coaches teach, what players work toward, and what directors use to track progress. Changes here are drafts — nothing is applied to player records until you explicitly review and approve each change.`,

  explain_levels: `Levels are the stages of player development in your academy — for example: Red 1, Red 2, Orange 1, Orange 2, Yellow 1, Yellow 2. Each level has associated drills, gates, and curriculum content. The level tree on the left shows the full pathway from entry level to advanced. Players are assigned to a level by the director; DONNA can identify when readiness signals suggest a player may be ready to move up, but level changes never happen automatically.`,

  explain_gates: `Gates are completion criteria a player must meet before advancing to the next level. Each gate has a threshold (for example, "3 coach observations of consistent backhand slice") and a status. When enough evidence is recorded by coaches and reviewed by you, a player's gate status can move from observing → evidence threshold met → confirmed. The director confirms gate completion — it does not happen automatically. Gate confirmation is what enables an advancement proposal.`,

  what_to_edit_first: `Start with the curriculum status overview — it shows which levels have content and which are missing key components. Then review the level tree to confirm your development pathway is complete. If a level is missing drills, gates, or content, that level is incomplete for coaching delivery. Focus on the levels your active players are currently assigned to — incomplete content there has the most immediate coaching impact.`,

  draft_review_behavior: `All curriculum edits create a draft — they do not take effect immediately. When you add a drill, change a gate threshold, or update a level description, the change is saved as a pending draft visible in the Review Draft area. You review the draft, make any adjustments, and then approve it. Only after approval does the change become part of the live curriculum. This means coaches and players always see a reviewed, director-approved curriculum — never an accidental edit.`,

  global_vs_academy: `Academy OS separates global curriculum content (the base library — drills, skills, missions shared across all academies) from academy-specific content (custom additions and overrides specific to your academy). As a director, you can: (1) use global content as-is; (2) create academy-specific custom content; (3) override global defaults for your academy. You cannot modify the global library directly — any changes to global content are proposed as academy overrides and remain specific to your academy. This ensures your customizations are safe and the base library remains consistent.`,
}

// ── Intent detector ───────────────────────────────────────────────────────────

const EXPLAIN_CURRICULUM_PHRASES = [
  'what is the curriculum',
  'explain the curriculum',
  'explain this page',
  'what does this page do',
  'curriculum overview',
] as const

const EXPLAIN_LEVELS_PHRASES = [
  'what are levels',
  'explain levels',
  'explain the level tree',
  'what is the level tree',
  'how do levels work',
  'curriculum levels',
] as const

const EXPLAIN_GATES_PHRASES = [
  'what are gates',
  'explain gates',
  'how does a player advance',
  'how do gates work',
  'curriculum gates',
  'advancement gates',
] as const

const WHAT_TO_EDIT_PHRASES = [
  'what should i edit first',
  'where do i start',
  'what to edit first',
  'what to focus on',
  'curriculum first step',
] as const

const DRAFT_REVIEW_PHRASES = [
  'how does the draft work',
  'do changes apply immediately',
  'draft review',
  'how do curriculum changes work',
  'when do changes take effect',
] as const

const GLOBAL_VS_ACADEMY_PHRASES = [
  'global vs academy',
  'what is global curriculum',
  'can i edit global content',
  'global vs local',
  'academy curriculum',
  'global curriculum',
] as const

export function matchesCurriculumBuilderGuidanceIntent(text: string): CurriculumBuilderGuidanceIntent | null {
  const n = text.toLowerCase().trim()

  if (EXPLAIN_CURRICULUM_PHRASES.some(p => n.includes(p))) return 'explain_curriculum'
  if (EXPLAIN_LEVELS_PHRASES.some(p => n.includes(p))) return 'explain_levels'
  if (EXPLAIN_GATES_PHRASES.some(p => n.includes(p))) return 'explain_gates'
  if (WHAT_TO_EDIT_PHRASES.some(p => n.includes(p))) return 'what_to_edit_first'
  if (DRAFT_REVIEW_PHRASES.some(p => n.includes(p))) return 'draft_review_behavior'
  if (GLOBAL_VS_ACADEMY_PHRASES.some(p => n.includes(p))) return 'global_vs_academy'

  return null
}

// ── Main guidance builder ─────────────────────────────────────────────────────

/**
 * Build COO-style guidance text for the given curriculum builder intent.
 * Returns a full text string — caller handles display via setCommandResponse.
 */
export function buildCurriculumBuilderGuidance(intent: CurriculumBuilderGuidanceIntent): string {
  return GUIDANCE[intent]
}
