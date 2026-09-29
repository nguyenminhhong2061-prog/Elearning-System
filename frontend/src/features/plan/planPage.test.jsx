import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/app/App'
import { tokenStorage } from '@/api/tokenStorage'
import { installFakeBackend, learner } from '@/test/fakeBackend'
import '@/test/preloadPages'

// Data shaped as docs/api/plans.md and docs/api/progress.md describe it.

const SKILLS = {
  latest: {
    attemptId: 42,
    testTitle: 'Kiểm tra tổng hợp tháng 9',
    takenAt: '2026-09-20T08:30:00Z',
    status: 'GRADED',
    overallScore: 46,
    previousOverallScore: 38,
    level: 'B1',
    skills: {
      listening: { score: 56, level: 'B2' },
      speaking: { score: 38, level: 'A2' },
      reading: { score: 48, level: 'B1' },
      writing: { score: 42, level: 'B1' },
    },
  },
}

const week = (weekNumber, startDate, endDate, extra) => ({
  weekNumber,
  startDate,
  endDate,
  description: `Nội dung tuần ${weekNumber}`,
  targetWords: 40,
  targetExercises: 5,
  wordsDone: 0,
  exercisesDone: 0,
  status: 'PENDING',
  achieved: null,
  ...extra,
})

const PLAN = {
  id: 5,
  goal: { targetLevel: 'B1', months: 3, note: 'Giao tiếp khi đi du lịch' },
  startLevel: 'A2',
  startDate: '2026-09-13',
  endDate: '2026-12-12',
  status: 'ACTIVE',
  dailyMinutes: { min: 20, max: 30 },
  summary: 'Ưu tiên luyện Nói.',
  currentWeek: 3,
  weeks: [
    week(1, '2026-09-13', '2026-09-19', { status: 'DONE', achieved: true, wordsDone: 44, exercisesDone: 6 }),
    week(2, '2026-09-20', '2026-09-26', { status: 'DONE', achieved: false, wordsDone: 31, exercisesDone: 3 }),
    week(3, '2026-09-27', '2026-10-03', { status: 'IN_PROGRESS', wordsDone: 12, exercisesDone: 2 }),
    week(4, '2026-10-04', '2026-10-10'),
  ],
}

const GOAL_OPTIONS = [
  { targetLevel: 'B2', months: 3, dailyMinutes: { min: 20, max: 30 }, recommended: true },
  { targetLevel: 'C1', months: 6, dailyMinutes: { min: 30, max: 45 }, recommended: false },
]

const SUGGESTIONS = {
  items: [
    { type: 'PRACTICE_SKILL', title: 'Tập trung luyện Nói 15 phút/ngày', reason: 'Điểm yếu nhất trong 4 kỹ năng (38/100)', skill: 'SPEAKING' },
    { type: 'LEARN_TOPIC', title: 'Ôn tập chủ đề Kinh doanh', reason: 'Còn 18 từ chưa học', topicId: 4 },
  ],
}

const DRAFT = {
  goal: { targetLevel: 'C1', months: 6, note: 'Thi IELTS' },
  startLevel: 'B1',
  startDate: '2026-09-29',
  endDate: '2027-03-28',
  dailyMinutes: { min: 30, max: 45 },
  summary: 'Lộ trình 26 tuần từ B1 lên C1.',
  weeks: [
    { weekNumber: 1, startDate: '2026-09-29', endDate: '2026-10-05', description: 'Tuần mở đầu', targetWords: 60, targetExercises: 8 },
    { weekNumber: 2, startDate: '2026-10-06', endDate: '2026-10-12', description: 'Tuần hai', targetWords: 60, targetExercises: 8 },
  ],
}

let backend

afterEach(() => backend?.restore())

function renderPlan(routes = {}) {
  tokenStorage.save({ accessToken: 'stored-token', expiresIn: 3600 })
  backend = installFakeBackend({
    'GET /api/users/me': () => ({ data: { ...learner, currentLevel: 'B1' } }),
    'GET /api/progress/skills': () => ({ data: SKILLS }),
    'GET /api/study-plan': () => ({ data: { plan: PLAN, goalOptions: GOAL_OPTIONS } }),
    'GET /api/study-plan/suggestions': () => ({ data: SUGGESTIONS }),
    'GET /api/study-plan/reminder': () => ({ data: { enabled: true, time: '20:00' } }),
    ...routes,
  })
  render(
    <MemoryRouter initialEntries={['/plan']}>
      <App />
    </MemoryRouter>,
  )
}

const callsTo = (key) => backend.calls.filter((call) => call.key === key)

describe('study plan page', () => {
  it('shows the level, what to do next and how this week is going', async () => {
    renderPlan()

    expect(await screen.findByRole('heading', { level: 1, name: 'Kế hoạch học cá nhân' })).toBeInTheDocument()
    expect(await screen.findByText('Điểm tổng: 46/100')).toBeInTheDocument()
    expect(screen.getByText('Tăng 8 điểm so với lần kiểm tra trước')).toBeInTheDocument()

    expect(await screen.findByRole('link', { name: 'Bắt đầu: Tập trung luyện Nói 15 phút/ngày' })).toHaveAttribute(
      'href',
      '/exercises?skill=pronunciation',
    )
    expect(screen.getByRole('link', { name: 'Bắt đầu: Ôn tập chủ đề Kinh doanh' })).toHaveAttribute('href', '/vocabulary/topics/4')

    expect(await screen.findByText('Đạt B1 trong 3 tháng')).toBeInTheDocument()
    expect(screen.getByText('Tuần này · tuần 3/4')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Từ mới' })).toHaveAttribute('aria-valuenow', '12')
    // D2 exception: the last finished week fell short, so a gentle warning, not a penalty.
    expect(screen.getByText('Tuần 2 chưa đạt mục tiêu')).toBeInTheDocument()
    expect(screen.getByText('20:00 mỗi ngày')).toBeInTheDocument()
  })

  it('asks for a goal when there is no plan, previews the AI plan, then applies it', async () => {
    const user = userEvent.setup()
    renderPlan({
      'GET /api/study-plan': () => ({ data: { plan: null, goalOptions: GOAL_OPTIONS } }),
      'POST /api/study-plan/preview': () => ({ data: DRAFT }),
      'POST /api/study-plan': ({ body }) => ({
        status: 201,
        data: {
          ...DRAFT,
          id: 9,
          goal: { targetLevel: body.targetLevel, months: body.months, note: body.note },
          status: 'ACTIVE',
          currentWeek: 1,
          weeks: DRAFT.weeks.map((item, index) => ({ ...item, wordsDone: 0, exercisesDone: 0, status: index === 0 ? 'IN_PROGRESS' : 'PENDING', achieved: null })),
        },
      }),
    })

    expect(await screen.findByRole('heading', { name: 'Đặt mục tiêu học tập' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Đạt B2 trong 3 tháng/ })).toBeChecked() // the recommended one
    await user.click(screen.getByRole('radio', { name: /Đạt C1 trong 6 tháng/ }))
    await user.type(screen.getByLabelText('Ghi chú mục tiêu (không bắt buộc)'), 'Thi IELTS')
    await user.click(screen.getByRole('button', { name: 'Gợi ý lộ trình' }))

    expect(await screen.findByRole('heading', { name: 'Lộ trình gợi ý: Đạt C1 trong 6 tháng' })).toBeInTheDocument()
    expect(callsTo('POST /api/study-plan/preview')[0].body).toEqual({ targetLevel: 'C1', months: 6, note: 'Thi IELTS' })
    expect(screen.getByText('Tuần mở đầu')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Áp dụng kế hoạch' }))

    expect(await screen.findByText('Đã áp dụng kế hoạch mới. Chúc bạn học tốt!')).toBeInTheDocument()
    expect(screen.getByText('Tuần này · tuần 1/2')).toBeInTheDocument()
    // The plan saved is exactly the one previewed.
    expect(callsTo('POST /api/study-plan')[0].body).toEqual({
      targetLevel: 'C1',
      months: 6,
      note: 'Thi IELTS',
      summary: 'Lộ trình 26 tuần từ B1 lên C1.',
      weeks: [
        { weekNumber: 1, description: 'Tuần mở đầu', targetWords: 60, targetExercises: 8 },
        { weekNumber: 2, description: 'Tuần hai', targetWords: 60, targetExercises: 8 },
      ],
    })
  })

  it('lets the learner choose their own level and duration', async () => {
    const user = userEvent.setup()
    renderPlan({
      'GET /api/study-plan': () => ({ data: { plan: null, goalOptions: GOAL_OPTIONS } }),
      'POST /api/study-plan/preview': () => ({ data: DRAFT }),
    })

    await user.click(await screen.findByRole('radio', { name: /Mục tiêu khác/ }))
    await user.selectOptions(screen.getByLabelText('Trình độ mục tiêu'), 'C2')
    await user.selectOptions(screen.getByLabelText('Thời gian'), '9')
    await user.click(screen.getByRole('button', { name: 'Gợi ý lộ trình' }))

    await waitFor(() => expect(callsTo('POST /api/study-plan/preview')).toHaveLength(1))
    expect(callsTo('POST /api/study-plan/preview')[0].body).toEqual({ targetLevel: 'C2', months: 9, note: null })
    // Levels below the current one (B1) cannot be chosen.
    expect(within(screen.getByLabelText('Trình độ mục tiêu')).queryByRole('option', { name: 'A2' })).not.toBeInTheDocument()
  })

  it('says when the AI cannot write a plan, and keeps the form', async () => {
    const user = userEvent.setup()
    renderPlan({
      'GET /api/study-plan': () => ({ data: { plan: null, goalOptions: GOAL_OPTIONS } }),
      'POST /api/study-plan/preview': () => ({ status: 503, data: { status: 503, message: 'AI unavailable' } }),
    })

    await user.click(await screen.findByRole('button', { name: 'Gợi ý lộ trình' }))

    expect(await screen.findByText('Trợ lý AI chưa gợi ý được lộ trình lúc này. Vui lòng thử lại sau.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gợi ý lộ trình' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Áp dụng kế hoạch' })).not.toBeInTheDocument()
  })

  it('opens the goal form from the plan and goes back with "Hủy"', async () => {
    const user = userEvent.setup()
    renderPlan()

    await user.click(await screen.findByRole('button', { name: 'Đặt lại mục tiêu' }))
    expect(screen.getByRole('heading', { name: 'Đặt lại mục tiêu học tập' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Kế hoạch của bạn' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(screen.getByRole('heading', { name: 'Kế hoạch của bạn' })).toBeInTheDocument()
  })

  it('pauses the plan and stops warning about missed weeks', async () => {
    const user = userEvent.setup()
    renderPlan({ 'PATCH /api/study-plan': ({ body }) => ({ data: { ...PLAN, status: body.status } }) })

    await user.click(await screen.findByRole('button', { name: 'Tạm dừng kế hoạch' }))

    expect(await screen.findByRole('button', { name: 'Tiếp tục kế hoạch' })).toBeInTheDocument()
    expect(callsTo('PATCH /api/study-plan')[0].body).toEqual({ status: 'PAUSED' })
    expect(screen.getByText(/Kế hoạch đang tạm dừng/)).toBeInTheDocument()
    expect(screen.queryByText('Tuần 2 chưa đạt mục tiêu')).not.toBeInTheDocument()
  })

  it('saves the reminder as soon as it changes', async () => {
    const user = userEvent.setup()
    renderPlan({ 'PUT /api/study-plan/reminder': ({ body }) => ({ data: body }) })

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Giờ nhắc' }), '21:30')
    expect(await screen.findByText('21:30 mỗi ngày')).toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: 'Nhắc tôi học mỗi ngày' }))

    expect(await screen.findByText('Đang tắt')).toBeInTheDocument()
    expect(callsTo('PUT /api/study-plan/reminder').map((call) => call.body)).toEqual([
      { enabled: true, time: '21:30' },
      { enabled: false, time: '21:30' },
    ])
  })

  it('keeps the other blocks when one of them fails to load', async () => {
    renderPlan({ 'GET /api/study-plan/suggestions': () => ({ status: 500, data: { status: 500, message: 'boom' } }) })

    const suggestions = (await screen.findByRole('heading', { name: 'Việc nên làm' })).closest('section')
    expect(await within(suggestions).findByText('Máy chủ đang gặp sự cố. Vui lòng thử lại sau.')).toBeInTheDocument()
    expect(within(suggestions).getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
    expect(await screen.findByText('Đạt B1 trong 3 tháng')).toBeInTheDocument()
    expect(screen.getByText('Điểm tổng: 46/100')).toBeInTheDocument()
  })

  it('invites a learner without a comprehensive test to take one', async () => {
    renderPlan({ 'GET /api/progress/skills': () => ({ data: { latest: null } }) })

    expect(await screen.findByText(/Bạn chưa làm bài kiểm tra tổng hợp/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Làm bài kiểm tra tổng hợp' })).toHaveAttribute('href', '/tests')
  })
})
