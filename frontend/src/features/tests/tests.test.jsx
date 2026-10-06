import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/app/App'
import { tokenStorage } from '@/api/tokenStorage'
import { startRecording, toWav } from '@/features/exercises/pronunciation/recorder'
import { installFakeBackend, learner } from '@/test/fakeBackend'
import '@/test/preloadPages'
import { GRADING_POLL_MS } from './constants'

// jsdom has no microphone: the recorder shared with the pronunciation exercises is replaced (its own logic is
// tested there).
vi.mock('@/features/exercises/pronunciation/recorder', async (importOriginal) => ({
  ...(await importOriginal()),
  isRecordingSupported: () => true,
  startRecording: vi.fn(),
  toWav: vi.fn(),
}))

// Data shaped exactly as docs/api/tests.md describes it.
const PERIODIC = {
  id: 100,
  title: 'Kiểm tra định kỳ — tuần 40',
  type: 'PERIODIC',
  skill: null,
  startDate: null,
  endDate: null,
  retakeAllowed: true,
  questionCount: 2,
  progress: { attemptCount: 0, bestScorePercent: null, lastCompletedAt: null, lastAttemptId: null, inProgress: null },
}

const COMPREHENSIVE = {
  id: 200,
  title: 'Kiểm tra tổng hợp tháng 9',
  type: 'COMPREHENSIVE',
  skill: null,
  startDate: null,
  endDate: null,
  retakeAllowed: false,
  questionCount: 2,
  progress: { attemptCount: 1, bestScorePercent: 62, lastCompletedAt: '2026-09-20T08:30:00Z', lastAttemptId: 7, inProgress: null },
}

const DETAIL = {
  id: 100,
  title: PERIODIC.title,
  type: 'PERIODIC',
  skill: null,
  startDate: null,
  endDate: null,
  retakeAllowed: true,
  passages: [],
  hasInProgress: false,
  lastAttemptId: null,
  questions: [
    {
      id: 11,
      passageId: null,
      type: 'MULTIPLE_CHOICE',
      skill: 'READING',
      content: 'She ___ (live) in Hanoi for five years.',
      points: 1,
      audioUrl: null,
      referenceText: null,
      maxRecordingSeconds: null,
      options: [
        { id: 101, content: 'lives' },
        { id: 102, content: 'has lived' },
      ],
    },
    {
      id: 12,
      passageId: null,
      type: 'FILL_BLANK',
      skill: 'WRITING',
      content: 'I have never ___ (see) such a beach.',
      points: 1,
      audioUrl: null,
      referenceText: null,
      maxRecordingSeconds: null,
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
  passages: [],
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
    // A comprehensive test is taken once: what is left of a submitted one is its result.
    expect(screen.getByText('2 câu · Đã làm · 62/100')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: `Xem kết quả: ${COMPREHENSIVE.title}` })).toHaveAttribute('href', '/tests/200/result/7')
  })

  it('offers a periodic test again after it has been taken', async () => {
    const taken = { ...PERIODIC, progress: { ...PERIODIC.progress, attemptCount: 2, bestScorePercent: 80, lastAttemptId: 9 } }
    renderSignedIn('/tests', { 'GET /api/tests': () => ({ data: [taken] }) })

    expect(await screen.findByText('2 câu · Đã làm 2 lần · cao nhất 80/100')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: `Làm lại: ${PERIODIC.title}` })).toHaveAttribute('href', '/tests/100')
  })

  it('opens the history of a test from its card, each attempt leading to its result', async () => {
    const user = userEvent.setup()
    const taken = { ...PERIODIC, progress: { ...PERIODIC.progress, attemptCount: 2, bestScorePercent: 80, lastAttemptId: 9 } }
    renderSignedIn('/tests', {
      'GET /api/tests': () => ({ data: [taken, { ...PERIODIC, id: 102, title: 'Chưa làm' }, COMPREHENSIVE] }),
      'GET /api/tests/100/attempts': () => ({
        data: [
          { attemptId: 9, status: 'SUBMITTED', submittedAt: '2026-10-06T14:26:00Z', scorePercent: null, suggestedLevel: null },
          { attemptId: 7, status: 'GRADED', submittedAt: '2026-09-29T14:19:00Z', scorePercent: 80, suggestedLevel: 'B1' },
        ],
      }),
    })

    // Only a test with submitted attempts that can be taken again has a history button.
    const open = await screen.findByRole('button', { name: `Lịch sử làm bài: ${PERIODIC.title}` })
    expect(screen.queryByRole('button', { name: 'Lịch sử làm bài: Chưa làm' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: `Lịch sử làm bài: ${COMPREHENSIVE.title}` })).not.toBeInTheDocument()
    // Nothing is fetched before the dialog opens.
    expect(callsTo('GET /api/tests/100/attempts')).toHaveLength(0)

    await user.click(open)

    const dialog = await screen.findByRole('dialog', { name: 'Lịch sử làm bài' })
    const attempts = await within(dialog).findAllByRole('link')
    expect(attempts).toHaveLength(2)
    // Newest first; the oldest attempt is "Lần 1". Times are Vietnam time.
    expect(attempts[0]).toHaveAttribute('href', '/tests/100/result/9')
    expect(attempts[0]).toHaveTextContent('Lần 2')
    expect(attempts[0]).toHaveTextContent('21:26, 06/10/2026')
    expect(attempts[0]).toHaveTextContent('Đang chấm')
    expect(attempts[1]).toHaveAttribute('href', '/tests/100/result/7')
    expect(attempts[1]).toHaveTextContent('Lần 1')
    expect(attempts[1]).toHaveTextContent('80/100 · B1')
  })
})

const NEW_ATTEMPT = { attemptId: 57, resumed: false, status: 'IN_PROGRESS', answers: [], passagePlays: [] }

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
    expect(within(dialog).getByText('Bạn còn 2 câu chưa trả lời (câu 1, 2). Câu bỏ trống được tính 0 điểm.')).toBeInTheDocument()
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

  it('only offers to continue an unfinished test, never to restart it (scenario 14, branch 7a)', async () => {
    renderSignedIn('/tests/100', {
      ...takingRoutes(),
      'GET /api/tests/100': () => ({ data: { ...DETAIL, hasInProgress: true } }),
    })

    expect(await screen.findByRole('button', { name: 'Làm tiếp' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Làm lại từ đầu' })).not.toBeInTheDocument()
    expect(screen.getByText('Bạn đang làm dở bài này. Các câu đã trả lời được giữ lại.')).toBeInTheDocument()
  })

  it('introduces a multi-part test with its content and parts, numbers its questions by part and counts essay words', async () => {
    const user = userEvent.setup()
    const questions = [
      { id: 21, type: 'LISTENING', skill: 'LISTENING', content: 'Where is the man flying to?', points: 1, audioUrl: '/media/trip.mp3', options: [{ id: 211, content: 'Hanoi' }, { id: 212, content: 'Singapore' }] },
      { id: 22, type: 'SPEAKING', skill: 'SPEAKING', content: 'Introduce yourself.', points: 5, audioUrl: null, options: [] },
      { id: 23, type: 'WRITING', skill: 'WRITING', content: 'Write about your last holiday.', points: 5, audioUrl: null, options: [] },
    ]
    renderSignedIn('/tests/200', {
      'GET /api/tests/200': () => ({ data: { ...DETAIL, id: 200, type: 'COMPREHENSIVE', skill: 'Nghe, nói, viết về du lịch', questions } }),
      'POST /api/tests/200/attempts': () => ({ status: 201, data: NEW_ATTEMPT }),
      'PUT /api/test-attempts/57/answers/23': () => ({ status: 204 }),
    })

    expect(await screen.findByText('Nội dung: Nghe, nói, viết về du lịch')).toBeInTheDocument()
    const parts = screen.getByRole('table', { name: 'Cấu trúc đề' })
    expect(within(parts).getAllByRole('row').slice(1).map((row) => row.textContent)).toEqual([
      'Nghe1trắc nghiệm',
      'Nói1đề bài nói',
      'Viết1bài viết',
    ])

    await user.click(screen.getByRole('button', { name: 'Bắt đầu' }))
    const nav = await screen.findByRole('navigation', { name: 'Chuyển câu hỏi' })
    expect(within(nav).getByRole('group', { name: 'Phần Nghe' })).toHaveTextContent('Nghe1')
    expect(within(nav).getByRole('group', { name: 'Phần Viết' })).toHaveTextContent('Viết3')

    await user.click(within(nav).getByRole('button', { name: 'Câu 3' }))
    await user.type(screen.getByLabelText('Bài viết của bạn'), 'We went to Da Lat last summer')
    expect(screen.getByText('7 từ')).toBeInTheDocument()
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
    // Scenario 15, step 18: who, when and the level before; the roadmap can be applied to the study plan (D2).
    expect(screen.getByText('Người học: Nguyễn Minh Hồng · Ngày làm: 27/09/2026 · Trình độ trước khi làm bài: A2')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Áp dụng lộ trình vào kế hoạch học →' })).toHaveAttribute('href', '/plan')
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

// A test whose first two questions are about one recording and whose third is about a text.
const PASSAGE_DETAIL = {
  ...DETAIL,
  passages: [
    { id: 3, title: 'At the airport', content: null, audioUrl: '/media/listening/airport.mp3', maxPlays: 2 },
    { id: 4, title: 'The museum', content: 'The museum opens at 9 a.m. every day except Monday.', audioUrl: null, maxPlays: null },
  ],
  questions: [
    { id: 31, passageId: 3, type: 'LISTENING', skill: 'LISTENING', content: 'Which flight is boarding?', points: 1, audioUrl: null, options: [{ id: 311, content: 'VN209' }, { id: 312, content: 'VN290' }] },
    { id: 32, passageId: 3, type: 'LISTENING', skill: 'LISTENING', content: 'Which gate should passengers go to?', points: 1, audioUrl: null, options: [{ id: 321, content: 'Gate 5' }, { id: 322, content: 'Gate 9' }] },
    { id: 33, passageId: 4, type: 'READING', skill: 'READING', content: 'When is the museum closed?', points: 1, audioUrl: null, options: [{ id: 331, content: 'Monday' }, { id: 332, content: 'Sunday' }] },
  ],
}

describe('passages and the listening limit', () => {
  // jsdom does not play media: the player only needs play() to resolve. The stubs stay for the whole file, because
  // the player pauses when it is unmounted, after the test's own cleanup.
  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  beforeEach(() => window.HTMLMediaElement.prototype.play.mockClear())

  it('shows the passage above its questions and counts each play with the server', async () => {
    const user = userEvent.setup()
    let playCount = 0
    renderSignedIn('/tests/100', {
      'GET /api/tests/100': () => ({ data: PASSAGE_DETAIL }),
      'POST /api/tests/100/attempts': () => ({ status: 201, data: NEW_ATTEMPT }),
      'POST /api/test-attempts/57/passages/3/plays': () => ({ data: { passageId: 3, playCount: ++playCount, maxPlays: 2 } }),
    })

    expect(await screen.findByText('Mỗi bài nghe được nghe tối đa 2 lần.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Bắt đầu' }))

    const listening = await screen.findByRole('region', { name: 'Bài nghe' })
    expect(within(listening).getByText('Bài nghe: At the airport')).toBeInTheDocument()
    // The browser's own controls would let the learner replay freely.
    expect(listening.querySelector('audio')).not.toHaveAttribute('controls')

    // The play starts only once the server has counted it.
    await user.click(within(listening).getByRole('button', { name: 'Nghe (còn 2 lần)' }))
    expect(await within(listening).findByRole('button', { name: 'Đang phát…' })).toBeDisabled()
    expect(callsTo('POST /api/test-attempts/57/passages/3/plays')).toHaveLength(1)
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1)

    // The next question is about the same recording: the player stays, still playing.
    await user.click(screen.getByRole('button', { name: /Câu tiếp theo/ }))
    expect(await screen.findByText('Which gate should passengers go to?')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Bài nghe' })).getByRole('button', { name: 'Đang phát…' })).toBeDisabled()

    fireEvent.ended(document.querySelector('audio'))
    await user.click(await screen.findByRole('button', { name: 'Nghe (còn 1 lần)' }))
    fireEvent.ended(document.querySelector('audio'))
    expect(await screen.findByRole('button', { name: 'Đã hết lượt nghe' })).toBeDisabled()
    expect(callsTo('POST /api/test-attempts/57/passages/3/plays')).toHaveLength(2)

    // The last question is about a text.
    await user.click(screen.getByRole('button', { name: /Câu tiếp theo/ }))
    const reading = await screen.findByRole('region', { name: 'Đoạn đọc' })
    expect(within(reading).getByText('The museum opens at 9 a.m. every day except Monday.')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Bài nghe' })).not.toBeInTheDocument()
  })

  it('gives no plays back when an attempt is resumed, and trusts the server when it refuses a play', async () => {
    const user = userEvent.setup()
    renderSignedIn('/tests/100', {
      'GET /api/tests/100': () => ({ data: { ...PASSAGE_DETAIL, hasInProgress: true } }),
      'POST /api/tests/100/attempts': () => ({
        data: { ...NEW_ATTEMPT, resumed: true, passagePlays: [{ passageId: 3, playCount: 1, maxPlays: 2 }] },
      }),
      'POST /api/test-attempts/57/passages/3/plays': () => ({ status: 409, data: { status: 409, message: 'No plays left' } }),
    })

    await user.click(await screen.findByRole('button', { name: 'Làm tiếp' }))
    await user.click(await screen.findByRole('button', { name: 'Nghe (còn 1 lần)' }))

    expect(await screen.findByRole('button', { name: 'Đã hết lượt nghe' })).toBeDisabled()
    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
  })
})

describe('a test taken only once', () => {
  const ONCE_DETAIL = { ...DETAIL, id: 200, title: COMPREHENSIVE.title, type: 'COMPREHENSIVE', retakeAllowed: false }

  it('asks before starting, because there is no second attempt', async () => {
    const user = userEvent.setup()
    renderSignedIn('/tests/200', {
      'GET /api/tests/200': () => ({ data: ONCE_DETAIL }),
      'POST /api/tests/200/attempts': () => ({ status: 201, data: NEW_ATTEMPT }),
    })

    expect(await screen.findByText('Bài này chỉ làm được một lần: sau khi nộp bạn không làm lại được.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Bắt đầu' }))
    const dialog = await screen.findByRole('dialog', { name: 'Bắt đầu bài kiểm tra?' })
    expect(callsTo('POST /api/tests/200/attempts')).toHaveLength(0)

    await user.click(within(dialog).getByRole('button', { name: 'Bắt đầu làm bài' }))
    expect(await screen.findByText(/Câu 1\/2/)).toBeInTheDocument()
    expect(callsTo('POST /api/tests/200/attempts')).toHaveLength(1)
  })

  it('opens the result instead of the test once it has been submitted', async () => {
    renderSignedIn('/tests/200', {
      'GET /api/tests/200': () => ({ data: { ...ONCE_DETAIL, lastAttemptId: 58 } }),
      'GET /api/test-attempts/58': () => ({ data: { ...PERIODIC_RESULT, attemptId: 58, testId: 200, title: COMPREHENSIVE.title, type: 'COMPREHENSIVE' } }),
    })

    expect(await screen.findByText('100/100')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/tests/200/result/58')
    // Its result offers no second attempt either.
    expect(screen.queryByRole('link', { name: 'Làm lại' })).not.toBeInTheDocument()
  })

  it('says so when the server refuses to start it again', async () => {
    const user = userEvent.setup()
    renderSignedIn('/tests/200', {
      'GET /api/tests/200': () => ({ data: ONCE_DETAIL }),
      'POST /api/tests/200/attempts': () => ({ status: 409, data: { status: 409, message: 'This test can only be taken once: 200' } }),
    })

    await user.click(await screen.findByRole('button', { name: 'Bắt đầu' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Bắt đầu làm bài' }))

    expect(await screen.findByText('Bài kiểm tra này chỉ làm được một lần và bạn đã làm rồi.')).toBeInTheDocument()
  })
})

describe('the review of a result', () => {
  it('shows each passage with its transcript, the level of the questions and what the AI said', async () => {
    const writing = { id: 34, passageId: null, type: 'WRITING', skill: 'WRITING', content: 'Describe your last holiday.', points: 6, audioUrl: null, options: [] }
    const result = {
      ...PERIODIC_RESULT,
      passages: [
        { id: 3, title: 'At the airport', content: null, audioUrl: '/media/listening/airport.mp3', transcript: 'Flight VN209 is now boarding at Gate 5.' },
        { id: 4, title: 'The museum', content: 'The museum opens at 9 a.m. every day except Monday.', audioUrl: null, transcript: null },
      ],
      review: [
        { questionId: 31, passageId: 3, type: 'LISTENING', level: 'A2', correct: true, selectedOptionId: 311, answerText: null, correctOptionId: 311, correctAnswer: 'VN209', points: 1, scoreEarned: 1, aiCriteria: null, aiComment: null },
        { questionId: 32, passageId: 3, type: 'LISTENING', level: 'B1', correct: false, selectedOptionId: 322, answerText: null, correctOptionId: 321, correctAnswer: 'Gate 5', points: 1, scoreEarned: 0, aiCriteria: null, aiComment: null },
        { questionId: 33, passageId: 4, type: 'READING', level: null, correct: true, selectedOptionId: 331, answerText: null, correctOptionId: 331, correctAnswer: 'Monday', points: 1, scoreEarned: 1, aiCriteria: null, aiComment: null },
        { questionId: 34, passageId: null, type: 'WRITING', level: 'B1', correct: null, selectedOptionId: null, answerText: 'Last summer I go to Da Nang.', correctOptionId: null, correctAnswer: null, points: 6, scoreEarned: 3, aiCriteria: { task: 4, coherence: 3, vocabulary: 3, grammar: 0 }, aiComment: 'Ý rõ ràng; cần ôn lại thì quá khứ đơn.' },
      ],
    }
    renderSignedIn('/tests/100/result/57', {
      'GET /api/tests/100': () => ({ data: { ...PASSAGE_DETAIL, questions: [...PASSAGE_DETAIL.questions, writing] } }),
      'GET /api/test-attempts/57': () => ({ data: result }),
    })

    // One block per passage, however many questions it has; the recording is free to replay now.
    expect(await screen.findAllByText('Bài nghe: At the airport')).toHaveLength(1)
    expect(document.querySelector('audio')).toHaveAttribute('controls')
    expect(screen.getByText('Lời thoại')).toBeInTheDocument()
    expect(screen.getByText('Flight VN209 is now boarding at Gate 5.')).toBeInTheDocument()
    expect(screen.getByText('Đoạn đọc: The museum')).toBeInTheDocument()

    expect(screen.getByLabelText('Bậc A2')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Bậc B1')).toHaveLength(2)

    const feedback = screen.getByText('Nhận xét của AI').parentElement
    expect(feedback).toHaveTextContent('Đáp ứng đề bài: B2')
    expect(feedback).toHaveTextContent('Mạch lạc: B1')
    expect(feedback).toHaveTextContent('Ngữ pháp: chưa đạt A1')
    expect(feedback).toHaveTextContent('Ý rõ ràng; cần ôn lại thì quá khứ đơn.')
    expect(screen.getByText('3/6 điểm')).toBeInTheDocument()

    // A periodic test may be taken again.
    expect(screen.getByRole('link', { name: 'Làm lại' })).toHaveAttribute('href', '/tests/100')
  })

  it('fills in by itself once the AI has finished grading', async () => {
    let graded = false
    const done = { ...PENDING_RESULT, status: 'GRADED', scorePercent: 46, suggestedLevel: 'B1', skills: { ...PENDING_RESULT.skills, speaking: { score: 38, level: 'A2' } } }
    renderSignedIn('/tests/200/result/58', {
      'GET /api/tests/200': () => ({ data: { ...DETAIL, id: 200, title: COMPREHENSIVE.title, type: 'COMPREHENSIVE', retakeAllowed: false } }),
      'GET /api/test-attempts/58': () => ({ data: graded ? done : PENDING_RESULT }),
    })

    expect(await screen.findByText(/Trang này tự cập nhật/)).toBeInTheDocument()
    graded = true

    expect(await screen.findByText('46/100', {}, { timeout: GRADING_POLL_MS + 3000 })).toBeInTheDocument()
    expect(screen.getByText('38 · A2')).toBeInTheDocument()
    // The level the test has just set is read again for the sidebar.
    expect(callsTo('GET /api/users/me').length).toBeGreaterThan(1)
  }, GRADING_POLL_MS + 10_000)
})

// A test whose first question is read aloud (answered with a recording) and whose second is a choice question.
const READ_ALOUD_QUESTION = {
  id: 41,
  passageId: null,
  type: 'SPEAKING',
  skill: 'SPEAKING',
  content: 'Read the sentence aloud.',
  points: 5,
  audioUrl: null,
  referenceText: 'Sustainability is a shared responsibility.',
  maxRecordingSeconds: 15,
  options: [],
}
const READ_ALOUD_DETAIL = { ...DETAIL, questions: [READ_ALOUD_QUESTION, DETAIL.questions[0]] }
const WAV = new Blob(['wav'], { type: 'audio/wav' })

describe('read-aloud speaking questions', () => {
  beforeEach(() => {
    startRecording.mockReset()
    toWav.mockReset()
    startRecording.mockResolvedValue({
      stop: vi.fn().mockResolvedValue({ blob: new Blob(['raw']), elapsedMs: 1500 }),
      cancel: vi.fn(),
    })
    toWav.mockResolvedValue({ wav: WAV, durationMs: 1200 })
    URL.createObjectURL = vi.fn(() => 'blob:recording')
    URL.revokeObjectURL = vi.fn()
  })

  async function recordOnce(user) {
    await user.click(await screen.findByRole('button', { name: /^Ghi (âm|lại)$/ }))
    await user.click(await screen.findByRole('button', { name: 'Dừng ghi âm' }))
  }

  it('records the sentence, sends the recording at once and counts the question as answered', async () => {
    const user = userEvent.setup()
    renderSignedIn('/tests/100', {
      'GET /api/tests/100': () => ({ data: READ_ALOUD_DETAIL }),
      'POST /api/tests/100/attempts': () => ({ status: 201, data: NEW_ATTEMPT }),
      'PUT /api/test-attempts/57/answers/41/recording': () => ({ status: 204 }),
    })

    expect(await screen.findByText(/2 câu \(1 câu chọn đáp án, 1 câu ghi âm\)/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Bắt đầu' }))

    // The sentence to read and a recorder, not a box to type in.
    expect(await screen.findByLabelText('Câu cần đọc')).toHaveTextContent('Sustainability is a shared responsibility.')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText(/Câu 1\/2 · đã trả lời 0\/2/)).toBeInTheDocument()

    await recordOnce(user)

    await waitFor(() => expect(callsTo('PUT /api/test-attempts/57/answers/41/recording')).toHaveLength(1))
    expect(callsTo('PUT /api/test-attempts/57/answers/41/recording')[0].body).toBe(WAV)
    expect(await screen.findByText(/Đã lưu bản ghi âm/)).toBeInTheDocument()
    // Answered now, the learner can listen to the recording and make another one.
    expect(screen.getByText(/Câu 1\/2 · đã trả lời 1\/2/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Câu 1 (đã trả lời)' })).toBeInTheDocument()
    expect(screen.getByLabelText('Bản ghi âm của bạn')).toHaveAttribute('src', 'blob:recording')
    expect(screen.getByRole('button', { name: 'Ghi lại' })).toBeEnabled()
    // How it was pronounced is not shown before the test is submitted.
    expect(screen.queryByText(/Điểm phát âm/)).not.toBeInTheDocument()
  })

  it('keeps a recording the service could not assess and sends the same one again', async () => {
    const user = userEvent.setup()
    let failures = 1
    renderSignedIn('/tests/100', {
      'GET /api/tests/100': () => ({ data: READ_ALOUD_DETAIL }),
      'POST /api/tests/100/attempts': () => ({ status: 201, data: NEW_ATTEMPT }),
      'PUT /api/test-attempts/57/answers/41/recording': () =>
        failures-- > 0 ? { status: 503, data: { status: 503, message: 'Pronunciation assessment service is unavailable' } } : { status: 204 },
    })

    await user.click(await screen.findByRole('button', { name: 'Bắt đầu' }))
    await recordOnce(user)

    expect(await screen.findByText(/Dịch vụ chấm phát âm chưa sẵn sàng/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Câu 1' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Gửi lại' }))

    expect(await screen.findByText(/Đã lưu bản ghi âm/)).toBeInTheDocument()
    expect(callsTo('PUT /api/test-attempts/57/answers/41/recording')).toHaveLength(2)
    // The learner did not have to record again.
    expect(toWav).toHaveBeenCalledTimes(1)
  })

  it('resumes a recorded question as answered and lets the learner record it again', async () => {
    const user = userEvent.setup()
    renderSignedIn('/tests/100', {
      'GET /api/tests/100': () => ({ data: { ...READ_ALOUD_DETAIL, hasInProgress: true } }),
      'POST /api/tests/100/attempts': () => ({
        data: { ...NEW_ATTEMPT, resumed: true, answers: [{ questionId: 41, optionId: null, text: null, recorded: true }] },
      }),
    })

    await user.click(await screen.findByRole('button', { name: 'Làm tiếp' }))

    // It opens at the choice question, the first one without an answer.
    expect(await screen.findByText(/Câu 2\/2 · đã trả lời 1\/2/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Câu 1 (đã trả lời)' }))
    expect(await screen.findByText(/Bạn đã ghi âm câu này/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ghi lại' })).toBeEnabled()
  })

  it('shows in the result what was heard, the score and the words that were mispronounced', async () => {
    const result = {
      ...PERIODIC_RESULT,
      review: [
        {
          questionId: 41, passageId: null, type: 'SPEAKING', level: 'B2', correct: null, selectedOptionId: null,
          answerText: 'sustainability is a share responsibility', correctOptionId: null,
          correctAnswer: 'Sustainability is a shared responsibility.', points: 5, scoreEarned: 3.75,
          aiCriteria: null, aiComment: null,
          pronunciation: {
            score: 75, phonemeAccuracy: 90, wordAccuracy: 80,
            errors: [
              { word: 'shared', expectedIpa: 'ʃɛrd', heardIpa: 'ʃɛr' },
              { word: 'a', expectedIpa: 'ə', heardIpa: '' },
            ],
          },
        },
      ],
    }
    renderSignedIn('/tests/100/result/57', {
      'GET /api/tests/100': () => ({ data: READ_ALOUD_DETAIL }),
      'GET /api/test-attempts/57': () => ({ data: result }),
    })

    expect(await screen.findByText('Hệ thống nghe được:')).toBeInTheDocument()
    expect(screen.getByText('sustainability is a share responsibility')).toBeInTheDocument()
    expect(screen.getByText('Câu mẫu:')).toBeInTheDocument()
    expect(screen.getByText('Sustainability is a shared responsibility.')).toBeInTheDocument()

    const feedback = screen.getByText('Chấm phát âm').parentElement
    expect(feedback).toHaveTextContent('Điểm phát âm: 75/100')
    expect(feedback).toHaveTextContent('Khớp âm: 90%')
    expect(feedback).toHaveTextContent('Khớp từ: 80%')
    expect(feedback).toHaveTextContent('“shared”: mong đợi /ʃɛrd/, nghe được /ʃɛr/')
    expect(feedback).toHaveTextContent('“a”: chưa đọc hoặc không nghe rõ')
    // Scored, not right or wrong.
    expect(screen.getByText('3.75/5 điểm')).toBeInTheDocument()
  })
})
