import { CEFR_LEVELS } from '../../src/api/constants.js'
import { HttpError } from '../http.js'
import { MOCK_LESSONS } from '../exerciseFixtures.js'
import { listeningAudioUrl } from '../media.js'

// docs/api/exercises.md

const SKILLS = ['GRAMMAR', 'LISTENING', 'PRONUNCIATION']
const MAX_RECORDING_BYTES = 1024 * 1024

const attempts = new Map() // attemptId -> attempt
let nextAttemptId = 1

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

/**
 * Grades one answer against a fixture question.
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
  const graded = grade(question, input)
  attempt.responses.set(question.id, graded)
  return graded
}

function completedAttempts(userId, lessonId) {
  return [...attempts.values()].filter((attempt) => attempt.userId === userId && attempt.lessonId === lessonId && attempt.status === 'COMPLETED')
}

function progressOf(userId, lessonId) {
  const done = completedAttempts(userId, lessonId)
  if (done.length === 0) return { attemptCount: 0, bestScorePercent: null, lastCompletedAt: null }
  return {
    attemptCount: done.length,
    bestScorePercent: Math.max(...done.map((attempt) => attempt.scorePercent)),
    lastCompletedAt: done.at(-1).finishedAt,
  }
}

function itemCount(lesson) {
  return lesson.skill === 'PRONUNCIATION' ? lesson.pronunciationItems.length : lesson.questions.length
}

function toSummary(lesson, userId) {
  const { questions: _q, passage: _p, pronunciationItems: _i, ...fields } = lesson
  return { ...fields, itemCount: itemCount(lesson), progress: progressOf(userId, lesson.id) }
}

/** The lesson as the API sends it: no answers, explanations or translations. */
function toPublicLesson(lesson) {
  return {
    ...lesson,
    questions: lesson.questions.map(({ correctOptionId: _c, accepted: _a, explanation: _e, ...question }) => question),
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
 * A believable fake assessment: no speech service here, so the score only depends on the item and the try number
 * (it improves as the learner tries again). Silence is rejected like a real service would (422).
 */
export function fakeAssessment(item, tryNumber, samples) {
  if (rms(samples) < 0.005) throw new HttpError(422, 'No speech recognized')
  const overall = clamp(62 + (item.id % 13) + (tryNumber - 1) * 9)
  const words = item.text.replace(/[.,!?]/g, '').split(/\s+/)
  const hardest = words.reduce((longest, word, index) => (word.length > words[longest].length ? index : longest), 0)
  return {
    itemId: item.id,
    tryNumber,
    overallScore: overall,
    accuracyScore: clamp(overall + 4),
    fluencyScore: clamp(overall - 8),
    completenessScore: clamp(overall + 6),
    recognizedText: item.text.replace(/[.,!?]$/, '').toLowerCase(),
    words: words.map((word, index) => {
      const score = index === hardest ? clamp(overall - 22) : clamp(overall + 5)
      return { word, accuracyScore: score, errorType: score < 60 ? 'MISPRONUNCIATION' : 'NONE' }
    }),
    tips:
      overall < 85
        ? [`Chú ý từ "${words[hardest]}": nghe mẫu rồi đọc lại chậm, rõ từng âm tiết.`, 'Nhấn mạnh âm tiết mang trọng âm, các âm tiết khác đọc nhẹ hơn.']
        : ['Rất tốt! Thử nói tự nhiên và liền mạch hơn một chút.'],
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
  } else {
    const review = lesson.questions.map((question) => {
      const response = attempt.responses.get(question.id)
      if (response) {
        const { awardedPoints: _points, ...item } = response
        return item
      }
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
      if (!SKILLS.includes(skill)) throw new HttpError(400, 'skill must be GRAMMAR, LISTENING or PRONUNCIATION')
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
    status: 201,
    handle({ userId, match }) {
      const lesson = requireLesson(match)
      for (const attempt of attempts.values()) {
        if (attempt.userId === userId && attempt.lessonId === lesson.id && attempt.status === 'IN_PROGRESS') attempt.status = 'ABANDONED'
      }
      const attempt = {
        id: nextAttemptId++,
        userId,
        lessonId: lesson.id,
        status: 'IN_PROGRESS',
        responses: new Map(),
        recordings: new Map(),
        playbackRate: 1,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        scorePercent: null,
      }
      attempts.set(attempt.id, attempt)
      return { attemptId: attempt.id, startedAt: attempt.startedAt }
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/exercise-attempts\/(\d+)\/responses$/,
    handle({ userId, match, body }) {
      const attempt = requireOpenAttempt(userId, match)
      const { optionId: _o, answer: _a, ...graded } = recordResponse(attempt, findLesson(attempt.lessonId), body)
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
