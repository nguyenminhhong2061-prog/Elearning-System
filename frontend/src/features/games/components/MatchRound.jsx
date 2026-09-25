import { useEffect, useRef, useState } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { cx } from '@/lib/cx'
import { checkAnswer } from '../api/gamesApi'
import { elapsedSince } from '../clock'

const WRONG_FLASH_MS = 600

function shuffle(items) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[other]] = [copy[other], copy[index]]
  }
  return copy
}

/** Word tiles and meaning tiles of a round, mixed together once. */
function buildTiles(round) {
  return shuffle([
    ...round.questions.map((question) => ({ key: `q${question.id}`, side: 'word', id: question.id, label: question.prompt, points: question.points })),
    ...round.matchOptions.map((option) => ({ key: `o${option.id}`, side: 'meaning', id: option.id, label: option.content })),
  ])
}

function tileStyle({ matched, picked, wrong }) {
  if (matched) return 'bg-review-remembered text-white'
  if (wrong) return 'bg-review-forgot text-white'
  if (picked) return 'bg-game-picked text-game-picked-text'
  return 'bg-white/92 text-brand-dark hover:bg-white'
}

/**
 * WORD_MATCH, the game drawn in the design: a grid of word and meaning tiles; pick one of each to match them. The pair
 * is checked with the server, which does not reveal the right meaning on a wrong pair.
 *
 * @param {object} props
 * @param {import('../types').GameRound} props.round
 * @param {(answer: { questionId: number, optionId: number, correct: true, points: number, responseTimeMs: number }) => void} props.onAnswer
 *   called for each correct pair
 * @param {() => void} props.onComplete when every word is matched
 */
export function MatchRound({ round, onAnswer, onComplete }) {
  const [tiles] = useState(() => buildTiles(round))
  const [picked, setPicked] = useState(null) // tile key
  const [matched, setMatched] = useState(() => new Set())
  const [wrong, setWrong] = useState(null) // [key, key] flashing red
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(null)
  const startedAt = useRef(0)
  useEffect(() => {
    startedAt.current = Date.now() // when the tiles are first shown
  }, [])

  async function pick(tile) {
    if (checking || wrong || matched.has(tile.key)) return
    const first = tiles.find((candidate) => candidate.key === picked)
    if (!first || first.key === tile.key || first.side === tile.side) {
      // Nothing picked yet, the same tile again, or another tile of the same side: this becomes the pick.
      setPicked(first?.key === tile.key ? null : tile.key)
      return
    }

    const word = first.side === 'word' ? first : tile
    const meaning = first.side === 'word' ? tile : first
    setChecking(true)
    setError(null)
    try {
      const result = await checkAnswer(round.gameId, { playToken: round.playToken, questionId: word.id, optionId: meaning.id })
      if (result.correct) {
        const next = new Set(matched).add(word.key).add(meaning.key)
        setMatched(next)
        setPicked(null)
        onAnswer({ questionId: word.id, optionId: meaning.id, correct: true, points: word.points, responseTimeMs: elapsedSince(startedAt.current) })
        if (next.size === tiles.length) onComplete()
      } else {
        setWrong([word.key, meaning.key])
        setTimeout(() => {
          setWrong(null)
          setPicked(null)
        }, WRONG_FLASH_MS)
      }
    } catch (failure) {
      setError(describeApiError(failure, 'Không kiểm tra được cặp này. Hãy thử lại.'))
      setPicked(null)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {tiles.map((tile) => {
          const state = { matched: matched.has(tile.key), picked: picked === tile.key, wrong: wrong?.includes(tile.key) }
          return (
            <button
              key={tile.key}
              type="button"
              lang={tile.side === 'word' ? 'en' : 'vi'}
              aria-label={state.matched ? `${tile.label} (đã ghép)` : tile.label}
              aria-pressed={state.picked}
              aria-disabled={state.matched || undefined}
              onClick={() => pick(tile)}
              className={cx(
                'flex aspect-square cursor-pointer items-center justify-center rounded-[10px] p-1 text-center text-xs font-semibold break-words transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                state.matched && 'cursor-default',
                tileStyle(state),
              )}
            >
              {tile.label}
            </button>
          )
        })}
      </div>
      <p className="text-label text-white/85">
        Bấm 1 ô tiếng Anh rồi 1 ô nghĩa tiếng Việt để ghép — ghép đúng sẽ sáng xanh.
      </p>
      <p aria-live="assertive" className="sr-only">
        {wrong ? 'Chưa đúng, hãy thử cặp khác.' : ''}
      </p>
      {error && <p role="alert" className="rounded-lg bg-white px-3 py-2 text-label font-semibold text-danger">{error}</p>}
    </div>
  )
}
