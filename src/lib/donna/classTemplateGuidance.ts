// Sprint 972 — DONNA Class Template Guidance V1
// Deterministic guidance for class template workflow decisions.
// Pure TypeScript — no DB calls, no API calls, no React, no mutations.
//
// Guides directors through:
//   - understanding a class template
//   - assessing template readiness
//   - understanding block structure
//   - knowing what "create session from template" means
//   - understanding V1 vs V2 capabilities
//
// Usage:
//   const text = buildClassTemplateGuidance('explain_template')

// ── Intent types ──────────────────────────────────────────────────────────────

export type ClassTemplateGuidanceIntent =
  | 'explain_template'           // Explain this template / What is a class template?
  | 'template_readiness'         // Is this template ready? / Template readiness
  | 'explain_blocks'             // What are blocks? / Explain block structure
  | 'create_session_from_template' // Create session from template / How do I use this template?
  | 'explain_template_list'      // What is the template library? / Explain template list

// ── Guidance text ─────────────────────────────────────────────────────────────

const GUIDANCE: Record<ClassTemplateGuidanceIntent, string> = {
  explain_template: `A class template is a structured lesson plan that defines how a session runs — the blocks (warm-up, technical work, point play, match play), their duration, their focus, and any exercises or drills tied to each block. Templates are reusable: one template can generate many sessions over time. Nothing in the template affects live sessions until you explicitly generate a session from it. Think of it as a director-approved blueprint.`,

  template_readiness: `A template is ready when it has: (1) a name and focus label, (2) at least one block with a defined duration and purpose, and (3) optionally a curriculum level linked so DONNA can provide context. The primary action area shows the next setup step — complete it before generating sessions. Templates in draft state are not yet generating sessions. Once complete, the director can generate a scheduled session from the template detail page.`,

  explain_blocks: `Blocks are the building sections of a class template — for example: Warm-Up (10 min), Technical Work (20 min), Point Play (15 min), Match Play (15 min). Each block has a name, duration, and optional focus. Blocks can have exercises or drills linked to them. The block list shows the current structure. You can add, reorder, or adjust blocks in the template builder. Changes to a template's blocks do not affect sessions already generated from it — only new sessions use the updated structure.`,

  create_session_from_template: `Generating a session from a template creates a scheduled instance — with a date, group, and coach assignment — based on the template's block structure. The session is separate from the template: editing the template later does not change existing sessions. To create a session: complete the template setup, then use the "Generate Session" action on the template detail page. The session appears in the Director Sessions list and becomes visible to the assigned coach. This is the safe workflow — no session is created automatically.`,

  explain_template_list: `The template library is your collection of director-approved class blueprints. Each template represents a session design that can be reused for different groups or dates. From the list, you can open any template to review, edit, or generate sessions from it. Creating a new template starts the builder — you define the name, focus, blocks, and duration. Templates with a curriculum level linked are ready for DONNA to provide contextual guidance. Templates without a level are usable but DONNA has less context for recommendations.`,
}

// ── Intent detector ───────────────────────────────────────────────────────────

const EXPLAIN_TEMPLATE_PHRASES = [
  'explain this template',
  'what is a class template',
  'what does this template do',
  'explain the template',
  'what is this template',
] as const

const TEMPLATE_READINESS_PHRASES = [
  'is this template ready',
  'template readiness',
  'is the template complete',
  'how do i know if the template is ready',
  'template complete',
] as const

const EXPLAIN_BLOCKS_PHRASES = [
  'what are blocks',
  'explain blocks',
  'explain block structure',
  'what is a block',
  'how do blocks work',
  'block structure',
] as const

const CREATE_SESSION_PHRASES = [
  'create session from template',
  'generate session from template',
  'how do i use this template',
  'create a session',
  'generate a session',
  'use this template',
] as const

const EXPLAIN_LIST_PHRASES = [
  'what is the template library',
  'explain template list',
  'explain the template library',
  'what are templates for',
  'template library',
] as const

export function matchesClassTemplateGuidanceIntent(text: string): ClassTemplateGuidanceIntent | null {
  const n = text.toLowerCase().trim()

  if (EXPLAIN_TEMPLATE_PHRASES.some(p => n.includes(p))) return 'explain_template'
  if (TEMPLATE_READINESS_PHRASES.some(p => n.includes(p))) return 'template_readiness'
  if (EXPLAIN_BLOCKS_PHRASES.some(p => n.includes(p))) return 'explain_blocks'
  if (CREATE_SESSION_PHRASES.some(p => n.includes(p))) return 'create_session_from_template'
  if (EXPLAIN_LIST_PHRASES.some(p => n.includes(p))) return 'explain_template_list'

  return null
}

// ── Main guidance builder ─────────────────────────────────────────────────────

/**
 * Build COO-style guidance text for the given class template intent.
 * Returns a full text string — caller handles display via setCommandResponse.
 */
export function buildClassTemplateGuidance(intent: ClassTemplateGuidanceIntent): string {
  return GUIDANCE[intent]
}
