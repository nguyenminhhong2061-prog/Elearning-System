// The small Markdown subset of the assistant's answers (docs/api/chatbot.md): paragraphs, "-" and "1." lists,
// **bold**, *italic* and `code`. Parsed into plain data here and rendered as React elements by ChatMarkdown, so no
// HTML from an answer is ever inserted into the page: a "<script>" in an answer shows as text.

const BULLET = /^\s*[-*•]\s+(.*)$/
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/

/**
 * @param {string} text
 * @returns {Array<{ type: 'paragraph', lines: string[] } | { type: 'bullets' | 'numbers', items: string[] }>}
 */
export function parseBlocks(text) {
  const blocks = []
  let current = null

  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    const bullet = BULLET.exec(line)
    const numbered = bullet ? null : NUMBERED.exec(line)
    if (line.trim() === '') {
      current = null
    } else if (bullet || numbered) {
      const type = bullet ? 'bullets' : 'numbers'
      if (current?.type !== type) {
        current = { type, items: [] }
        blocks.push(current)
      }
      current.items.push((bullet ?? numbered)[1])
    } else {
      if (current?.type !== 'paragraph') {
        current = { type: 'paragraph', lines: [] }
        blocks.push(current)
      }
      current.lines.push(line.trim())
    }
  }
  return blocks
}

// `code` first, so asterisks inside code stay literal; *italic* needs a non-space right after the opening star
// ("5 * 3 * 2" is not italic).
const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/

/**
 * @param {string} text one line or list item
 * @returns {Array<{ type: 'text' | 'strong' | 'em' | 'code', text: string }>}
 */
export function parseInline(text) {
  return text
    .split(INLINE)
    .filter(Boolean)
    .map((part) => {
      if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) return { type: 'code', text: part.slice(1, -1) }
      if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) return { type: 'strong', text: part.slice(2, -2) }
      if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) return { type: 'em', text: part.slice(1, -1) }
      return { type: 'text', text: part }
    })
}
