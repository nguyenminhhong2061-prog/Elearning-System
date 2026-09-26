import { useCallback, useEffect, useRef, useState } from 'react'
import { startAttempt } from './api/exercisesApi'

/**
 * The attempt the learner is working on. Opening a lesson starts one (the list card says "bấm để làm bài"), and
 * `restart` starts another for "Làm lại". While a restart is on its way the previous attempt stays on screen; when
 * it arrives, `round` changes so the exercise can remount fresh (use it as a React key).
 *
 * @param {number} lessonId
 */
export function useAttempt(lessonId) {
  const [state, setState] = useState({ id: null, round: 0, starting: true, error: null })
  // StrictMode runs mount effects twice in development; one lesson visit must start one attempt, not two.
  const startedOnMount = useRef(false)

  const start = useCallback(async () => {
    setState((current) => ({ ...current, starting: true, error: null }))
    try {
      const { attemptId } = await startAttempt(lessonId)
      setState((current) => ({ id: attemptId, round: current.round + 1, starting: false, error: null }))
    } catch (error) {
      setState((current) => ({ ...current, starting: false, error }))
    }
  }, [lessonId])

  useEffect(() => {
    if (startedOnMount.current) return
    startedOnMount.current = true
    start()
  }, [start])

  return { attemptId: state.id, round: state.round, starting: state.starting, error: state.error, restart: start }
}
