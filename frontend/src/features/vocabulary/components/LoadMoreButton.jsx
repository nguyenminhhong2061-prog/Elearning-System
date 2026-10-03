import { Button } from '@/components/ui/Button'

/**
 * "Xem thêm" under a list the server sends page by page (useInfiniteQuery). Hidden once the last page is loaded.
 *
 * @param {object} props
 * @param {import('@tanstack/react-query').UseInfiniteQueryResult} props.query
 * @param {string} props.label for example "Xem thêm từ (còn 6)"
 */
export function LoadMoreButton({ query, label }) {
  if (!query.hasNextPage) return null

  return (
    <Button
      variant="outline"
      className="sm:min-w-60 sm:self-center"
      loading={query.isFetchingNextPage}
      onClick={() => query.fetchNextPage()}
    >
      {query.isFetchingNextPage ? 'Đang tải…' : label}
    </Button>
  )
}
