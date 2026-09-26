import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { Page } from '@/components/layout/Page'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { parseId } from '@/features/vocabulary/routeParams'
import { formatCount } from '@/features/vocabulary/topicProgress'
import { useStudyTime } from '@/features/progress/useStudyTime'
import { playGame } from '../api/gamesApi'
import { useGames, useSubmitRound } from '../api/gamesQueries'
import { formatClock } from '../clock'
import { ChoiceRound } from '../components/ChoiceRound'
import { GameBoard, Pill } from '../components/GameBoard'
import { GameResult } from '../components/GameResult'
import { Leaderboard } from '../components/Leaderboard'
import { MatchRound } from '../components/MatchRound'
import { GAME_TYPE_INFO, POINTS_PER_UNIT } from '../constants'
import { useGameClock } from '../useGameClock'

const GAMES_PATH = '/vocabulary/games'
const WHITE_BUTTON =
  'cursor-pointer rounded-lg bg-white px-6 py-3 text-body font-semibold text-brand-dark hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-70'

function Layout({ title, children }) {
  return (
    <Page
      title={title}
      width="medium"
      heading={
        <Link to={GAMES_PATH} className="self-start text-label font-medium">
          ← Trò chơi
        </Link>
      }
    >
      <div className="flex flex-wrap items-start gap-5">
        <div className="min-w-0 flex-[2_1_432px]">{children}</div>
        <Leaderboard className="flex-[1_1_320px] lg:max-w-110" />
      </div>
    </Page>
  )
}

/**
 * One game (A4): an intro, the timed round, then the score computed by the server. The round is only handed in when it
 * ends; leaving earlier sends nothing, so that round's score is not saved.
 */
export function GamePlayPage() {
  useStudyTime()
  const params = useParams()
  const gameId = parseId(params.gameId)
  const navigate = useNavigate()
  const games = useGames()
  const submit = useSubmitRound(gameId)

  const [phase, setPhase] = useState('intro') // intro | starting | playing | finished
  const [round, setRound] = useState(null)
  const [roundNumber, setRoundNumber] = useState(0)
  const [startedAt, setStartedAt] = useState(null)
  const [score, setScore] = useState(0)
  const [startError, setStartError] = useState(null)
  const [confirmingExit, setConfirmingExit] = useState(false)
  const answers = useRef(new Map())
  const lastSubmission = useRef(null)
  // The last pair and the end of the time can land in the same moment; the round must be handed in only once.
  const handedIn = useRef(false)

  async function start() {
    setPhase('starting')
    setStartError(null)
    submit.reset()
    try {
      const next = await playGame(gameId)
      answers.current = new Map()
      handedIn.current = false
      setScore(0)
      setRound(next)
      setRoundNumber((previous) => previous + 1)
      setStartedAt(Date.now())
      setPhase('playing')
    } catch (error) {
      setStartError(error)
      setPhase('intro')
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
  })

  if (gameId === null || (games.data && !games.data.some((game) => game.id === gameId))) {
    return (
      <Layout title="Không tìm thấy trò chơi">
        <h1 className="sr-only">Không tìm thấy trò chơi</h1>
        <Card>
          <p className="text-sm text-muted">Trò chơi này không tồn tại.</p>
        </Card>
      </Layout>
    )
  }
  if (games.isError) {
    return (
      <Layout title="Trò chơi">
        <h1 className="sr-only">Trò chơi</h1>
        <LoadError error={games.error} onRetry={() => games.refetch()} message="Không tải được trò chơi." />
      </Layout>
    )
  }
  if (!games.data) {
    return (
      <Layout title="Trò chơi">
        <h1 className="sr-only">Đang tải trò chơi</h1>
        <Skeleton className="h-80 rounded-2xl" />
      </Layout>
    )
  }

  const game = games.data.find((candidate) => candidate.id === gameId)
  const info = GAME_TYPE_INFO[game.gameType]
  const playing = phase === 'playing'
  const seconds = clock.remainingMs === null ? clock.elapsedMs / 1000 : Math.ceil(clock.remainingMs / 1000)

  let body
  if (phase === 'intro' || phase === 'starting') {
    body = (
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-white/90">{info?.instructions}</p>
        <p className="text-label text-white/80">
          {game.questionCount} câu · {game.timeLimitSeconds ? `${game.timeLimitSeconds} giây` : 'không giới hạn thời gian'}
          {game.myBestScore !== null && ` · Kỷ lục của bạn: ${formatCount(game.myBestScore)}`}
        </p>
        {startError && (
          <p role="alert" className="rounded-lg bg-white px-3 py-2 text-label font-semibold text-danger">
            {describeApiError(startError, 'Không bắt đầu được ván chơi. Vui lòng thử lại.')}
          </p>
        )}
        <button type="button" onClick={start} disabled={phase === 'starting'} className={WHITE_BUTTON}>
          {phase === 'starting' ? 'Đang chuẩn bị…' : 'Bắt đầu'}
        </button>
      </div>
    )
  } else if (playing) {
    body =
      round.gameType === 'WORD_MATCH' ? (
        <MatchRound key={roundNumber} round={round} onAnswer={recordAnswer} onComplete={finish} />
      ) : (
        <ChoiceRound key={roundNumber} round={round} onAnswer={recordAnswer} onComplete={finish} />
      )
  } else if (submit.isSuccess) {
    body = <GameResult result={submit.data} onPlayAgain={start} />
  } else if (submit.isError) {
    body = (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="rounded-lg bg-white px-3 py-2 text-label font-semibold text-danger">
          {describeApiError(submit.error, 'Chưa gửi được kết quả ván chơi.')}
        </p>
        <button type="button" onClick={() => submit.mutate(lastSubmission.current)} className={WHITE_BUTTON}>
          Gửi lại kết quả
        </button>
      </div>
    )
  } else {
    body = (
      <div className="flex items-center gap-3 py-6 text-sm font-semibold text-white">
        <Spinner label={null} className="border-white/40 border-t-white" />
        Đang chấm điểm…
      </div>
    )
  }

  return (
    <Layout title={game.name}>
      <GameBoard
        title={game.name}
        aside={
          <>
            {playing && (
              <>
                <Pill label={clock.remainingMs === null ? 'Thời gian đã chơi' : 'Thời gian còn lại'}>{formatClock(seconds)}</Pill>
                <Pill label="Điểm tạm tính">{formatCount(score)} điểm</Pill>
              </>
            )}
            {playing && (
              <button
                type="button"
                aria-label="Thoát ván"
                onClick={() => setConfirmingExit(true)}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/18 text-sm text-white hover:bg-white/28 focus-visible:outline-2 focus-visible:outline-white"
              >
                ✕
              </button>
            )}
          </>
        }
      >
        {body}
      </GameBoard>

      <Dialog open={confirmingExit} onClose={() => setConfirmingExit(false)} title="Thoát ván này?">
        <p className="text-sm text-ink-soft">Điểm của ván đang chơi sẽ không được lưu.</p>
        <div className="flex gap-2 pt-1.5">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmingExit(false)}>
            Chơi tiếp
          </Button>
          <Button variant="danger" size="sm" className="flex-1" onClick={() => navigate(GAMES_PATH)}>
            Thoát ván
          </Button>
        </div>
      </Dialog>
    </Layout>
  )
}
