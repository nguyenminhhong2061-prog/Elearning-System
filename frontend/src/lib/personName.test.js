import { describe, expect, it } from 'vitest'
import { getGivenName, getInitials } from './personName'

describe('getGivenName', () => {
  it('uses the last word, as Vietnamese given names come last', () => {
    expect(getGivenName('Nguyễn Minh Hồng')).toBe('Hồng')
  })

  it('handles single names, extra whitespace and missing names', () => {
    expect(getGivenName('  An  ')).toBe('An')
    expect(getGivenName('Lý   Quang  Đạt')).toBe('Đạt')
    expect(getGivenName('')).toBe('')
    expect(getGivenName(undefined)).toBe('')
  })
})

describe('getInitials', () => {
  it('uses the first and last word', () => {
    expect(getInitials('Nguyễn Minh Hồng')).toBe('NH')
    expect(getInitials('Khuất Huy Nhân')).toBe('KN')
  })

  it('keeps accented letters whole and upper-cases them', () => {
    expect(getInitials('đặng văn lâm')).toBe('ĐL')
  })

  it('handles single names and missing names', () => {
    expect(getInitials('An')).toBe('A')
    expect(getInitials('   ')).toBe('?')
    expect(getInitials(undefined)).toBe('?')
  })
})
