import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import { createRequestId } from '@/lib/observability/requestTrace'
import { createActionLogger } from '@/lib/observability/logger'

const MAX_FILE_BYTES = 4 * 1024 * 1024 // 4 MB
const ALLOWED_MIME_TYPES = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
])

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params
  const requestId = createRequestId('transcribe')
  const log = createActionLogger({ action: 'transcribe', requestId, sessionId })

  if (!sessionId) {
    log.warn('missing_session_id')
    return NextResponse.json({ ok: false, error: 'Missing session ID.' }, { status: 400 })
  }

  // 1. Authenticate
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    log.warn('auth_failed')
    return NextResponse.json({ ok: false, error: 'Not authenticated.' }, { status: 401 })
  }

  // 2. Resolve academy_id — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  const academyId = profile?.academy_id
  if (!academyId) {
    log.warn('no_academy_context', { userId: user.id })
    return NextResponse.json({ ok: false, error: 'Academy context unavailable.' }, { status: 403 })
  }

  // 3. Verify active staff membership
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  const isStaff = role === 'coach' || role === 'head_coach' || role === 'academy_director'
  if (!isStaff) {
    log.warn('access_denied', { userId: user.id, role })
    return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })
  }

  // 4. Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()

  if (!session) {
    return NextResponse.json({ ok: false, error: 'Session not found or access denied.' }, { status: 403 })
  }

  // 5. Check STT provider is configured
  const openAiKey = process.env.OPENAI_API_KEY
  if (!openAiKey) {
    return NextResponse.json(
      { ok: false, error: 'Production transcription is not configured. You can still type or use browser dictation.' },
      { status: 503 }
    )
  }

  // 6. Parse multipart/form-data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not parse audio upload.' }, { status: 400 })
  }

  const audioEntry = formData.get('audio')
  if (!audioEntry || typeof audioEntry === 'string') {
    return NextResponse.json({ ok: false, error: 'No audio file provided.' }, { status: 400 })
  }

  const audioFile = audioEntry as File

  // 7. Validate MIME type
  const mimeType = audioFile.type || 'application/octet-stream'
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { ok: false, error: 'Unsupported audio format. Please use WebM, MP4, MP3, WAV, or OGG.' },
      { status: 415 }
    )
  }

  // 8. Enforce file size limit
  if (audioFile.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'Audio file is too large. Maximum is 4 MB. Try a shorter recording.' },
      { status: 413 }
    )
  }

  // 9. Send to OpenAI Whisper — server-side only, key never exposed to browser
  log.info('transcription_start', { userId: user.id, academyId, size: audioFile.size, mimeType })
  const transcribeStart = Date.now()
  try {
    const whisperForm = new FormData()
    whisperForm.append('file', audioFile, `recording.${mimeExtension(mimeType)}`)
    whisperForm.append('model', 'whisper-1')
    whisperForm.append('language', 'en')

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
      },
      body: whisperForm,
    })

    if (!whisperResponse.ok) {
      log.error('whisper_error', { status: whisperResponse.status, latencyMs: Date.now() - transcribeStart })
      return NextResponse.json(
        { ok: false, error: 'Transcription failed. Please try again or type your answer.' },
        { status: 502 }
      )
    }

    const whisperData = await whisperResponse.json() as { text?: string }
    const transcript = (whisperData.text ?? '').trim()

    if (!transcript) {
      return NextResponse.json(
        { ok: false, error: 'No speech detected. Try speaking more clearly, then tap Stop.' },
        { status: 200 }
      )
    }

    // 10. Write audit log — metadata only, never transcript or audio
    const rawDb = supabase as any
    rawDb.from('audit_logs').insert({
      academy_id: academyId,
      actor_id: user.id,
      action: 'voice_transcription.completed',
      target_type: 'session',
      target_id: sessionId,
      target_label: `session:${sessionId}`,
      payload: {
        provider: 'openai_whisper',
        audio_retained: false,
        file_size_bytes: audioFile.size,
        mime_type: mimeType,
        success: true,
      },
      source_type: 'voice',
    }).then(() => {
      // best-effort — do not block response on audit write
    }).catch(() => {
      // ignore audit write failures
    })

    log.info('transcription_success', { userId: user.id, academyId, size: audioFile.size, latencyMs: Date.now() - transcribeStart })
    return NextResponse.json({ ok: true, transcript })
  } catch (err) {
    log.error('transcription_exception', { latencyMs: Date.now() - transcribeStart, message: (err as Error)?.message ?? 'unknown' })
    return NextResponse.json(
      { ok: false, error: 'Transcription service unavailable. Please type your answer.' },
      { status: 502 }
    )
  }
}

function mimeExtension(mime: string): string {
  if (mime === 'audio/webm') return 'webm'
  if (mime === 'audio/mp4') return 'mp4'
  if (mime === 'audio/mpeg') return 'mp3'
  if (mime === 'audio/wav') return 'wav'
  if (mime === 'audio/ogg') return 'ogg'
  return 'audio'
}
