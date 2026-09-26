import { describe, expect, it, vi } from 'vitest'
import { reloadAfterLoadFailure } from './lazyPage'

function memoryStorage() {
  const data = new Map()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)) }
}

describe('reloadAfterLoadFailure', () => {
  it('reloads once, then gives up while the failures keep coming right after the reload', () => {
    const storage = memoryStorage()
    const reload = vi.fn()
    const start = Date.UTC(2026, 8, 27, 3, 0, 0)

    expect(reloadAfterLoadFailure({ storage, reload, now: start })).toBe(true)
    expect(reloadAfterLoadFailure({ storage, reload, now: start + 9_000 })).toBe(false)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('reloads again for a failure long after the previous reload (a later deploy)', () => {
    const storage = memoryStorage()
    const reload = vi.fn()
    const start = Date.UTC(2026, 8, 27, 3, 0, 0)

    reloadAfterLoadFailure({ storage, reload, now: start })
    expect(reloadAfterLoadFailure({ storage, reload, now: start + 60_000 })).toBe(true)
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it('never reloads when it cannot remember the previous reload, to avoid a reload loop', () => {
    const reload = vi.fn()
    const blocked = {
      getItem: () => {
        throw new DOMException('Access denied', 'SecurityError')
      },
      setItem: () => {},
    }

    expect(reloadAfterLoadFailure({ storage: null, reload })).toBe(false)
    expect(reloadAfterLoadFailure({ storage: blocked, reload })).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })
})
