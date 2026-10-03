import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { startAttempt } from './api/exercisesApi'
import { markAttemptsStale } from './api/exercisesQueries'

/** @type {import('./types').AttemptProgress} */
const NOTHING_DONE = { resumed: false, responses: [], pronunciation: [] }

/**
 * The attempt the learner is working on. Opening a lesson picks up the unfinished attempt when the server allows it
 * (reading, writing, pronunciation) or starts a new one; `progress` says which, and what was already done. `retry`
 * opens the lesson again after a failure (still picking up the unfinished attempt); `restart` always starts afresh
 * ("Làm lại", "Làm lại từ đầu"). While a restart is on its way the previous attempt stays on screen; when it arrives,
 * `round` changes so the exercise can remount fresh (use it as a React key).
 *
 * @param {number} lessonId
 */
export function useAttempt(lessonId) {
  const queryClient = useQueryClient()
  const [state, setState] = useState({ id: null, round: 0, starting: true, error: null, progress: NOTHING_DONE })
  // StrictMode runs mount effects twice in development; one lesson visit must open one attempt, not two.
  const startedOnMount = useRef(false)

  const start = useCallback(
    async (restart) => {
      setState((current) => ({ ...current, starting: true, error: null }))
      try {
        const data = await startAttempt(lessonId, { restart })
        setState((current) => ({
          id: data.attemptId,
          round: current.round + 1,
          starting: false,
          error: null,
          progress: { resumed: Boolean(data.resumed), responses: data.responses ?? [], pronunciation: data.pronunciation ?? [] },
        }))
        markAttemptsStale(queryClient)
      } catch (error) {
        setState((current) => ({ ...current, starting: false, error }))
      }
    },
    [lessonId, queryClient],
  )

  useEffect(() => {
    if (startedOnMount.current) return
    startedOnMount.current = true
    start(false)
  }, [start])

  const retry = useCallback(() => start(false), [start])
  const restart = useCallback(() => start(true), [start])

  return {
    attemptId: state.id,
    round: state.round,
    starting: state.starting,
    error: state.error,
    progress: state.progress,
    retry,
    restart,
  }
}
