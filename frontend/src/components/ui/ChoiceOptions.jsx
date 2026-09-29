import { cx } from '@/lib/cx'

const BASE =
  'flex cursor-pointer items-center justify-between gap-3 rounded-full border px-4 py-3.25 text-sm font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand has-disabled:cursor-default'

// A ring on top of the 1px border makes the design's 2px outline without moving the text by a pixel.
const STYLE = {
  idle: 'border-line bg-white text-ink-soft hover:border-brand-tint-line',
  selected: 'border-brand bg-brand-tint text-brand-dark ring-1 ring-brand',
  correct: 'border-success-solid bg-success-bg text-success ring-1 ring-success-solid',
  wrong: 'border-danger-solid bg-danger-bg text-danger ring-1 ring-danger-solid',
  locked: 'border-line bg-white text-muted',
}

function stateOf(optionId, selectedId, graded) {
  if (!graded) return optionId === selectedId ? 'selected' : 'idle'
  if (optionId === graded.correctOptionId) return 'correct'
  if (optionId === selectedId) return 'wrong'
  return 'locked'
}

const MARK = {
  correct: { symbol: '✓', text: 'đáp án đúng' },
  wrong: { symbol: '✗', text: 'bạn chọn, chưa đúng' },
}

/**
 * The design's pill answers of a multiple-choice question, built on native radio buttons so arrow keys, Tab and
 * screen readers work as for any radio group. Once `graded` is set the answers lock and show which was right.
 *
 * @param {object} props
 * @param {string} props.name unique radio group name
 * @param {string} props.label accessible name of the group (the question)
 * @param {Array<{ id: number, text: string }>} props.options
 * @param {number | null} props.selectedId
 * @param {(optionId: number) => void} props.onSelect
 * @param {{ correctOptionId: number | null } | null} [props.graded]
 * @param {boolean} [props.shortcuts] announce keys 1-4 (the grammar screen listens for them)
 */
export function ChoiceOptions({ name, label, options, selectedId, onSelect, graded = null, shortcuts = false }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2.5">
      {options.map((option, position) => {
        const state = stateOf(option.id, selectedId, graded)
        const mark = MARK[state]
        return (
          <label key={option.id} className={cx(BASE, STYLE[state])}>
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={option.id === selectedId}
              disabled={Boolean(graded)}
              onChange={() => onSelect(option.id)}
              aria-keyshortcuts={shortcuts ? String(position + 1) : undefined}
              className="sr-only"
            />
            <span lang="en">{option.text}</span>
            {mark && (
              <span className="flex-none">
                <span aria-hidden="true">{mark.symbol}</span>
                <span className="sr-only">({mark.text})</span>
              </span>
            )}
          </label>
        )
      })}
    </div>
  )
}
