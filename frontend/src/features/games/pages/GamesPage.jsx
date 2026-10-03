import { Page } from '@/components/layout/Page'
import { BackLink } from '@/components/ui/BackLink'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/config/paths'
import { useGames } from '../api/gamesQueries'
import { GameCard } from '../components/GameCard'
import { Leaderboard } from '../components/Leaderboard'

// One card per game, side by side as far as the width allows, sharing the whole column.
const GAME_GRID = 'grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3'

/** The game cards: loading, error, none, or the cards. */
function GameList() {
  const games = useGames()

  if (games.isPending) {
    return (
      <div className={GAME_GRID}>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-40 rounded-xl" />
        ))}
      </div>
    )
  }
  if (games.isError) {
    return <LoadError error={games.error} onRetry={() => games.refetch()} message="Không tải được danh sách trò chơi." />
  }
  if (games.data.length === 0) return <p className="text-sm text-muted">Chưa có trò chơi nào.</p>

  return (
    <ul className={GAME_GRID}>
      {games.data.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </ul>
  )
}

/** /vocabulary/games (A4): the three games and the leaderboard. */
export function GamesPage() {
  return (
    <Page
      title="Trò chơi từ vựng"
      heading={
        <div className="flex flex-col gap-2">
          <BackLink to={paths.vocabulary}>Từ vựng</BackLink>
          <h1 className="text-title font-bold text-ink">Trò chơi từ vựng</h1>
          <p className="text-label text-muted">Ôn từ vựng theo cách chơi có tính giờ, thi đua với bạn học khác.</p>
        </div>
      }
    >
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[3_1_432px] flex-col gap-3">
          <GameList />
        </div>
        <Leaderboard className="flex-[1_1_320px] lg:max-w-110" />
      </div>
    </Page>
  )
}
