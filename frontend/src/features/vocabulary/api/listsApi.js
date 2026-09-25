import { httpClient } from '@/api/httpClient'

// Calls of the personal-list API (A3). The contract is in docs/api/custom-lists.md.

const base = (id) => `/api/custom-lists/${id}`

/** @returns {Promise<import('../types').CustomList[]>} */
export async function getCustomLists() {
  const { data } = await httpClient.get('/api/custom-lists')
  return data
}

export async function getCustomList(id) {
  const { data } = await httpClient.get(base(id))
  return data
}

/**
 * Creates a list with its first words in one go.
 * @param {{ name: string, vocabularyIds: number[], newWords: import('../types').NewWord[] }} payload
 */
export async function createCustomList(payload) {
  const { data } = await httpClient.post('/api/custom-lists', payload)
  return data
}

export async function renameCustomList(id, name) {
  const { data } = await httpClient.put(base(id), { name })
  return data
}

export async function deleteCustomList(id) {
  await httpClient.delete(base(id))
}

export async function getListWords(id, { page = 0, size = 50 } = {}) {
  const { data } = await httpClient.get(`${base(id)}/words`, { params: { page, size } })
  return data
}

/** Adds a word from the shared vocabulary. Rejects with 409 when it is already in the list. */
export async function addWordToList(id, vocabularyId) {
  const { data } = await httpClient.post(`${base(id)}/words`, { vocabularyId })
  return data
}

/** Creates the learner's own word and adds it to the list. @param {import('../types').NewWord} newWord */
export async function addNewWordToList(id, newWord) {
  const { data } = await httpClient.post(`${base(id)}/words/new`, newWord)
  return data
}

export async function removeWordFromList(id, vocabularyId) {
  await httpClient.delete(`${base(id)}/words/${vocabularyId}`)
}
