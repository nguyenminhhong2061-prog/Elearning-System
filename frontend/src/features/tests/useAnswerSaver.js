import { useCallback, useEffect, useRef, useState } from 'react'
import { saveAnswer } from './api/testsApi'

/** How long typing must pause before a typed answer is saved. */
export const TYPING_PAUSE_MS = 800

/**
 * Saves the answers of a test attempt while the learner works, so leaving the page loses nothing: a picked option at
 * once, typed text when typing pauses. Saves run one at a time in the order they were made, so a slow earlier
 * request can never overwrite a later answer on the server. A failed save stays pending and is sent again by flush().
 *
 * Mount one saver per attempt (give the component a `key` of the attempt id).
 *
 * @param {number} attemptId
 * @param {import('./types').SavedAnswer[]} savedAnswers what the server already has (a resumed attempt)
 */
export function useAnswerSaver(attemptId, savedAnswers) {
  // 'idle' | 'unsaved' (waiting for the typing pause) | 'saving' | 'saved' | 'error'
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  // questionId -> JSON of the payload the server has, so an unchanged answer is not sent again.
  const [saved] = useState(
    () =>
      new Map(
        savedAnswers.map((item) => [
          item.questionId,
          JSON.stringify(item.optionId != null ? { optionId: item.optionId } : { text: item.text }),
        ]),
      ),
  )
  const pending = useRef(new Map()) // questionId -> payload not sent yet
  const timer = useRef(null)
  const queue = useRef(Promise.resolve())

  const send = useCallback(
    (questionId, payload) => {
      const run = queue.current.then(async () => {
        const json = JSON.stringify(payload)
        if (saved.get(questionId) === json) return true
        setStatus('saving')
        try {
          await saveAnswer(attemptId, questionId, payload)
          saved.set(questionId, json)
          setStatus(pending.current.size > 0 ? 'unsaved' : 'saved')
          setError(null)
          return true
        } catch (saveError) {
          // Keep it for the next flush, unless the learner has changed the answer since.
          if (!pending.current.has(questionId)) pending.current.set(questionId, payload)
          setStatus('error')
          setError(saveError)
          return false
        }
      })
      queue.current = run
      return run
    },
    [attemptId, saved],
  )

  /** Sends every pending answer now. Resolves to true when the server has them all. */
  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    const entries = [...pending.current]
    pending.current.clear()
    const results = await Promise.all(entries.map(([questionId, payload]) => send(questionId, payload)))
    return results.every(Boolean)
  }, [send])

  /** A picked option: saved at once. A null payload (nothing usable) is not sent. */
  const saveNow = useCallback(
    (questionId, payload) => {
      pending.current.delete(questionId)
      if (!payload) return Promise.resolve(true)
      return send(questionId, payload)
    },
    [send],
  )

  /** Typed text: saved once typing pauses. The server cannot erase an answer, so emptied text is simply not sent. */
  const saveLater = useCallback(
    (questionId, payload) => {
      clearTimeout(timer.current)
      if (payload) {
        pending.current.set(questionId, payload)
        setStatus('unsaved')
      } else {
        pending.current.delete(questionId)
      }
      timer.current = setTimeout(flush, TYPING_PAUSE_MS)
    },
    [flush],
  )

  // Leaving the screen (another page of the app) still sends what was typed.
  useEffect(
    () => () => {
      clearTimeout(timer.current)
      for (const [questionId, payload] of pending.current) send(questionId, payload)
      pending.current.clear()
    },
    [send],
  )

  // Closing or reloading the tab while an answer is not on the server yet: let the browser ask first.
  const unsafe = status === 'unsaved' || status === 'saving' || status === 'error'
  useEffect(() => {
    if (!unsafe) return undefined
    function warn(event) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsafe])

  return { status, error, saveNow, saveLater, flush }
}
