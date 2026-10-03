import { afterEach, describe, expect, it, vi } from 'vitest'
import { tokenStorage } from './tokenStorage'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('tokenStorage', () => {
  it('has no session at first', () => {
    expect(tokenStorage.get()).toBeNull()
  })

  it('returns a saved session with its issue time, its expiry computed from expiresIn (seconds) and its user', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-25T10:00:00Z'))

    tokenStorage.save({ accessToken: 'abc', expiresIn: 1800, userId: 7 })

    expect(tokenStorage.get()).toEqual({
      accessToken: 'abc',
      issuedAt: new Date('2026-09-25T10:00:00Z').getTime(),
      expiresAt: new Date('2026-09-25T10:30:00Z').getTime(),
      userId: 7,
    })
  })

  it('treats an expired session as absent and deletes it', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-25T10:00:00Z'))
    tokenStorage.save({ accessToken: 'abc', expiresIn: 60 })

    vi.setSystemTime(new Date('2026-09-25T10:01:01Z'))

    expect(tokenStorage.get()).toBeNull()
    expect(localStorage.getItem(tokenStorage.key)).toBeNull()
  })

  it('ignores and deletes corrupt or wrongly shaped entries instead of throwing', () => {
    localStorage.setItem(tokenStorage.key, '{not json')
    expect(tokenStorage.get()).toBeNull()
    expect(localStorage.getItem(tokenStorage.key)).toBeNull()

    localStorage.setItem(tokenStorage.key, JSON.stringify({ accessToken: 123, expiresAt: 'soon' }))
    expect(tokenStorage.get()).toBeNull()
    expect(localStorage.getItem(tokenStorage.key)).toBeNull()
  })

  it('forgets the session on clear', () => {
    tokenStorage.save({ accessToken: 'abc', expiresIn: 60 })

    tokenStorage.clear()

    expect(tokenStorage.get()).toBeNull()
  })

  it('keeps the session in memory when localStorage is unavailable (e.g. blocked site data)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })

    tokenStorage.save({ accessToken: 'abc', expiresIn: 60 })
    expect(tokenStorage.get()?.accessToken).toBe('abc')

    tokenStorage.clear()
    expect(tokenStorage.get()).toBeNull()
  })
})
