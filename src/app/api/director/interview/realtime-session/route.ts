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

  // Fetch academy name for session personalization
  const rawDbForName = supabase as any
  const { data: academy } = await rawDbForName
    .from('academies')
    .select('name')
    .eq('id', academyId)
    .single()
  const academyName: string | null = (academy?.name as string) ?? null

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

  const ENDPOINT = 'https://api.openai.com/v1/realtime/client_secrets'

  // Create ephemeral client secret via OpenAI Realtime API
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model,
          instructions:
            'You are the Academy Setup Assistant. ' +
            (academyName
              ? `You are helping set up Academy OS for ${academyName}. Use this academy name naturally in conversation when it personalizes the experience. `
              : '') +
            // ── App is the conductor ──
            'The app controls every step — you do not control the setup. ' +
            'Your role is to speak the exact text the app sends you, warmly and naturally. ' +
            'When the app sends a response.create with text to speak, say it word for word in a warm, clear voice, then stop and wait. ' +
            'Do not add extra words, comments, or follow-up questions after the message ends. ' +
            'Do not ask "How can I help?" or any variation of that phrase. ' +
            'Do not start Q&A unless the app-provided text explicitly asks a question. ' +
            'After speaking, wait silently — the app decides what happens next. ' +
            // ── Current question lock ──
            'The app controls which setup question is active. ' +
            'You must never ask a setup question that was not first given to you by the app via response.create. ' +
            'The current setup question is always the last question the app told you to speak. ' +
            'Keep the director focused on that question. ' +
            // ── Off-track redirect ──
            'If the director says something unrelated to the current setup question — for example asks a general question, makes a comment, or goes off-topic — ' +
            'acknowledge it briefly in one sentence (only if genuinely helpful), then redirect: ' +
            '"To keep setup moving, let me bring you back to the question I just asked." ' +
            'Then repeat the last question you were given by the app, word for word. ' +
            'Do not invent a new question. Do not skip ahead. ' +
            // ── Director confirmation rule ──
            'The director must confirm each answer before setup advances. ' +
            'You never advance the setup — only the app does. ' +
            'During preflight, speak the provided text and then wait. Do not continue speaking.',
          audio: {
            output: { voice },
          },
        },
      }),
    })

    console.log('[realtime-session] OpenAI response status:', res.status)
    console.log('[realtime-session] OpenAI content-type:', res.headers.get('content-type'))

    if (!res.ok) {
      const body = await res.text()
      console.error('[realtime-session] OpenAI error body:', body.slice(0, 500))
      let openaiError = body.slice(0, 300)
      try {
        const parsed = JSON.parse(body) as { error?: { message?: string } }
        if (parsed?.error?.message) openaiError = parsed.error.message.slice(0, 300)
      } catch { /* leave as raw text */ }
      return NextResponse.json(
        {
          error: 'Realtime session could not be created. Check the server logs for the OpenAI error.',
          envConfigured: true,
          openaiStatus: res.status,
          openaiError,
          endpointAttempted: ENDPOINT,
          model,
          voice,
        },
        { status: 502 }
      )
    }

    const data = await res.json() as Record<string, unknown>

    // Safe diagnostics — never log the secret value itself
    const responseKeys = Object.keys(data).join(', ')
    const csField = data.client_secret
    const csType = typeof csField
    const csKeys = csField && typeof csField === 'object' ? Object.keys(csField as object).join(', ') : 'n/a'
    const csValuePresent = Boolean((csField as Record<string, unknown> | undefined)?.value)
    console.log('[realtime-session] response keys:', responseKeys)
    console.log('[realtime-session] typeof client_secret:', csType)
    console.log('[realtime-session] client_secret keys (if object):', csKeys)
    console.log('[realtime-session] client_secret.value present:', csValuePresent)

    // Resolve the secret from whichever shape OpenAI actually returns
    const rawSecret =
      (csField && typeof csField === 'object'
        ? (csField as Record<string, unknown>).value
        : csField) ??
      data.value ??
      null

    const clientSecret =
      typeof rawSecret === 'string' && rawSecret.length > 10 ? rawSecret : null

    const clientSecretShape =
      csType === 'object' && csField !== null
        ? `object{${csKeys}}`
        : csType === 'string'
        ? `string(${(csField as string).slice(0, 8)}...)`
        : csType

    if (!clientSecret) {
      console.error('[realtime-session] No usable client_secret found in OpenAI response')
      return NextResponse.json(
        {
          error: 'OpenAI response did not include a usable client secret.',
          envConfigured: true,
          openaiStatus: res.status,
          endpointAttempted: ENDPOINT,
          model,
          voice,
          openaiResponseKeys: responseKeys,
          clientSecretShape,
        },
        { status: 502 }
      )
    }

    console.log('[realtime-session] ephemeral token created successfully')
    return NextResponse.json({
      client_secret: clientSecret,
      model,
      voice,
      envConfigured: true,
      endpointAttempted: ENDPOINT,
      openaiResponseKeys: responseKeys,
      clientSecretShape,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[realtime-session] network error:', msg)
    return NextResponse.json(
      { error: `Network error reaching OpenAI: ${msg}`, envConfigured: true },
      { status: 502 }
    )
  }
}
