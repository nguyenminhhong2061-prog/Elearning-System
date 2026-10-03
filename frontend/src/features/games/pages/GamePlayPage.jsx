import { useNavigate, useParams } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { Page } from '@/components/layout/Page'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { paths } from '@/config/paths'
import { useStudyTime } from '@/features/progress/useStudyTime'
import { formatCount } from '@/lib/format'
import { parseId } from '@/lib/routeParams'
import { useGames } from '../api/gamesQueries'
import { ChoiceRound } from '../components/ChoiceRound'
import { GameBoard, Pill } from '../components/GameBoard'
import { GameResult } from '../components/GameResult'
import { Leaderboard } from '../components/Leaderboard'
import { MatchRound } from '../components/MatchRound'
import { GAME_TYPE_INFO } from '../constants'
import { useGameRound } from '../hooks/useGameRound'
import { formatClock } from '../utils/clock'

const WHITE_BUTTON =
  'cursor-pointer rounded-lg bg-white px-6 py-3 text-body font-semibold text-brand-dark hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-70'

/** The page around a game: back link, the game, and the leaderboard beside it. */
function Layout({ title, children }) {
  return (
    <Page title={title} width="medium" heading={<BackLink to={paths.games}>Trò chơi</BackLink>}>
      <div className="flex flex-wrap items-start gap-5">
        <div className="min-w-0 flex-[2_1_432px]">{children}</div>
        <Leaderboard className="flex-[1_1_320px] lg:max-w-110" />
      </div>
    </Page>
  )
}

/** Inside the teal panel, by phase: the intro, the round being played, then grading and the result. */
function RoundContent({ game, play }) {
  if (play.phase === 'intro' || play.phase === 'starting') {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-white/90">{GAME_TYPE_INFO[game.gameType]?.instructions}</p>
        <p className="text-label text-white/80">
          {game.questionCount} câu · {game.timeLimitSeconds ? `${game.timeLimitSeconds} giây` : 'không giới hạn thời gian'}
          {game.myBestScore !== null && ` · Kỷ lục của bạn: ${formatCount(game.myBestScore)}`}
        </p>
        {play.startError && (
          <p role="alert" className="rounded-lg bg-white px-3 py-2 text-label font-semibold text-danger">
            {describeApiError(play.startError, 'Không bắt đầu được ván chơi. Vui lòng thử lại.')}
          </p>
        )}
        <button type="button" onClick={play.start} disabled={play.phase === 'starting'} className={WHITE_BUTTON}>
          {play.phase === 'starting' ? 'Đang chuẩn bị…' : 'Bắt đầu'}
        </button>
      </div>
    )
  }

  if (play.phase === 'playing') {
    const Round = play.round.gameType === 'WORD_MATCH' ? MatchRound : ChoiceRound
    return <Round key={play.roundNumber} round={play.round} onAnswer={play.recordAnswer} onComplete={play.finish} />
  }

  // Finished: the round has been handed in.
  if (play.submit.isSuccess) {
    return (
      <GameResult
        result={play.submit.data}
        playedSeconds={play.playedSeconds}
        round={play.round}
        answers={play.finalAnswers}
        onPlayAgain={play.start}
      />
    )
  }
  if (play.submit.isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="rounded-lg bg-white px-3 py-2 text-label font-semibold text-danger">
          {describeApiError(play.submit.error, 'Chưa gửi được kết quả ván chơi.')}
        </p>
        <button type="button" onClick={play.resubmit} className={WHITE_BUTTON}>
          Gửi lại kết quả
        </button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 py-6 text-sm font-semibold text-white">
      <Spinner label={null} className="border-white/40 border-t-white" />
      Đang chấm điểm…
    </div>
  )
}

/** Time and score pills, and the ✕ that asks before leaving, shown while playing. */
function RoundPills({ play }) {
  if (play.phase !== 'playing') return null
  const { remainingMs, elapsedMs } = play.clock
  const seconds = remainingMs === null ? elapsedMs / 1000 : Math.ceil(remainingMs / 1000)

  return (
    <>
      <Pill label={remainingMs === null ? 'Thời gian đã chơi' : 'Thời gian còn lại'}>{formatClock(seconds)}</Pill>
      <Pill label="Điểm tạm tính">{formatCount(play.score)} điểm</Pill>
      <button
        type="button"
        aria-label="Thoát ván"
        onClick={play.askToExit}
        className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/18 text-sm text-white hover:bg-white/28 focus-visible:outline-2 focus-visible:outline-white"
      >
        ✕
      </button>
    </>
  )
}

/**
 * /vocabulary/games/:gameId (A4): an intro, the timed round, then the score computed by the server. The rules of a
 * round are in useGameRound; this page only shows them.
 */
export function GamePlayPage() {
  useStudyTime()
  const navigate = useNavigate()

  // 1. What the URL asks for.
  const gameId = parseId(useParams().gameId)

  // 2. The data, and the round being played.
  const games = useGames()
  const play = useGameRound(gameId)

  // 3. One state at a time: not found, error, loading, then the game.
  if (gameId === null || (games.data && !games.data.some((game) => game.id === gameId))) {
    return (
      <Layout title="Không tìm thấy trò chơi">
        <h1 className="sr-only">Không tìm thấy trò chơi</h1>
        <EmptyState>Trò chơi này không tồn tại.</EmptyState>
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
  return (
    <Layout title={game.name}>
      <GameBoard title={game.name} aside={<RoundPills play={play} />}>
        <RoundContent game={game} play={play} />
      </GameBoard>

      <Dialog open={play.confirmingExit} onClose={play.keepPlaying} title="Thoát ván này?">
        <p className="text-sm text-ink-soft">Thoát bây giờ sẽ không lưu điểm ván này. Bạn có chắc?</p>
        <div className="flex gap-2 pt-1.5">
          <Button variant="outline" size="sm" className="flex-1" onClick={play.keepPlaying}>
            Chơi tiếp
          </Button>
          <Button variant="danger" size="sm" className="flex-1" onClick={() => navigate(paths.games)}>
            Thoát ván
          </Button>
        </div>
      </Dialog>
    </Layout>
  )
}
