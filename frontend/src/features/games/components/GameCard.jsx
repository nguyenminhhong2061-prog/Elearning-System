import { ButtonLink } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { paths } from '@/config/paths'
import { formatCount } from '@/lib/format'
import { GAME_TYPE_INFO } from '../constants'

/**
 * One game on the games page: what it asks, its length, the learner's best score, and "Chơi →".
 * @param {{ game: import('../types').Game }} props
 */
export function GameCard({ game }) {
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
      <ButtonLink to={paths.game(game.id)} size="sm" className="mt-auto self-start" aria-label={`Chơi ${game.name}`}>
        Chơi →
      </ButtonLink>
    </li>
  )
}
