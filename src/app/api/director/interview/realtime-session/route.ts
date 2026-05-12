import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function POST() {
  console.log('[realtime-session] route reached')

  // Authenticate
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Resolve academy context — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  const academyId = profile?.academy_id
  if (!academyId) {
    return NextResponse.json({ error: 'Academy context unavailable.' }, { status: 403 })
  }

  // Verify active director membership
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (membership?.role !== 'academy_director') {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_REALTIME_MODEL ?? 'gpt-realtime'
  const voice = process.env.OPENAI_REALTIME_VOICE ?? 'marin'

  console.log('[realtime-session] API key exists:', !!apiKey)
  console.log('[realtime-session] model:', model)
  console.log('[realtime-session] voice:', voice)

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured on the server.', envConfigured: false },
      { status: 503 }
    )
  }

  // Create ephemeral client secret via OpenAI Realtime API
  try {
    const res = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        audio: {
          output: { voice },
        },
        instructions:
          'You are the Academy OS setup assistant. Speak warmly and concisely. ' +
          'When asked to say something, say it naturally and clearly.',
        modalities: ['audio', 'text'],
      }),
    })

    console.log('[realtime-session] OpenAI response status:', res.status)
    console.log('[realtime-session] OpenAI content-type:', res.headers.get('content-type'))

    if (!res.ok) {
      const body = await res.text()
      console.error('[realtime-session] OpenAI error body:', body.slice(0, 300))
      return NextResponse.json(
        {
          error: `OpenAI session creation failed (${res.status}). Check OPENAI_REALTIME_MODEL and OPENAI_REALTIME_VOICE in env.`,
          envConfigured: true,
        },
        { status: 502 }
      )
    }

    const session = await res.json() as { client_secret?: { value?: string } }
    const clientSecret = session.client_secret?.value

    if (!clientSecret) {
      console.error('[realtime-session] No client_secret in OpenAI response')
      return NextResponse.json(
        { error: 'OpenAI returned no client_secret — session may not support WebRTC.', envConfigured: true },
        { status: 502 }
      )
    }

    console.log('[realtime-session] ephemeral token created successfully')
    return NextResponse.json({ clientSecret, model, voice, envConfigured: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[realtime-session] network error:', msg)
    return NextResponse.json(
      { error: `Network error reaching OpenAI: ${msg}`, envConfigured: true },
      { status: 502 }
    )
  }
}
