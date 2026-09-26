import { describe, expect, it } from 'vitest'
import { parseBlocks, parseInline } from './markdownParser'

describe('parseBlocks', () => {
  it('splits paragraphs on blank lines and keeps line breaks inside a paragraph', () => {
    expect(parseBlocks('First line\nsecond line\n\nNew paragraph')).toEqual([
      { type: 'paragraph', lines: ['First line', 'second line'] },
      { type: 'paragraph', lines: ['New paragraph'] },
    ])
  })

  it('groups bullet and numbered items into lists, even right after a paragraph line', () => {
    expect(parseBlocks('Dấu hiệu:\n- for\n* since\n1. Nghe\n2) Đọc')).toEqual([
      { type: 'paragraph', lines: ['Dấu hiệu:'] },
      { type: 'bullets', items: ['for', 'since'] },
      { type: 'numbers', items: ['Nghe', 'Đọc'] },
    ])
  })

  it('accepts Windows line endings', () => {
    expect(parseBlocks('a\r\n\r\nb')).toHaveLength(2)
  })
})

describe('parseInline', () => {
  it('finds bold, italic and code', () => {
    expect(parseInline('Dùng **has lived**, *for* và `since`.')).toEqual([
      { type: 'text', text: 'Dùng ' },
      { type: 'strong', text: 'has lived' },
      { type: 'text', text: ', ' },
      { type: 'em', text: 'for' },
      { type: 'text', text: ' và ' },
      { type: 'code', text: 'since' },
      { type: 'text', text: '.' },
    ])
  })

  it('leaves lone stars, arithmetic and HTML as plain text', () => {
    expect(parseInline('5 * 3 * 2')).toEqual([{ type: 'text', text: '5 * 3 * 2' }])
    expect(parseInline('<b>hi</b>')).toEqual([{ type: 'text', text: '<b>hi</b>' }])
  })

  it('keeps stars inside code literal', () => {
    expect(parseInline('`**x**`')).toEqual([{ type: 'code', text: '**x**' }])
  })
})
