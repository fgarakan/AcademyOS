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
  lastError: string | null
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
  lastError: null,
}

export function useRealtimeInterviewVoice() {
  const [status, setStatus] = useState<RealtimeStatus>('idle')
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [debug, setDebug] = useState<RealtimeDebugState>(INITIAL_DEBUG)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pendingDoneRef = useRef<{ cb: () => void; timer: ReturnType<typeof setTimeout> } | null>(null)

  const patchDebug = useCallback((patch: Partial<RealtimeDebugState>) => {
    setDebug(prev => ({ ...prev, ...patch }))
  }, [])

  const clearPending = useCallback(() => {
    if (pendingDoneRef.current) {
      clearTimeout(pendingDoneRef.current.timer)
      pendingDoneRef.current = null
    }
  }, [])

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

  // Send a response.create to make the assistant speak text aloud.
  // onDone fires on response.done or after a timeout fallback.
  const speak = useCallback((text: string, onDone?: () => void) => {
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

    const estimatedMs = Math.max(3000, text.length * 65 + 1200)

    const event = {
      type: 'response.create',
      response: {
        modalities: ['audio', 'text'],
        instructions: `Say the following exactly, in a warm natural voice: "${text}"`,
      },
    }
    console.log('[Realtime] speak() — sending response.create:', text.slice(0, 60))
    dc.send(JSON.stringify(event))

    if (onDone) {
      const timer = setTimeout(() => {
        console.log('[Realtime] speak() — timeout fallback fired')
        pendingDoneRef.current = null
        onDone()
      }, estimatedMs)
      pendingDoneRef.current = { cb: onDone, timer }
    }
  }, [clearPending])

  const connect = useCallback(async (): Promise<boolean> => {
    // Already connected
    if (dcRef.current?.readyState === 'open') return true

    setStatus('fetching-token')
    patchDebug({ ...INITIAL_DEBUG })

    // ── Step 1: Fetch ephemeral token from server ─────────────────────────────
    let clientSecret: string
    let model: string

    try {
      const res = await fetch('/api/director/interview/realtime-session', { method: 'POST' })
      const data = await res.json() as {
        clientSecret?: string
        model?: string
        error?: string
        envConfigured?: boolean
      }
      patchDebug({ envConfigured: data.envConfigured ?? false })

      if (!res.ok || !data.clientSecret) {
        setStatus('token-error')
        patchDebug({ lastError: data.error ?? `Server returned ${res.status}` })
        return false
      }
      clientSecret = data.clientSecret
      model = data.model ?? 'gpt-realtime'
      patchDebug({ tokenFetched: true })
    } catch (err) {
      setStatus('token-error')
      patchDebug({
        lastError: `Failed to reach realtime-session route: ${err instanceof Error ? err.message : String(err)}`,
      })
      return false
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

        // response.done fires when an assistant turn (including audio) is complete
        if ((evType === 'response.done' || evType === 'response.audio.done') && pendingDoneRef.current) {
          const { cb, timer } = pendingDoneRef.current
          clearTimeout(timer)
          pendingDoneRef.current = null
          cb()
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

      // Configure session: output audio + server VAD + input transcription
      const sessionUpdate = {
        type: 'session.update',
        session: {
          modalities: ['audio', 'text'],
          turn_detection: { type: 'server_vad' },
          input_audio_transcription: { model: 'whisper-1' },
        },
      }
      console.log('[Realtime] sending session.update')
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

  return { status, debug, audioBlocked, connect, disconnect, enableAudio, speak }
}
