import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_RECORDING_MS } from '../constants'
import { recordingErrorMessage, startRecording, toWav } from './recorder'

/**
 * Recording state for one pronunciation item: idle, asking for the microphone, recording (with the elapsed time), or
 * converting. The recording stops by itself after `maxMs`. When a recording is ready, `onRecorded` receives the WAV.
 *
 * @param {{ onRecorded: (recording: { wav: Blob, durationMs: number }) => void, maxMs?: number }} options
 */
export function useRecorder({ onRecorded, maxMs = MAX_RECORDING_MS }) {
  const [status, setStatus] = useState('idle') // idle | starting | recording | processing
  const [elapsedMs, setElapsedMs] = useState(0)
  const [error, setError] = useState(null)
  const session = useRef(null)
  const startedAt = useRef(0)
  // The latest callback, so a recording stopped by the timer reaches the current item's handler.
  const handleRecorded = useRef(onRecorded)
  useEffect(() => {
    handleRecorded.current = onRecorded
  })

  const stop = useCallback(async () => {
    const current = session.current
    if (!current) return
    session.current = null
    setStatus('processing')
    try {
      const recording = await toWav(await current.stop())
      setStatus('idle')
      handleRecorded.current(recording)
    } catch (failure) {
      setStatus('idle')
      setError(recordingErrorMessage(failure))
    }
  }, [])

  const start = useCallback(async () => {
    if (session.current) return
    setError(null)
    setElapsedMs(0)
    setStatus('starting')
    try {
      session.current = await startRecording()
      startedAt.current = Date.now()
      setStatus('recording')
    } catch (failure) {
      setStatus('idle')
      setError(recordingErrorMessage(failure))
    }
  }, [])

  // Elapsed time, and the automatic stop at the limit.
  useEffect(() => {
    if (status !== 'recording') return undefined
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt.current
      setElapsedMs(Math.min(elapsed, maxMs))
      if (elapsed >= maxMs) stop()
    }, 100)
    return () => clearInterval(timer)
  }, [status, maxMs, stop])

  // Leaving the page mid-recording releases the microphone.
  useEffect(() => () => session.current?.cancel(), [])

  return { status, elapsedMs, error, start, stop, clearError: () => setError(null) }
}
