import { cx } from '@/lib/cx'

/**
 * The passage split into its timed segments. The one being heard is highlighted, and a click plays from its start,
 * so a hard sentence can be heard again. Translations (after hand-in) sit under each segment.
 *
 * @param {object} props
 * @param {import('../types').Segment[]} props.segments
 * @param {number | null} props.activeId
 * @param {Map<number, string> | null} props.translations segment id -> Vietnamese, or null to hide them
 * @param {(ms: number) => void} props.onPlayFrom
 */
export function Transcript({ segments, activeId, translations, onPlayFrom }) {
  return (
    <ol aria-label="Phụ đề" className="flex flex-col gap-1">
      {segments.map((segment) => {
        const active = segment.id === activeId
        const translation = translations?.get(segment.id)
        return (
          <li key={segment.id}>
            <button
              type="button"
              onClick={() => onPlayFrom(segment.startMs)}
              aria-current={active ? 'true' : undefined}
              title="Nghe lại đoạn này"
              className={cx(
                'flex w-full cursor-pointer flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-brand',
                active ? 'bg-brand-tint' : 'hover:bg-white',
              )}
            >
              {segment.speaker && <span className="text-xs font-semibold text-muted">{segment.speaker}</span>}
              <span lang="en" className={cx('text-sm leading-relaxed', active ? 'text-ink' : 'text-ink-soft')}>
                {segment.transcript}
              </span>
              {translation && <span className="text-label leading-relaxed text-muted">{translation}</span>}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
