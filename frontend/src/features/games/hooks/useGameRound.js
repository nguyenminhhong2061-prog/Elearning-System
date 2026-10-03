import { useRef, useState } from 'react'
import { useStartRound, useSubmitRound } from '../api/gamesQueries'
import { POINTS_PER_UNIT } from '../constants'
import { useGameClock } from './useGameClock'

/**
 * The rules of playing one game (A4), separate from how the screen looks. A round goes through four phases:
 * intro → starting (start()) → playing → finished (finish(), or the time is up). If starting fails, it goes back to
 * intro with `startError`; "Chơi lại" calls start() again from finished.
 *
 * While playing, the clock runs (and ends the round when the time is up), answers are recorded and the score is
 * counted. The round is only handed in when it ends; leaving earlier sends nothing, so that round's score is not
 * saved. The clock stops while the learner is asked about leaving and goes on from where it was (scenario 8, 6a).
 *
 * @param {number | null} gameId
 */
export function useGameRound(gameId) {
  const startRound = useStartRound(gameId)
  const submit = useSubmitRound(gameId)

  const [phase, setPhase] = useState('intro') // intro | starting | playing | finished
  const [round, setRound] = useState(null)
  const [roundNumber, setRoundNumber] = useState(0)
  const [startedAt, setStartedAt] = useState(null)
  const [score, setScore] = useState(0)
  const [confirmingExit, setConfirmingExit] = useState(false)
  const [playedSeconds, setPlayedSeconds] = useState(0)
  const [finalAnswers, setFinalAnswers] = useState(() => new Map())
  const pausedAt = useRef(null)
  const answers = useRef(new Map())
  const lastSubmission = useRef(null)
  // The last pair and the end of the time can land in the same moment; the round must be handed in only once.
  const handedIn = useRef(false)

  async function start() {
    setPhase('starting')
    submit.reset()
    try {
      const next = await startRound.mutateAsync()
      answers.current = new Map()
      handedIn.current = false
      setScore(0)
      setRound(next)
      setRoundNumber((previous) => previous + 1)
      setStartedAt(Date.now())
      setPhase('playing')
    } catch {
      setPhase('intro') // the intro shows startRound.error
    }
  }

  function recordAnswer(answer) {
    if (answers.current.has(answer.questionId)) return // only the first answer to a question counts
    answers.current.set(answer.questionId, answer)
    if (answer.correct) setScore((previous) => previous + answer.points * POINTS_PER_UNIT)
  }

  function finish() {
    if (phase !== 'playing' || handedIn.current) return
    handedIn.current = true
    setPlayedSeconds(Math.min(round.timeLimitSeconds ?? Infinity, Math.round((Date.now() - startedAt) / 1000)))
    setFinalAnswers(new Map(answers.current))
    setPhase('finished')
    setConfirmingExit(false)
    lastSubmission.current = {
      playToken: round.playToken,
      answers: round.questions.map((question) => {
        const answer = answers.current.get(question.id)
        return { questionId: question.id, optionId: answer?.optionId ?? null, responseTimeMs: answer?.responseTimeMs ?? null }
      }),
    }
    submit.mutate(lastSubmission.current)
  }

  const clock = useGameClock({
    startedAt: phase === 'playing' ? startedAt : null,
    limitSeconds: round?.timeLimitSeconds ?? null,
    onExpire: finish,
    paused: confirmingExit,
  })

  function askToExit() {
    pausedAt.current = Date.now()
    setConfirmingExit(true)
  }

  function keepPlaying() {
    const pausedFor = pausedAt.current === null ? 0 : Date.now() - pausedAt.current
    pausedAt.current = null
    setStartedAt((previous) => previous + pausedFor)
    setConfirmingExit(false)
  }

  return {
    phase,
    round,
    /** Changes with every new round, to start the round components afresh. */
    roundNumber,
    score,
    clock,
    start,
    startError: startRound.error,
    recordAnswer,
    finish,
    confirmingExit,
    askToExit,
    keepPlaying,
    /** The handing in of the finished round: pending (grading), error, or the server's result in `data`. */
    submit,
    resubmit: () => submit.mutate(lastSubmission.current),
    playedSeconds,
    finalAnswers,
  }
}
