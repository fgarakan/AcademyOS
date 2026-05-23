import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import {
  DONNA_OPENAI_TTS_MODEL,
  DONNA_OPENAI_TTS_VOICE,
  DONNA_OPENAI_TTS_MODEL_FALLBACK,
  DONNA_OPENAI_TTS_VOICE_FALLBACK,
  DONNA_VOICE_INSTRUCTIONS,
} from '@/lib/donna/donnaVoiceConfig'

const MAX_TEXT_LENGTH = 500

// Sprint 720 — attempt a single TTS call; returns the raw fetch response or throws.
async function callOpenAiTts(
  apiKey: string,
  model: string,
  voice: string,
  input: string,
  includeInstructions: boolean,
): Promise<Response> {
  const payload: Record<string, string> = {
    model,
    input,
    voice,
    response_format: 'mp3',
  }
  if (includeInstructions) {
    payload['instructions'] = DONNA_VOICE_INSTRUCTIONS
  }
  return fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, reason: 'not_authenticated' }, { status: 401 })

  let body: { text?: unknown }
  try {
    body = await req.json() as { text?: unknown }
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 })
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) return NextResponse.json({ ok: false, reason: 'empty_text' }, { status: 400 })
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ ok: false, reason: 'text_too_long' }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, reason: 'server_tts_not_configured' }, { status: 503 })
  }

  // Sprint 720 — primary: gpt-4o-mini-tts + marin + voice instructions
  // Fallback: tts-1-hd + nova (for plans without gpt-4o-mini-tts access)
  let usedModel = DONNA_OPENAI_TTS_MODEL
  let usedVoice = DONNA_OPENAI_TTS_VOICE

  try {
    let res = await callOpenAiTts(apiKey, DONNA_OPENAI_TTS_MODEL, DONNA_OPENAI_TTS_VOICE, text, true)

    // If primary model/voice unavailable (403/404/422), try legacy fallback
    if (!res.ok && (res.status === 403 || res.status === 404 || res.status === 422)) {
      usedModel = DONNA_OPENAI_TTS_MODEL_FALLBACK
      usedVoice = DONNA_OPENAI_TTS_VOICE_FALLBACK
      res = await callOpenAiTts(apiKey, DONNA_OPENAI_TTS_MODEL_FALLBACK, DONNA_OPENAI_TTS_VOICE_FALLBACK, text, false)
    }

    if (!res.ok) {
      const errText = await res.text()
      console.error('[donna/tts] OpenAI error:', res.status, errText.slice(0, 200))
      return NextResponse.json({ ok: false, reason: 'openai_error', status: res.status }, { status: 502 })
    }

    const audioBuffer = await res.arrayBuffer()
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        // Sprint 720 — expose which voice was used so the client can show quality status
        'X-Donna-Voice': usedVoice,
        'X-Donna-Model': usedModel,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[donna/tts] network error:', msg)
    return NextResponse.json({ ok: false, reason: 'network_error' }, { status: 502 })
  }
}
