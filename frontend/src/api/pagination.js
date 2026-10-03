// Helpers for lists the server sends one page at a time (PageResponse: items, page, size, totalItems, totalPages),
// loaded with TanStack Query's useInfiniteQuery and a "Xem thêm" button.

/** getNextPageParam of useInfiniteQuery: the next page number, or undefined after the last page. */
export function nextPageParam(lastPage) {
  return lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined
}

/** Every item loaded so far, in order; empty while nothing is loaded. */
export function loadedItems(data) {
  return data?.pages.flatMap((page) => page.items) ?? []
}

/** How many items the whole list has on the server (every page carries the same count). */
export function totalItems(data) {
  return data.pages[0].totalItems
}
