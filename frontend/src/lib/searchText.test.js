import { describe, expect, it } from 'vitest'
import { matchesSearch, normalizeForSearch } from './searchText'

describe('normalizeForSearch', () => {
  it('removes Vietnamese diacritics, including đ, and lower-cases', () => {
    expect(normalizeForSearch('Du lịch')).toBe('du lich')
    expect(normalizeForSearch('Đời sống ĐÔ THỊ')).toBe('doi song do thi')
    expect(normalizeForSearch('  Y tế ')).toBe('y te')
  })

  it('treats missing text as empty', () => {
    expect(normalizeForSearch(undefined)).toBe('')
  })
})

describe('matchesSearch', () => {
  it('matches part of the text whether or not the user types accents', () => {
    expect(matchesSearch('Du lịch', 'du lich')).toBe(true)
    expect(matchesSearch('Du lịch', 'Lịch')).toBe(true)
    expect(matchesSearch('Kinh doanh', 'doanh')).toBe(true)
    expect(matchesSearch('Kinh doanh', 'y tế')).toBe(false)
  })

  it('matches everything for an empty term', () => {
    expect(matchesSearch('Y tế', '   ')).toBe(true)
  })
})
