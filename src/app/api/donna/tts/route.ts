import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'

const MAX_TEXT_LENGTH = 500

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

  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy',
        response_format: 'mp3',
      }),
    })

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
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[donna/tts] network error:', msg)
    return NextResponse.json({ ok: false, reason: 'network_error' }, { status: 502 })
  }
}
