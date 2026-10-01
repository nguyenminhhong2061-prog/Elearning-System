import { Link } from 'react-router'
import { formatCount } from '@/features/vocabulary/topicProgress'

const optionText = (question, optionId) => question.options.find((option) => option.id === optionId)?.content ?? '—'

/**
 * "Các câu sai" under the result of a choice game (scenario 8, step 8): the prompt, what was picked and the right
 * answer. Questions left when the time ran out count as wrong too.
 */
function WrongAnswers({ round, answers }) {
  const rows = round.questions
    .map((question, index) => ({ question, number: index + 1, answer: answers.get(question.id) }))
    .filter(({ answer }) => !answer?.correct)
  if (rows.length === 0) return null
  return (
    <div className="mt-2 w-full rounded-[10px] bg-white p-4 text-left text-ink">
      <h3 className="text-label font-semibold text-ink">Các câu sai</h3>
      <table className="mt-2 w-full text-label">
        <thead>
          <tr className="text-xs text-muted">
            <th scope="col" className="py-1 pr-2 text-left font-medium">
              Câu
            </th>
            <th scope="col" className="py-1 pr-2 text-left font-medium">
              {round.gameType === 'QUICK_QUIZ' ? 'Nghĩa' : 'Từ'}
            </th>
            <th scope="col" className="py-1 pr-2 text-left font-medium">
              Bạn chọn
            </th>
            <th scope="col" className="py-1 text-left font-medium">
              Đáp án đúng
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ question, number, answer }) => (
            <tr key={question.id} className="border-t border-canvas align-top">
              <td className="py-1.5 pr-2 tabular-nums">{number}</td>
              <td className="py-1.5 pr-2 font-semibold">{question.prompt}</td>
              <td className="py-1.5 pr-2 text-danger">{answer ? optionText(question, answer.optionId) : 'Chưa trả lời'}</td>
              <td className="py-1.5 text-success">{answer ? optionText(question, answer.correctOptionId) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * End of a round, inside the teal panel: the score the server computed, the time played and what to do next.
 * @param {object} props
 * @param {object} props.result the server's result
 * @param {number} props.playedSeconds
 * @param {import('../types').GameRound} props.round
 * @param {Map<number, { optionId: number, correct: boolean, correctOptionId: number | null }>} props.answers
 * @param {() => void} props.onPlayAgain
 */
export function GameResult({ result, playedSeconds, round, answers, onPlayAgain }) {
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
        <li>Thời gian {formatCount(playedSeconds)} giây</li>
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
      {round.gameType !== 'WORD_MATCH' && <WrongAnswers round={round} answers={answers} />}
    </div>
  )
}
