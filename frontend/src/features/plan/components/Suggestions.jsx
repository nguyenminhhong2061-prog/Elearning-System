import { ButtonLink } from '@/components/ui/Button'
import { LoadError } from '@/components/ui/LoadError'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSuggestions } from '../api/planQueries'
import { suggestionLink } from '../plan'

/** The design's "Lộ trình đề xuất" rows: what to do next, each with a "Bắt đầu" button (the first one filled). */
export function Suggestions() {
  const suggestions = useSuggestions()
  const items = (suggestions.data?.items ?? []).filter((item) => suggestionLink(item) !== null)

  return (
    <section aria-labelledby="suggestions-title" className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-white p-5 sm:p-6">
      <div>
        <h2 id="suggestions-title" className="text-lg font-semibold text-ink">
          Việc nên làm
        </h2>
        <p className="text-label text-muted">Gợi ý theo điểm kỹ năng và những gì bạn đang học.</p>
      </div>
      {suggestions.isPending && (
        <div aria-busy="true" aria-label="Đang tải gợi ý" className="flex flex-col gap-2.5">
          <Skeleton className="h-16 w-full rounded-[10px]" />
          <Skeleton className="h-16 w-full rounded-[10px]" />
        </div>
      )}
      {suggestions.isError && (
        <LoadError error={suggestions.error} onRetry={() => suggestions.refetch()} message="Không tải được gợi ý." />
      )}
      {suggestions.isSuccess && items.length === 0 && (
        <p className="text-label text-ink-soft">Bạn đang theo kịp mọi thứ. Hãy tiếp tục kế hoạch tuần này.</p>
      )}
      {items.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {items.map((item, index) => (
            <li
              key={`${item.type}-${index}`}
              className="flex items-center justify-between gap-4 rounded-[10px] border border-line px-4 py-3.5"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold text-ink">{item.title}</span>
                <span className="text-xs text-muted">{item.reason}</span>
              </div>
              <ButtonLink
                to={suggestionLink(item)}
                size="sm"
                variant={index === 0 ? 'primary' : 'outline'}
                aria-label={`Bắt đầu: ${item.title}`}
                className="flex-none"
              >
                Bắt đầu
              </ButtonLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
