import { describe, expect, it } from 'vitest'
import { safeRedirectPath } from './redirect'

describe('safeRedirectPath', () => {
  it.each([
    ['/account/change-password', '/account/change-password'],
    ['/vocabulary/topics?level=B1#top', '/vocabulary/topics?level=B1#top'],
    ['/', '/'],
  ])('keeps the in-app path %s', (candidate, expected) => {
    expect(safeRedirectPath(candidate)).toBe(expected)
  })

  it.each([
    ['nothing', undefined],
    ['null', null],
    ['an object', { path: '/x' }],
    ['a relative path', 'vocabulary'],
    ['a full URL', 'https://evil.example/phish'],
    ['a protocol-relative URL', '//evil.example'],
    ['a backslash trick', '/\\evil.example'],
    ['a tab hidden inside', '/\t/evil.example'],
    ['a newline', '/a\nb'],
    ['a space', '/a b'],
  ])('falls back to home for %s', (_label, candidate) => {
    expect(safeRedirectPath(candidate)).toBe('/')
  })

  it.each(['/login', '/register', '/login?x=1', '/register#form', '/login/'])(
    'does not send the user back to %s (it would loop)',
    (candidate) => {
      expect(safeRedirectPath(candidate)).toBe('/')
    },
  )

  it('still accepts paths that merely start with the same letters', () => {
    expect(safeRedirectPath('/loginhelp')).toBe('/loginhelp')
    expect(safeRedirectPath('/register-interest')).toBe('/register-interest')
  })
})
