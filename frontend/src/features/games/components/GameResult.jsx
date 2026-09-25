import { Link } from 'react-router'
import { formatCount } from '@/features/vocabulary/topicProgress'

/** End of a round, inside the teal panel: the score the server computed and what to do next. */
export function GameResult({ result, onPlayAgain }) {
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      {result.isPersonalBest && (
        <span className="rounded-full bg-game-picked px-3 py-1 text-xs font-bold text-game-picked-text">Kỷ lục mới!</span>
      )}
      <p className="text-label font-semibold text-white/85">Điểm của bạn</p>
      <p className="text-[48px] leading-none font-bold text-white tabular-nums">{formatCount(result.score)}</p>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-label text-white/90">
        <li>
          Đúng {result.correctCount}/{result.questionCount} câu
        </li>
        {result.timeBonus > 0 && <li>Thưởng thời gian +{formatCount(result.timeBonus)}</li>}
        <li>Kỷ lục: {formatCount(result.bestScore)}</li>
      </ul>
      <p className="max-w-80 text-xs text-white/75">Bảng xếp hạng được tính lại định kỳ, điểm của ván này sẽ sớm xuất hiện.</p>
      <div className="mt-2 flex w-full flex-wrap gap-2">
        <button
          type="button"
          onClick={onPlayAgain}
          className="flex-1 cursor-pointer rounded-lg bg-white px-4 py-3 text-label font-semibold text-brand-dark hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Chơi lại
        </button>
        <Link
          to="/vocabulary/games"
          className="flex-1 rounded-lg bg-white/16 px-4 py-3 text-center text-label font-semibold text-white hover:bg-white/24 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Chọn trò chơi khác
        </Link>
      </div>
    </div>
  )
}
