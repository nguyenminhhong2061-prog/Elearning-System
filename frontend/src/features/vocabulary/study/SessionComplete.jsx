import { ButtonLink } from '@/components/ui/Button'
import { formatDate } from '@/lib/dates'
import { useLearningSummary } from '../api/learningQueries'
import { formatCount } from '../topicProgress'
import { REVIEW_OPTIONS } from '../constants'

const DOT = { FORGOT: 'bg-review-forgot', VAGUE: 'bg-review-vague', REMEMBERED: 'bg-review-remembered' }

/** "Cần ôn vào ngày mai (07/10/2026): 5 từ", from the review schedule once the session's ratings are saved. */
function DueTomorrow() {
  const summary = useLearningSummary()
  const tomorrow = summary.data?.upcoming?.[0]
  if (!tomorrow) return null
  return (
    <p className="text-label text-muted-light">
      Cần ôn vào ngày mai ({formatDate(tomorrow.date)}): {formatCount(tomorrow.count)} từ
    </p>
  )
}

/**
 * The design's dark summary card (scenarios 5 and 6): the cards studied, how they were rated and what is due
 * tomorrow. The design's "streak" belongs to the progress module, so it is not repeated here.
 *
 * @param {object} props
 * @param {string} props.title "Hoàn thành phiên học · Du lịch" or "Hoàn thành phiên ôn tập"
 */
export function SessionComplete({ title, results, backTo, backLabel, onContinue }) {
  return (
    <div className="mx-auto flex w-full max-w-120 animate-screen-in flex-col items-center gap-4 rounded-2xl bg-sidebar-deep p-10 text-center">
      <div className="flex size-25 items-center justify-center rounded-full border-6 border-brand text-title font-bold text-white">
        {results.length}
      </div>
      <h2 className="text-[22px] leading-7 font-bold text-white">{title}</h2>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-label text-sidebar-text">
        {REVIEW_OPTIONS.map((option) => (
          <li key={option.value} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-2 rounded-full ${DOT[option.value]}`} />
            {option.label}: {results.filter((result) => result === option.value).length}
          </li>
        ))}
      </ul>
      <DueTomorrow />
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
