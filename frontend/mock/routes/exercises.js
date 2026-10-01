import { CEFR_LEVELS } from '../../src/api/constants.js'
import { todayInVietnam } from '../../src/lib/dates.js'
import { delay, HttpError } from '../http.js'
import { MOCK_LESSONS } from '../exerciseFixtures.js'
import { listeningAudioUrl } from '../media.js'

// docs/api/exercises.md

const SKILLS = ['READING', 'WRITING', 'LISTENING', 'PRONUNCIATION']
const MAX_RECORDING_BYTES = 1024 * 1024
// Only these skills can be picked up again; listening answers reach the server only with the whole test.
const RESUMABLE_SKILLS = ['READING', 'WRITING', 'PRONUNCIATION']
const WRITING_TYPES = ['TRANSLATION', 'REWRITE', 'KEYWORD_SENTENCE']
const MAX_WRITING_LENGTH = 1000
const AI_GRADING_MS = 900 // the AI reading a sentence
const RESUME_WINDOW_MS = 7 * 86_400_000

const attempts = new Map() // attemptId -> attempt
let nextAttemptId = 1

// Every learner starts with a little history, so the lists show best scores right away and beating one shows
// "Kỷ lục mới!". [lessonId, scorePercent, days ago]
const SEEDED_HISTORY = [
  [1, 60, 6],
  [1, 80, 2], // Thì hiện tại đơn: best 80%, so a perfect run is a new record
  [2, 100, 5], // Mạo từ: already perfect, a new record is impossible
  [3, 50, 3],
  [12, 67, 4],
  [22, 74, 1],
  [31, 90, 3], // Viết câu về gia đình: best 90%
]
// Unfinished attempts, so "Tiếp tục" and "Đang làm dở" show right away. [lessonId, answered or recorded, hours since
// the last activity]. Lesson 4's is older than 7 days: it cannot be resumed and must not show anywhere.
const SEEDED_UNFINISHED = [
  [3, 2, 20], // Thì hiện tại hoàn thành: 2 of 6 answered, one right and one wrong
  [23, 2, 72], // Trọng âm từ 2 âm tiết: 2 of 6 items recorded
  [4, 1, 9 * 24],
]
const seededUsers = new Set()

function newAttempt(userId, lessonId, startedAt) {
  const attempt = {
    id: nextAttemptId++,
    userId,
    lessonId,
    status: 'IN_PROGRESS',
    responses: new Map(),
    recordings: new Map(),
    playbackRate: 1,
    startedAt,
    lastActivityAt: startedAt,
    finishedAt: null,
    scorePercent: null,
  }
  attempts.set(attempt.id, attempt)
  return attempt
}

/** A right answer at even positions and a wrong one at odd positions, as the learner would have sent it. */
function seededAnswer(question, position) {
  if (question.type === 'FILL_BLANK') return { questionId: question.id, answer: position % 2 === 0 ? question.accepted[0] : 'xyz' }
  const wrong = question.options.find((option) => option.id !== question.correctOptionId)
  return { questionId: question.id, optionId: position % 2 === 0 ? question.correctOptionId : wrong.id }
}

function ensureHistory(userId) {
  if (seededUsers.has(userId)) return
  seededUsers.add(userId)
  for (const [lessonId, scorePercent, daysAgo] of SEEDED_HISTORY) {
    const finishedAt = new Date(Date.now() - daysAgo * 86_400_000)
    const attempt = newAttempt(userId, lessonId, new Date(finishedAt.getTime() - 5 * 60_000).toISOString())
    Object.assign(attempt, { status: 'COMPLETED', finishedAt: finishedAt.toISOString(), scorePercent, seeded: true })
  }
  for (const [lessonId, done, hoursAgo] of SEEDED_UNFINISHED) {
    const lastActivity = new Date(Date.now() - hoursAgo * 3_600_000)
    const attempt = newAttempt(userId, lessonId, new Date(lastActivity.getTime() - 10 * 60_000).toISOString())
    attempt.lastActivityAt = lastActivity.toISOString()
    const lesson = findLesson(lessonId)
    lesson.questions.slice(0, done).forEach((question, position) => attempt.responses.set(question.id, grade(question, seededAnswer(question, position))))
    lesson.pronunciationItems.slice(0, done).forEach((item, position) => attempt.recordings.set(item.id, [62 + position * 10, 71 + position * 10]))
  }
}

/** Forgets every attempt; each learner gets the seeded history again on the next request (the /__mock page's reset). */
export function resetExerciseData() {
  attempts.clear()
  seededUsers.clear()
}

/** Lessons the learner finished on `date` (Vietnam time) in this mock, for the progress mock's "today". */
export function exerciseCompletionsOn(userId, date) {
  return [...attempts.values()].filter(
    (attempt) => attempt.userId === userId && attempt.status === 'COMPLETED' && !attempt.seeded && todayInVietnam(new Date(attempt.finishedAt)) === date,
  ).length
}

export function findLesson(id) {
  return MOCK_LESSONS.find((lesson) => lesson.id === id)
}

export function findAttempt(userId, id) {
  const attempt = attempts.get(id)
  return attempt?.userId === userId ? attempt : undefined
}

function requireLesson(match) {
  const lesson = findLesson(Number(match[1]))
  if (!lesson) throw new HttpError(404, 'Lesson not found')
  return lesson
}

function doneCount(attempt, lesson) {
  return lesson.skill === 'PRONUNCIATION' ? attempt.recordings.size : attempt.responses.size
}

/**
 * The rule of docs/api/exercises.md: an unfinished grammar or pronunciation attempt with something done in it, active
 * in the last 7 days. (The backend also checks that the lesson was not edited after the attempt began; the sample
 * lessons never change.)
 */
export function isResumable(attempt, lesson, now = Date.now()) {
  return (
    attempt.status === 'IN_PROGRESS' &&
    RESUMABLE_SKILLS.includes(lesson.skill) &&
    doneCount(attempt, lesson) > 0 &&
    now - new Date(attempt.lastActivityAt).getTime() <= RESUME_WINDOW_MS
  )
}

function unfinishedAttempt(userId, lessonId) {
  return [...attempts.values()].find((attempt) => attempt.userId === userId && attempt.lessonId === lessonId && attempt.status === 'IN_PROGRESS')
}

function inProgressOf(userId, lesson) {
  const attempt = unfinishedAttempt(userId, lesson.id)
  if (!attempt || !isResumable(attempt, lesson)) return null
  return { attemptId: attempt.id, doneCount: doneCount(attempt, lesson), lastActivityAt: attempt.lastActivityAt }
}

/** What opening a lesson returns: the attempt, and what was already done in it when it is picked up again. */
function startPayload(attempt, lesson, resumed) {
  return {
    attemptId: attempt.id,
    startedAt: attempt.startedAt,
    resumed,
    responses: lesson.questions.filter((question) => attempt.responses.has(question.id)).map((question) => reviewItem(attempt.responses.get(question.id))),
    pronunciation: lesson.pronunciationItems
      .filter((item) => attempt.recordings.has(item.id))
      .map((item) => {
        const scores = attempt.recordings.get(item.id)
        return { itemId: item.id, tryCount: scores.length, bestScore: Math.max(...scores) }
      }),
  }
}

function requireOpenAttempt(userId, match) {
  const attempt = findAttempt(userId, Number(match[1]))
  if (!attempt) throw new HttpError(404, 'Attempt not found')
  if (attempt.status !== 'IN_PROGRESS') throw new HttpError(409, 'Attempt is no longer in progress')
  return attempt
}

/** The comparison rule of the contract: trim, collapse spaces, lowercase, straight apostrophes. */
export function normalizeAnswer(text) {
  return text.trim().replace(/\s+/g, ' ').toLowerCase().replace(/[‘’]/g, "'")
}

export const isWriting = (question) => WRITING_TYPES.includes(question.type)

/**
 * Grades one answer against a fixture question (reading, listening).
 * @returns {{ questionId, correct, optionId, answer, correctOptionId, correctAnswer, explanation, awardedPoints }}
 */
export function grade(question, input) {
  const hasOption = input?.optionId !== undefined && input?.optionId !== null
  const hasAnswer = typeof input?.answer === 'string'
  if (hasOption === hasAnswer) throw new HttpError(400, 'Send exactly one of optionId and answer')

  let correct
  if (hasOption) {
    if (!question.options.some((option) => option.id === input.optionId)) throw new HttpError(400, 'optionId does not belong to the question')
    correct = input.optionId === question.correctOptionId
  } else {
    if (input.answer.trim().length === 0 || input.answer.length > 200) throw new HttpError(400, 'answer must be 1 to 200 characters')
    correct = question.accepted.some((accepted) => normalizeAnswer(accepted) === normalizeAnswer(input.answer))
  }
  return {
    questionId: question.id,
    correct,
    optionId: hasOption ? input.optionId : null,
    answer: hasAnswer ? input.answer : null,
    ...answerKey(question),
    awardedPoints: correct ? question.points : 0,
  }
}

/** What is revealed once a question has been answered: the right option or answer, and why. */
function answerKey(question) {
  return {
    correctOptionId: question.correctOptionId,
    correctAnswer: question.correctOptionId
      ? question.options.find((option) => option.id === question.correctOptionId).text
      : question.accepted[0],
    explanation: question.explanation,
  }
}

function recordResponse(attempt, lesson, input) {
  const question = lesson.questions.find((candidate) => candidate.id === input?.questionId)
  if (!question) throw new HttpError(400, 'Question does not belong to the lesson')
  if (attempt.responses.has(question.id)) throw new HttpError(409, 'Question already answered in this attempt')
  if (isWriting(question)) throw new HttpError(400, 'Writing answers are sent one by one to /responses')
  const graded = grade(question, input)
  attempt.responses.set(question.id, graded)
  attempt.lastActivityAt = new Date().toISOString()
  return graded
}

// --- Writing (scenario 10) -----------------------------------------------------------------------------------------

const VIETNAMESE_LETTERS = /[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i
const plain = (text) => normalizeAnswer(text).replace(/[.!?,;:"]/g, '').replace(/\s+/g, ' ').trim()
const wordsOf = (text) => plain(text).split(' ').filter(Boolean)

/** Every word of a keyword starts some word of the answer ("check" matches "checked"). */
const usesKeyword = (answerWords, keyword) => wordsOf(keyword).every((part) => answerWords.some((word) => word.startsWith(part)))

/**
 * A believable fake of the AI grader: no AI here, so a few rules decide the points and the feedback. The fixtures'
 * own rules come first (the mistakes of scenario 10), then: not English, missing keywords, a rewrite without the given
 * start, an answer equal to a sample, and otherwise how many words of the closest sample it shares.
 * @returns {{ points: number, feedback: string }}
 */
export function fakeWritingGrade(question, answer) {
  const max = question.points
  const text = plain(answer)
  const sample = question.sampleAnswers[0]
  const rule = question.rules.find((candidate) => text.includes(candidate.includes))
  if (rule) return { points: rule.points, feedback: rule.feedback }
  if (VIETNAMESE_LETTERS.test(answer)) return { points: 0, feedback: 'Câu trả lời chưa viết bằng tiếng Anh. Hãy viết lại câu bằng tiếng Anh.' }
  const words = wordsOf(answer)
  if (question.type === 'KEYWORD_SENTENCE') {
    const missing = question.prompt.split('/').map((keyword) => keyword.trim()).filter((keyword) => !usesKeyword(words, keyword))
    if (missing.length > 0) {
      return { points: Math.max(0, max - missing.length), feedback: `Thiếu từ khóa ${missing.join(', ')}: câu cần dùng đủ các từ gợi ý. Câu gợi ý: ${sample}` }
    }
  }
  if (question.type === 'REWRITE' && question.starter && !text.startsWith(plain(question.starter))) {
    return { points: max / 2, feedback: `Câu viết lại cần bắt đầu bằng "${question.starter} …" như đề cho sẵn. Câu gợi ý: ${sample}` }
  }
  if (question.sampleAnswers.some((candidate) => plain(candidate) === text)) {
    return { points: max, feedback: question.perfect ?? 'Chính xác: câu đúng ngữ pháp, đủ ý và diễn đạt tự nhiên.' }
  }
  const overlap = Math.max(...question.sampleAnswers.map((candidate) => {
    const target = wordsOf(candidate)
    return target.filter((word) => words.includes(word)).length / target.length
  }))
  if (overlap >= 0.8) return { points: max - 0.5, feedback: `Câu gần đúng và đủ ý, còn một chỗ diễn đạt chưa tự nhiên. Câu gợi ý: ${sample}` }
  if (overlap >= 0.5) return { points: max / 2, feedback: `Câu mới đủ một phần ý và còn lỗi diễn đạt. Câu gợi ý: ${sample}` }
  return { points: 0, feedback: `Câu chưa đúng yêu cầu của đề. Câu gợi ý: ${sample}` }
}

/** A writing answer as the API returns it: graded (points, feedback, samples, explanation) or not yet. */
function writingResult(question, answer, grading) {
  return {
    questionId: question.id,
    correct: null,
    graded: Boolean(grading),
    optionId: null,
    answer,
    awardedPoints: grading ? grading.points : null,
    maxPoints: question.points,
    feedback: grading ? grading.feedback : null,
    sampleAnswers: grading ? question.sampleAnswers : [],
    explanation: grading ? question.explanation : null,
    correctOptionId: null,
    correctAnswer: null,
  }
}

/** Asks the (fake) AI to grade a saved answer; when the AI is down the answer stays saved without points. */
async function gradeWriting(attempt, question, aiDown) {
  await delay(AI_GRADING_MS)
  const saved = attempt.responses.get(question.id)
  const result = writingResult(question, saved.answer, aiDown ? null : fakeWritingGrade(question, saved.answer))
  attempt.responses.set(question.id, result)
  attempt.lastActivityAt = new Date().toISOString()
  return result
}

/** Scenario 10, steps 5 to 8: the answer is saved first, then graded. */
async function answerWriting(attempt, lesson, input, aiDown) {
  const question = lesson.questions.find((candidate) => candidate.id === input?.questionId)
  if (!question || !isWriting(question)) throw new HttpError(400, 'Question is not a writing question of the lesson')
  if (attempt.responses.has(question.id)) throw new HttpError(409, 'Question already answered in this attempt')
  if (input.optionId !== undefined && input.optionId !== null) throw new HttpError(400, 'Writing questions take an answer, not an option')
  if (typeof input.answer !== 'string' || !input.answer.trim() || input.answer.length > MAX_WRITING_LENGTH) {
    throw new HttpError(400, `answer must be 1 to ${MAX_WRITING_LENGTH} characters`)
  }
  attempt.responses.set(question.id, writingResult(question, input.answer, null))
  attempt.lastActivityAt = new Date().toISOString()
  return gradeWriting(attempt, question, aiDown)
}

/** A response as the review lists it: without the points of a reading or listening question. */
function reviewItem(response) {
  if (response.maxPoints !== undefined) return response
  const { awardedPoints: _points, ...item } = response
  return item
}

function completedAttempts(userId, lessonId) {
  return [...attempts.values()].filter((attempt) => attempt.userId === userId && attempt.lessonId === lessonId && attempt.status === 'COMPLETED')
}

/** Different items recorded at least once over every attempt; a seeded finished attempt counts as all of them. */
function practicedCountOf(userId, lesson) {
  if (lesson.skill !== 'PRONUNCIATION') return null
  const mine = [...attempts.values()].filter((attempt) => attempt.userId === userId && attempt.lessonId === lesson.id)
  if (mine.some((attempt) => attempt.seeded && attempt.status === 'COMPLETED')) return lesson.pronunciationItems.length
  return new Set(mine.flatMap((attempt) => [...attempt.recordings.keys()])).size
}

/** The latest finished attempt as "8/10"; a seeded one only has its percentage, so the count is derived from it. */
function lastResultOf(lesson, done) {
  if (lesson.skill === 'PRONUNCIATION' || lesson.skill === 'WRITING' || done.length === 0) return null
  const last = done.at(-1)
  const questionCount = lesson.questions.length
  const correctCount = last.responses.size > 0
    ? [...last.responses.values()].filter((response) => response.correct).length
    : Math.round((last.scorePercent / 100) * questionCount)
  return { correctCount, questionCount }
}

function progressOf(userId, lessonId) {
  ensureHistory(userId)
  const lesson = findLesson(lessonId)
  const done = completedAttempts(userId, lessonId)
  const inProgress = inProgressOf(userId, lesson)
  const extra = { practicedCount: practicedCountOf(userId, lesson), lastResult: lastResultOf(lesson, done) }
  if (done.length === 0) return { attemptCount: 0, bestScorePercent: null, lastCompletedAt: null, inProgress, ...extra }
  return {
    attemptCount: done.length,
    bestScorePercent: Math.max(...done.map((attempt) => attempt.scorePercent)),
    lastCompletedAt: done.at(-1).finishedAt,
    inProgress,
    ...extra,
  }
}

function itemCount(lesson) {
  return lesson.skill === 'PRONUNCIATION' ? lesson.pronunciationItems.length : lesson.questions.length
}

function toSummary(lesson, userId) {
  const { questions: _q, passage: _p, pronunciationItems: _i, ...fields } = lesson
  return { ...fields, itemCount: itemCount(lesson), progress: progressOf(userId, lesson.id) }
}

/** The lesson as the API sends it: no answers, sample answers, explanations or translations. */
function toPublicLesson(lesson) {
  return {
    ...lesson,
    questions: lesson.questions.map(
      ({ correctOptionId: _c, accepted: _a, explanation: _e, sampleAnswers: _s, rules: _r, perfect: _p, ...question }) => question,
    ),
    passage: lesson.passage && {
      title: lesson.passage.title,
      audioUrl: listeningAudioUrl(lesson.id),
      durationMs: lesson.passage.durationMs,
      segments: lesson.passage.segments.map(({ translation: _t, ...segment }) => segment),
    },
  }
}

// --- Pronunciation -----------------------------------------------------------------------------------------------

/** Reads a 16-bit PCM WAV: its sample rate and samples (-1..1), or null when it is not one. */
export function readWav(buffer) {
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') return null
  let offset = 12
  let sampleRate = null
  let bitsPerSample = null
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4)
    const size = buffer.readUInt32LE(offset + 4)
    if (id === 'fmt ') {
      sampleRate = buffer.readUInt32LE(offset + 12)
      bitsPerSample = buffer.readUInt16LE(offset + 22)
    } else if (id === 'data' && sampleRate && bitsPerSample === 16) {
      const end = Math.min(buffer.length, offset + 8 + size)
      const samples = new Float32Array(Math.floor((end - offset - 8) / 2))
      for (let index = 0; index < samples.length; index += 1) samples[index] = buffer.readInt16LE(offset + 8 + index * 2) / 0x8000
      return { sampleRate, samples }
    }
    offset += 8 + size + (size % 2)
  }
  return null
}

function rms(samples) {
  let sum = 0
  for (const sample of samples) sum += sample * sample
  return Math.sqrt(sum / Math.max(1, samples.length))
}

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)))

/**
 * A believable fake assessment: no speech service here, so the score only depends on the item and the try number.
 * First tries spread over the three colour bands (45 to 84, depending on the item) and each new try adds 9, so every
 * band can be seen. The longest word is the badly said one; a long sentence read poorly the first time also loses its
 * last word (the "bị bỏ sót" style). Silence is rejected like a real service would (422).
 */
export function fakeAssessment(item, tryNumber, samples) {
  if (rms(samples) < 0.005) throw new HttpError(422, 'No speech recognized')
  const overall = clamp(45 + ((item.id * 17) % 40) + (tryNumber - 1) * 9)
  const words = item.text.replace(/[.,!?]/g, '').split(/\s+/)
  const omitsLast = words.length >= 5 && tryNumber === 1 && overall < 75
  const candidates = omitsLast ? words.slice(0, -1) : words
  const hardest = candidates.reduce((longest, word, index) => (word.length > candidates[longest].length ? index : longest), 0)
  const tips = []
  if (omitsLast) tips.push(`Đọc hết câu: từ "${words.at(-1)}" bị bỏ sót.`)
  if (overall < 85) tips.push(`Chú ý từ "${words[hardest]}": nghe mẫu rồi đọc lại chậm, rõ từng âm tiết.`, 'Nhấn mạnh âm tiết mang trọng âm, các âm tiết khác đọc nhẹ hơn.')
  else tips.push('Rất tốt! Thử nói tự nhiên và liền mạch hơn một chút.')
  return {
    itemId: item.id,
    tryNumber,
    overallScore: overall,
    accuracyScore: clamp(overall + 4),
    fluencyScore: clamp(overall - 8),
    completenessScore: omitsLast ? clamp(overall - 15) : clamp(overall + 6),
    recognizedText: (omitsLast ? words.slice(0, -1).join(' ') : words.join(' ')).toLowerCase(),
    words: words.map((word, index) => {
      if (omitsLast && index === words.length - 1) return { word, accuracyScore: 0, errorType: 'OMISSION' }
      const score = index === hardest ? clamp(overall - 25) : clamp(overall + 5)
      return { word, accuracyScore: score, errorType: score < 60 ? 'MISPRONUNCIATION' : 'NONE' }
    }),
    tips,
  }
}

function assessRecording(attempt, lesson, itemId, body) {
  const item = lesson.pronunciationItems.find((candidate) => candidate.id === itemId)
  if (!item) throw new HttpError(404, 'Item not found in this lesson')
  if (!Buffer.isBuffer(body) || body.length === 0) throw new HttpError(400, 'Body must be a WAV file')
  if (body.length > MAX_RECORDING_BYTES) throw new HttpError(413, 'Recording is larger than 1 MB')
  const wav = readWav(body)
  if (!wav) throw new HttpError(400, 'Body is not a 16-bit PCM WAV file')
  if (wav.samples.length / wav.sampleRate < 0.3) throw new HttpError(400, 'Recording is shorter than 0.3 seconds')

  const tries = attempt.recordings.get(item.id) ?? []
  const assessment = fakeAssessment(item, tries.length + 1, wav.samples)
  attempt.recordings.set(item.id, [...tries, assessment.overallScore])
  attempt.lastActivityAt = new Date().toISOString()
  return assessment
}

// --- Completion ----------------------------------------------------------------------------------------------------

function finish(attempt, lesson, body) {
  const inputs = Array.isArray(body.responses) ? body.responses : []
  for (const input of inputs) recordResponse(attempt, lesson, input)
  if (body.playbackRate !== undefined && body.playbackRate !== null) {
    if (typeof body.playbackRate !== 'number' || body.playbackRate < 0.5 || body.playbackRate > 2) throw new HttpError(400, 'playbackRate must be 0.5 to 2')
    attempt.playbackRate = body.playbackRate
  }

  const previousBest = progressOf(attempt.userId, lesson.id).bestScorePercent
  let result
  if (lesson.skill === 'PRONUNCIATION') {
    const best = lesson.pronunciationItems.map((item) => Math.max(0, ...(attempt.recordings.get(item.id) ?? [])))
    const practiced = lesson.pronunciationItems.filter((item) => attempt.recordings.has(item.id))
    const practicedScores = practiced.map((item) => Math.max(...attempt.recordings.get(item.id)))
    const total = lesson.pronunciationItems.length
    result = {
      correctCount: practiced.length,
      questionCount: total,
      earnedPoints: best.reduce((sum, score) => sum + score, 0),
      totalPoints: total * 100,
      scorePercent: Math.round(best.reduce((sum, score) => sum + score, 0) / total),
      review: [],
      translations: [],
      pronunciation: {
        averageScore: practicedScores.length ? Math.round(practicedScores.reduce((sum, score) => sum + score, 0) / practicedScores.length) : 0,
        practicedCount: practiced.length,
        itemCount: total,
      },
    }
  } else if (lesson.skill === 'WRITING') {
    const ungraded = [...attempt.responses.values()].filter((response) => !response.graded).length
    if (ungraded > 0) throw new HttpError(409, `${ungraded} writing answer(s) not graded yet`)
    const review = lesson.questions.map(
      (question) => attempt.responses.get(question.id) ?? { ...writingResult(question, null, { points: 0, feedback: null }) }, // unanswered
    )
    const totalPoints = lesson.questions.reduce((sum, question) => sum + question.points, 0)
    const earnedPoints = review.reduce((sum, item) => sum + item.awardedPoints, 0)
    result = {
      correctCount: review.filter((item) => item.awardedPoints === item.maxPoints).length,
      questionCount: lesson.questions.length,
      earnedPoints,
      totalPoints,
      scorePercent: totalPoints ? Math.round((earnedPoints / totalPoints) * 100) : 0,
      review,
      translations: [],
      pronunciation: null,
    }
  } else {
    const review = lesson.questions.map((question) => {
      const response = attempt.responses.get(question.id)
      if (response) return reviewItem(response)
      return { questionId: question.id, correct: false, optionId: null, answer: null, ...answerKey(question) } // unanswered
    })
    const totalPoints = lesson.questions.reduce((sum, question) => sum + question.points, 0)
    const earnedPoints = lesson.questions.reduce((sum, question) => sum + (attempt.responses.get(question.id)?.awardedPoints ?? 0), 0)
    result = {
      correctCount: review.filter((item) => item.correct).length,
      questionCount: lesson.questions.length,
      earnedPoints,
      totalPoints,
      scorePercent: totalPoints ? Math.round((earnedPoints / totalPoints) * 100) : 0,
      review,
      translations: lesson.passage?.segments.map((segment) => ({ segmentId: segment.id, translation: segment.translation })) ?? [],
      pronunciation: null,
    }
  }

  attempt.status = 'COMPLETED'
  attempt.finishedAt = new Date().toISOString()
  attempt.scorePercent = result.scorePercent
  return {
    attemptId: attempt.id,
    lessonId: lesson.id,
    ...result,
    bestScorePercent: Math.max(result.scorePercent, previousBest ?? 0),
    isPersonalBest: previousBest !== null && result.scorePercent > previousBest,
  }
}

export const exerciseRoutes = [
  {
    method: 'GET',
    pattern: /^\/api\/exercises$/,
    handle({ userId, searchParams }) {
      const skill = searchParams.get('skill')
      if (!SKILLS.includes(skill)) throw new HttpError(400, 'skill must be READING, WRITING, LISTENING or PRONUNCIATION')
      return MOCK_LESSONS.filter((lesson) => lesson.skill === skill && itemCount(lesson) > 0)
        .toSorted((a, b) => CEFR_LEVELS.indexOf(a.cefrLevel) - CEFR_LEVELS.indexOf(b.cefrLevel) || a.id - b.id)
        .map((lesson) => toSummary(lesson, userId))
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/exercises\/(\d+)$/,
    handle({ match }) {
      return toPublicLesson(requireLesson(match))
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/exercises\/(\d+)\/attempts$/,
    // 200 when an unfinished attempt is picked up again, 201 when a new one is created.
    status: (result) => (result.resumed ? 200 : 201),
    handle({ userId, match, searchParams }) {
      const lesson = requireLesson(match)
      ensureHistory(userId)
      const unfinished = unfinishedAttempt(userId, lesson.id)
      if (unfinished && isResumable(unfinished, lesson) && searchParams.get('restart') !== 'true') return startPayload(unfinished, lesson, true)
      if (unfinished) unfinished.status = 'ABANDONED'
      return startPayload(newAttempt(userId, lesson.id, new Date().toISOString()), lesson, false)
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/exercise-attempts\/current$/,
    handle({ userId }) {
      ensureHistory(userId)
      const candidates = [...attempts.values()]
        .filter((attempt) => attempt.userId === userId && isResumable(attempt, findLesson(attempt.lessonId)))
        .toSorted((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))
      const attempt = candidates[0]
      if (!attempt) return { current: null }
      const lesson = findLesson(attempt.lessonId)
      return {
        current: {
          attemptId: attempt.id,
          lesson: { id: lesson.id, skill: lesson.skill, title: lesson.title, cefrLevel: lesson.cefrLevel, itemCount: itemCount(lesson) },
          doneCount: doneCount(attempt, lesson),
          lastActivityAt: attempt.lastActivityAt,
        },
      }
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/exercise-attempts\/(\d+)\/responses$/,
    async handle({ userId, match, body, aiDown }) {
      const attempt = requireOpenAttempt(userId, match)
      const lesson = findLesson(attempt.lessonId)
      const writing = lesson.skill === 'WRITING'
      const { optionId: _o, answer: _a, ...graded } = writing
        ? await answerWriting(attempt, lesson, body, aiDown)
        : recordResponse(attempt, lesson, body)
      return graded
    },
  },
  {
    // Scenario 10, branches 7b and 14a: send a saved writing answer to the AI again.
    method: 'POST',
    pattern: /^\/api\/exercise-attempts\/(\d+)\/responses\/(\d+)\/grade$/,
    async handle({ userId, match, aiDown }) {
      const attempt = requireOpenAttempt(userId, match)
      const question = findLesson(attempt.lessonId).questions.find((candidate) => candidate.id === Number(match[2]))
      if (!question || !isWriting(question) || !attempt.responses.has(question.id)) {
        throw new HttpError(400, 'Not an answered writing question of this attempt')
      }
      if (attempt.responses.get(question.id).graded) throw new HttpError(409, 'Answer already graded')
      const { optionId: _o, answer: _a, ...graded } = await gradeWriting(attempt, question, aiDown)
      return graded
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/exercise-attempts\/(\d+)\/complete$/,
    handle({ userId, match, body }) {
      const attempt = requireOpenAttempt(userId, match)
      return finish(attempt, findLesson(attempt.lessonId), body)
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/exercise-attempts\/(\d+)\/pronunciation\/(\d+)$/,
    status: 201,
    rawBody: true,
    handle({ userId, match, body }) {
      const attempt = requireOpenAttempt(userId, match)
      const lesson = findLesson(attempt.lessonId)
      if (lesson.skill !== 'PRONUNCIATION') throw new HttpError(400, 'Not a pronunciation lesson')
      return assessRecording(attempt, lesson, Number(match[2]), body)
    },
  },
]
