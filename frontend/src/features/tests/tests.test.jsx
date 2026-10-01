import { render, screen, waitFor, within } from '@testing-library/react'
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

describe('tests list', () => {
  it('shows the design cards grouped by type, with the deadline and the learner progress', async () => {
    const endsIn3Days = new Date(Date.now() + 3.5 * 24 * 60 * 60 * 1000).toISOString()
    renderSignedIn('/tests', { 'GET /api/tests': () => ({ data: [{ ...PERIODIC, endDate: endsIn3Days }, COMPREHENSIVE] }) })

    expect(await screen.findByRole('heading', { name: PERIODIC.title })).toBeInTheDocument()
    expect(screen.getByText('2 câu · Còn 3 ngày · Chưa làm lần nào')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: `Bắt đầu: ${PERIODIC.title}` })).toHaveAttribute('href', '/tests/100')
    expect(screen.getByText('2 câu · Đã làm 1 lần · cao nhất 62/100')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: `Làm lại: ${COMPREHENSIVE.title}` })).toHaveAttribute('href', '/tests/200')
  })
})

const NEW_ATTEMPT = { attemptId: 57, resumed: false, status: 'IN_PROGRESS', answers: [] }

function takingRoutes(extra = {}) {
  return {
    'GET /api/tests/100': () => ({ data: DETAIL }),
    'POST /api/tests/100/attempts': () => ({ status: 201, data: NEW_ATTEMPT }),
    'PUT /api/test-attempts/57/answers/11': () => ({ status: 204 }),
    'PUT /api/test-attempts/57/answers/12': () => ({ status: 204 }),
    'POST /api/test-attempts/57/submit': () => ({ data: PERIODIC_RESULT }),
    'GET /api/test-attempts/57': () => ({ data: PERIODIC_RESULT }),
    ...extra,
  }
}

describe('taking a test', () => {
  it('saves each answer as it is given and submits after a confirmation', async () => {
    const user = userEvent.setup()
    renderSignedIn('/tests/100', takingRoutes())

    await user.click(await screen.findByRole('button', { name: 'Bắt đầu' }))

    // A picked option is saved at once.
    await user.click(await screen.findByRole('radio', { name: 'has lived' }))
    await waitFor(() => expect(callsTo('PUT /api/test-attempts/57/answers/11')).toHaveLength(1))
    expect(callsTo('PUT /api/test-attempts/57/answers/11')[0].body).toEqual({ optionId: 102 })
    expect(await screen.findByText('Đã lưu')).toBeInTheDocument()

    // Typed text is saved once typing pauses, without leaving the question.
    await user.click(screen.getByRole('button', { name: /Câu tiếp theo/ }))
    await user.type(await screen.findByLabelText('Câu trả lời của bạn'), '  seen ')
    await waitFor(() => expect(callsTo('PUT /api/test-attempts/57/answers/12')).toHaveLength(1))
    expect(callsTo('PUT /api/test-attempts/57/answers/12')[0].body).toEqual({ text: 'seen' })

    await user.click(screen.getByRole('button', { name: 'Nộp bài' }))
    const dialog = await screen.findByRole('dialog', { name: 'Nộp bài kiểm tra?' })
    expect(within(dialog).getByText(/Bạn đã trả lời tất cả các câu/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Nộp bài' }))

    expect(await screen.findByText('100/100')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/tests/100/result/57')
    // Nothing was sent twice, and the result came with the submission (no second request for it).
    expect(callsTo('PUT /api/test-attempts/57/answers/11')).toHaveLength(1)
    expect(callsTo('PUT /api/test-attempts/57/answers/12')).toHaveLength(1)
    expect(callsTo('GET /api/test-attempts/57')).toHaveLength(0)
    // A periodic test never changes the level.
    expect(screen.queryByText(/Trình độ của bạn/)).not.toBeInTheDocument()
  })

  it('warns about empty questions before submitting and leads back to the first one', async () => {
    const user = userEvent.setup()
    renderSignedIn('/tests/100', takingRoutes())

    await user.click(await screen.findByRole('button', { name: 'Bắt đầu' }))
    await user.click(await screen.findByRole('button', { name: /Câu tiếp theo/ }))
    await user.click(screen.getByRole('button', { name: 'Nộp bài' }))

    const dialog = await screen.findByRole('dialog', { name: 'Nộp bài kiểm tra?' })
    expect(within(dialog).getByText(/Bạn còn 2 câu chưa trả lời/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Làm câu còn thiếu' }))

    expect(await screen.findByText(/Câu 1\/2/)).toBeInTheDocument()
    expect(callsTo('POST /api/test-attempts/57/submit')).toHaveLength(0)
  })

  it('resumes an unfinished attempt at its first empty question', async () => {
    const user = userEvent.setup()
    renderSignedIn('/tests/100', {
      ...takingRoutes(),
      'GET /api/tests/100': () => ({ data: { ...DETAIL, hasInProgress: true } }),
      'POST /api/tests/100/attempts': () => ({
        data: { ...NEW_ATTEMPT, resumed: true, answers: [{ questionId: 11, optionId: 102, text: null }] },
      }),
    })

    await user.click(await screen.findByRole('button', { name: 'Làm tiếp' }))

    expect(await screen.findByText(/Câu 2\/2 · đã trả lời 1\/2/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Câu 1 (đã trả lời)' }))
    expect(await screen.findByRole('radio', { name: 'has lived' })).toBeChecked()
    expect(callsTo('POST /api/tests/100/attempts')[0].params).toEqual({ restart: false })
    // What the server already has is not sent again.
    expect(callsTo('PUT /api/test-attempts/57/answers/11')).toHaveLength(0)
  })

  it('restarts from scratch when asked', async () => {
    const user = userEvent.setup()
    renderSignedIn('/tests/100', {
      ...takingRoutes(),
      'GET /api/tests/100': () => ({ data: { ...DETAIL, hasInProgress: true } }),
    })

    await user.click(await screen.findByRole('button', { name: 'Làm lại từ đầu' }))

    expect(await screen.findByText(/Câu 1\/2 · đã trả lời 0\/2/)).toBeInTheDocument()
    expect(callsTo('POST /api/tests/100/attempts')[0].params).toEqual({ restart: true })
  })

  it('asks before signing out in the middle of a test, and keeps the attempt (scenario 3, 4a)', async () => {
    const user = userEvent.setup()
    renderSignedIn('/tests/100', takingRoutes())

    await user.click(await screen.findByRole('button', { name: 'Bắt đầu' }))
    await user.click(await screen.findByRole('button', { name: /Câu tiếp theo/ }))
    await user.type(await screen.findByLabelText('Câu trả lời của bạn'), 'seen')

    const logout = screen.getAllByRole('button', { name: '← Đăng xuất' })[0]
    await user.click(logout)
    let dialog = await screen.findByRole('dialog', { name: 'Đăng xuất?' })
    expect(within(dialog).getByText(/Bài kiểm tra đang làm sẽ được lưu ở trạng thái đang làm/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Ở lại làm bài' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/tests/100')

    await user.click(logout)
    dialog = await screen.findByRole('dialog', { name: 'Đăng xuất?' })
    await user.click(within(dialog).getByRole('button', { name: 'Đăng xuất' }))

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    // The typed answer was saved before leaving, and nothing was submitted.
    expect(callsTo('PUT /api/test-attempts/57/answers/12').at(-1).body).toEqual({ text: 'seen' })
    expect(callsTo('POST /api/test-attempts/57/submit')).toHaveLength(0)
  })

  it('signs out at once when no test is open', async () => {
    const user = userEvent.setup()
    renderSignedIn('/tests/100', takingRoutes())

    await user.click((await screen.findAllByRole('button', { name: '← Đăng xuất' }))[0])

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Đăng xuất?' })).not.toBeInTheDocument()
  })

  it('keeps an answer that could not be saved and sends it again on retry', async () => {
    const user = userEvent.setup()
    let failures = 1
    renderSignedIn('/tests/100', {
      ...takingRoutes(),
      'PUT /api/test-attempts/57/answers/11': () => (failures-- > 0 ? { status: 500 } : { status: 204 }),
    })

    await user.click(await screen.findByRole('button', { name: 'Bắt đầu' }))
    await user.click(await screen.findByRole('radio', { name: 'has lived' }))

    expect(await screen.findByText('Chưa lưu được câu trả lời.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByText('Đã lưu')).toBeInTheDocument()
    expect(callsTo('PUT /api/test-attempts/57/answers/11')).toHaveLength(2)
  })

  it('shows the new level in the sidebar right after a comprehensive test', async () => {
    const user = userEvent.setup()
    let level = 'A2'
    const detail = { ...DETAIL, id: 200, title: COMPREHENSIVE.title, type: 'COMPREHENSIVE', questions: [DETAIL.questions[0]] }
    const result = { ...PERIODIC_RESULT, testId: 200, title: COMPREHENSIVE.title, type: 'COMPREHENSIVE', suggestedLevel: 'B1' }
    renderSignedIn('/tests/200', {
      'GET /api/users/me': () => ({ data: { ...learner, currentLevel: level } }),
      'GET /api/tests/200': () => ({ data: detail }),
      'POST /api/tests/200/attempts': () => ({ status: 201, data: NEW_ATTEMPT }),
      'PUT /api/test-attempts/57/answers/11': () => ({ status: 204 }),
      'POST /api/test-attempts/57/submit': () => {
        level = 'B1'
        return { data: result }
      },
    })
    const sidebarLevel = () => within(screen.getAllByText('Trình độ hiện tại')[0].parentElement).getByText(/^[ABC][12]$/)

    await user.click(await screen.findByRole('button', { name: 'Bắt đầu' }))
    expect(sidebarLevel()).toHaveTextContent('A2')
    await user.click(await screen.findByRole('radio', { name: 'has lived' }))
    await user.click(screen.getByRole('button', { name: 'Nộp bài' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Nộp bài' }))

    expect(await screen.findByText('Trình độ của bạn đổi từ A2 thành B1.')).toBeInTheDocument()
    // C2: the report leads on to the study plan (D2).
    expect(screen.getByRole('link', { name: 'Xem kế hoạch cá nhân →' })).toHaveAttribute('href', '/plan')
    await waitFor(() => expect(sidebarLevel()).toHaveTextContent('B1'))
  })

  it('says so when the test is closed or does not exist', async () => {
    renderSignedIn('/tests/100', {
      'GET /api/tests/100': () => ({ status: 404, data: { status: 404, message: 'Test not found' } }),
    })

    expect(await screen.findByText('Bài kiểm tra không tồn tại hoặc đã hết hạn.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Về danh sách bài kiểm tra/ })).toHaveAttribute('href', '/tests')
  })

  it('shows the AI score of a speaking answer once it is graded', async () => {
    const speaking = { id: 13, type: 'SPEAKING', skill: 'SPEAKING', content: 'Read aloud: "Hello."', points: 5, audioUrl: null, options: [] }
    const graded = {
      ...PERIODIC_RESULT,
      review: [
        { questionId: 13, type: 'SPEAKING', correct: null, selectedOptionId: null, answerText: 'Hello.', correctOptionId: null, correctAnswer: null, points: 5, scoreEarned: 4.5 },
      ],
    }
    renderSignedIn('/tests/100/result/57', {
      'GET /api/tests/100': () => ({ data: { ...DETAIL, questions: [speaking] } }),
      'GET /api/test-attempts/57': () => ({ data: graded }),
    })

    expect(await screen.findByText('4.5/5 điểm')).toBeInTheDocument()
    expect(screen.queryByText('Đang chấm')).not.toBeInTheDocument()
  })

  it('shows which skills the AI is still grading', async () => {
    renderSignedIn('/tests/200/result/58', {
      'GET /api/tests/200': () => ({ data: { ...DETAIL, id: 200, title: COMPREHENSIVE.title, type: 'COMPREHENSIVE' } }),
      'GET /api/test-attempts/58': () => ({ data: PENDING_RESULT }),
    })

    expect(await screen.findByText(/Đang chấm phần Nói/)).toBeInTheDocument()
    expect(screen.getByText('đang chấm')).toBeInTheDocument()
    // Opened later (not straight after submitting): no note about the level.
    expect(screen.queryByText(/Trình độ của bạn/)).not.toBeInTheDocument()
  })
})
