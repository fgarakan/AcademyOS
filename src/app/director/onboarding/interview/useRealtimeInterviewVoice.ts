'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

export type RealtimeStatus =
  | 'idle'
  | 'fetching-token'
  | 'token-error'
  | 'requesting-mic'
  | 'mic-denied'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'closed'

// Voice readiness: tracks pre-click token preparation state.
// idle        — not yet attempted
// preparing   — token fetch in progress (background, before Start click)
// ready       — token cached, connection will be faster on Start click
// needs_permission — token ready, mic permission needed on click
// error       — pre-fetch failed (env not configured, network error)
export type VoiceReadiness = 'idle' | 'preparing' | 'ready' | 'needs_permission' | 'error'

export interface RealtimeDebugState {
  envConfigured: boolean | null
  tokenFetched: boolean
  micGranted: boolean | null
  peerConnectionState: string
  iceConnectionState: string
  dataChannelState: string
  remoteTrackReceived: boolean
  audioPlaying: boolean
  audioBlocked: boolean
  lastEventType: string
  lastTranscriptEvent: string
  lastError: string | null
  openaiStatus: number | null
  openaiError: string | null
  endpointAttempted: string | null
  openaiModel: string | null
  openaiVoice: string | null
  openaiResponseKeys: string | null
  clientSecretShape: string | null
  tokenPreloaded: boolean
  preparedAt: number | null
}

const INITIAL_DEBUG: RealtimeDebugState = {
  envConfigured: null,
  tokenFetched: false,
  micGranted: null,
  peerConnectionState: 'none',
  iceConnectionState: 'none',
  dataChannelState: 'none',
  remoteTrackReceived: false,
  audioPlaying: false,
  audioBlocked: false,
  lastEventType: '',
  lastTranscriptEvent: '',
  lastError: null,
  openaiStatus: null,
  openaiError: null,
  endpointAttempted: null,
  openaiModel: null,
  openaiVoice: null,
  openaiResponseKeys: null,
  clientSecretShape: null,
  tokenPreloaded: false,
  preparedAt: null,
}

export function useRealtimeInterviewVoice() {
  const [status, setStatus] = useState<RealtimeStatus>('idle')
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [debug, setDebug] = useState<RealtimeDebugState>(INITIAL_DEBUG)

  // ── Transcript state ────────────────────────────────────────────────────────
  // Assistant transcript: what the AI is currently saying / last said
  const [currentAssistantText, setCurrentAssistantText] = useState('')
  const [lastAssistantText, setLastAssistantText] = useState('')
  // Director transcript: what the director just spoke
  const [finalUserTranscript, setFinalUserTranscript] = useState('')
  const [speechStarted, setSpeechStarted] = useState(false)
  const [finalTranscriptReceived, setFinalTranscriptReceived] = useState(false)

  // Voice readiness — tracks pre-click token preparation
  const [voiceReadiness, setVoiceReadiness] = useState<VoiceReadiness>('idle')
  // Cached token from prepare() — consumed by connect() if not expired
  const preparedTokenRef = useRef<{ clientSecret: string; model: string } | null>(null)
  const preparedAtRef = useRef<number | null>(null)
  const isPreparingRef = useRef(false)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pendingDoneRef = useRef<{ cb: () => void; timer: ReturnType<typeof setTimeout> } | null>(null)
  // ID of the response we explicitly requested via speak() — only this response
  // is allowed to fire the onDone callback. Auto-generated responses are ignored.
  const activeResponseIdRef = useRef<string | null>(null)

  const patchDebug = useCallback((patch: Partial<RealtimeDebugState>) => {
    setDebug(prev => ({ ...prev, ...patch }))
  }, [])

  const clearPending = useCallback(() => {
    if (pendingDoneRef.current) {
      clearTimeout(pendingDoneRef.current.timer)
      pendingDoneRef.current = null
    }
  }, [])

  // Pre-fetch the ephemeral token before the user clicks Start.
  // Safe to call on page load — no browser gesture required for HTTP requests.
  // Mic and WebRTC are still deferred to the user click inside connect().
  const prepare = useCallback(async () => {
    if (isPreparingRef.current) return
    if (preparedTokenRef.current) {
      const age = preparedAtRef.current != null ? Date.now() - preparedAtRef.current : Infinity
      if (age < 50_000) return // still valid — skip
      preparedTokenRef.current = null
      preparedAtRef.current = null
    }
    isPreparingRef.current = true
    setVoiceReadiness('preparing')
    try {
      const res = await fetch('/api/director/interview/realtime-session', { method: 'POST' })
      const data = await res.json() as {
        client_secret?: string
        model?: string
        voice?: string
        error?: string
        envConfigured?: boolean
        openaiStatus?: number
        openaiError?: string
        endpointAttempted?: string
        openaiResponseKeys?: string
        clientSecretShape?: string
      }
      patchDebug({ envConfigured: data.envConfigured ?? false })
      const secretValue = data.client_secret
      const secretUsable = typeof secretValue === 'string' && secretValue.length > 10
      if (!res.ok || !secretUsable) {
        setVoiceReadiness('error')
        patchDebug({
          lastError: data.error ?? `Token prep failed: server returned ${res.status}`,
          openaiStatus: data.openaiStatus ?? null,
          openaiError: data.openaiError ?? null,
          endpointAttempted: data.endpointAttempted ?? null,
        })
        return
      }
      const now = Date.now()
      preparedTokenRef.current = { clientSecret: secretValue as string, model: data.model ?? 'gpt-4o-realtime-preview' }
      preparedAtRef.current = now
      patchDebug({
        tokenFetched: true,
        tokenPreloaded: true,
        preparedAt: now,
        endpointAttempted: data.endpointAttempted ?? null,
        openaiResponseKeys: data.openaiResponseKeys ?? null,
        clientSecretShape: data.clientSecretShape ?? null,
        openaiModel: data.model ?? null,
        openaiVoice: data.voice ?? null,
      })
      setVoiceReadiness('ready')
    } catch (err) {
      setVoiceReadiness('error')
      patchDebug({ lastError: `Token prep failed: ${err instanceof Error ? err.message : String(err)}` })
    } finally {
      isPreparingRef.current = false
    }
  }, [patchDebug])

  const disconnect = useCallback(() => {
    clearPending()
    try { dcRef.current?.close() } catch { /* ignore */ }
    try { pcRef.current?.close() } catch { /* ignore */ }
    streamRef.current?.getTracks().forEach(t => t.stop())
    dcRef.current = null
    pcRef.current = null
    streamRef.current = null
    if (audioElRef.current) {
      audioElRef.current.srcObject = null
      try { audioElRef.current.remove() } catch { /* ignore */ }
      audioElRef.current = null
    }
    setStatus('closed')
    setAudioBlocked(false)
    // Reset readiness so prepare() fires again on next welcome-screen visit
    setVoiceReadiness('idle')
    preparedTokenRef.current = null
    preparedAtRef.current = null
  }, [clearPending])

  // Called from a user gesture to unblock autoplay-blocked audio
  const enableAudio = useCallback(() => {
    const el = audioElRef.current
    if (!el) return
    el.play()
      .then(() => {
        setAudioBlocked(false)
        patchDebug({ audioPlaying: true, audioBlocked: false })
      })
      .catch((err: Error) => {
        patchDebug({ lastError: `Enable audio failed: ${err.message}` })
      })
  }, [patchDebug])

  // Clear assistant transcript state (e.g. between steps)
  const clearAssistantTranscript = useCallback(() => {
    setCurrentAssistantText('')
    setLastAssistantText('')
  }, [])

  // Clear director transcript state (Record again / step change)
  const clearUserTranscript = useCallback(() => {
    setFinalUserTranscript('')
    setSpeechStarted(false)
    setFinalTranscriptReceived(false)
  }, [])

  // Send a response.create to make the assistant speak text aloud.
  // onDone fires on response.done (real speech confirmed).
  // onTimeout fires when the safety timeout fires without response.done (speech unconfirmed).
  // If onTimeout is not provided, the timeout falls back to onDone for backward compat.
  // App owns the workflow — never let the AI choose what to say next.
  const speak = useCallback((text: string, onDone?: () => void, onTimeout?: () => void) => {
    const dc = dcRef.current
    if (!dc || dc.readyState !== 'open') {
      console.warn('[Realtime] speak() — data channel not open, state:', dc?.readyState ?? 'null')
      if (onDone) {
        const t = setTimeout(onDone, 500)
        pendingDoneRef.current = { cb: onDone, timer: t }
      }
      return
    }
    clearPending()
    // Clear current transcript so the new utterance builds up fresh
    setCurrentAssistantText('')
    // Reset the tracked response ID — response.created will fill it in.
    // Until then, no response.done from a prior or auto-generated turn can fire the callback.
    activeResponseIdRef.current = null

    const estimatedMs = Math.max(3000, text.length * 65 + 1200)

    const event = {
      type: 'response.create',
      response: {
        modalities: ['audio', 'text'],
        // Explicit constraint: say exactly this, nothing more.
        instructions: `Say exactly this, word for word, in a warm natural voice: "${text}". Do not add extra words, questions, or commentary after the message ends.`,
      },
    }
    console.log('[Realtime] speak() — sending response.create:', text.slice(0, 60))
    dc.send(JSON.stringify(event))

    if (onDone || onTimeout) {
      const timer = setTimeout(() => {
        console.log('[Realtime] speak() — timeout fallback fired (speech unconfirmed)')
        pendingDoneRef.current = null
        // onTimeout = distinct handler for timeout — not real confirmed speech.
        // If no onTimeout, fall back to onDone for callers that treat both the same.
        if (onTimeout) {
          onTimeout()
        } else {
          onDone?.()
        }
      }, estimatedMs)
      pendingDoneRef.current = { cb: onDone ?? (() => {}), timer }
    }
  }, [clearPending])

  const connect = useCallback(async (): Promise<boolean> => {
    // Already connected
    if (dcRef.current?.readyState === 'open') return true

    setStatus('fetching-token')
    patchDebug({ ...INITIAL_DEBUG })

    // ── Step 1: Resolve ephemeral token ──────────────────────────────────────
    // Use the pre-fetched token from prepare() if available and not expired.
    // Skipping the fetch here removes ~300–500 ms from the Start click latency.
    let clientSecret: string
    let model: string

    const prepAge = preparedAtRef.current != null ? Date.now() - preparedAtRef.current : Infinity
    if (preparedTokenRef.current && prepAge < 50_000) {
      // Consume the pre-fetched token
      clientSecret = preparedTokenRef.current.clientSecret
      model = preparedTokenRef.current.model
      preparedTokenRef.current = null
      preparedAtRef.current = null
      console.log('[Realtime] connect() — using pre-fetched token (age:', Math.round(prepAge / 1000), 's)')
      patchDebug({ tokenFetched: true, tokenPreloaded: true })
    } else {
      // No cached token or expired — fetch now (original path)
      preparedTokenRef.current = null
      preparedAtRef.current = null
      try {
        const res = await fetch('/api/director/interview/realtime-session', { method: 'POST' })
        const data = await res.json() as {
          client_secret?: string
          model?: string
          voice?: string
          error?: string
          envConfigured?: boolean
          openaiStatus?: number
          openaiError?: string
          endpointAttempted?: string
          openaiResponseKeys?: string
          clientSecretShape?: string
        }
        patchDebug({ envConfigured: data.envConfigured ?? false })

        const secretValue = data.client_secret
        const secretUsable = typeof secretValue === 'string' && secretValue.length > 10

        if (!res.ok || !secretUsable) {
          setStatus('token-error')
          patchDebug({
            lastError: data.error ?? `Server returned ${res.status}`,
            openaiStatus: data.openaiStatus ?? null,
            openaiError: data.openaiError ?? null,
            endpointAttempted: data.endpointAttempted ?? null,
            openaiModel: data.model ?? null,
            openaiVoice: data.voice ?? null,
            openaiResponseKeys: data.openaiResponseKeys ?? null,
            clientSecretShape: data.clientSecretShape ?? null,
          })
          return false
        }
        clientSecret = secretValue as string
        model = data.model ?? 'gpt-4o-realtime-preview'
        patchDebug({
          tokenFetched: true,
          endpointAttempted: data.endpointAttempted ?? null,
          openaiResponseKeys: data.openaiResponseKeys ?? null,
          clientSecretShape: data.clientSecretShape ?? null,
          openaiModel: data.model ?? null,
          openaiVoice: data.voice ?? null,
        })
      } catch (err) {
        setStatus('token-error')
        patchDebug({
          lastError: `Failed to reach realtime-session route: ${err instanceof Error ? err.message : String(err)}`,
        })
        return false
      }
    }

    // ── Step 2: Request microphone ────────────────────────────────────────────
    setStatus('requesting-mic')
    let stream: MediaStream

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia not available (requires HTTPS or localhost)')
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      patchDebug({ micGranted: true })
    } catch (err) {
      setStatus('mic-denied')
      patchDebug({
        micGranted: false,
        lastError: `Mic denied: ${err instanceof Error ? err.message : String(err)}`,
      })
      return false
    }

    // ── Step 3: Create RTCPeerConnection ──────────────────────────────────────
    setStatus('connecting')
    const pc = new RTCPeerConnection()
    pcRef.current = pc

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState
      console.log('[Realtime] pc.connectionState:', s)
      patchDebug({ peerConnectionState: s })
    }
    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState
      console.log('[Realtime] pc.iceConnectionState:', s)
      patchDebug({ iceConnectionState: s })
    }

    // Add local mic track so OpenAI can receive director's voice
    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    // ── Step 4: Attach remote audio track ─────────────────────────────────────
    pc.ontrack = (event: RTCTrackEvent) => {
      console.log('[Realtime] ontrack fired — streams:', event.streams.length)
      const remoteStream = event.streams[0]
      if (!remoteStream) {
        console.warn('[Realtime] ontrack: no remote stream')
        return
      }

      const audioTracks = remoteStream.getAudioTracks()
      console.log(
        '[Realtime] remote audio tracks:', audioTracks.length,
        audioTracks.map(t => ({ enabled: t.enabled, muted: t.muted, readyState: t.readyState })),
      )
      patchDebug({ remoteTrackReceived: true })

      // Create audio element if not already created
      if (!audioElRef.current) {
        const el = document.createElement('audio')
        el.autoplay = true
        // playsInline is a valid HTML attribute but missing from older TS DOM libs
        ;(el as HTMLAudioElement & { playsInline: boolean }).playsInline = true
        el.muted = false
        el.volume = 1
        document.body.appendChild(el)
        audioElRef.current = el
      }
      audioElRef.current.srcObject = remoteStream

      audioElRef.current.play()
        .then(() => {
          const el = audioElRef.current
          console.log(
            '[Realtime] audio.play() succeeded — paused:', el?.paused,
            'vol:', el?.volume, 'muted:', el?.muted,
          )
          setAudioBlocked(false)
          patchDebug({ audioPlaying: true, audioBlocked: false })
        })
        .catch((err: Error) => {
          console.warn('[Realtime] audio.play() blocked by autoplay policy:', err.message)
          setAudioBlocked(true)
          patchDebug({ audioBlocked: true, audioPlaying: false, lastError: `Autoplay blocked: ${err.message}` })
        })
    }

    // ── Step 5: Data channel ──────────────────────────────────────────────────
    // Must be created before offer so it's included in SDP negotiation
    const dc = pc.createDataChannel('oai-events')
    dcRef.current = dc

    dc.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as Record<string, unknown>
        const evType = (msg.type as string) ?? 'unknown'
        console.log('[Realtime] server event:', evType)
        patchDebug({ lastEventType: evType })

        // ── Assistant transcript events ────────────────────────────────────
        // Build up current transcript delta-by-delta while assistant speaks
        if (evType === 'response.audio_transcript.delta') {
          const delta = (msg.delta as string) ?? ''
          if (delta) setCurrentAssistantText(prev => prev + delta)
          patchDebug({ lastTranscriptEvent: evType })
        }
        // Finalize when audio transcript is complete — full text arrives here
        if (evType === 'response.audio_transcript.done') {
          const transcript = (msg.transcript as string) ?? ''
          if (transcript) setLastAssistantText(transcript)
          setCurrentAssistantText('')
          patchDebug({ lastTranscriptEvent: evType })
        }
        // Text modality fallback (if audio transcript events not present)
        if (evType === 'response.text.delta') {
          const delta = (msg.delta as string) ?? ''
          if (delta) setCurrentAssistantText(prev => prev + delta)
          patchDebug({ lastTranscriptEvent: evType })
        }
        if (evType === 'response.text.done') {
          const text = (msg.text as string) ?? ''
          if (text) setLastAssistantText(text)
          setCurrentAssistantText('')
          patchDebug({ lastTranscriptEvent: evType })
        }
        // Content part done — another path that may carry transcript
        if (evType === 'response.content_part.done') {
          const part = msg.part as Record<string, unknown> | undefined
          if (part?.type === 'audio') {
            const t = (part.transcript as string) ?? ''
            if (t) setLastAssistantText(t)
            setCurrentAssistantText('')
          } else if (part?.type === 'text') {
            const t = (part.text as string) ?? ''
            if (t) setLastAssistantText(t)
            setCurrentAssistantText('')
          }
          patchDebug({ lastTranscriptEvent: evType })
        }

        // ── Director speech / transcription events ─────────────────────────
        if (evType === 'input_audio_buffer.speech_started') {
          console.log('[Realtime] director speech started')
          setSpeechStarted(true)
          setFinalTranscriptReceived(false)
          patchDebug({ lastTranscriptEvent: evType })
        }
        if (evType === 'input_audio_buffer.speech_stopped') {
          console.log('[Realtime] director speech stopped')
          setSpeechStarted(false)
          patchDebug({ lastTranscriptEvent: evType })
        }
        if (evType === 'conversation.item.input_audio_transcription.completed') {
          const transcript = (msg.transcript as string)?.trim() ?? ''
          console.log('[Realtime] director transcript completed:', transcript.slice(0, 60))
          if (transcript) {
            setFinalUserTranscript(transcript)
            setFinalTranscriptReceived(true)
            patchDebug({ lastTranscriptEvent: evType })
          }
        }
        // Also handle the delta variant if present
        if (evType === 'conversation.item.input_audio_transcription.delta') {
          patchDebug({ lastTranscriptEvent: evType })
        }

        // ── response.created — capture the ID of the response we requested ──
        // Only responses whose ID was captured here are allowed to fire onDone.
        // Auto-generated or prior-turn responses arrive with no matching pending,
        // so they never set activeResponseIdRef and are therefore safely ignored.
        if (evType === 'response.created') {
          const responseId = (msg.response as Record<string, unknown> | undefined)?.id as string | undefined
          if (responseId && pendingDoneRef.current) {
            console.log('[Realtime] response.created — tracking id:', responseId)
            activeResponseIdRef.current = responseId
          }
        }

        // ── response.cancelled — clear pending WITHOUT firing callback ─────
        // A cancelled response must not advance the interview state machine.
        if (evType === 'response.cancelled') {
          const responseId = (msg.response as Record<string, unknown> | undefined)?.id as string | undefined
          const isOurs = !responseId || responseId === activeResponseIdRef.current
          if (isOurs && pendingDoneRef.current) {
            clearTimeout(pendingDoneRef.current.timer)
            pendingDoneRef.current = null
            activeResponseIdRef.current = null
          }
        }

        // ── response.done fires when the full assistant turn is complete ────
        // Only fire onDone for the response ID we explicitly requested via speak().
        // A random/auto response.done must never advance the setup state machine.
        if (evType === 'response.done' || evType === 'response.audio.done') {
          const responseId = (msg.response as Record<string, unknown> | undefined)?.id as string | undefined
          const isOurs = responseId
            ? responseId === activeResponseIdRef.current
            : pendingDoneRef.current !== null // no id field — treat as ours if we have a pending
          if (isOurs && pendingDoneRef.current) {
            console.log('[Realtime] response.done — firing onDone for id:', responseId ?? 'unknown')
            const { cb, timer } = pendingDoneRef.current
            clearTimeout(timer)
            pendingDoneRef.current = null
            activeResponseIdRef.current = null
            cb()
          } else if (!isOurs) {
            console.log('[Realtime] response.done ignored — id', responseId, '!= active', activeResponseIdRef.current)
          }
        }
      } catch { /* non-JSON message */ }
    }

    dc.onclose = () => {
      console.log('[Realtime] data channel closed')
      patchDebug({ dataChannelState: 'closed' })
    }
    dc.onerror = () => {
      console.warn('[Realtime] data channel error')
      patchDebug({ dataChannelState: 'error', lastError: 'Data channel error' })
    }

    // Promise that resolves when dc.onopen fires (connection established)
    let resolveDcOpen!: () => void
    let rejectDcOpen!: (err: Error) => void
    const dcOpenPromise = new Promise<void>((res, rej) => {
      resolveDcOpen = res
      rejectDcOpen = rej
    })
    const dcOpenTimeout = setTimeout(
      () => rejectDcOpen(new Error('Data channel did not open within 10 seconds')),
      10_000,
    )

    dc.onopen = () => {
      clearTimeout(dcOpenTimeout)
      console.log('[Realtime] data channel open')
      patchDebug({ dataChannelState: 'open' })
      setStatus('connected')

      // App-owned workflow: server VAD transcribes director speech but does NOT
      // auto-generate responses. The app calls speak() to control every utterance.
      // Session instructions reinforce: model must only read provided text exactly —
      // never improvise questions, add commentary, or respond freely to user audio.
      const sessionUpdate = {
        type: 'session.update',
        session: {
          modalities: ['audio', 'text'],
          instructions:
            'You are an academy setup assistant. You ONLY speak the exact text provided in each response.create instruction — word for word, nothing added or removed. ' +
            'Never improvise questions, add commentary, or generate your own responses to user audio. ' +
            'The application controls all spoken text through explicit instructions. ' +
            'When the user speaks, do not generate a response — wait for the application to send a new response.create.',
          turn_detection: {
            type: 'server_vad',
            create_response: false, // app owns response creation — no free-running AI
          },
          input_audio_transcription: { model: 'whisper-1' },
        },
      }
      console.log('[Realtime] sending session.update (create_response: false)')
      dc.send(JSON.stringify(sessionUpdate))

      resolveDcOpen()
    }

    // ── Step 6: Create SDP offer ───────────────────────────────────────────────
    let offerSdp: string
    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      offerSdp = offer.sdp ?? ''
      console.log('[Realtime] SDP offer created')
    } catch (err) {
      clearTimeout(dcOpenTimeout)
      setStatus('error')
      patchDebug({ lastError: `createOffer failed: ${err instanceof Error ? err.message : String(err)}` })
      stream.getTracks().forEach(t => t.stop())
      pc.close()
      return false
    }

    // ── Step 7: Exchange SDP with OpenAI ──────────────────────────────────────
    let sdpAnswer: string
    try {
      const sdpRes = await fetch(
        `https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(model)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${clientSecret}`,
            'Content-Type': 'application/sdp',
          },
          body: offerSdp,
        },
      )

      console.log(
        '[Realtime] SDP exchange — status:', sdpRes.status,
        'content-type:', sdpRes.headers.get('content-type'),
      )

      if (!sdpRes.ok) {
        const errText = await sdpRes.text()
        clearTimeout(dcOpenTimeout)
        setStatus('error')
        patchDebug({ lastError: `OpenAI SDP error ${sdpRes.status}: ${errText.slice(0, 200)}` })
        stream.getTracks().forEach(t => t.stop())
        pc.close()
        return false
      }
      sdpAnswer = await sdpRes.text()
    } catch (err) {
      clearTimeout(dcOpenTimeout)
      setStatus('error')
      patchDebug({ lastError: `SDP exchange failed: ${err instanceof Error ? err.message : String(err)}` })
      stream.getTracks().forEach(t => t.stop())
      pc.close()
      return false
    }

    // ── Step 8: Set remote description and wait for data channel ─────────────
    try {
      await pc.setRemoteDescription({ type: 'answer', sdp: sdpAnswer })
      console.log('[Realtime] setRemoteDescription OK — waiting for data channel')
    } catch (err) {
      clearTimeout(dcOpenTimeout)
      setStatus('error')
      patchDebug({ lastError: `setRemoteDescription failed: ${err instanceof Error ? err.message : String(err)}` })
      stream.getTracks().forEach(t => t.stop())
      pc.close()
      return false
    }

    try {
      await dcOpenPromise
      console.log('[Realtime] connect() complete — data channel open')
      return true
    } catch (err) {
      setStatus('error')
      patchDebug({ lastError: `${err instanceof Error ? err.message : String(err)}` })
      stream.getTracks().forEach(t => t.stop())
      pc.close()
      return false
    }
  }, [patchDebug])

  useEffect(() => { return () => { disconnect() } }, [disconnect])

  return {
    status,
    debug,
    audioBlocked,
    voiceReadiness,
    prepare,
    connect,
    disconnect,
    enableAudio,
    speak,
    // Assistant transcript — what the AI is currently saying / last said
    currentAssistantText,
    lastAssistantText,
    clearAssistantTranscript,
    // Director transcript — what the director spoke
    finalUserTranscript,
    speechStarted,
    finalTranscriptReceived,
    clearUserTranscript,
  }
}
