import { Link } from 'react-router'
import { Page } from '@/components/layout/Page'
import { ButtonLink } from '@/components/ui/Button'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { formatCount } from '@/features/vocabulary/topicProgress'
import { useGames } from '../api/gamesQueries'
import { Leaderboard } from '../components/Leaderboard'
import { GAME_TYPE_INFO } from '../constants'

function GameCard({ game }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[17px] leading-6 font-semibold text-ink">{game.name}</h2>
        <p className="text-label text-muted">{GAME_TYPE_INFO[game.gameType]?.summary}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tag>{game.questionCount} câu</Tag>
        <Tag>{game.timeLimitSeconds ? `${game.timeLimitSeconds} giây` : 'Không giới hạn thời gian'}</Tag>
        <Tag variant={game.myBestScore === null ? 'neutral' : 'brand'}>
          {game.myBestScore === null ? 'Chưa chơi' : `Kỷ lục ${formatCount(game.myBestScore)}`}
        </Tag>
      </div>
      <ButtonLink to={`/vocabulary/games/${game.id}`} size="sm" className="self-start" aria-label={`Chơi ${game.name}`}>
        Chơi →
      </ButtonLink>
    </li>
  )
}

/** A4: the three games and the leaderboard. */
export function GamesPage() {
  const games = useGames()

  let list
  if (games.isPending) {
    list = Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-40 rounded-xl" />)
  } else if (games.isError) {
    list = <LoadError error={games.error} onRetry={() => games.refetch()} message="Không tải được danh sách trò chơi." />
  } else if (games.data.length === 0) {
    list = <p className="text-sm text-muted">Chưa có trò chơi nào.</p>
  } else {
    list = (
      <ul className="flex flex-col gap-3">
        {games.data.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </ul>
    )
  }

  return (
    <Page
      title="Trò chơi từ vựng"
      heading={
        <div className="flex flex-col gap-2">
          <Link to="/vocabulary" className="self-start text-label font-medium">
            ← Từ vựng
          </Link>
          <h1 className="text-title font-bold text-ink">Trò chơi từ vựng</h1>
          <p className="text-label text-muted">Ôn từ vựng theo cách chơi có tính giờ, thi đua với bạn học khác.</p>
        </div>
      }
    >
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex flex-[1_1_432px] flex-col gap-3">{list}</div>
        <Leaderboard className="flex-[1_1_320px]" />
      </div>
    </Page>
  )
}
