/**
 * Lower-case text without Vietnamese diacritics, so that searching "du lich" finds "Du lịch".
 * NFD splits "ị" into "i" plus combining marks, which are then removed; "đ" has no decomposition and is mapped by hand.
 */
export function normalizeForSearch(text) {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

/** True when `text` contains `term`, ignoring case, diacritics and surrounding spaces. An empty term matches all. */
export function matchesSearch(text, term) {
  return normalizeForSearch(text).includes(normalizeForSearch(term))
}
