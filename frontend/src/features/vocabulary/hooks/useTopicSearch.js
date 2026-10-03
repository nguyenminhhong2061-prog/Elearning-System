import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { SEARCH_DELAY_MS } from '../constants'

/**
 * The search box of the topics tab. What is typed shows at once (`query`); the search itself (`debouncedTerm`) follows
 * once typing pauses, and is kept in the URL (?q=) so that coming back from a topic brings it back.
 *
 * @returns {{ query: string, setQuery: (value: string) => void, term: string, debouncedTerm: string }}
 *   `term` is `query` without surrounding spaces
 */
export function useTopicSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTerm = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(urlTerm)
  const term = query.trim()
  const debouncedTerm = useDebouncedValue(term, SEARCH_DELAY_MS)

  // Write the search into the URL. `replace` keeps typing from filling the browser history.
  useEffect(() => {
    if (debouncedTerm === urlTerm) return
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (debouncedTerm) next.set('q', debouncedTerm)
        else next.delete('q')
        return next
      },
      { replace: true },
    )
  }, [debouncedTerm, urlTerm, setSearchParams])

  return { query, setQuery, term, debouncedTerm }
}
