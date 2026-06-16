// Sprint 2891–2920 — DONNA Knowledge Promotion Engine V1
// Part 4 — Knowledge Draft Generator
//
// Converts an approved LearningEntry into a knowledge draft.
// The draft is the proposed content the director will review before promoting.
//
// OpenAI usage — strictly limited to:
//   - Suggesting a cleaner title
//   - Rewording the body for clarity
//   - Structural formatting of the knowledge statement
//
// OpenAI NEVER:
//   - Approves or rejects drafts
//   - Determines what is truth
//   - Influences promotion decisions
//   - Accesses or modifies LearningEntry status
//
// Without OPENAI_API_KEY: system generates a deterministic draft (always works).
//
// Design rules:
//   - Pure TypeScript. No DB, no React, no side effects beyond OpenAI call.
//   - Always returns a draft — never throws.
//   - isDraft: true and requiresApproval: true are hardcoded.

import type { LearningEntry } from '../learning/learningEntryModel'
import type { KnowledgeTargetScope } from './knowledgePromotionCandidateModel'
import { inferTargetScope } from './knowledgePromotionCandidateModel'

// ── Draft result ──────────────────────────────────────────────────────────────

export interface KnowledgeDraft {
  proposedTitle: string
  proposedBody: string
  targetScope: KnowledgeTargetScope
  draftGeneratedBy: 'system' | 'openai'
  isDraft: true                     // always true
  requiresApproval: true            // always true
  generatedAt: string
  openaiSkipped: boolean
  openaiSkipReason: string | null
  wordCount: number
}

// ── Scope labels ──────────────────────────────────────────────────────────────

const SCOPE_LABELS: Record<KnowledgeTargetScope, string> = {
  academy_specific_knowledge: 'Academy-Specific Knowledge',
  global_platform_knowledge_candidate: 'Global Platform Knowledge (Pending Review)',
  brian_philosophy_knowledge: 'Academy Philosophy',
  curriculum_knowledge: 'Curriculum Knowledge',
  coach_standard_knowledge: 'Coaching Standard',
  parent_communication_knowledge: 'Parent Communication Standard',
  operating_model_knowledge: 'Academy Operating Knowledge',
}

// ── System draft generator (no AI) ───────────────────────────────────────────

function generateSystemDraft(entry: LearningEntry, scope: KnowledgeTargetScope): KnowledgeDraft {
  // Title: capitalize summary, trim to 80 chars
  const rawTitle = entry.topic.length > 5
    ? entry.topic
    : entry.summary.slice(0, 80)
  const proposedTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1)

  // Body: structured knowledge statement
  const scopeLabel = SCOPE_LABELS[scope]
  const sourceLabel = entry.sourceType === 'brian_direct'
    ? 'Academy owner (Brian Dabul)'
    : entry.sourceType === 'director_voice'
      ? 'Director'
      : entry.sourceType === 'coach_observation'
        ? 'Coach observation'
        : entry.sourceType === 'system_observation'
          ? 'System data'
          : 'Academy'

  const body = [
    `**${proposedTitle}**`,
    '',
    entry.summary,
    '',
    `**Evidence:** ${entry.evidence}`,
    entry.examplePhrases.length > 0
      ? `**Example phrases:** ${entry.examplePhrases.slice(0, 3).join(' · ')}`
      : '',
    '',
    `**Source:** ${sourceLabel}`,
    `**Scope:** ${scopeLabel}`,
    `**Confidence:** ${Math.round(entry.confidence * 100)}%`,
    '',
    '*This draft requires director review and approval before becoming official knowledge.*',
  ].filter(l => l !== undefined).join('\n')

  return {
    proposedTitle,
    proposedBody: body,
    targetScope: scope,
    draftGeneratedBy: 'system',
    isDraft: true,
    requiresApproval: true,
    generatedAt: new Date().toISOString(),
    openaiSkipped: true,
    openaiSkipReason: 'System draft — no OpenAI enrichment requested',
    wordCount: body.split(/\s+/).length,
  }
}

// ── OpenAI prompt ─────────────────────────────────────────────────────────────

function buildDraftPrompt(entry: LearningEntry, scope: KnowledgeTargetScope): string {
  return `You are DONNA, an AI assistant for a tennis academy.
A learning entry has been approved and is being drafted as official academy knowledge.
Your task is to write a clean, professional knowledge statement for director review.

LEARNING ENTRY:
Topic: ${entry.topic}
Summary: ${entry.summary}
Evidence: ${entry.evidence}
Phrases: ${entry.examplePhrases.join('; ')}
Source: ${entry.sourceType}
Confidence: ${Math.round(entry.confidence * 100)}%

TARGET SCOPE: ${SCOPE_LABELS[scope]}

Write:
1. A concise title (max 10 words) for this knowledge item
2. A 2-4 sentence knowledge body that is clear, actionable, and professional

Return ONLY a JSON object:
{
  "title": "...",
  "body": "..."
}

Rules:
- Do not fabricate facts. Use only what is in the learning entry.
- Professional tone — this will be reviewed by an academy director.
- No marketing language. No hedging. State it directly.
- Body must end with: "Source: [source type]"
- Do not include approval language — the director decides.`
}

// ── Main generator ────────────────────────────────────────────────────────────

/**
 * Generate a knowledge draft from an approved LearningEntry.
 * Uses OpenAI for wording only if: OPENAI_API_KEY is set.
 * Falls back to system-generated draft gracefully.
 * Always returns a draft with isDraft: true and requiresApproval: true.
 */
export async function generateKnowledgeDraft(entry: LearningEntry): Promise<KnowledgeDraft> {
  const scope = inferTargetScope(entry)
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    const draft = generateSystemDraft(entry, scope)
    return { ...draft, openaiSkipReason: 'OPENAI_API_KEY not configured' }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledge drafting assistant for an academy operating system. Return only JSON.',
          },
          {
            role: 'user',
            content: buildDraftPrompt(entry, scope),
          },
        ],
        temperature: 0.3,
        max_tokens: 400,
      }),
    })

    if (!response.ok) {
      return {
        ...generateSystemDraft(entry, scope),
        openaiSkipReason: `OpenAI API error: ${response.status}`,
      }
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) {
      return {
        ...generateSystemDraft(entry, scope),
        openaiSkipReason: 'OpenAI returned empty content',
      }
    }

    let parsed: { title?: string; body?: string }
    try {
      parsed = JSON.parse(content) as { title?: string; body?: string }
    } catch {
      return {
        ...generateSystemDraft(entry, scope),
        openaiSkipReason: 'OpenAI returned non-JSON content',
      }
    }

    if (!parsed.title || !parsed.body) {
      return {
        ...generateSystemDraft(entry, scope),
        openaiSkipReason: 'OpenAI response missing required fields',
      }
    }

    const body = `${parsed.body}\n\n*This draft requires director review and approval before becoming official knowledge.*`

    return {
      proposedTitle: parsed.title,
      proposedBody: body,
      targetScope: scope,
      draftGeneratedBy: 'openai',
      isDraft: true,
      requiresApproval: true,
      generatedAt: new Date().toISOString(),
      openaiSkipped: false,
      openaiSkipReason: null,
      wordCount: body.split(/\s+/).length,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return {
      ...generateSystemDraft(entry, scope),
      openaiSkipReason: `OpenAI call failed: ${message}`,
    }
  }
}

/**
 * Generate a system draft synchronously (no API call).
 * Use this when async is not available or speed is required.
 */
export function generateSystemKnowledgeDraft(entry: LearningEntry): KnowledgeDraft {
  const scope = inferTargetScope(entry)
  return generateSystemDraft(entry, scope)
}
