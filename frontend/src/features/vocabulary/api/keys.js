// Cache keys of module A. Kept in one file because mutations of one area refresh the others: a review changes the
// learned counts of topics and personal lists; a new personal word shows up in word searches.

/** Keys are nested so that invalidating a root (for example `vocabularyKeys.all`) refreshes everything below it. */
export const vocabularyKeys = {
  all: ['vocabulary'],
  topics: () => [...vocabularyKeys.all, 'topics'],
  topic: (id) => [...vocabularyKeys.topics(), id],
  topicWords: (topicId) => [...vocabularyKeys.all, 'words', { topicId }],
  search: (term) => [...vocabularyKeys.all, 'search', term],
}

export const learningKeys = {
  all: ['learning'],
  summary: () => [...learningKeys.all, 'summary'],
  /** @param {{ status?: string, reviewedToday?: boolean }} [filter] */
  history: (filter = {}) => [...learningKeys.all, 'history', filter],
}

export const listKeys = {
  all: ['custom-lists'],
  detail: (id) => [...listKeys.all, id],
  words: (id) => [...listKeys.detail(id), 'words'],
}
