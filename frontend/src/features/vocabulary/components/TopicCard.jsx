import { Link } from 'react-router'
import { Skeleton } from '@/components/ui/Skeleton'
import { describeTopicProgress } from '../topicProgress'

// Diagonal teal stripes of the design, shown when a topic has no image.
const PLACEHOLDER =
  'bg-[repeating-linear-gradient(135deg,var(--color-brand-soft)_0_10px,var(--color-brand-stripe)_10px_20px)]'

/**
 * @param {object} props
 * @param {import('../types').Topic} props.topic
 * @param {string} [props.backTo] where the topic page's back link should return (keeps the current search)
 */
export function TopicCard({ topic, backTo }) {
  return (
    <Link
      to={`/vocabulary/topics/${topic.id}`}
      state={backTo ? { backTo } : undefined}
      className="flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {topic.imageUrl ? (
        <img src={topic.imageUrl} alt="" className="h-22 w-full object-cover" />
      ) : (
        <div aria-hidden="true" className={`flex h-22 items-center justify-center ${PLACEHOLDER}`}>
          <span className="text-2xl font-bold text-brand-dark/50">{Array.from(topic.name)[0]}</span>
        </div>
      )}
      <div className="flex flex-col gap-1.5 p-4">
        <span className="text-base font-semibold text-ink">{topic.name}</span>
        <span className="text-xs text-muted">{describeTopicProgress(topic)}</span>
      </div>
    </Link>
  )
}

export function TopicCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <Skeleton className="h-22 rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  )
}

/** The design's dashed "Tạo danh sách riêng" card at the end of the topic grid (A3). */
export function CreateListCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-37.5 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line bg-surface-alt transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span aria-hidden="true" className="flex size-7.5 items-center justify-center rounded-full bg-brand-tint text-[17px] font-semibold text-brand-dark">
        +
      </span>
      <span className="text-label font-semibold text-brand-dark">Tạo danh sách riêng</span>
    </button>
  )
}

/** Card grid of the design: as many 220px+ columns as fit. */
export function TopicGrid({ children }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">{children}</div>
}
