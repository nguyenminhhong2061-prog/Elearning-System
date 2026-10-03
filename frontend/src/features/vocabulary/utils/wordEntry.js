// Quick entry of a word in the design's "Thêm từ" box: "negotiate — thương lượng".

// Em dash, en dash, a colon, or a hyphen with spaces around it. A hyphen inside a word ("check-in") is not a separator.
const SEPARATOR = /\s*(?:—|–|:|\s-\s)\s*/
const MAX_WORD = 150

/**
 * @param {string} text
 * @returns {{ word: string, meaning: string } | null} null when the text is not "word — meaning"
 */
export function parseWordEntry(text) {
  const trimmed = (text ?? '').trim()
  const match = SEPARATOR.exec(trimmed)
  if (!match || match.index === 0) return null

  const word = trimmed.slice(0, match.index).trim()
  const meaning = trimmed.slice(match.index + match[0].length).trim()
  if (!word || !meaning || word.length > MAX_WORD) return null
  return { word, meaning }
}
