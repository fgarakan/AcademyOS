'use client'

// Sprint 297 — Output-only Realtime voice hook for Floating Donna.
// Does NOT request microphone — uses addTransceiver('audio', {direction:'recvonly'})
// so the browser receives OpenAI audio without sending mic input.
// Calls the same /api/director/interview/realtime-session endpoint (authed,
// director-only, academy-scoped, returns 503 when OPENAI_API_KEY absent).
// Browser TTS (speakAssistantText) remains the fallback in DonnaAssistantButton.

import { useRef, useState, useCallback, useEffect } from 'react'

export type DonnaRealtimeStatus =
  | 'idle'
  | 'unavailable'   // server returned 503: OPENAI_API_KEY not configured
  | 'connecting'
  | 'ready'         // data channel open, speak() can be called
  | 'speaking'
  | 'error'
  | 'closed'

export interface DonnaRealtimeConnectResult {
  ok: boolean
  reason?: string
}

export function useDonnaRealtimeVoice() {
  const [status, setStatus] = useState<DonnaRealtimeStatus>('idle')
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const isConnectingRef = useRef(false)

  // Tracks the pending onDone callback from speak() and its safety timer
  const pendingDoneRef = useRef<{
    cb: () => void
    timer: ReturnType<typeof setTimeout>
  } | null>(null)
  // ID of the response.create we sent — only that response fires onDone
  const activeResponseIdRef = useRef<string | null>(null)

  const clearPending = useCallback(() => {
    if (pendingDoneRef.current) {
      clearTimeout(pendingDoneRef.current.timer)
      pendingDoneRef.current = null
    }
    activeResponseIdRef.current = null
  }, [])

  const disconnect = useCallback(() => {
    isConnectingRef.current = false
    clearPending()
    try { dcRef.current?.close() } catch { /* ignore */ }
    try { pcRef.current?.close() } catch { /* ignore */ }
    dcRef.current = null
    pcRef.current = null
    if (audioElRef.current) {
      audioElRef.current.srcObject = null
      try { audioElRef.current.remove() } catch { /* ignore */ }
      audioElRef.current = null
    }
    setStatus('closed')
  }, [clearPending])

  // Send a response.create event to make the model speak text aloud.
  // onDone fires when response.done arrives (real speech confirmed).
  // onTimeout fires when the safety timeout fires without a response.done (speech unconfirmed).
  // If onTimeout is not provided, the timeout falls back to onDone for backward compat.
  const speak = useCallback((text: string, onDone?: () => void, onTimeout?: () => void) => {
    const dc = dcRef.current
    if (!dc || dc.readyState !== 'open') {
      console.warn('[DonnaRealtime] speak() — data channel not ready, state:', dc?.readyState ?? 'null')
      onDone?.()
      return
    }
    clearPending()
    setStatus('speaking')
    activeResponseIdRef.current = null

    const event = {
      type: 'response.create',
      response: {
        modalities: ['audio', 'text'],
        instructions: `Say exactly this, word for word, in a warm natural voice: "${text}". Do not add extra words, questions, or commentary after the message ends.`,
      },
    }
    console.log('[DonnaRealtime] speak() — sending response.create:', text.slice(0, 60))
    dc.send(JSON.stringify(event))

    if (onDone || onTimeout) {
      // Safety timeout: max(4s, ~65ms per character + 1.5s buffer)
      const estimatedMs = Math.max(4000, text.length * 65 + 1500)
      const timer = setTimeout(() => {
        console.log('[DonnaRealtime] speak() — timeout fallback fired (speech unconfirmed)')
        pendingDoneRef.current = null
        activeResponseIdRef.current = null
        setStatus('ready')
        // onTimeout = distinct handler for timeout (not real speech).
        // If no onTimeout, fall back to onDone for backward compat with callers
        // that treat timeout and real done the same way.
        if (onTimeout) {
          onTimeout()
        } else {
          onDone?.()
        }
      }, estimatedMs)
      // cb is the real-done callback — only fired on response.done event.
      pendingDoneRef.current = { cb: onDone ?? (() => {}), timer }
    }
  }, [clearPending])

  const connect = useCallback(async (): Promise<DonnaRealtimeConnectResult> => {
    // Already connected
    if (dcRef.current?.readyState === 'open') return { ok: true }
    // Guard against concurrent calls
    if (isConnectingRef.current) return { ok: false, reason: 'Already connecting' }

    isConnectingRef.current = true
    setStatus('connecting')
    setUnavailableReason(null)

    // ── Step 1: Fetch ephemeral token ────────────────────────────────────────
    let clientSecret: string
    let model: string
    try {
      const res = await fetch('/api/director/interview/realtime-session', { method: 'POST' })
      const data = await res.json() as {
        client_secret?: string
        model?: string
        error?: string
        envConfigured?: boolean
      }

      const secretValue = data.client_secret
      const secretUsable = typeof secretValue === 'string' && secretValue.length > 10

      if (!res.ok || !secretUsable) {
        const reason = res.status === 503
          ? 'Donna voice is not configured on this server. Browser voice or typed setup is available.'
          : (data.error ?? `Token request failed (${res.status}).`)
        const nextStatus: DonnaRealtimeStatus = res.status === 503 ? 'unavailable' : 'error'
        setStatus(nextStatus)
        setUnavailableReason(reason)
        isConnectingRef.current = false
        return { ok: false, reason }
      }

      clientSecret = secretValue as string
      model = data.model ?? 'gpt-4o-realtime-preview'
      console.log('[DonnaRealtime] token fetched, model:', model)
    } catch (err) {
      const reason = `Network error: ${err instanceof Error ? err.message : String(err)}`
      setStatus('error')
      setUnavailableReason(reason)
      isConnectingRef.current = false
      return { ok: false, reason }
    }

    // ── Step 2: RTCPeerConnection — output only, no mic ──────────────────────
    const pc = new RTCPeerConnection()
    pcRef.current = pc

    // Receive OpenAI audio without sending microphone audio.
    // recvonly tells OpenAI we will accept an audio track but not send one.
    pc.addTransceiver('audio', { direction: 'recvonly' })

    // Create the audio element eagerly — before setRemoteDescription so it exists
    // when ontrack fires. Without this, speak() may send response.create before the
    // element is ready and the model audio plays into nothing (silent ontrack race).
    if (!audioElRef.current) {
      const el = document.createElement('audio')
      el.autoplay = true
      ;(el as HTMLAudioElement & { playsInline: boolean }).playsInline = true
      el.muted = false
      el.volume = 1
      document.body.appendChild(el)
      audioElRef.current = el
      console.log('[DonnaRealtime] audio element created eagerly')
    }

    // Log ICE state changes so audio routing failures are visible in console.
    pc.oniceconnectionstatechange = () => {
      console.log('[DonnaRealtime] ICE state:', pc.iceConnectionState)
    }

    // ── Step 3: Attach remote audio stream when track arrives ────────────────
    pc.ontrack = (event: RTCTrackEvent) => {
      const remoteStream = event.streams[0]
      console.log('[DonnaRealtime] ontrack — streams:', event.streams.length)
      if (!remoteStream) return

      // Audio element already exists (created eagerly above) — attach stream now.
      const el = audioElRef.current
      if (!el) {
        console.warn('[DonnaRealtime] ontrack — audio element missing (unexpected)')
        return
      }
      el.srcObject = remoteStream
      el.play()
        .then(() => {
          console.log('[DonnaRealtime] audio.play() resolved — paused:', el.paused,
            'muted:', el.muted, 'volume:', el.volume, 'readyState:', el.readyState)
        })
        .catch((err: Error) => {
          console.warn('[DonnaRealtime] audio.play() blocked:', err.message,
            '— director must interact with page to unblock autoplay')
        })
    }

    // ── Step 4: Data channel ─────────────────────────────────────────────────
    const dc = pc.createDataChannel('oai-events')
    dcRef.current = dc

    dc.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as Record<string, unknown>
        const evType = (msg.type as string) ?? ''

        // Track the response ID so we can guard onDone against unrelated turns
        if (evType === 'response.created') {
          const responseId = (msg.response as Record<string, unknown> | undefined)?.id as string | undefined
          if (responseId && pendingDoneRef.current) {
            console.log('[DonnaRealtime] response.created — tracking id:', responseId)
            activeResponseIdRef.current = responseId
          }
        }

        if (evType === 'response.cancelled') {
          if (pendingDoneRef.current) {
            clearTimeout(pendingDoneRef.current.timer)
            pendingDoneRef.current = null
            activeResponseIdRef.current = null
            setStatus('ready')
          }
        }

        if (evType === 'response.done' || evType === 'response.audio.done') {
          const responseId = (msg.response as Record<string, unknown> | undefined)?.id as string | undefined
          const isOurs = responseId
            ? responseId === activeResponseIdRef.current
            : pendingDoneRef.current !== null
          if (isOurs && pendingDoneRef.current) {
            console.log('[DonnaRealtime] response.done — firing onDone, id:', responseId ?? 'unknown')
            const { cb, timer } = pendingDoneRef.current
            clearTimeout(timer)
            pendingDoneRef.current = null
            activeResponseIdRef.current = null
            setStatus('ready')
            cb()
          }
        }
      } catch { /* non-JSON message — ignore */ }
    }

    dc.onclose = () => {
      console.log('[DonnaRealtime] data channel closed')
      clearPending()
    }
    dc.onerror = () => {
      console.warn('[DonnaRealtime] data channel error')
      clearPending()
      setStatus('error')
    }

    // Promise that resolves when dc.onopen fires
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
      console.log('[DonnaRealtime] data channel open')
      setStatus('ready')

      // Lock model to exact-text-only output. Disable auto-response generation.
      // App controls all spoken text via explicit response.create instructions.
      dc.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['audio', 'text'],
          instructions:
            'You are a voice assistant. You ONLY speak the exact text provided in each response.create instruction — word for word, nothing added or removed. ' +
            'Never improvise, add commentary, or generate your own responses. ' +
            'The application controls all spoken text through explicit instructions.',
          turn_detection: { type: 'server_vad', create_response: false },
        },
      }))

      resolveDcOpen()
    }

    // ── Step 5: SDP offer ────────────────────────────────────────────────────
    let offerSdp: string
    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      offerSdp = offer.sdp ?? ''
      console.log('[DonnaRealtime] SDP offer created')
    } catch (err) {
      clearTimeout(dcOpenTimeout)
      setStatus('error')
      pc.close()
      isConnectingRef.current = false
      return { ok: false, reason: `SDP offer failed: ${err instanceof Error ? err.message : String(err)}` }
    }

    // ── Step 6: SDP exchange with OpenAI Realtime ────────────────────────────
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
      console.log('[DonnaRealtime] SDP exchange — status:', sdpRes.status)
      if (!sdpRes.ok) {
        const errText = await sdpRes.text()
        clearTimeout(dcOpenTimeout)
        setStatus('error')
        pc.close()
        isConnectingRef.current = false
        return { ok: false, reason: `OpenAI SDP error ${sdpRes.status}: ${errText.slice(0, 200)}` }
      }
      sdpAnswer = await sdpRes.text()
    } catch (err) {
      clearTimeout(dcOpenTimeout)
      setStatus('error')
      pc.close()
      isConnectingRef.current = false
      return { ok: false, reason: `SDP exchange failed: ${err instanceof Error ? err.message : String(err)}` }
    }

    // ── Step 7: Set remote description ──────────────────────────────────────
    try {
      await pc.setRemoteDescription({ type: 'answer', sdp: sdpAnswer })
      console.log('[DonnaRealtime] remote description set — waiting for data channel')
    } catch (err) {
      clearTimeout(dcOpenTimeout)
      setStatus('error')
      pc.close()
      isConnectingRef.current = false
      return { ok: false, reason: `Remote description failed: ${err instanceof Error ? err.message : String(err)}` }
    }

    // ── Step 8: Wait for data channel open ──────────────────────────────────
    try {
      await dcOpenPromise
      console.log('[DonnaRealtime] connect() complete')
      isConnectingRef.current = false
      return { ok: true }
    } catch (err) {
      setStatus('error')
      pc.close()
      isConnectingRef.current = false
      return { ok: false, reason: `${err instanceof Error ? err.message : String(err)}` }
    }
  }, [clearPending])

  // Clean up on unmount
  useEffect(() => { return () => { disconnect() } }, [disconnect])

  return {
    status,
    unavailableReason,
    connect,
    disconnect,
    speak,
  }
}
