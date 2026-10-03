import { describe, expect, it } from 'vitest'
import { ANONYMOUS, authReducer, LOADING } from './authReducer'

const hong = { id: 7, fullName: 'Nguyễn Minh Hồng' }
const signedIn = { status: 'authenticated', user: hong, endReason: null }

describe('authReducer', () => {
  it('signs in with the user the server confirmed', () => {
    expect(authReducer(LOADING, { type: 'signedIn', user: hong })).toEqual(signedIn)
  })

  it('remembers why a session ended, but does not overwrite the reason once signed out', () => {
    const expired = authReducer(signedIn, { type: 'signedOut', reason: 'expired' })
    expect(expired).toEqual({ status: 'anonymous', user: null, endReason: 'expired' })
    expect(authReducer(expired, { type: 'signedOut', reason: 'logout' })).toBe(expired)
  })

  it('keeps a failed check apart from being signed out, and checks again on retry', () => {
    const failed = authReducer(LOADING, { type: 'checkFailed' })
    expect(failed.status).toBe('error')
    expect(authReducer(failed, { type: 'checkStarted' })).toBe(LOADING)
  })

  it('takes a fresh profile of the signed-in user only', () => {
    const promoted = { ...hong, currentLevel: 'B1' }
    expect(authReducer(signedIn, { type: 'userUpdated', user: promoted }).user).toBe(promoted)
    expect(authReducer(signedIn, { type: 'userUpdated', user: { id: 8 } })).toBe(signedIn)
    expect(authReducer(ANONYMOUS, { type: 'userUpdated', user: hong })).toBe(ANONYMOUS)
  })

  it('ignores a token another tab refreshed for the same user, and checks any other one', () => {
    expect(authReducer(signedIn, { type: 'tokenChanged', userId: 7 })).toBe(signedIn)
    expect(authReducer(signedIn, { type: 'tokenChanged', userId: 8 })).toBe(LOADING)
    expect(authReducer(ANONYMOUS, { type: 'tokenChanged', userId: 7 })).toBe(LOADING)
  })
})
