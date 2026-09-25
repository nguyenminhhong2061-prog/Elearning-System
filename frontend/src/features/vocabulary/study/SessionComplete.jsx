import { ButtonLink } from '@/components/ui/Button'
import { formatCount } from '../topicProgress'
import { REVIEW_OPTIONS } from '../constants'

const DOT = { FORGOT: 'bg-review-forgot', VAGUE: 'bg-review-vague', REMEMBERED: 'bg-review-remembered' }

/**
 * The design's dark "Hoàn thành phiên ôn tập" card. The design's "streak" belongs to the progress module, so it shows
 * how the cards were rated instead.
 */
export function SessionComplete({ results, backTo, backLabel, onContinue }) {
  return (
    <div className="mx-auto flex w-full max-w-120 animate-screen-in flex-col items-center gap-4 rounded-2xl bg-sidebar-deep p-10 text-center">
      <div className="flex size-25 items-center justify-center rounded-full border-6 border-brand text-title font-bold text-white">
        {results.length}
      </div>
      <h2 className="text-[22px] leading-7 font-bold text-white">Hoàn thành phiên ôn tập</h2>
      <p className="text-label text-muted-light">
        {formatCount(results.length)} từ đã ôn · các từ sẽ được nhắc lại theo lịch ôn
      </p>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-label text-sidebar-text">
        {REVIEW_OPTIONS.map((option) => (
          <li key={option.value} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-2 rounded-full ${DOT[option.value]}`} />
            {option.label}: {results.filter((result) => result === option.value).length}
          </li>
        ))}
      </ul>
      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 cursor-pointer rounded-lg border border-sidebar-line px-3 py-3 text-label font-semibold text-sidebar-text hover:bg-sidebar-raised focus-visible:outline-2 focus-visible:outline-brand"
        >
          Học tiếp
        </button>
        <ButtonLink to={backTo} size="sm" className="flex-1">
          {backLabel}
        </ButtonLink>
      </div>
    </div>
  )
}
