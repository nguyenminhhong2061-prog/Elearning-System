import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'

/**
 * Filters of an admin list kept in the query string, so a reload, the back button or a shared link shows the same
 * list. Values equal to their default are left out of the URL. Changing any filter other than `page` goes back to the
 * first page.
 *
 * @template {Record<string, string>} T
 * @param {T} initialDefaults read once, on the first render
 * @returns {[T, (changes: Partial<T>) => void]}
 */
export function useUrlFilters(initialDefaults) {
  const [defaults] = useState(initialDefaults)
  const [searchParams, setSearchParams] = useSearchParams()
  const serialized = searchParams.toString()
  // react-router computes a functional update from the params of the last render, so two changes made before the
  // page re-renders (two filters picked in quick succession) would lose the first. Build on the latest one instead.
  const latest = useRef(searchParams)
  useEffect(() => {
    latest.current = searchParams
  }, [searchParams])

  const filters = useMemo(() => {
    const params = new URLSearchParams(serialized)
    return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, params.get(key) ?? fallback]))
  }, [serialized, defaults])

  const update = useCallback(
    (changes) => {
      const next = new URLSearchParams(latest.current)
      if (Object.keys(changes).some((key) => key !== 'page')) next.delete('page')
      for (const [key, value] of Object.entries(changes)) {
        if (value === undefined || value === null || value === '' || value === defaults[key]) next.delete(key)
        else next.set(key, String(value))
      }
      latest.current = next
      setSearchParams(next, { replace: true })
    },
    [setSearchParams, defaults],
  )

  return [filters, update]
}

/**
 * Goes back to the last page that still has rows when the current one empties (its last row was deleted, or a
 * shared link points past the end).
 *
 * @param {{ items: unknown[], page: number, totalPages: number } | undefined} data
 * @param {(changes: { page: string }) => void} setFilters
 */
export function useClampPage(data, setFilters) {
  const pastEnd = data !== undefined && data.items.length === 0 && data.page > 0
  const lastPage = data ? Math.max(0, data.totalPages - 1) : 0
  useEffect(() => {
    if (pastEnd) setFilters({ page: String(lastPage) })
  }, [pastEnd, lastPage, setFilters])
}
