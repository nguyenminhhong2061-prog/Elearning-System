import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/app/App'
import { tokenStorage } from '@/api/tokenStorage'
import { installFakeBackend, learner } from '@/test/fakeBackend'
import '@/test/preloadPages'

// Data shaped exactly as docs/api/tests.md describes it.
const PERIODIC = {
  id: 100,
  title: 'Kiểm tra định kỳ — tuần 40',
  type: 'PERIODIC',
  skill: null,
  startDate: null,
  endDate: null,
  questionCount: 2,
  progress: { attemptCount: 0, bestScorePercent: null, lastCompletedAt: null, inProgress: null },
}

const COMPREHENSIVE = {
  id: 200,
  title: 'Kiểm tra tổng hợp tháng 9',
  type: 'COMPREHENSIVE',
  skill: null,
  startDate: null,
  endDate: null,
  questionCount: 2,
  progress: { attemptCount: 1, bestScorePercent: 62, lastCompletedAt: '2026-09-20T08:30:00Z', inProgress: null },
}

const DETAIL = {
  id: 100,
  title: PERIODIC.title,
  type: 'PERIODIC',
  skill: null,
  startDate: null,
  endDate: null,
  hasInProgress: false,
  questions: [
    {
      id: 11,
      type: 'MULTIPLE_CHOICE',
      skill: 'READING',
      content: 'She ___ (live) in Hanoi for five years.',
      points: 1,
      audioUrl: null,
      options: [
        { id: 101, content: 'lives' },
        { id: 102, content: 'has lived' },
      ],
    },
    {
      id: 12,
      type: 'FILL_BLANK',
      skill: 'WRITING',
      content: 'I have never ___ (see) such a beach.',
      points: 1,
      audioUrl: null,
      options: [],
    },
  ],
}

const PERIODIC_RESULT = {
  attemptId: 57,
  testId: 100,
  title: PERIODIC.title,
  type: 'PERIODIC',
  status: 'GRADED',
  submittedAt: '2026-09-27T15:00:00Z',
  correctCount: 2,
  questionCount: 2,
  totalPoints: 2,
  earnedPoints: 2,
  scorePercent: 100,
  bestScorePercent: 100,
  isPersonalBest: false,
  suggestedLevel: 'C2',
  suggestedRoadmap: 'Tập trung luyện cả bốn kỹ năng 15 phút mỗi ngày.',
  skills: { reading: { score: 100, level: 'C2' }, writing: { score: 100, level: 'C2' } },
  review: [
    {
      questionId: 11,
      type: 'MULTIPLE_CHOICE',
      correct: true,
      selectedOptionId: 102,
      answerText: null,
      correctOptionId: 102,
      correctAnswer: 'has lived',
      points: 1,
      scoreEarned: 1,
    },
    {
      questionId: 12,
      type: 'FILL_BLANK',
      correct: false,
      selectedOptionId: null,
      answerText: 'saw',
      correctOptionId: null,
      correctAnswer: 'seen',
      points: 1,
      scoreEarned: 0,
    },
  ],
}

// A comprehensive attempt whose speaking skill is still being graded by the AI.
const PENDING_RESULT = {
  ...PERIODIC_RESULT,
  attemptId: 58,
  testId: 200,
  title: COMPREHENSIVE.title,
  type: 'COMPREHENSIVE',
  status: 'SUBMITTED',
  scorePercent: null,
  suggestedLevel: null,
  suggestedRoadmap: null,
  skills: {
    listening: { score: 56, level: 'B2' },
    reading: { score: 48, level: 'B1' },
    writing: { score: 42, level: 'B1' },
    speaking: { score: null, level: null },
  },
}

let backend

afterEach(() => backend?.restore())

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

function renderSignedIn(path, routes) {
  tokenStorage.save({ accessToken: 'stored-token', expiresIn: 3600 })
  backend = installFakeBackend({ 'GET /api/users/me': () => ({ data: learner }), ...routes })
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  )
}

const callsTo = (key) => backend.calls.filter((call) => call.key === key)

const listRoutes = {
  'GET /api/tests': () => ({ data: [PERIODIC, COMPREHENSIVE] }),
}

describe('tests list', () => {
  it('groups the open tests by type and shows each one progress', async () => {
    renderSignedIn('/tests', listRoutes)

    expect(await screen.findByRole('heading', { name: PERIODIC.title })).toBeInTheDocument()
    expect(screen.getByText(/Chưa làm lần nào/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bắt đầu' })).toHaveAttribute('href', '/tests/100')
    expect(screen.getByText(/Đã làm 1 lần · điểm cao nhất 62\/100/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Làm lại' })).toHaveAttribute('href', '/tests/200')
  })
})

describe('taking a test', () => {
  it('answers every question, saves as it goes and shows the result', async () => {
    const user = userEvent.setup()
    renderSignedIn('/tests/100', {
      'GET /api/tests/100': () => ({ data: DETAIL }),
      'POST /api/tests/100/attempts': () => ({ status: 201, data: { attemptId: 57, resumed: false, status: 'IN_PROGRESS', answers: [] } }),
      'PUT /api/test-attempts/57/answers/11': () => ({ status: 204 }),
      'PUT /api/test-attempts/57/answers/12': () => ({ status: 204 }),
      'POST /api/test-attempts/57/submit': () => ({ data: PERIODIC_RESULT }),
      'GET /api/test-attempts/57': () => ({ data: PERIODIC_RESULT }),
    })

    await user.click(await screen.findByRole('button', { name: 'Bắt đầu' }))

    await user.click(await screen.findByRole('button', { name: 'has lived' }))
    await user.click(screen.getByRole('button', { name: /Câu tiếp theo/ }))

    await user.type(await screen.findByLabelText('Câu trả lời của bạn'), 'seen')
    await user.click(screen.getByRole('button', { name: 'Nộp bài' }))

    expect(await screen.findByText('100/100')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/tests/100/result/57')
    // The chosen option and the typed answer were both saved before submitting.
    expect(callsTo('PUT /api/test-attempts/57/answers/11')[0].body).toEqual({ optionId: 102 })
    expect(callsTo('PUT /api/test-attempts/57/answers/12')[0].body).toEqual({ text: 'seen' })
  })

  it('shows which skills the AI is still grading', async () => {
    renderSignedIn('/tests/200/result/58', {
      'GET /api/tests/200': () => ({ data: { ...DETAIL, id: 200, title: COMPREHENSIVE.title, type: 'COMPREHENSIVE' } }),
      'GET /api/test-attempts/58': () => ({ data: PENDING_RESULT }),
    })

    expect(await screen.findByText(/Đang chấm phần Nói/)).toBeInTheDocument()
    expect(screen.getByText('đang chấm')).toBeInTheDocument()
  })
})
