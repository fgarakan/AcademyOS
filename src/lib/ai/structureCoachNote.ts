import Anthropic from '@anthropic-ai/sdk'

export interface AIDraftResult {
  current_strengths: string[]
  things_to_work_on: string[]
  development_focus: string
  coach_summary: string
  student_friendly_summary: string
  confidence: 'low' | 'medium' | 'high'
  warnings: string[]
}

const SYSTEM_PROMPT = `You are an assistant helping a tennis coach structure their raw coaching notes into a player development summary.

Rules:
- Only extract facts clearly present in the note.
- Do not invent or infer details not stated.
- Coach summary: direct, technical, professional tone. Written for the coaching team.
- Student-friendly summary: encouraging, simple, age-appropriate, mission-focused. Never harsh, clinical, or discouraging.
- Do not diagnose medical conditions. If an injury is mentioned, state it factually and without diagnosis.
- If the note is vague or short, set confidence to "low" and include a warning asking for more detail.
- Return only valid JSON. No markdown. No prose outside the JSON object.

Output schema:
{
  "current_strengths": string[],
  "things_to_work_on": string[],
  "development_focus": string,
  "coach_summary": string,
  "student_friendly_summary": string,
  "confidence": "low" | "medium" | "high",
  "warnings": string[]
}`

function isValidDraft(obj: unknown): obj is AIDraftResult {
  if (!obj || typeof obj !== 'object') return false
  const d = obj as Record<string, unknown>
  return (
    Array.isArray(d.current_strengths) &&
    Array.isArray(d.things_to_work_on) &&
    typeof d.development_focus === 'string' &&
    typeof d.coach_summary === 'string' &&
    typeof d.student_friendly_summary === 'string' &&
    (d.confidence === 'low' || d.confidence === 'medium' || d.confidence === 'high') &&
    Array.isArray(d.warnings)
  )
}

export async function structureCoachNote(noteText: string): Promise<AIDraftResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured.')
  }

  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Here is the coach's note for a tennis player:\n\n<note>\n${noteText}\n</note>\n\nExtract a structured player development summary following the JSON schema exactly. Return only valid JSON.`,
      },
    ],
  })

  const raw = message.content[0]
  if (!raw || raw.type !== 'text') {
    throw new Error('Unexpected response format from AI.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw.text.trim())
  } catch {
    throw new Error('AI returned invalid JSON. Try again or rephrase the note.')
  }

  if (!isValidDraft(parsed)) {
    throw new Error('AI response did not match expected structure. Try again.')
  }

  return parsed
}
