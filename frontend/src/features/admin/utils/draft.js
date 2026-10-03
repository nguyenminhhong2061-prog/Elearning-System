// Helpers of the lesson and test editors. A draft is the API object plus a `key` on every list entry (questions,
// options, reading passages, test materials, segments, pronunciation items), so React keeps each row's inputs while rows are added, moved or removed.

let counter = 0
export const newKey = () => `new-${(counter += 1)}`

const keyed = (entry) => ({ ...entry, key: entry.id ? `id-${entry.id}` : newKey() })

/** Adds keys to a lesson or test from the API. */
export function toDraft(source) {
  const questions = (source.questions ?? []).map((question) => ({ ...keyed(question), options: (question.options ?? []).map(keyed) }))
  return {
    ...source,
    questions,
    ...(source.passage !== undefined && { passage: source.passage && { ...source.passage, segments: source.passage.segments.map(keyed) } }),
    ...(source.pronunciationItems !== undefined && { pronunciationItems: source.pronunciationItems.map(keyed) }),
    ...(source.readingPassages !== undefined && { readingPassages: source.readingPassages.map(keyed) }),
    ...(source.materials !== undefined && { materials: source.materials.map(keyed) }),
  }
}

/** Removes the keys (and the entries' empty ids) before sending a draft. */
export function stripKeys(value) {
  if (Array.isArray(value)) return value.map(stripKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([name, entry]) => name !== 'key' && !(name === 'id' && entry === undefined))
        .map(([name, entry]) => [name, stripKeys(entry)]),
    )
  }
  return value
}

/** Moves the entry at `index` one place up (-1) or down (+1). */
export function move(list, index, direction) {
  const target = index + direction
  if (target < 0 || target >= list.length) return list
  const copy = [...list]
  ;[copy[index], copy[target]] = [copy[target], copy[index]]
  return copy
}

export const replaceAt = (list, index, entry) => list.map((current, position) => (position === index ? entry : current))
export const removeAt = (list, index) => list.filter((_, position) => position !== index)

/** 8500 -> "0:08.5". */
export function formatClockMs(ms) {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return ''
  const tenths = Math.round(ms / 100)
  const minutes = Math.floor(tenths / 600)
  const seconds = (tenths % 600) / 10
  return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`
}

/** "0:08.5", "8.5" or "1:02" -> milliseconds, or null when it cannot be read. */
export function parseClockMs(text) {
  const match = /^\s*(?:(\d+):)?(\d{1,2}(?:[.,]\d)?)\s*$/.exec(text ?? '')
  if (!match) return null
  const minutes = Number(match[1] ?? 0)
  const seconds = Number(match[2].replace(',', '.'))
  if (match[1] !== undefined && seconds >= 60) return null
  return Math.round((minutes * 60 + seconds) * 1000)
}

/** Same content, ignoring keys: whether the draft differs from what was loaded. */
export const sameContent = (a, b) => JSON.stringify(stripKeys(a)) === JSON.stringify(stripKeys(b))

export const blankOption = () => ({ key: newKey(), text: '', correct: false })

/** Short answer line of a collapsed question: ["Đáp án đúng", "goes"] or ["Đáp án chấp nhận", "seen, see"]. */
export function answerSummary(question) {
  const correct = question.options.find((option) => option.correct)
  if (question.options.length > 0) return ['Đáp án đúng', correct?.text || 'chưa chọn']
  const accepted = question.acceptedAnswers.filter((answer) => answer.trim())
  if (accepted.length > 0) return ['Đáp án chấp nhận', accepted.join(', ')]
  return null
}

/**
 * Problems of one question's answers (shared by lessons and tests), as { options?, acceptedAnswers? } messages.
 * @param {{ options: { text: string, correct: boolean }[], acceptedAnswers: string[] }} question
 * @param {'CHOICE' | 'TEXT' | 'AI'} mode
 */
export function answerErrors(question, mode) {
  const errors = {}
  if (mode === 'CHOICE') {
    if (question.options.length < 2) errors.options = 'Cần ít nhất 2 lựa chọn.'
    else if (question.options.some((option) => !option.text.trim())) errors.options = 'Điền nội dung cho mọi lựa chọn, hoặc bỏ lựa chọn trống.'
    else if (question.options.filter((option) => option.correct).length !== 1) errors.options = 'Chọn đúng 1 đáp án đúng.'
  }
  if (mode === 'TEXT' && !question.acceptedAnswers.some((answer) => answer.trim())) errors.acceptedAnswers = 'Nhập ít nhất 1 đáp án chấp nhận.'
  return errors
}
