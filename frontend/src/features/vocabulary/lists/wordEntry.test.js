import { describe, expect, it } from 'vitest'
import { parseWordEntry } from './wordEntry'

describe('parseWordEntry', () => {
  it.each([
    ['negotiate — thương lượng', 'negotiate', 'thương lượng'],
    ['negotiate–thương lượng', 'negotiate', 'thương lượng'],
    ['negotiate - thương lượng', 'negotiate', 'thương lượng'],
    ['jet lag: mệt mỏi do lệch múi giờ', 'jet lag', 'mệt mỏi do lệch múi giờ'],
    ['  check-in — làm thủ tục  ', 'check-in', 'làm thủ tục'],
    ['follow up — theo dõi, nhắc lại', 'follow up', 'theo dõi, nhắc lại'],
  ])('reads %j', (text, word, meaning) => {
    expect(parseWordEntry(text)).toEqual({ word, meaning })
  })

  it.each([
    ['', 'nothing typed'],
    ['negotiate', 'no meaning'],
    ['check-in', 'a hyphen inside a word'],
    ['— thương lượng', 'no word'],
    ['negotiate —   ', 'an empty meaning'],
    [`${'a'.repeat(151)} — quá dài`, 'a word over 150 characters'],
  ])('rejects %j (%s)', (text) => {
    expect(parseWordEntry(text)).toBeNull()
  })
})
