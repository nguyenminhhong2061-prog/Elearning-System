import { CEFR_LEVELS } from '../../src/api/constants.js'
import { HttpError, paginate } from '../http.js'
import { byLevel, countsFor, findWord, notHidden, toItem } from '../store.js'

// docs/api/custom-lists.md

let nextListId = 1
let nextWordId = 10_000 // learners' own words, after the fixture ids

/** A list of this user, or undefined: another user's list is "not found" too. */
export function findList(user, id) {
  return user.lists.find((list) => list.id === id)
}

function requireList(user, match) {
  const list = findList(user, Number(match[1]))
  if (!list) throw new HttpError(404, 'List not found')
  return list
}

function listWords(user, list) {
  return list.wordIds.map((id) => findWord(user, id)).filter(notHidden)
}

function toList(user, list, today) {
  return { id: list.id, name: list.name, createdAt: list.createdAt, ...countsFor(user, listWords(user, list), today) }
}

function validName(value) {
  const name = typeof value === 'string' ? value.trim() : ''
  if (!name || name.length > 150) throw new HttpError(400, 'name must be 1 to 150 characters')
  return name
}

/** One learner's lists cannot share a name, ignoring case (409, docs/api/custom-lists.md). */
function uniqueName(user, name, excludedId = null) {
  const taken = user.lists.some((list) => list.id !== excludedId && list.name.toLowerCase() === name.toLowerCase())
  if (taken) throw new HttpError(409, `A list named "${name}" already exists`)
  return name
}

/** A NewWord checked and turned into a vocabulary row owned by the user (not saved yet). */
function buildNewWord(userId, input, defaultLevel) {
  const word = typeof input?.word === 'string' ? input.word.trim() : ''
  const meaning = typeof input?.meaning === 'string' ? input.meaning.trim() : ''
  if (!word || word.length > 150 || !meaning) throw new HttpError(400, 'word and meaning are required')
  const level = input.difficultyLevel ?? defaultLevel
  if (!CEFR_LEVELS.includes(level)) throw new HttpError(400, 'difficultyLevel must be one of A1..C2')
  return {
    id: 0,
    topicId: null,
    createdBy: Number(userId),
    word,
    meaning,
    exampleSentence: input.exampleSentence?.trim() || null,
    phonetic: input.phonetic?.trim() || null,
    audioUrl: null,
    imageUrl: null,
    difficultyLevel: level,
  }
}

function saveNewWord(user, row) {
  const saved = { ...row, id: nextWordId++ }
  user.customWords.push(saved)
  return saved
}

// The mock does not know the learner's level; the real backend uses users.current_level.
const DEFAULT_LEVEL = 'A1'

export const listRoutes = [
  {
    method: 'GET',
    pattern: /^\/api\/custom-lists$/,
    handle: ({ user, today }) =>
      [...user.lists].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((list) => toList(user, list, today)),
  },
  {
    method: 'POST',
    pattern: /^\/api\/custom-lists$/,
    status: 201,
    handle: ({ user, userId, today, body }) => {
      // Everything is checked before anything is saved: creating a list is all or nothing.
      const name = uniqueName(user, validName(body.name))
      const existingIds = [...new Set(body.vocabularyIds ?? [])]
      if (existingIds.some((id) => !findWord(user, id))) throw new HttpError(400, 'vocabularyIds contains an unknown word')
      const newRows = (body.newWords ?? []).map((input) => buildNewWord(userId, input, DEFAULT_LEVEL))

      const created = newRows.map((row) => saveNewWord(user, row))
      const list = {
        id: nextListId++,
        name,
        createdAt: new Date().toISOString(),
        wordIds: [...existingIds, ...created.map((word) => word.id)],
      }
      user.lists.push(list)
      return toList(user, list, today)
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/custom-lists\/(\d+)$/,
    handle: ({ user, today, match }) => toList(user, requireList(user, match), today),
  },
  {
    method: 'PUT',
    pattern: /^\/api\/custom-lists\/(\d+)$/,
    handle: ({ user, today, match, body }) => {
      const list = requireList(user, match)
      list.name = uniqueName(user, validName(body.name), list.id)
      return toList(user, list, today)
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/custom-lists\/(\d+)$/,
    handle: ({ user, match }) => {
      const list = requireList(user, match)
      user.lists = user.lists.filter((other) => other !== list) // the learner's own words are kept
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/custom-lists\/(\d+)\/words$/,
    handle: ({ user, match, searchParams }) => {
      const list = requireList(user, match)
      const words = listWords(user, list).sort(byLevel).map((word) => toItem(user, word))
      return paginate(words, searchParams, { defaultSize: 50 })
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/custom-lists\/(\d+)\/words$/,
    status: 201,
    handle: ({ user, match, body }) => {
      const list = requireList(user, match)
      const word = findWord(user, body.vocabularyId)
      if (!word) throw new HttpError(404, 'Vocabulary not found')
      if (list.wordIds.includes(word.id)) throw new HttpError(409, 'The word is already in the list')
      list.wordIds.push(word.id)
      return toItem(user, word)
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/custom-lists\/(\d+)\/words\/new$/,
    status: 201,
    handle: ({ user, userId, match, body }) => {
      const list = requireList(user, match)
      const word = saveNewWord(user, buildNewWord(userId, body, DEFAULT_LEVEL))
      list.wordIds.push(word.id)
      return toItem(user, word)
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/custom-lists\/(\d+)\/words\/(\d+)$/,
    handle: ({ user, match }) => {
      const list = requireList(user, match)
      list.wordIds = list.wordIds.filter((id) => id !== Number(match[2]))
    },
  },
]
