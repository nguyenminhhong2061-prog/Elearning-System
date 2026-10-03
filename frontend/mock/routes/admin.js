import { CEFR_LEVELS } from '../../src/api/constants.js'
import { addDays } from '../../src/lib/dates.js'
import { buildLearners, buildTests, learnerDetail } from '../adminFixtures.js'
import { MOCK_LESSONS } from '../exerciseFixtures.js'
import { HttpError, paginate } from '../http.js'
import { listeningAudioUrl } from '../media.js'
import { allUsers, byLevel, SYSTEM_WORDS, topics } from '../store.js'

// docs/api/admin.md (module E). Only admin tokens get through (403 otherwise), like the real API will.
//
// Topics and words are the ones the learner mock serves (store.js), so an edit here shows up on the learner screens. Lessons, tests and learners are the admin area's own sample data (adminFixtures.js): editing a
// lesson here does not change what the learner mock serves.

const SKILL_ORDER = ['LISTENING', 'SPEAKING', 'READING', 'WRITING']
const MAX_URL = 500

let state = null
const uploads = new Map() // path -> { type, data }

/** Admin sample data, built on first use (dates relative to that day). */
function admin(today) {
  if (!state) {
    state = {
      learners: buildLearners(today),
      tests: buildTests(today),
      lessons: MOCK_LESSONS.map(toAdminLesson),
      nextId: 50_000,
    }
  }
  return state
}

const ORIGINAL_WORDS = SYSTEM_WORDS.map((word) => ({ ...word }))
const ORIGINAL_TOPICS = topics.map((topic) => ({ ...topic }))

/** The /__mock page's reset: admin data and every vocabulary edit go back to the start. */
export function resetAdminData() {
  state = null
  uploads.clear()
  SYSTEM_WORDS.splice(0, SYSTEM_WORDS.length, ...ORIGINAL_WORDS.map((word) => ({ ...word })))
  topics.splice(0, topics.length, ...ORIGINAL_TOPICS.map((topic) => ({ ...topic })))
}

const nowIso = () => new Date().toISOString()
const clean = (value) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null)
const same = (a, b) => a.trim().toLocaleLowerCase('vi') === b.trim().toLocaleLowerCase('vi')

function requireAdmin(role) {
  if (role !== 'ADMIN') throw new HttpError(403, 'Admin role required')
}

// --- Words and topics ------------------------------------------------------------------------------------------------

/** How many learners study a word and how many personal lists hold it: sample numbers plus the mock's real learners. */
function usageOf(word) {
  let learners = 0
  let lists = 0
  if (word.id < 10_000) {
    // passport and luggage as in scenarios 19 and 21; one word in seven has never been studied.
    const fixed = { passport: [12, 3], luggage: [14, 2] }[word.word]
    if (fixed) [learners, lists] = fixed
    else if (word.id % 7 !== 0 && word.topicId <= 4) [learners, lists] = [3 + ((word.id * 37) % 40), (word.id * 11) % 4]
  }
  for (const user of allUsers().values()) {
    if (user.learning.has(word.id)) learners += 1
    lists += user.lists.filter((list) => list.wordIds.includes(word.id)).length
  }
  return { learnerCount: learners, listCount: lists }
}

const liveWords = () => SYSTEM_WORDS.filter((word) => word.status !== 'HIDDEN')

/** Test questions made from a word (scenario 21): how many, and the open tests among theirs. */
function questionsOf(s, wordId, today) {
  let questionCount = 0
  const openTests = []
  for (const test of s.tests) {
    const count = test.questions.filter((question) => question.vocabularyId === wordId).length
    questionCount += count
    if (count > 0 && testStatus(test, today) === 'OPEN') openTests.push({ id: test.id, title: test.title })
  }
  return { questionCount, openTests }
}

function toAdminWord(word, s, today) {
  const { status: _status, createdBy: _createdBy, ...fields } = word
  return { ...fields, updatedAt: word.updatedAt ?? '2026-09-25T03:00:00Z', ...usageOf(word), ...questionsOf(s, word.id, today) }
}

function toAdminTopic(topic) {
  const words = liveWords().filter((word) => word.topicId === topic.id)
  const levels = words.map((word) => CEFR_LEVELS.indexOf(word.difficultyLevel))
  const learnerCount = words.length === 0 ? 0 : Math.max(...words.map((word) => usageOf(word).learnerCount), 0) * 2 + (topic.id % 5) * 3
  return {
    ...topic,
    wordCount: words.length,
    minLevel: words.length ? CEFR_LEVELS[Math.min(...levels)] : null,
    maxLevel: words.length ? CEFR_LEVELS[Math.max(...levels)] : null,
    missingAudioCount: words.filter((word) => !word.audioUrl).length,
    missingExampleCount: words.filter((word) => !word.exampleSentence).length,
    learnerCount: Math.min(learnerCount, 128),
    updatedAt: topic.updatedAt ?? '2026-09-25T03:00:00Z',
  }
}

function readTopic(body, exceptId) {
  const name = clean(body.name)
  if (!name || name.length > 150) throw new HttpError(400, 'name must be 1-150 characters')
  const imageUrl = clean(body.imageUrl)
  if (imageUrl && imageUrl.length > MAX_URL) throw new HttpError(400, 'imageUrl is too long')
  if (topics.some((topic) => topic.id !== exceptId && same(topic.name, name))) throw new HttpError(409, 'A topic with this name already exists')
  return { name, description: clean(body.description), imageUrl }
}

function requireTopic(id) {
  const topic = topics.find((candidate) => candidate.id === id)
  if (!topic) throw new HttpError(404, 'Topic not found')
  return topic
}

function readWord(body, exceptId) {
  const word = clean(body.word)
  const meaning = clean(body.meaning)
  if (!word || !meaning) throw new HttpError(400, 'word and meaning are required')
  if (!CEFR_LEVELS.includes(body.difficultyLevel)) throw new HttpError(400, 'difficultyLevel must be one of A1..C2')
  const topicId = body.topicId ?? null
  if (topicId !== null) requireTopic(topicId)
  for (const key of ['audioUrl', 'imageUrl']) {
    if ((clean(body[key]) ?? '').length > MAX_URL) throw new HttpError(400, `${key} is too long`)
  }
  const duplicate = liveWords().find((other) => other.id !== exceptId && other.topicId === topicId && same(other.word, word))
  if (duplicate) throw new HttpError(409, `The topic already has the word "${duplicate.word}" (id ${duplicate.id})`)
  return {
    topicId,
    word,
    phonetic: clean(body.phonetic),
    meaning,
    exampleSentence: clean(body.exampleSentence),
    audioUrl: clean(body.audioUrl),
    imageUrl: clean(body.imageUrl),
    difficultyLevel: body.difficultyLevel,
  }
}

function requireWord(id) {
  const word = SYSTEM_WORDS.find((candidate) => candidate.id === id && candidate.status !== 'HIDDEN')
  if (!word) throw new HttpError(404, 'Vocabulary not found')
  return word
}

const MISSING = {
  AUDIO: (word) => !word.audioUrl,
  EXAMPLE: (word) => !word.exampleSentence,
  IMAGE: (word) => !word.imageUrl,
}

// --- Lessons ---------------------------------------------------------------------------------------------------------

function toAdminLesson(lesson) {
  const passage = lesson.passage && {
    // "Hội thoại tại sân bay" has no audio file, as in the real seed (scenario 23).
    audioUrl: lesson.id === 11 ? null : listeningAudioUrl(lesson.id),
    durationMs: lesson.passage.durationMs,
    transcript: lesson.passage.segments.map((segment) => segment.transcript).join(' '),
    translation: lesson.passage.segments.map((segment) => segment.translation).join(' '),
    segments: lesson.passage.segments.map(({ id, startMs, endMs, speaker, transcript, translation }) => ({
      id,
      startMs,
      endMs,
      speaker,
      text: transcript,
      translation,
    })),
  }
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    topic: lesson.topic,
    skill: lesson.skill,
    cefrLevel: lesson.cefrLevel,
    difficulty: lesson.difficulty,
    estimatedMinutes: lesson.estimatedMinutes,
    status: lesson.id === 99 ? 'DRAFT' : 'PUBLISHED',
    attempts: lesson.id === 99 ? 0 : { 1: 168, 11: 112, 24: 76 }[lesson.id] ?? 12 + ((lesson.id * 29) % 90),
    updatedAt: `2026-09-${String(20 + (lesson.id % 8)).padStart(2, '0')}T0${lesson.id % 10}:15:00Z`,
    questions: lesson.questions.map((question) => ({
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      hint: question.hint,
      explanation: question.explanation ?? null,
      points: question.points,
      options: question.options.map((option) => ({ id: option.id, text: option.text, correct: option.id === question.correctOptionId })),
      acceptedAnswers: [...question.accepted],
    })),
    passage,
    pronunciationItems: lesson.pronunciationItems.map(({ id, text, ipa, audioUrl, notes }) => ({ id, text, ipa, audioUrl, notes })),
  }
}

function lessonIssues(lesson) {
  const issues = []
  if (lesson.skill === 'LISTENING' && !lesson.passage?.audioUrl) issues.push('MISSING_AUDIO')
  const count = lesson.skill === 'PRONUNCIATION' ? lesson.pronunciationItems.length : lesson.questions.length
  if (count === 0) issues.push('NO_QUESTIONS')
  return issues
}

const withIssues = (lesson) => ({
  ...lesson,
  issues: lessonIssues(lesson),
  passage: lesson.passage && { ...lesson.passage, audioMissing: !lesson.passage.audioUrl },
})

function lessonSummary(lesson) {
  return {
    id: lesson.id,
    title: lesson.title,
    skill: lesson.skill,
    cefrLevel: lesson.cefrLevel,
    difficulty: lesson.difficulty,
    status: lesson.status,
    questionCount: lesson.questions.length,
    segmentCount: lesson.passage?.segments.length ?? 0,
    itemCount: lesson.pronunciationItems.length,
    attempts: lesson.attempts,
    updatedAt: lesson.updatedAt,
    issues: lessonIssues(lesson),
  }
}

function checkChoiceQuestion(question, index) {
  const label = `question ${index + 1}`
  if (!clean(question.prompt ?? question.content)) throw new HttpError(400, `${label}: the prompt is empty`)
  if (!Number.isInteger(question.points) || question.points < 1) throw new HttpError(400, `${label}: points must be at least 1`)
  const options = question.options ?? []
  if (options.length > 0) {
    if (options.length < 2 || options.length > 6) throw new HttpError(400, `${label}: 2-6 options`)
    if (options.some((option) => !clean(option.text))) throw new HttpError(400, `${label}: an option is empty`)
    if (options.filter((option) => option.correct).length !== 1) throw new HttpError(400, `${label}: exactly one correct option`)
  }
}

function readLesson(body, s, existing) {
  const title = clean(body.title)
  if (!title || title.length > 150) throw new HttpError(400, 'title must be 1-150 characters')
  if (!CEFR_LEVELS.includes(body.cefrLevel)) throw new HttpError(400, 'cefrLevel must be one of A1..C2')
  const skill = existing?.skill ?? body.skill
  if (!['GRAMMAR', 'READING', 'WRITING', 'LISTENING', 'PRONUNCIATION'].includes(skill)) throw new HttpError(400, 'skill is not valid')
  const questions = (body.questions ?? []).map((question, index) => {
    checkChoiceQuestion(question, index)
    if (question.type === 'MULTIPLE_CHOICE' && (question.options ?? []).length === 0) throw new HttpError(400, `question ${index + 1}: options are required`)
    if (question.type === 'FILL_BLANK' && !(question.acceptedAnswers ?? []).some(clean)) throw new HttpError(400, `question ${index + 1}: an accepted answer is required`)
    return {
      id: question.id ?? (s.nextId += 1),
      type: question.type,
      prompt: question.prompt.trim(),
      hint: clean(question.hint),
      explanation: clean(question.explanation),
      points: question.points,
      options: question.type === 'MULTIPLE_CHOICE' ? question.options.map((option) => ({ id: option.id ?? (s.nextId += 1), text: option.text.trim(), correct: Boolean(option.correct) })) : [],
      acceptedAnswers: question.type === 'FILL_BLANK' ? question.acceptedAnswers.map((answer) => answer.trim()).filter(Boolean) : [],
    }
  })
  const passage =
    skill === 'LISTENING'
      ? {
          audioUrl: clean(body.passage?.audioUrl),
          durationMs: body.passage?.durationMs ?? null,
          transcript: body.passage?.transcript ?? '',
          translation: body.passage?.translation ?? '',
          segments: (body.passage?.segments ?? []).map((segment, index) => {
            if (!(segment.endMs > segment.startMs)) throw new HttpError(400, `segment ${index + 1}: the end must be after the start`)
            if (!clean(segment.text)) throw new HttpError(400, `segment ${index + 1}: the English sentence is empty`)
            return { ...segment, id: segment.id ?? (s.nextId += 1) }
          }),
        }
      : null
  const pronunciationItems = (body.pronunciationItems ?? []).map((item, index) => {
    if (!clean(item.text)) throw new HttpError(400, `item ${index + 1}: the sentence is empty`)
    return { id: item.id ?? (s.nextId += 1), text: item.text.trim(), ipa: clean(item.ipa), audioUrl: clean(item.audioUrl), notes: clean(item.notes) }
  })
  const status = existing ? body.status : 'DRAFT'
  if (!['DRAFT', 'PUBLISHED', 'HIDDEN'].includes(status)) throw new HttpError(400, 'status is not valid')
  const lesson = {
    id: existing?.id ?? (s.nextId += 1),
    title,
    description: clean(body.description),
    topic: clean(body.topic),
    skill,
    cefrLevel: body.cefrLevel,
    difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(body.difficulty) ? body.difficulty : 'MEDIUM',
    estimatedMinutes: Number.isInteger(body.estimatedMinutes) ? body.estimatedMinutes : null,
    status,
    attempts: existing?.attempts ?? 0,
    updatedAt: nowIso(),
    questions,
    passage,
    pronunciationItems,
  }
  if (status === 'PUBLISHED') {
    const issues = lessonIssues(lesson)
    if (issues.includes('NO_QUESTIONS')) throw new HttpError(400, 'A published lesson needs at least one question')
    if (issues.includes('MISSING_AUDIO') || (skill === 'LISTENING' && !clean(passage.transcript))) {
      throw new HttpError(400, 'A published listening lesson needs an audio file and a transcript')
    }
  }
  return lesson
}

function requireLesson(s, id) {
  const lesson = s.lessons.find((candidate) => candidate.id === id)
  if (!lesson) throw new HttpError(404, 'Lesson not found')
  return lesson
}

// --- Tests -----------------------------------------------------------------------------------------------------------

function testStatus(test, today) {
  if (test.draft) return 'DRAFT'
  if (!test.startDate) return 'OPEN'
  if (today < test.startDate) return 'UPCOMING'
  if (today > test.endDate) return 'CLOSED'
  return 'OPEN'
}

function testSummary(test, today) {
  const skills = SKILL_ORDER.filter((skill) => test.questions.some((question) => question.skill === skill))
  const { questions: _q, duplicatedFrom: _d, draft: _draft, ...fields } = test
  return { ...fields, status: testStatus(test, today), questionCount: test.questions.length, skills }
}

const testDetail = (test, today) => ({ ...testSummary(test, today), duplicatedFrom: test.duplicatedFrom, questions: test.questions })

/**
 * Next week, when no weekly test opens in it (docs/api/admin.md, attention). "Next week" follows the weekly test that
 * has already opened most recently (the one open today, or else the last one to close).
 */
export function periodicTestGap(tests, today) {
  const scheduled = tests.filter((test) => test.type === 'PERIODIC' && !test.draft && test.endDate)
  const current = scheduled.filter((test) => test.startDate <= today).sort((a, b) => a.startDate.localeCompare(b.startDate)).at(-1)
  if (!current) return null
  const weekStart = addDays(current.endDate, 1)
  const weekEnd = addDays(current.endDate, 7)
  return scheduled.some((test) => test.startDate >= weekStart && test.startDate <= weekEnd) ? null : { weekStart, weekEnd }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function readTestQuestions(body, s) {
  return (body.questions ?? []).map((question, index) => {
    checkChoiceQuestion({ ...question, prompt: question.content }, index)
    if (!SKILL_ORDER.includes(question.skill)) throw new HttpError(400, `question ${index + 1}: skill is not valid`)
    return {
      id: question.id ?? (s.nextId += 1),
      skill: question.skill,
      type: question.type,
      points: question.points,
      audioUrl: clean(question.audioUrl),
      content: question.content.trim(),
      options: (question.options ?? []).map((option) => ({ id: option.id ?? (s.nextId += 1), text: option.text.trim(), correct: Boolean(option.correct) })),
      acceptedAnswers: (question.acceptedAnswers ?? []).map((answer) => answer.trim()).filter(Boolean),
      vocabularyId: question.vocabularyId ?? null,
    }
  })
}

function readTest(body, s, type) {
  const title = clean(body.title)
  if (!title || title.length > 200) throw new HttpError(400, 'title must be 1-200 characters')
  let startDate = null
  let endDate = null
  if (type === 'PERIODIC') {
    if (!ISO_DATE.test(body.startDate ?? '') || !ISO_DATE.test(body.endDate ?? '')) throw new HttpError(400, 'startDate and endDate are required')
    if (body.endDate <= body.startDate) throw new HttpError(400, 'endDate must be after startDate')
    ;({ startDate, endDate } = body)
  }
  const questions = readTestQuestions(body, s)
  if (questions.length === 0) throw new HttpError(400, 'A test needs at least one question')
  if (type === 'COMPREHENSIVE' && SKILL_ORDER.some((skill) => !questions.some((question) => question.skill === skill))) {
    throw new HttpError(400, 'A comprehensive test needs all four skills')
  }
  return { title, startDate, endDate, draft: Boolean(body.draft), questions }
}

/** Only wording may change once learners have submitted: same questions, answers and points (scenario 24). */
function sameStructure(before, after) {
  if (after.startDate !== before.startDate || after.questions.length !== before.questions.length) return false
  return before.questions.every((question, index) => {
    const next = after.questions[index]
    return (
      next.id === question.id &&
      next.skill === question.skill &&
      next.type === question.type &&
      next.points === question.points &&
      next.options.length === question.options.length &&
      next.options.every((option, optionIndex) => option.id === question.options[optionIndex].id && option.correct === question.options[optionIndex].correct) &&
      next.acceptedAnswers.join('\n') === question.acceptedAnswers.join('\n')
    )
  })
}

function requireTest(s, id) {
  const test = s.tests.find((candidate) => candidate.id === id)
  if (!test) throw new HttpError(404, 'Test not found')
  return test
}

// --- Users -----------------------------------------------------------------------------------------------------------

const givenName = (fullName) => fullName.trim().split(/\s+/).at(-1)

const USER_SORTS = {
  NEWEST: (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id,
  RECENT_ACTIVITY: (a, b) => (b.lastActiveAt ?? '').localeCompare(a.lastActiveAt ?? '') || b.id - a.id,
  NAME: (a, b) => givenName(a.fullName).localeCompare(givenName(b.fullName), 'vi') || a.fullName.localeCompare(b.fullName, 'vi') || a.id - b.id,
}

function requireLearner(s, id) {
  const learner = s.learners.find((candidate) => candidate.id === id)
  if (!learner) throw new HttpError(404, 'User not found')
  return learner
}

const userDetail = (learner, today) => ({ ...learner, ...learnerDetail(learner, today) })

// --- Statistics ------------------------------------------------------------------------------------------------------

/** A stable pseudo-random number in [0, 1) for a day. */
function noise(isoDate, salt = 0) {
  let hash = 2166136261 ^ salt
  for (const char of isoDate) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return ((hash >>> 0) % 1000) / 1000
}

function activeOn(learners, day, today) {
  if (day > today) return 0
  const registered = learners.filter((learner) => learner.createdAt.slice(0, 10) <= day).length
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay()
  const share = (weekday === 0 || weekday === 6 ? 0.1 : 0.2) + noise(day) * 0.12
  return Math.round(registered * share)
}

/**
 * Learners with at least one study day in the period. Up to today that is exact (their last activity falls in it); for
 * a period that ended earlier the mock can only estimate it from the daily numbers.
 */
function activeLearners(learners, dailyActive, from, to, today) {
  const registered = learners.filter((learner) => learner.createdAt.slice(0, 10) <= to)
  if (to >= today) return registered.filter((learner) => learner.lastActiveAt && learner.lastActiveAt.slice(0, 10) >= from).length
  const studyDays = dailyActive.reduce((sum, day) => sum + day.count, 0)
  return Math.min(registered.length, Math.round(studyDays / (1 + dailyActive.length * 0.2)))
}

/** Topics, lessons and tests learned the most in the period, by number of learners (ContentStat of the design). */
function topContent(s, today, from, to, reviews, active, periodShare) {
  const coverage = active / Math.max(1, s.learners.length)
  const topicRows = topics
    .map((topic) => ({ topic, weight: liveWords().filter((word) => word.topicId === topic.id).reduce((sum, word) => sum + usageOf(word).learnerCount, 0) }))
    .filter(({ weight }) => weight > 0)
  const totalWeight = topicRows.reduce((sum, { weight }) => sum + weight, 0)
  const rows = [
    ...topicRows.map(({ topic, weight }) => ({
      type: 'TOPIC',
      id: topic.id,
      name: topic.name,
      skill: null,
      attemptCount: Math.round((reviews * weight) / totalWeight),
      learnerCount: Math.min(active, Math.round(toAdminTopic(topic).learnerCount * coverage)),
    })),
    ...s.lessons
      .filter((lesson) => lesson.status !== 'DRAFT')
      // About 45% of a lesson's attempts are by different learners (the rest are retries).
      .map((lesson) => ({
        type: 'EXERCISE',
        id: lesson.id,
        name: lesson.title,
        skill: lesson.skill,
        attemptCount: Math.round(lesson.attempts * periodShare),
        learnerCount: Math.min(active, Math.round(lesson.attempts * 0.45 * coverage)),
      })),
    ...s.tests
      .filter((test) => !test.draft && (!test.startDate || (test.startDate <= to && test.startDate <= today && test.endDate >= from)))
      .map((test) => ({ type: 'TEST', id: test.id, name: test.title, skill: null, attemptCount: test.submissions, learnerCount: Math.min(active, Math.round(test.submissions * 0.94)) })),
  ]
  return rows
    .filter((row) => row.attemptCount > 0 && row.learnerCount > 0)
    .sort((a, b) => b.learnerCount - a.learnerCount || b.attemptCount - a.attemptCount)
    .slice(0, 5)
}

function stats(s, today, from, to) {
  if (!ISO_DATE.test(from ?? '') || !ISO_DATE.test(to ?? '')) throw new HttpError(400, 'from and to must be YYYY-MM-DD')
  if (from > to) throw new HttpError(400, 'from must not be after to')
  const days = []
  for (let day = from; day <= to; day = addDays(day, 1)) {
    days.push(day)
    if (days.length > 366) throw new HttpError(400, 'The period may not exceed 366 days')
  }
  const dailyActive = days.map((date) => ({ date, count: activeOn(s.learners, date, today) }))
  const activeDays = dailyActive.reduce((sum, day) => sum + day.count, 0)
  const reviews = dailyActive.reduce((sum, day) => sum + Math.round(day.count * (9 + noise(day.date, 1) * 6)), 0)
  const active = activeLearners(s.learners, dailyActive, from, to, today)

  const levels = Object.fromEntries([...CEFR_LEVELS, 'NONE'].map((level) => [level, 0]))
  s.learners.forEach((learner) => (levels[learner.currentLevel ?? 'NONE'] += 1))

  return {
    from,
    to,
    generatedAt: nowIso(),
    learners: {
      total: s.learners.filter((learner) => learner.createdAt.slice(0, 10) <= to).length,
      newInPeriod: s.learners.filter((learner) => learner.createdAt.slice(0, 10) >= from && learner.createdAt.slice(0, 10) <= to).length,
    },
    activeLearners: active,
    reviews,
    exerciseAttempts: Math.round(activeDays * 0.55),
    testsSubmitted: Math.round(activeDays * 0.12),
    dailyActive,
    levels,
    topContent: topContent(s, today, from, to, reviews, active, activeDays / Math.max(1, s.learners.length * 30 * 0.2)),
    attention: {
      wordsMissingAudio: liveWords().filter(MISSING.AUDIO).length,
      wordsMissingExample: liveWords().filter(MISSING.EXAMPLE).length,
      lessonsWithIssues: s.lessons
        .filter((lesson) => lesson.status === 'PUBLISHED')
        .flatMap((lesson) => lessonIssues(lesson).map((issue) => ({ lessonId: lesson.id, title: lesson.title, issue }))),
      periodicTestGap: periodicTestGap(s.tests, today),
      lockedUsers: s.learners.filter((learner) => learner.status === 'LOCKED').length,
    },
  }
}

// --- Media -----------------------------------------------------------------------------------------------------------

const MEDIA_TYPES = {
  AUDIO: { 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/ogg': 'ogg', 'audio/webm': 'webm' },
  IMAGE: { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' },
}
const MEDIA_LIMITS = { AUDIO: 10 * 1024 * 1024, IMAGE: 2 * 1024 * 1024 }

/** Serves a file uploaded through POST /api/admin/media; returns false for any other request. */
export function serveUpload(req, res) {
  const path = new URL(req.url, 'http://localhost').pathname
  const file = req.method === 'GET' && uploads.get(path)
  if (!file) return false
  res.statusCode = 200
  res.setHeader('Content-Type', file.type)
  res.setHeader('Content-Length', file.data.length)
  res.end(file.data)
  return true
}

// --- Routes ----------------------------------------------------------------------------------------------------------

/** Wraps a handler so it only runs for admins and gets the admin data. */
const adminOnly = (handler) => (context) => {
  requireAdmin(context.role)
  return handler({ ...context, s: admin(context.today) })
}

const id = (match) => Number(match[1])

export const adminRoutes = [
  // Overview
  {
    method: 'GET',
    pattern: /^\/api\/admin\/stats$/,
    handle: adminOnly(({ s, today, searchParams }) => stats(s, today, searchParams.get('from'), searchParams.get('to'))),
  },

  // Topics
  {
    method: 'GET',
    pattern: /^\/api\/admin\/topics$/,
    handle: adminOnly(() => topics.map(toAdminTopic)),
  },
  {
    method: 'POST',
    pattern: /^\/api\/topics$/,
    status: 201,
    handle: adminOnly(({ body, s }) => {
      const topic = { id: (s.nextId += 1), ...readTopic(body), updatedAt: nowIso() }
      topics.push(topic)
      return topic
    }),
  },
  {
    method: 'PUT',
    pattern: /^\/api\/topics\/(\d+)$/,
    handle: adminOnly(({ body, match }) => {
      const topic = requireTopic(id(match))
      Object.assign(topic, readTopic(body, topic.id), { updatedAt: nowIso() })
      return topic
    }),
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/topics\/(\d+)$/,
    handle: adminOnly(({ match }) => {
      const topic = requireTopic(id(match))
      const count = SYSTEM_WORDS.filter((word) => word.topicId === topic.id).length
      if (count > 0) throw new HttpError(409, `Topic still has ${count} words`)
      topics.splice(topics.indexOf(topic), 1)
    }),
  },

  // Words
  {
    method: 'GET',
    pattern: /^\/api\/admin\/vocabulary$/,
    handle: adminOnly(({ s, today, searchParams }) => {
      const level = searchParams.get('level')
      if (level && !CEFR_LEVELS.includes(level)) throw new HttpError(400, 'level must be one of A1..C2')
      const missing = searchParams.get('missing')
      if (missing && !MISSING[missing]) throw new HttpError(400, 'missing must be AUDIO, EXAMPLE or IMAGE')
      const topicId = searchParams.get('topicId')
      const q = (searchParams.get('q') ?? '').trim().toLocaleLowerCase('vi')
      const matching = liveWords()
        .filter(
          (word) =>
            (!topicId || String(word.topicId) === topicId) &&
            (!level || word.difficultyLevel === level) &&
            (!missing || MISSING[missing](word)) &&
            (!q || word.word.toLocaleLowerCase('vi').includes(q) || word.meaning.toLocaleLowerCase('vi').includes(q)),
        )
        .sort(byLevel)
        .map((word) => toAdminWord(word, s, today))
      return paginate(matching, searchParams, { defaultSize: 10, maxSize: 50 })
    }),
  },
  {
    method: 'POST',
    pattern: /^\/api\/vocabulary$/,
    status: 201,
    handle: adminOnly(({ body, s, today }) => {
      const word = { id: (s.nextId += 1), createdBy: null, ...readWord(body), status: 'VISIBLE', updatedAt: nowIso() }
      SYSTEM_WORDS.push(word)
      return toAdminWord(word, s, today)
    }),
  },
  {
    method: 'PUT',
    pattern: /^\/api\/vocabulary\/(\d+)$/,
    handle: adminOnly(({ body, match, s, today }) => {
      const word = requireWord(id(match))
      Object.assign(word, readWord(body, word.id), { updatedAt: nowIso() })
      return toAdminWord(word, s, today)
    }),
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/vocabulary\/(\d+)$/,
    status: 200,
    handle: adminOnly(({ match, s, today }) => {
      const word = requireWord(id(match))
      const { learnerCount, listCount } = usageOf(word)
      // Hidden, not deleted, while anything points at it; test questions keep their wording either way.
      if (learnerCount > 0 || listCount > 0 || questionsOf(s, word.id, today).questionCount > 0) {
        Object.assign(word, { status: 'HIDDEN', updatedAt: nowIso() })
        return { result: 'HIDDEN' }
      }
      SYSTEM_WORDS.splice(SYSTEM_WORDS.indexOf(word), 1)
      return { result: 'DELETED' }
    }),
  },
  {
    method: 'POST',
    pattern: /^\/api\/admin\/media$/,
    rawBody: true,
    status: 201,
    handle: adminOnly(({ body, headers, searchParams, s }) => {
      const kind = searchParams.get('kind')
      const extension = MEDIA_TYPES[kind]?.[(headers['content-type'] ?? '').split(';')[0].trim()]
      if (!extension) throw new HttpError(400, 'Unsupported file type')
      if (body.length === 0 || body.length > MEDIA_LIMITS[kind]) throw new HttpError(400, 'The file is empty or too large')
      const url = `/mock-media/uploads/${(s.nextId += 1)}.${extension}`
      uploads.set(url, { type: headers['content-type'], data: body })
      return { url }
    }),
  },

  // Lessons
  {
    method: 'GET',
    pattern: /^\/api\/admin\/lessons$/,
    handle: adminOnly(({ s }) => s.lessons.map(lessonSummary)),
  },
  {
    method: 'GET',
    pattern: /^\/api\/admin\/lessons\/(\d+)$/,
    handle: adminOnly(({ s, match }) => withIssues(requireLesson(s, id(match)))),
  },
  {
    method: 'POST',
    pattern: /^\/api\/admin\/lessons$/,
    status: 201,
    handle: adminOnly(({ s, body }) => {
      const lesson = readLesson(body, s, null)
      s.lessons.push(lesson)
      return withIssues(lesson)
    }),
  },
  {
    method: 'PUT',
    pattern: /^\/api\/admin\/lessons\/(\d+)$/,
    handle: adminOnly(({ s, body, match }) => {
      const existing = requireLesson(s, id(match))
      const lesson = readLesson(body, s, existing)
      s.lessons[s.lessons.indexOf(existing)] = lesson
      return withIssues(lesson)
    }),
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/admin\/lessons\/(\d+)$/,
    status: 200,
    handle: adminOnly(({ s, match }) => {
      const lesson = requireLesson(s, id(match))
      if (lesson.attempts > 0) {
        Object.assign(lesson, { status: 'HIDDEN', updatedAt: nowIso() })
        return { result: 'HIDDEN' }
      }
      s.lessons.splice(s.lessons.indexOf(lesson), 1)
      return { result: 'DELETED' }
    }),
  },

  // Tests
  {
    method: 'GET',
    pattern: /^\/api\/admin\/tests$/,
    handle: adminOnly(({ s, today }) => s.tests.map((test) => testSummary(test, today))),
  },
  {
    method: 'GET',
    pattern: /^\/api\/admin\/tests\/(\d+)$/,
    handle: adminOnly(({ s, today, match }) => testDetail(requireTest(s, id(match)), today)),
  },
  {
    method: 'POST',
    pattern: /^\/api\/admin\/tests$/,
    status: 201,
    handle: adminOnly(({ s, today, body }) => {
      if (!['PERIODIC', 'COMPREHENSIVE'].includes(body.type)) throw new HttpError(400, 'type must be PERIODIC or COMPREHENSIVE')
      const test = { id: (s.nextId += 1), type: body.type, ...readTest(body, s, body.type), submissions: 0, averageScore: null, duplicatedFrom: null }
      s.tests.unshift(test)
      return testDetail(test, today)
    }),
  },
  {
    method: 'PUT',
    pattern: /^\/api\/admin\/tests\/(\d+)$/,
    handle: adminOnly(({ s, today, body, match }) => {
      const test = requireTest(s, id(match))
      const next = readTest(body, s, test.type)
      if (test.submissions > 0 && (!sameStructure(test, next) || next.draft)) {
        throw new HttpError(409, 'The test has submissions: only the wording and the closing date may change')
      }
      Object.assign(test, next)
      return testDetail(test, today)
    }),
  },
  {
    method: 'POST',
    pattern: /^\/api\/admin\/tests\/(\d+)\/duplicate$/,
    status: 201,
    handle: adminOnly(({ s, today, body, match }) => {
      const source = requireTest(s, id(match))
      const copy = {
        id: (s.nextId += 1),
        type: source.type,
        ...readTest(
          {
            ...body,
            draft: true,
            questions: source.questions.map(({ id: _id, options, ...question }) => ({ ...question, options: options.map(({ id: _o, ...option }) => option) })),
          },
          s,
          source.type,
        ),
        submissions: 0,
        averageScore: null,
        duplicatedFrom: { id: source.id, title: source.title },
      }
      s.tests.unshift(copy)
      return testDetail(copy, today)
    }),
  },

  // Users
  {
    method: 'GET',
    pattern: /^\/api\/admin\/users$/,
    handle: adminOnly(({ s, searchParams }) => {
      const q = (searchParams.get('q') ?? '').trim().toLocaleLowerCase('vi')
      const status = searchParams.get('status')
      if (status && !['ACTIVE', 'LOCKED'].includes(status)) throw new HttpError(400, 'status must be ACTIVE or LOCKED')
      const level = searchParams.get('level')
      if (level && level !== 'NONE' && !CEFR_LEVELS.includes(level)) throw new HttpError(400, 'level must be A1..C2 or NONE')
      const sort = USER_SORTS[searchParams.get('sort') ?? 'NEWEST']
      if (!sort) throw new HttpError(400, 'sort must be NEWEST, RECENT_ACTIVITY or NAME')
      const matching = s.learners
        .filter(
          (learner) =>
            (!q || learner.fullName.toLocaleLowerCase('vi').includes(q) || learner.email.toLowerCase().includes(q)) &&
            (!status || learner.status === status) &&
            (!level || (learner.currentLevel ?? 'NONE') === level),
        )
        .toSorted(sort)
      return paginate(matching, searchParams, { defaultSize: 10, maxSize: 50 })
    }),
  },
  {
    method: 'GET',
    pattern: /^\/api\/admin\/users\/summary$/,
    handle: adminOnly(({ s }) => {
      const locked = s.learners.filter((learner) => learner.status === 'LOCKED').length
      return { total: s.learners.length, active: s.learners.length - locked, locked }
    }),
  },
  {
    method: 'GET',
    pattern: /^\/api\/admin\/users\/(\d+)$/,
    handle: adminOnly(({ s, today, match }) => userDetail(requireLearner(s, id(match)), today)),
  },
  {
    method: 'PATCH',
    pattern: /^\/api\/admin\/users\/(\d+)$/,
    handle: adminOnly(({ s, today, body, match, userId }) => {
      if (String(id(match)) === String(userId)) throw new HttpError(403, 'Admins cannot be locked')
      const learner = requireLearner(s, id(match))
      if (!['ACTIVE', 'LOCKED'].includes(body.status)) throw new HttpError(400, 'status must be ACTIVE or LOCKED')
      learner.status = body.status
      return userDetail(learner, today)
    }),
  },
]

/** Scenarios of the /__mock page for the admin endpoints (and the topic and word writes they use). */
export function adminScenarioEffect(scenario, method, pathname) {
  const admin = /^\/api\/admin\//.test(pathname)
  const vocabularyWrite = method !== 'GET' && /^\/api\/(topics|vocabulary)(\/\d+)?$/.test(pathname)
  if (!admin && !vocabularyWrite) return null
  if (scenario === 'slow') return { extraDelayMs: 2500 }
  if (scenario === 'load-error' && method === 'GET') {
    return { reply: { status: 500, message: 'Simulated server error (mock scenario "load-error")' } }
  }
  if (scenario === 'save-error' && method !== 'GET') {
    return { reply: { status: 500, message: 'Simulated server error (mock scenario "save-error")' } }
  }
  return {}
}

