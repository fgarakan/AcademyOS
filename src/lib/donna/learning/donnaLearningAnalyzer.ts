// Sprint 2861–2890 — DONNA Learning Ledger V1
// Part 8 — OpenAI Learning Analyzer (Advisory Only)
//
// Provides AI-assisted enrichment of learning entries.
// OpenAI is a TEACHER, not a source of truth:
//   - Never modifies status, score, or approval
//   - Only called when confidence < 0.50 and OPENAI_API_KEY is present
//   - All suggestions are advisory — director must approve before promotion
//   - Graceful fallback when API key is absent or call fails
//
// What it does:
//   - Suggest a cleaner topic label
//   - Suggest importance rating
//   - Identify related AcademyOS concepts not yet tagged
//   - Suggest a sharper one-sentence summary
//
// Design rules:
//   - Pure TypeScript. No DB, no React, no side effects beyond OpenAI call.
//   - Never throws — always returns a result (with isAdvisory: true).
//   - Results stored in entry.metadata['openai_suggestion'] only.

import type { LearningEntry } from './learningEntryModel'
import type { AcademyOSConcept } from '../conversation/donnaMeaningExtractor'

// ── Suggestion type ───────────────────────────────────────────────────────────

export interface OpenAISuggestion {
  suggestedTopic: string | null
  suggestedImportance: number | null    // 0–1
  suggestedConcepts: AcademyOSConcept[]
  suggestedSummary: string | null
  confidence: number                    // OpenAI's self-reported confidence 0–1
  isAdvisory: true                      // always true — never auto-applied
  generatedAt: string                   // ISO timestamp
  model: string
  skipped: boolean                      // true if call was not made
  skipReason: string | null
}

// ── Fallback suggestion (used when API is unavailable) ────────────────────────

function noOpSuggestion(reason: string): OpenAISuggestion {
  return {
    suggestedTopic: null,
    suggestedImportance: null,
    suggestedConcepts: [],
    suggestedSummary: null,
    confidence: 0,
    isAdvisory: true,
    generatedAt: new Date().toISOString(),
    model: 'none',
    skipped: true,
    skipReason: reason,
  }
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(entry: LearningEntry): string {
  return `You are DONNA — an AI assistant for a tennis academy director.
You are reviewing a learning entry that needs enrichment.

Learning entry:
  Topic: ${entry.topic}
  Domain: ${entry.topicDomain}
  Summary: ${entry.summary}
  Evidence: ${entry.evidence}
  Example phrases: ${entry.examplePhrases.join('; ')}
  Current concepts tagged: ${entry.concepts.join(', ') || 'none'}
  Confidence: ${entry.confidence}
  Source: ${entry.sourceType}

Return a JSON object with these fields ONLY:
{
  "suggestedTopic": "...",       (string or null — cleaner label if needed)
  "suggestedImportance": 0.X,    (number 0-1 or null)
  "suggestedConcepts": [...],    (array of strings from known concept list)
  "suggestedSummary": "...",     (one sentence or null)
  "confidence": 0.X              (your confidence in these suggestions, 0-1)
}

Known concepts include: progression_issue, engagement_issue, effort_issue, session_quality,
curriculum_issue, grouping_issue, focus_issue, expectation_issue, retention_risk,
confidence_issue, enrollment_issue, enrollment_opportunity, advancement_opportunity,
attendance_issue, parent_communication, parent_satisfaction, competitive_readiness,
tactical_concern, physical_development, mental_performance.

Be concise. Return only the JSON object, no commentary.`
}

// ── Main analyzer ─────────────────────────────────────────────────────────────

/**
 * Analyze a low-confidence learning entry using OpenAI.
 * Only called when: entry.confidence < 0.50 AND process.env.OPENAI_API_KEY is set.
 * Never throws. Always returns a suggestion (possibly skipped).
 */
export async function analyzeLearningEntry(entry: LearningEntry): Promise<OpenAISuggestion> {
  // Gate 1: Only analyze low-confidence entries
  if (entry.confidence >= 0.50) {
    return noOpSuggestion('Confidence sufficient — no AI enrichment needed')
  }

  // Gate 2: Check for API key
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return noOpSuggestion('OPENAI_API_KEY not configured')
  }

  try {
    const prompt = buildPrompt(entry)

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
            content: 'You are a learning entry enrichment assistant for a tennis academy AI. Return only JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      return noOpSuggestion(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
      model?: string
    }
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return noOpSuggestion('OpenAI returned empty response')
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(content.trim()) as Record<string, unknown>
    } catch {
      return noOpSuggestion('OpenAI returned non-JSON content')
    }

    return {
      suggestedTopic:      typeof parsed.suggestedTopic === 'string' ? parsed.suggestedTopic : null,
      suggestedImportance: typeof parsed.suggestedImportance === 'number' ? parsed.suggestedImportance : null,
      suggestedConcepts:   Array.isArray(parsed.suggestedConcepts)
        ? (parsed.suggestedConcepts as string[]).filter(Boolean) as AcademyOSConcept[]
        : [],
      suggestedSummary:    typeof parsed.suggestedSummary === 'string' ? parsed.suggestedSummary : null,
      confidence:          typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      isAdvisory:          true,
      generatedAt:         new Date().toISOString(),
      model:               data.model ?? 'gpt-4o-mini',
      skipped:             false,
      skipReason:          null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return noOpSuggestion(`OpenAI call failed: ${message}`)
  }
}

/**
 * Apply advisory suggestions to an entry's metadata.
 * Does NOT modify the canonical fields — only metadata['openai_suggestion'].
 */
export function applySuggestionToMetadata(
  entry: LearningEntry,
  suggestion: OpenAISuggestion,
): LearningEntry {
  return {
    ...entry,
    metadata: {
      ...entry.metadata,
      openai_suggestion: suggestion,
    },
  }
}
