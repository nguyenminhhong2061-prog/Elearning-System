import { useCallback, useEffect, useRef, useState } from 'react'
import { saveRecording } from './api/testsApi'

/**
 * Uploads the recorded answers of read-aloud questions and keeps what the screen shows about each of them: being
 * processed, saved (with the learner's own recording to play back), or failed (kept, to send again).
 *
 * It lives in the attempt screen, not in the question: the server assesses a recording while it saves it, which can
 * take a while, and the learner may move on to another question in the meantime.
 *
 * @param {number} attemptId
 * @param {(questionId: number) => void} onSaved the server now has a recording for the question
 */
export function useRecordingSaver(attemptId, onSaved) {
  // questionId -> { status: 'saving' | 'saved' | 'error', url: string, error: unknown }
  const [uploads, setUploads] = useState({})
  const [kept] = useState(() => new Map()) // questionId -> the recording, to retry a failed upload
  const [urls] = useState(() => new Set())
  const handleSaved = useRef(onSaved)
  useEffect(() => {
    handleSaved.current = onSaved
  })

  /** Sends the recording as the question's answer. One upload per question at a time: the screen waits for it. */
  const save = useCallback(
    async (questionId, wav) => {
      const url = URL.createObjectURL(wav)
      urls.add(url)
      kept.set(questionId, wav)
      setUploads((current) => ({ ...current, [questionId]: { status: 'saving', url, error: null } }))
      try {
        await saveRecording(attemptId, questionId, wav)
        setUploads((current) => ({ ...current, [questionId]: { status: 'saved', url, error: null } }))
        handleSaved.current(questionId)
      } catch (error) {
        setUploads((current) => ({ ...current, [questionId]: { status: 'error', url, error } }))
      }
    },
    [attemptId, kept, urls],
  )

  /** Sends the kept recording of a question again after a failed upload. */
  const retry = useCallback(
    (questionId) => {
      const wav = kept.get(questionId)
      if (wav) save(questionId, wav)
    },
    [kept, save],
  )

  useEffect(
    () => () => {
      for (const url of urls) URL.revokeObjectURL(url)
    },
    [urls],
  )

  const busy = Object.values(uploads).some((upload) => upload.status === 'saving')
  return { uploads, save, retry, busy }
}
