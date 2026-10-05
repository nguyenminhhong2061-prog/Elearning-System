import { render } from '@testing-library/react'
import { createElement as h } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import App from '@/app/App'
import { tokenStorage } from '@/api/tokenStorage'
import { installFakeBackend, learner } from '@/test/fakeBackend'

// Shared data and rendering helper of the module B tests, shaped as docs/api/exercises.md describes.

const NO_PROGRESS = { attemptCount: 0, bestScorePercent: null, lastCompletedAt: null }

export const LESSONS = {
  READING: [
    { id: 1, skill: 'READING', title: 'Thì hiện tại đơn', description: null, topic: null, cefrLevel: 'A1', difficulty: 'EASY', estimatedMinutes: 5, itemCount: 5, progress: NO_PROGRESS },
    {
      id: 3,
      skill: 'READING',
      title: 'Thì hiện tại hoàn thành',
      description: 'Hành động bắt đầu trong quá khứ và còn liên quan tới hiện tại.',
      topic: 'Thì của động từ',
      cefrLevel: 'B1',
      difficulty: 'MEDIUM',
      estimatedMinutes: 8,
      itemCount: 2,
      progress: { attemptCount: 2, bestScorePercent: 80, lastCompletedAt: '2026-09-25T09:00:00Z' },
    },
    { id: 5, skill: 'READING', title: 'Câu bị động', description: null, topic: null, cefrLevel: 'B2', difficulty: 'HARD', estimatedMinutes: null, itemCount: 5, progress: NO_PROGRESS },
  ],
  WRITING: [
    { id: 33, skill: 'WRITING', title: 'Viết về chuyến đi', description: null, topic: 'Du lịch', cefrLevel: 'A2', difficulty: 'MEDIUM', estimatedMinutes: 10, itemCount: 2, progress: NO_PROGRESS },
    {
      id: 34,
      skill: 'WRITING',
      title: 'Email công việc ngắn',
      description: null,
      topic: 'Công việc',
      cefrLevel: 'B1',
      difficulty: 'MEDIUM',
      estimatedMinutes: 8,
      itemCount: 3,
      progress: { attemptCount: 1, bestScorePercent: 83, lastCompletedAt: '2026-09-28T09:00:00Z' },
    },
  ],
  LISTENING: [
    { id: 11, skill: 'LISTENING', title: 'Hội thoại tại sân bay', description: null, topic: null, cefrLevel: 'A2', difficulty: 'MEDIUM', estimatedMinutes: 6, itemCount: 2, progress: NO_PROGRESS },
  ],
  PRONUNCIATION: [
    { id: 21, skill: 'PRONUNCIATION', title: 'Từ vựng chủ đề Kinh doanh', description: null, topic: null, cefrLevel: 'B1', difficulty: 'MEDIUM', estimatedMinutes: 6, itemCount: 2, progress: NO_PROGRESS },
  ],
}

const lessonFields = (summary) => {
  const { itemCount: _count, progress: _progress, ...fields } = summary
  return { ...fields, questions: [], readingPassages: [], passage: null, pronunciationItems: [] }
}

export const READING_LESSON = {
  ...lessonFields(LESSONS.READING[1]),
  questions: [
    {
      id: 31,
      type: 'MULTIPLE_CHOICE',
      prompt: 'She ___ (live) in Hanoi for five years.',
      hint: 'Có "for five years": hành động kéo dài tới bây giờ.',
      points: 1,
      options: [
        { id: 311, key: 'A', text: 'lives' },
        { id: 312, key: 'B', text: 'has lived' },
        { id: 313, key: 'C', text: 'is living' },
      ],
    },
    { id: 32, type: 'FILL_BLANK', prompt: 'I have never ___ (see) such a beautiful beach.', hint: null, points: 1, options: [] },
  ],
}

/** A reading lesson with a passage (scenario 9, step 13): a grammar question, then one about the passage. */
export const PASSAGE_LESSON = {
  ...lessonFields({ id: 8, skill: 'READING', title: 'A trip to Ha Long Bay', description: null, topic: 'Du lịch', cefrLevel: 'A2', difficulty: 'MEDIUM', estimatedMinutes: 7 }),
  readingPassages: [
    {
      id: 72,
      title: 'A trip to Ha Long Bay',
      content: 'Last month, my family visited Ha Long Bay. We went there by bus from Hanoi.\n\nWe spent one night on a boat.',
    },
  ],
  questions: [
    {
      id: 81,
      type: 'MULTIPLE_CHOICE',
      prompt: 'I ___ this film before.',
      hint: null,
      points: 1,
      options: [
        { id: 811, key: 'A', text: 'see' },
        { id: 812, key: 'B', text: 'saw' },
        { id: 813, key: 'C', text: 'have seen' },
      ],
      passageId: null,
    },
    {
      id: 82,
      type: 'MULTIPLE_CHOICE',
      prompt: 'How did they get to Ha Long Bay?',
      hint: null,
      points: 1,
      options: [
        { id: 821, key: 'A', text: 'By train' },
        { id: 822, key: 'B', text: 'By bus' },
      ],
      passageId: 72,
    },
  ],
}

export const READING_KEY = {
  31: { correctOptionId: 312, correctAnswer: 'has lived', explanation: 'Hành động kéo dài tới hiện tại dùng hiện tại hoàn thành.' },
  32: { correctOptionId: null, correctAnswer: 'seen', explanation: 'Sau have dùng V3: see → seen.' },
  81: { correctOptionId: 813, correctAnswer: 'have seen', explanation: 'Trải nghiệm không có mốc thời gian: hiện tại hoàn thành.' },
  82: { correctOptionId: 822, correctAnswer: 'By bus', explanation: 'Đoạn 1: "We went there by bus from Hanoi."' },
}

/** Grades like the server: option id or the accepted answer. */
export function gradeReading(body) {
  const key = READING_KEY[body.questionId]
  const correct = key.correctOptionId ? body.optionId === key.correctOptionId : body.answer?.trim().toLowerCase() === key.correctAnswer
  return { questionId: body.questionId, correct, ...key, awardedPoints: correct ? 1 : 0 }
}

/** A writing lesson (scenario 10): a sentence to translate and one to rewrite, 2 points each. */
export const WRITING_LESSON = {
  ...lessonFields(LESSONS.WRITING[0]),
  questions: [
    {
      id: 41,
      type: 'TRANSLATION',
      prompt: 'Tôi đã đặt phòng khách sạn trước hai tuần.',
      hint: "Chú ý cách nói 'trước bao lâu' trong tiếng Anh",
      points: 2,
      options: [],
      passageId: null,
      starter: null,
    },
    { id: 42, type: 'REWRITE', prompt: 'It took us three hours to get to Da Lat.', hint: null, points: 2, options: [], passageId: null, starter: 'We spent' },
  ],
}

/** What the AI says about each writing question in these tests, once it has graded the answer. */
export const WRITING_GRADES = {
  41: {
    awardedPoints: 1,
    feedback: "Chia đúng thì quá khứ đơn và đủ ý. 'before two weeks' không phải cách nói tự nhiên.",
    sampleAnswers: ['I booked the hotel room two weeks in advance.', 'I booked a hotel room two weeks ahead.'],
    explanation: 'in advance nghĩa là trước một thời điểm.',
  },
  42: {
    awardedPoints: 2,
    feedback: 'Chính xác, giữ nguyên nghĩa câu gốc.',
    sampleAnswers: ['We spent three hours getting to Da Lat.'],
    explanation: 'It took + thời gian + to V = spent + thời gian + V-ing.',
  },
}

/** A writing result as the server returns it: graded with WRITING_GRADES, or saved without points (the AI failed). */
export function writingResult(questionId, { graded = true, answer } = {}) {
  const base = { questionId, correct: null, graded, maxPoints: 2, correctOptionId: null, correctAnswer: null, ...(answer === undefined ? {} : { answer, optionId: null }) }
  if (!graded) return { ...base, awardedPoints: null, feedback: null, sampleAnswers: [], explanation: null }
  return { ...base, ...WRITING_GRADES[questionId] }
}

export const LISTENING_LESSON = {
  ...lessonFields(LESSONS.LISTENING[0]),
  passage: {
    title: 'Hội thoại tại sân bay',
    audioUrl: '/media/airport.mp3',
    durationMs: 29000,
    segments: [
      { id: 1101, order: 1, startMs: 0, endMs: 5500, speaker: 'Hành khách', transcript: 'Excuse me, where is the check-in counter?' },
      { id: 1102, order: 2, startMs: 6000, endMs: 11500, speaker: 'Nhân viên', transcript: 'It’s counter number twelve.' },
      { id: 1103, order: 3, startMs: 12000, endMs: 16500, speaker: 'Hành khách', transcript: 'What time does boarding start?' },
    ],
  },
  questions: [
    {
      id: 1111,
      type: 'MULTIPLE_CHOICE',
      prompt: 'Người nói cần tìm gì?',
      hint: null,
      points: 1,
      options: [
        { id: 11111, key: 'A', text: 'Quầy làm thủ tục' },
        { id: 11112, key: 'B', text: 'Cổng lên máy bay' },
      ],
    },
    { id: 1112, type: 'FILL_BLANK', prompt: 'Quầy số mấy?', hint: null, points: 1, options: [] },
  ],
}

export const PRONUNCIATION_LESSON = {
  ...lessonFields(LESSONS.PRONUNCIATION[0]),
  pronunciationItems: [
    { id: 801, text: 'sustainability', ipa: '/səˌsteɪnəˈbɪləti/', audioUrl: null, notes: 'Trọng âm rơi vào "bil".' },
    { id: 802, text: 'We need to reach an agreement.', ipa: null, audioUrl: null, notes: null },
  ],
}

export const ASSESSMENT = {
  itemId: 801,
  tryNumber: 1,
  overallScore: 86,
  phonemeAccuracyScore: 90,
  wordAccuracyScore: 82,
  recognizedText: 'sustainability',
  errors: [{
    word: 'sustainability',
    expectedIpa: 'səsteɪnəbɪləti',
    heardIpa: 'səsteɪnəbɪləti',
    confidence: 72,
    errorType: 'MISPRONUNCIATION',
    phones: [{ expected: 'ɪ', heard: 'i', confidence: 72 }],
  }],
  tips: ['Kiểm tra lại phát âm từ sustainability.'],
}

export const ATTEMPT_ID = 55

export function baseRoutes(overrides = {}) {
  let attemptNumber = 0
  return {
    'GET /api/users/me': () => ({ data: { ...learner, currentLevel: 'B1' } }),
    'GET /api/exercises': ({ params }) => ({ data: LESSONS[params.skill] ?? [] }),
    'GET /api/exercises/3': () => ({ data: READING_LESSON }),
    'GET /api/exercises/8': () => ({ data: PASSAGE_LESSON }),
    'GET /api/exercises/33': () => ({ data: WRITING_LESSON }),
    'GET /api/exercises/11': () => ({ data: LISTENING_LESSON }),
    'GET /api/exercises/21': () => ({ data: PRONUNCIATION_LESSON }),
    'POST /api/exercises/3/attempts': () => ({ status: 201, data: { attemptId: ATTEMPT_ID + attemptNumber++, startedAt: '2026-09-26T02:00:00Z' } }),
    'POST /api/exercises/8/attempts': () => ({ status: 201, data: { attemptId: ATTEMPT_ID, startedAt: '2026-09-26T02:00:00Z' } }),
    'POST /api/exercises/33/attempts': () => ({ status: 201, data: { attemptId: ATTEMPT_ID + attemptNumber++, startedAt: '2026-09-26T02:00:00Z' } }),
    'POST /api/exercises/11/attempts': () => ({ status: 201, data: { attemptId: ATTEMPT_ID, startedAt: '2026-09-26T02:00:00Z' } }),
    'POST /api/exercises/21/attempts': () => ({ status: 201, data: { attemptId: ATTEMPT_ID, startedAt: '2026-09-26T02:00:00Z' } }),
    [`POST /api/exercise-attempts/${ATTEMPT_ID}/responses`]: ({ body }) =>
      ({ data: READING_KEY[body.questionId] ? gradeReading(body) : writingResult(body.questionId) }),
    ...overrides,
  }
}

function LocationProbe() {
  const location = useLocation()
  return h('output', { 'data-testid': 'location' }, location.pathname + location.search)
}

/** Renders the whole app at `path`, signed in, against the fake backend; returns the backend's call log. */
export function renderApp(path, routes) {
  tokenStorage.save({ accessToken: 'stored-token', expiresIn: 3600 })
  const backend = installFakeBackend(routes)
  // Plain createElement keeps this helper file free of JSX (it exports data, not components).
  const view = render(h(MemoryRouter, { initialEntries: [path] }, h(App), h(LocationProbe)))
  return { backend, view, callsTo: (key) => backend.calls.filter((call) => call.key === key) }
}
