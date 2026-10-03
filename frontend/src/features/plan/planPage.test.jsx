import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/app/App'
import { tokenStorage } from '@/api/tokenStorage'
import { addDays, lastDayAfterMonths, todayInVietnam } from '@/lib/dates'
import { installFakeBackend, learner } from '@/test/fakeBackend'
import '@/test/preloadPages'
import { periodLine, planWeeks } from './plan'

// Scenarios 17 and 18, with data shaped as docs/api/plans.md and docs/api/progress.md describe it. Dates are counted
// from today, because the page compares them with today.

const TODAY = todayInVietnam()
const weekday = new Date(`${TODAY}T00:00:00Z`).getUTCDay() // 0 = Sunday
const THIS_MONDAY = addDays(TODAY, weekday === 0 ? -6 : 1 - weekday)

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

// A plan in its third week: weeks 1 and 2 are over (week 2 fell short), week 3 is this week, week 4 is next week.
const PLAN_START = addDays(THIS_MONDAY, -14)
const PLAN_END = addDays(PLAN_START, 27)
const WEEK_STATE = [
  { status: 'DONE', achieved: true, wordsDone: 44, exercisesDone: 6 },
  { status: 'DONE', achieved: false, wordsDone: 31, exercisesDone: 3 },
  { status: 'IN_PROGRESS', achieved: null, wordsDone: 12, exercisesDone: 2 },
  { status: 'PENDING', achieved: null, wordsDone: 0, exercisesDone: 0 },
]
const PLAN = {
  id: 5,
  goal: { targetLevel: 'B1', description: 'Giao tiếp khi đi du lịch' },
  startLevel: 'A2',
  startDate: PLAN_START,
  endDate: PLAN_END,
  status: 'ACTIVE',
  dailyMinutes: { min: 20, max: 30 },
  summary: 'Ưu tiên luyện Nói.',
  currentWeek: 3,
  weeks: planWeeks(PLAN_START, PLAN_END).map((week, index) => ({
    ...week,
    description: `Nội dung tuần ${week.weekNumber}`,
    targetWords: 40,
    targetExercises: 5,
    ...WEEK_STATE[index],
  })),
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

// The learner's own goal of scenario 17, step 3: B2, from next Monday for two weeks.
const START = addDays(THIS_MONDAY, 7)
const END = addDays(START, 13)
const DESCRIPTION = 'Đạt B2 để phỏng vấn học bổng'
const DRAFT = {
  goal: { targetLevel: 'B2', description: DESCRIPTION },
  startLevel: 'B1',
  startDate: START,
  endDate: END,
  dailyMinutes: { min: 20, max: 30 },
  summary: 'Lộ trình 2 tuần từ B1 lên B2.',
  weeks: planWeeks(START, END).map((week) => ({ ...week, description: `Tuần ${week.weekNumber}: từ vựng Công việc`, targetWords: 50, targetExercises: 6 })),
}

/** What POST /api/study-plan answers: the plan saved from the body, nothing started yet. */
const savedPlan = (body) => ({
  ...DRAFT,
  id: 9,
  goal: { targetLevel: body.targetLevel, description: body.description },
  startDate: body.startDate,
  endDate: body.endDate,
  summary: body.summary,
  status: 'ACTIVE',
  currentWeek: null,
  weeks: planWeeks(body.startDate, body.endDate).map((week, index) => ({
    ...week,
    ...body.weeks[index],
    wordsDone: 0,
    exercisesDone: 0,
    status: 'PENDING',
    achieved: null,
  })),
})

let backend

afterEach(() => backend?.restore())

function renderPlan(routes = {}, state = null) {
  tokenStorage.save({ accessToken: 'stored-token', expiresIn: 3600 })
  backend = installFakeBackend({
    'GET /api/users/me': () => ({ data: { ...learner, currentLevel: 'B1' } }),
    'GET /api/progress/skills': () => ({ data: SKILLS }),
    'GET /api/study-plan': () => ({ data: { plan: PLAN, goalOptions: GOAL_OPTIONS } }),
    'GET /api/study-plan/suggestions': () => ({ data: SUGGESTIONS }),
    ...routes,
  })
  render(
    <MemoryRouter initialEntries={[{ pathname: '/plan', state }]}>
      <App />
    </MemoryRouter>,
  )
}

const NO_PLAN = { 'GET /api/study-plan': () => ({ data: { plan: null, goalOptions: GOAL_OPTIONS } }) }
const callsTo = (key) => backend.calls.filter((call) => call.key === key)
const setDate = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

async function fillOwnGoal(user, { level = 'B2', start = START, end = END } = {}) {
  await user.click(await screen.findByRole('radio', { name: /Mục tiêu khác/ }))
  await user.selectOptions(screen.getByLabelText('Trình độ mục tiêu'), level)
  await user.type(screen.getByLabelText('Mô tả mục tiêu'), DESCRIPTION)
  setDate('Ngày bắt đầu', start)
  setDate('Ngày kết thúc', end)
}

describe('following a plan', () => {
  it('shows the level, what to do next and how this week is going (scenario 18, step 3)', async () => {
    renderPlan()

    expect(await screen.findByRole('heading', { level: 1, name: 'Kế hoạch học cá nhân' })).toBeInTheDocument()
    expect(await screen.findByText('Điểm tổng: 46/100')).toBeInTheDocument()
    expect(screen.getByText('Tăng 8 điểm so với lần kiểm tra trước')).toBeInTheDocument()

    expect(await screen.findByRole('link', { name: 'Bắt đầu: Tập trung luyện Nói 15 phút/ngày' })).toHaveAttribute(
      'href',
      '/exercises?skill=pronunciation',
    )

    expect(await screen.findByText('Mục tiêu của bạn: “Giao tiếp khi đi du lịch”')).toBeInTheDocument()
    expect(screen.getByText('Trình độ A2 → B1')).toBeInTheDocument()
    expect(screen.getByText(`${periodLine(PLAN_START, PLAN_END, 4)} · 20–30 phút/ngày`)).toBeInTheDocument()
    expect(screen.getByText('Đang thực hiện')).toBeInTheDocument()
    expect(screen.getByText('Tuần này · tuần 3/4')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Từ mới' })).toHaveAttribute('aria-valuenow', '12')
    // Branch 1a: the last finished week fell short, so a gentle warning, not a penalty.
    expect(screen.getByText('Tuần 2 chưa đạt mục tiêu (31/40 từ, 3/5 bài)')).toBeInTheDocument()
    expect(screen.getByText('Nhắc nhở: 8:00 thứ Hai đầu mỗi tuần')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Nhắc học hằng ngày' })).not.toBeInTheDocument()
  })

  it('asks before pausing, then ends the plan from the adjustment screen (scenario 18, branches 5a and 5b)', async () => {
    const user = userEvent.setup()
    let status = 'ACTIVE'
    renderPlan({
      'PATCH /api/study-plan': ({ body }) => {
        status = body.status
        return { data: { ...PLAN, status } }
      },
    })

    await user.click(await screen.findByRole('button', { name: 'Tạm dừng kế hoạch' }))
    const pause = screen.getByRole('dialog', { name: 'Tạm dừng kế hoạch?' })
    await user.click(within(pause).getByRole('button', { name: 'Tạm dừng' }))

    expect(await screen.findByRole('button', { name: 'Tiếp tục kế hoạch' })).toBeInTheDocument()
    expect(screen.getByText(/Kế hoạch đang tạm dừng/)).toBeInTheDocument()
    expect(screen.queryByText(/Tuần 2 chưa đạt mục tiêu/)).not.toBeInTheDocument()
    expect(screen.getByText('Nhắc nhở: tạm ngừng trong lúc kế hoạch tạm dừng')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Điều chỉnh kế hoạch' }))
    await user.click(screen.getByRole('button', { name: 'Kết thúc kế hoạch' }))
    const end = screen.getByRole('dialog', { name: 'Kết thúc kế hoạch?' })
    await user.click(within(end).getByRole('button', { name: 'Kết thúc kế hoạch' }))

    expect(await screen.findByText('Đã kết thúc kế hoạch. Bạn có thể lập kế hoạch mới.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Đặt mục tiêu học tập' })).toBeInTheDocument()
    expect(callsTo('PATCH /api/study-plan').map((call) => call.body.status)).toEqual(['PAUSED', 'COMPLETED'])
  })

  it('adjusts the targets of the weeks not over yet (scenario 18, steps 4 to 8)', async () => {
    const user = userEvent.setup()
    renderPlan({ 'PUT /api/study-plan/schedule': ({ body }) => ({ data: { ...PLAN, weeks: PLAN.weeks.map((week) => ({ ...week, ...body.weeks.find((sent) => sent.weekNumber === week.weekNumber) })) } }) })

    await user.click(await screen.findByRole('button', { name: 'Điều chỉnh kế hoạch' }))
    expect(screen.getByRole('heading', { name: 'Điều chỉnh kế hoạch' })).toBeInTheDocument()
    // Weeks 1 and 2 are over: shown with what was done, not editable.
    expect(screen.queryByLabelText('Mục tiêu số từ mới tuần 2')).not.toBeInTheDocument()
    expect(screen.getAllByText('Đã làm 31 từ')).toHaveLength(1)

    for (const week of [3, 4]) {
      await user.clear(screen.getByLabelText(`Mục tiêu số từ mới tuần ${week}`))
      await user.type(screen.getByLabelText(`Mục tiêu số từ mới tuần ${week}`), '30')
    }
    await user.clear(screen.getByLabelText('Mục tiêu số bài tập tuần 4'))
    await user.type(screen.getByLabelText('Mục tiêu số bài tập tuần 4'), 'năm')
    await user.click(screen.getByRole('button', { name: 'Lưu' }))
    // Branch 6a: the wrong target is pointed out and nothing is saved.
    expect(screen.getByLabelText('Mục tiêu số bài tập tuần 4')).toHaveAccessibleDescription('Nhập số nguyên không âm.')
    expect(callsTo('PUT /api/study-plan/schedule')).toHaveLength(0)

    await user.clear(screen.getByLabelText('Mục tiêu số bài tập tuần 4'))
    await user.type(screen.getByLabelText('Mục tiêu số bài tập tuần 4'), '4')
    await user.click(screen.getByRole('button', { name: 'Lưu' }))

    expect(await screen.findByText('Cập nhật kế hoạch thành công')).toBeInTheDocument()
    expect(callsTo('PUT /api/study-plan/schedule')[0].body).toEqual({
      endDate: PLAN_END,
      weeks: [
        { weekNumber: 3, description: 'Nội dung tuần 3', targetWords: 30, targetExercises: 5 },
        { weekNumber: 4, description: 'Nội dung tuần 4', targetWords: 30, targetExercises: 4 },
      ],
    })
    expect(screen.getByRole('heading', { name: 'Kế hoạch của bạn' })).toBeInTheDocument()
  })

  it('drops or adds weeks with a new end date, and cancels without saving (scenario 18, branches 6b and 6c)', async () => {
    const user = userEvent.setup()
    renderPlan({ 'PUT /api/study-plan/schedule': () => ({ data: PLAN }) })

    await user.click(await screen.findByRole('button', { name: 'Điều chỉnh kế hoạch' }))
    setDate('Ngày kết thúc', addDays(PLAN_END, -7))
    expect(screen.getByText('Tuần 4 nằm sau ngày kết thúc mới và sẽ bị xóa khỏi lịch trình khi lưu.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Mục tiêu số từ mới tuần 4')).not.toBeInTheDocument()

    setDate('Ngày kết thúc', addDays(PLAN_END, 7))
    expect(screen.getByText('Đã thêm tuần 5: nhập nội dung và mục tiêu trước khi lưu.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(screen.getByLabelText('Mục tiêu số từ mới tuần 5')).toHaveAttribute('aria-invalid', 'true')
    await user.type(screen.getByLabelText('Nội dung học tuần 5'), 'Ôn tập')
    await user.type(screen.getByLabelText('Mục tiêu số từ mới tuần 5'), '20')
    await user.type(screen.getByLabelText('Mục tiêu số bài tập tuần 5'), '3')
    await user.click(screen.getByRole('button', { name: 'Lưu' }))

    await waitFor(() => expect(callsTo('PUT /api/study-plan/schedule')).toHaveLength(1))
    const { body } = callsTo('PUT /api/study-plan/schedule')[0]
    expect(body.endDate).toBe(addDays(PLAN_END, 7))
    expect(body.weeks.map((week) => week.weekNumber)).toEqual([3, 4, 5])
    expect(body.weeks[2]).toEqual({ weekNumber: 5, description: 'Ôn tập', targetWords: 20, targetExercises: 3 })

    await user.click(await screen.findByRole('button', { name: 'Điều chỉnh kế hoạch' }))
    await user.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(screen.getByRole('heading', { name: 'Kế hoạch của bạn' })).toBeInTheDocument()
    expect(callsTo('PUT /api/study-plan/schedule')).toHaveLength(1)
  })
})

describe('making a new plan', () => {
  it('previews the AI plan for the learner’s goal, takes changed targets, then applies it (scenario 17)', async () => {
    const user = userEvent.setup()
    renderPlan({
      ...NO_PLAN,
      'POST /api/study-plan/preview': () => ({ data: DRAFT }),
      'POST /api/study-plan': ({ body }) => ({ status: 201, data: savedPlan(body) }),
    })

    expect(await screen.findByRole('heading', { name: 'Đặt mục tiêu học tập' })).toBeInTheDocument()
    // A suggested goal fills in the dates: from today, for its months.
    expect(screen.getByRole('radio', { name: /Đạt B2 trong 3 tháng/ })).toBeChecked()
    expect(screen.getByLabelText('Ngày bắt đầu')).toHaveValue(TODAY)
    expect(screen.getByLabelText('Ngày kết thúc')).toHaveValue(lastDayAfterMonths(TODAY, 3))

    await fillOwnGoal(user)
    expect(screen.getByText('2 tuần')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Gợi ý lộ trình' }))

    expect(await screen.findByRole('heading', { name: 'Lộ trình gợi ý' })).toBeInTheDocument()
    expect(callsTo('POST /api/study-plan/preview')[0].body).toEqual({ targetLevel: 'B2', startDate: START, endDate: END, description: DESCRIPTION })
    expect(screen.getByText(`${periodLine(START, END, 2)} · B1 → B2 · 20–30 phút/ngày`)).toBeInTheDocument()

    // Step 7: a busy week gets fewer words.
    await user.clear(screen.getByLabelText('Mục tiêu số từ mới tuần 1'))
    await user.type(screen.getByLabelText('Mục tiêu số từ mới tuần 1'), '40')
    await user.click(screen.getByRole('button', { name: 'Áp dụng kế hoạch' }))

    expect(await screen.findByText('Đã áp dụng kế hoạch mới. Chúc bạn học tốt!')).toBeInTheDocument()
    expect(callsTo('POST /api/study-plan')[0].body).toEqual({
      targetLevel: 'B2',
      startDate: START,
      endDate: END,
      description: DESCRIPTION,
      summary: 'Lộ trình 2 tuần từ B1 lên B2.',
      weeks: [
        { weekNumber: 1, description: 'Tuần 1: từ vựng Công việc', targetWords: 40, targetExercises: 6 },
        { weekNumber: 2, description: 'Tuần 2: từ vựng Công việc', targetWords: 50, targetExercises: 6 },
      ],
    })
    // Step 9: the plan starts next Monday.
    expect(screen.getByText('Tuần hiện tại: chưa bắt đầu')).toBeInTheDocument()
    expect(screen.getByText('Nhắc nhở: 8:00 thứ Hai đầu mỗi tuần')).toBeInTheDocument()
  })

  it('points out each wrong field and does not ask the AI (scenario 17, branch 4a)', async () => {
    const user = userEvent.setup()
    renderPlan({ ...NO_PLAN, 'POST /api/study-plan/preview': () => ({ data: DRAFT }) })

    await user.click(await screen.findByRole('radio', { name: /Mục tiêu khác/ }))
    setDate('Ngày bắt đầu', '') // the suggested goal had filled them in
    setDate('Ngày kết thúc', '')
    await user.click(screen.getByRole('button', { name: 'Gợi ý lộ trình' }))
    expect(screen.getByLabelText('Mô tả mục tiêu')).toHaveAccessibleDescription('Vui lòng nhập mô tả mục tiêu.')
    expect(screen.getByLabelText('Ngày bắt đầu')).toHaveAccessibleDescription('Vui lòng chọn ngày bắt đầu.')
    expect(screen.getByLabelText('Ngày kết thúc')).toHaveAccessibleDescription('Vui lòng chọn ngày kết thúc.')

    await user.type(screen.getByLabelText('Mô tả mục tiêu'), DESCRIPTION)
    setDate('Ngày bắt đầu', addDays(TODAY, -1))
    setDate('Ngày kết thúc', addDays(TODAY, -1))
    expect(screen.getByLabelText('Ngày bắt đầu')).toHaveAccessibleDescription('Ngày bắt đầu không được trước hôm nay.')
    expect(screen.getByLabelText('Ngày kết thúc')).toHaveAccessibleDescription('Ngày kết thúc phải sau ngày bắt đầu.')
    expect(callsTo('POST /api/study-plan/preview')).toHaveLength(0)
  })

  it('lets the learner aim at any level, with a warning when it is not higher (scenario 17, branch 4b)', async () => {
    const user = userEvent.setup()
    renderPlan({ ...NO_PLAN, 'POST /api/study-plan/preview': () => ({ data: DRAFT }) })

    await fillOwnGoal(user, { level: 'A2' })
    expect(screen.getByText('A2 thấp hơn trình độ hiện tại (B1). Bạn vẫn có thể tiếp tục để củng cố kiến thức nền.')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Trình độ mục tiêu')).getByRole('option', { name: 'B1 (giữ vững)' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Gợi ý lộ trình' }))

    await waitFor(() => expect(callsTo('POST /api/study-plan/preview')).toHaveLength(1))
    expect(callsTo('POST /api/study-plan/preview')[0].body.targetLevel).toBe('A2')
  })

  it('refuses a target that is not a whole number (scenario 17, branch 8a)', async () => {
    const user = userEvent.setup()
    renderPlan({ ...NO_PLAN, 'POST /api/study-plan/preview': () => ({ data: DRAFT }) })

    await fillOwnGoal(user)
    await user.click(screen.getByRole('button', { name: 'Gợi ý lộ trình' }))
    await user.clear(await screen.findByLabelText('Mục tiêu số từ mới tuần 2'))
    await user.type(screen.getByLabelText('Mục tiêu số từ mới tuần 2'), '-5')
    await user.click(screen.getByRole('button', { name: 'Áp dụng kế hoạch' }))

    expect(screen.getByLabelText('Mục tiêu số từ mới tuần 2')).toHaveAccessibleDescription('Nhập số nguyên không âm.')
    expect(screen.getByText(/Có mục tiêu chưa hợp lệ/)).toBeInTheDocument()
    expect(callsTo('POST /api/study-plan')).toHaveLength(0)
  })

  it('lets the learner write the weeks when the AI is down (scenario 17, branch 5a)', async () => {
    const user = userEvent.setup()
    renderPlan({
      ...NO_PLAN,
      'POST /api/study-plan/preview': () => ({ status: 503, data: { status: 503, message: 'AI unavailable' } }),
      'POST /api/study-plan': ({ body }) => ({ status: 201, data: savedPlan(body) }),
    })

    await fillOwnGoal(user)
    await user.click(screen.getByRole('button', { name: 'Gợi ý lộ trình' }))
    expect(await screen.findByText('Trợ lý AI chưa gợi ý được lộ trình lúc này. Vui lòng thử lại sau.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Áp dụng kế hoạch' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tự lập kế hoạch' }))
    expect(screen.getByRole('heading', { name: 'Tự lập kế hoạch' })).toBeInTheDocument()
    for (const week of [1, 2]) {
      await user.type(screen.getByLabelText(`Nội dung học tuần ${week}`), `Tự học tuần ${week}`)
      await user.type(screen.getByLabelText(`Mục tiêu số từ mới tuần ${week}`), '30')
      await user.type(screen.getByLabelText(`Mục tiêu số bài tập tuần ${week}`), '4')
    }
    await user.click(screen.getByRole('button', { name: 'Áp dụng kế hoạch' }))

    expect(await screen.findByText('Đã áp dụng kế hoạch mới. Chúc bạn học tốt!')).toBeInTheDocument()
    expect(callsTo('POST /api/study-plan')[0].body).toMatchObject({
      summary: null,
      weeks: [
        { weekNumber: 1, description: 'Tự học tuần 1', targetWords: 30, targetExercises: 4 },
        { weekNumber: 2, description: 'Tự học tuần 2', targetWords: 30, targetExercises: 4 },
      ],
    })
  })

  it('starts from the roadmap of a comprehensive test (scenario 17, branch 2a)', async () => {
    const user = userEvent.setup()
    renderPlan(
      { ...NO_PLAN, 'POST /api/study-plan/preview': () => ({ data: DRAFT }) },
      { fromTest: { attemptId: 77, targetLevel: 'B2', roadmap: 'Ưu tiên luyện Nói và Viết.' } },
    )

    expect(await screen.findByText('Ưu tiên luyện Nói và Viết.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Mục tiêu khác/ })).toBeChecked()
    expect(screen.getByLabelText('Trình độ mục tiêu')).toHaveValue('B2')

    await user.type(screen.getByLabelText('Mô tả mục tiêu'), DESCRIPTION)
    setDate('Ngày bắt đầu', START)
    setDate('Ngày kết thúc', END)
    await user.click(screen.getByRole('button', { name: 'Gợi ý lộ trình' }))

    await waitFor(() => expect(callsTo('POST /api/study-plan/preview')).toHaveLength(1))
    expect(callsTo('POST /api/study-plan/preview')[0].body).toEqual({
      targetLevel: 'B2',
      startDate: START,
      endDate: END,
      description: DESCRIPTION,
      fromAttemptId: 77,
    })
  })

  it('asks before a test roadmap replaces the active plan (scenario 17, branch 2b)', async () => {
    const user = userEvent.setup()
    renderPlan({}, { fromTest: { attemptId: 77, targetLevel: 'B2', roadmap: 'Ưu tiên luyện Nói và Viết.' } })

    const dialog = await screen.findByRole('dialog', { name: 'Lập kế hoạch mới?' })
    expect(within(dialog).getByText('Kế hoạch hiện tại sẽ chuyển sang tạm dừng. Tiếp tục?')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Kế hoạch của bạn' })).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Tiếp tục' }))

    expect(screen.getByRole('heading', { name: 'Đặt lại mục tiêu học tập' })).toBeInTheDocument()
    expect(screen.getByText(/Kế hoạch hiện tại sẽ chuyển sang tạm dừng khi bạn bấm/)).toBeInTheDocument()
    expect(screen.getByText('Ưu tiên luyện Nói và Viết.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(screen.getByRole('heading', { name: 'Kế hoạch của bạn' })).toBeInTheDocument()
  })
})

describe('other blocks', () => {
  it('keeps the other blocks when one of them fails to load', async () => {
    renderPlan({ 'GET /api/study-plan/suggestions': () => ({ status: 500, data: { status: 500, message: 'boom' } }) })

    const suggestions = (await screen.findByRole('heading', { name: 'Việc nên làm' })).closest('section')
    expect(await within(suggestions).findByText('Máy chủ đang gặp sự cố. Vui lòng thử lại sau.')).toBeInTheDocument()
    expect(within(suggestions).getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
    expect(await screen.findByText('Trình độ A2 → B1')).toBeInTheDocument()
    expect(screen.getByText('Điểm tổng: 46/100')).toBeInTheDocument()
  })

  it('invites a learner without a comprehensive test to take one', async () => {
    renderPlan({ 'GET /api/progress/skills': () => ({ data: { latest: null } }) })

    expect(await screen.findByText(/Bạn chưa làm bài kiểm tra tổng hợp/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Làm bài kiểm tra tổng hợp' })).toHaveAttribute('href', '/tests')
  })
})
