function nameWords(fullName) {
  return (fullName ?? '').trim().split(/\s+/).filter(Boolean)
}

/** Vietnamese names put the given name last: "Nguyễn Minh Hồng" is greeted as "Hồng". */
export function getGivenName(fullName) {
  const words = nameWords(fullName)
  return words.length > 0 ? words[words.length - 1] : ''
}

/**
 * Up to two capital letters for an avatar: first and last word ("Nguyễn Minh Hồng" -> "NH"). Array.from keeps
 * accented and multi-unit characters whole.
 */
export function getInitials(fullName) {
  const words = nameWords(fullName)
  if (words.length === 0) return '?'

  const firstLetter = (word) => Array.from(word)[0].toLocaleUpperCase('vi')
  if (words.length === 1) return firstLetter(words[0])
  return firstLetter(words[0]) + firstLetter(words[words.length - 1])
}
