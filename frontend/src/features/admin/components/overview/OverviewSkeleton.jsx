import { Skeleton } from '@/components/ui/Skeleton'

/** Grey blocks in the place of the cards and the two charts while the numbers load. */
export function OverviewSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-fade-in-late flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  )
}
