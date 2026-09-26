import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/app/App'
import { tokenStorage } from '@/api/tokenStorage'
import { LESSONS } from '@/features/exercises/testFixtures'
import { installFakeBackend, learner } from '@/test/fakeBackend'

// The home page (D1), against docs/api/progress.md and the vocabulary and exercise APIs it borrows numbers from.

let backend
afterEach(() => backend?.restore())

const zeroCounts = { wordsLearned: 0, exercisesCompleted: 0, testsCompleted: 0, studyMinutes: 0, averageTestScore: null }
const DAYS = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27']
const DAY_ACTIVITY = {
  period: 'DAY',
  from: DAYS[0],
  to: DAYS[6],
  items: DAYS.map((day, index) => ({
    start: day,
    end: day,
    wordsLearned: [5, 12, 0, 8, 6, 3, 9][index],
    exercisesCompleted: [1, 2, 0, 1, 0, 0, 1][index],
    testsCompleted: index === 3 ? 1 : 0,
    studyMinutes: [18, 34, 0, 26, 22, 10, 42][index],
    averageTestScore: index === 3 ? 62 : null,
  })),
  totals: { wordsLearned: 43, exercisesCompleted: 5, testsCompleted: 1, studyMinutes: 152, averageTestScore: 62 },
}
const WEEK_ACTIVITY = {
  period: 'WEEK',
  from: '2026-07-06',
  to: DAYS[6],
  items: Array.from({ length: 12 }, (_, index) => {
    const start = new Date(Date.UTC(2026, 6, 6 + index * 7)).toISOString().slice(0, 10)
    return { start, end: start, ...zeroCounts, wordsLearned: index }
  }),
  totals: { ...zeroCounts, wordsLearned: 66 },
}
const GRADED = {
  attemptId: 42,
  testTitle: 'Kiểm tra tổng hợp tháng 9',
  takenAt: '2026-09-20T08:30:00Z',
  status: 'GRADED',
  overallScore: 46,
  level: 'B1',
  skills: {
    listening: { score: 56, level: 'B2' },
    speaking: { score: 38, level: 'A2' },
    reading: { score: 48, level: 'B1' },
    writing: { score: 42, level: 'B1' },
  },
}
const badge = (id, name, type, value, progress, earnedAt = null) => ({ id, name, description: null, iconUrl: null, condition: { type, value }, progress, earnedAt })
const BADGES = [
  badge(2, 'Chăm chỉ 7 ngày', 'STREAK_DAYS', 7, 7, '2026-09-24T14:05:00Z'),
  badge(3, 'Chăm chỉ 30 ngày', 'STREAK_DAYS', 30, 14),
  badge(6, '1000 từ', 'WORDS_LEARNED', 1000, 248),
]
const CURRENT = {
  attemptId: 57,
  lesson: { id: 3, skill: 'GRAMMAR', title: 'Thì hiện tại hoàn thành', cefrLevel: 'B1', itemCount: 10 },
  doneCount: 4,
  lastActivityAt: '2026-09-26T14:10:00Z',
}

function routes(overrides = {}) {
  return {
    'GET /api/users/me': () => ({ data: { ...learner, currentLevel: 'B1' } }),
    'GET /api/learning/summary': () => ({ data: { dueToday: 12, learningCount: 160, masteredCount: 88, reviewedToday: 3, upcoming: [] } }),
    'GET /api/progress/summary': () => ({ data: { streak: { current: 14, activeToday: false }, totals: { exercisesCompleted: 37, testsCompleted: 4, studyMinutes: 1260 } } }),
    'GET /api/progress/activity': ({ params }) => ({ data: params.period === 'WEEK' ? WEEK_ACTIVITY : DAY_ACTIVITY }),
    'GET /api/progress/skills': () => ({ data: { latest: GRADED } }),
    'GET /api/progress/badges': () => ({ data: BADGES }),
    'GET /api/exercise-attempts/current': () => ({ data: { current: CURRENT } }),
    'GET /api/exercises': ({ params }) => ({ data: LESSONS[params.skill] ?? [] }),
    ...overrides,
  }
}

function renderHome(overrides) {
  tokenStorage.save({ accessToken: 'stored-token', expiresIn: 3600 })
  backend = installFakeBackend(routes(overrides))
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )
  return { callsTo: (key) => backend.calls.filter((call) => call.key === key) }
}

const section = (name) => screen.findByRole('region', { name })

describe('home page numbers', () => {
  it('shows words learned, exercises done, the streak and what is due', async () => {
    renderHome()

    expect(await screen.findByText('248')).toBeInTheDocument()
    expect(screen.getByText('Đang học 160 · Đã thuộc 88')).toBeInTheDocument()
    expect(screen.getByText('37')).toBeInTheDocument()
    expect(await screen.findByText('14 ngày')).toBeInTheDocument()
    expect(screen.getByText('Học hôm nay để giữ chuỗi 14 ngày')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bạn có 12 từ cần ôn hôm nay. Ôn tập ngay' })).toHaveAttribute('href', '/vocabulary/review')
  })

  it('welcomes a learner who has not studied yet, with an empty chart', async () => {
    renderHome({
      'GET /api/learning/summary': () => ({ data: { dueToday: 0, learningCount: 0, masteredCount: 0, reviewedToday: 0, upcoming: [] } }),
      'GET /api/progress/summary': () => ({ data: { streak: { current: 0, activeToday: false }, totals: { exercisesCompleted: 0, testsCompleted: 0, studyMinutes: 0 } } }),
      'GET /api/progress/activity': () => ({ data: { ...DAY_ACTIVITY, items: DAY_ACTIVITY.items.map((item) => ({ ...item, ...zeroCounts })), totals: zeroCounts } }),
    })

    const welcome = await section('Chào mừng bạn đến với LinguaStep')
    expect(within(welcome).getByRole('link', { name: 'Học 20 từ đầu tiên →' })).toHaveAttribute('href', '/vocabulary')
    expect(await screen.findByText('Chưa có hoạt động nào trong 7 ngày qua')).toBeInTheDocument()
    expect(screen.getByText('Học hôm nay để bắt đầu chuỗi')).toBeInTheDocument()
  })

  it('keeps the other blocks when one fails to load', async () => {
    renderHome({ 'GET /api/progress/skills': () => ({ status: 500, data: {} }) })

    const skills = await section('Điểm theo kỹ năng')
    expect(await within(skills).findByRole('alert')).toBeInTheDocument()
    expect(await screen.findByText('14 ngày')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Chào mừng bạn đến với LinguaStep' })).not.toBeInTheDocument()
  })
})

describe('activity chart', () => {
  it('charts the chosen metric by day, and asks the server again only for another period', async () => {
    const app = renderHome()
    const user = userEvent.setup()
    const chart = await section('Hoạt động học tập')

    const table = await within(chart).findByRole('table', { name: 'Từ mới, 7 ngày qua' })
    expect(within(table).getByRole('row', { name: 'Chủ Nhật 27/09 9 từ' })).toBeInTheDocument()
    expect(within(chart).getByText(/^7 ngày qua: 43 từ mới · 5 bài tập · 1 bài kiểm tra, trung bình 62 điểm/)).toBeInTheDocument()

    await user.click(within(chart).getByRole('button', { name: 'Điểm kiểm tra' }))
    expect(within(chart).getByRole('button', { name: 'Điểm kiểm tra' })).toHaveAttribute('aria-pressed', 'true')
    const scores = within(chart).getByRole('table', { name: 'Điểm kiểm tra, 7 ngày qua' })
    expect(within(scores).getByRole('row', { name: 'Thứ Năm 24/09 62 điểm' })).toBeInTheDocument()
    expect(within(scores).getByRole('row', { name: 'Thứ Sáu 25/09 Không làm bài kiểm tra' })).toBeInTheDocument()
    expect(app.callsTo('GET /api/progress/activity')).toHaveLength(1)

    await user.click(within(chart).getByRole('button', { name: 'Tuần' }))
    expect(await within(chart).findByRole('table', { name: 'Điểm kiểm tra, 12 tuần qua' })).toBeInTheDocument()
    expect(app.callsTo('GET /api/progress/activity').map((call) => call.params)).toEqual([{ period: 'DAY' }, { period: 'WEEK' }])
  })
})

describe('skills radar', () => {
  it('shows the latest comprehensive test on the four skills', async () => {
    renderHome()
    const skills = await section('Điểm theo kỹ năng')

    expect(await within(skills).findByText('46/100 · B1')).toBeInTheDocument()
    expect(within(skills).getByRole('img')).toHaveAccessibleName('Nghe 56 điểm (B2), Đọc 48 điểm (B1), Viết 42 điểm (B1), Nói 38 điểm (A2)')
    expect(within(skills).getByRole('link', { name: 'Xem báo cáo và lộ trình trong Kế hoạch →' })).toHaveAttribute('href', '/plan')
  })

  it('says which skills the AI is still grading', async () => {
    const skills = { ...GRADED.skills, speaking: { score: null, level: null }, writing: { score: null, level: null } }
    renderHome({ 'GET /api/progress/skills': () => ({ data: { latest: { ...GRADED, status: 'SUBMITTED', overallScore: null, level: null, skills } } }) })
    const radar = await section('Điểm theo kỹ năng')

    expect(await within(radar).findByText('Đang chấm phần Viết, Nói')).toBeInTheDocument()
    expect(within(radar).getByRole('img')).toHaveAccessibleName('Nghe 56 điểm (B2), Đọc 48 điểm (B1), Viết đang chấm, Nói đang chấm')
  })

  it('invites to take the comprehensive test before the first one', async () => {
    renderHome({ 'GET /api/progress/skills': () => ({ data: { latest: null } }) })
    const skills = await section('Điểm theo kỹ năng')

    expect(await within(skills).findByRole('link', { name: 'Làm bài kiểm tra tổng hợp' })).toHaveAttribute('href', '/tests')
  })
})

describe('level journey and achievements', () => {
  it('places the learner on the six CEFR levels', async () => {
    renderHome()
    const levels = await section('Hành trình trình độ')

    expect(within(levels).getByText('2/6 đã đạt')).toBeInTheDocument()
    const steps = within(levels).getAllByRole('listitem')
    expect(steps.map((step) => step.textContent)).toEqual(['A1Đạt', 'A2Đạt', 'B1Hiện tại', 'B2Chưa đạt', 'C1Chưa đạt', 'C2Chưa đạt'])
    expect(steps[2]).toHaveAttribute('aria-current', 'step')
  })

  it('shows the badges earned, the closest ones, and every badge on demand', async () => {
    renderHome()
    const user = userEvent.setup()
    const achievements = await section('Thành tích')

    expect(await within(achievements).findByText('1/3 đã đạt')).toBeInTheDocument()
    expect(within(achievements).getByText('Chăm chỉ 7 ngày')).toBeInTheDocument()
    expect(within(achievements).getByRole('progressbar', { name: 'Chăm chỉ 30 ngày' })).toHaveAttribute('aria-valuenow', '14')
    expect(within(achievements).getByText('248/1000 từ')).toBeInTheDocument()

    await user.click(within(achievements).getByRole('button', { name: 'Xem tất cả thành tích' }))
    const dialog = screen.getByRole('dialog', { name: 'Thành tích · 1/3 đã đạt' })
    expect(within(dialog).getByText('Đạt 24/09')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Đóng' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('continue card', () => {
  it('continues the unfinished lesson where the learner left it', async () => {
    renderHome()

    const card = await screen.findByRole('link', { name: /Tiếp tục: Thì hiện tại hoàn thành/ })
    expect(card).toHaveTextContent('Ngữ pháp · Đã làm 4/10 câu · còn 6 câu')
    expect(card).toHaveAttribute('href', '/exercises/lessons/3')
  })

  it('suggests the next grammar lesson when nothing is unfinished', async () => {
    const app = renderHome({ 'GET /api/exercise-attempts/current': () => ({ data: { current: null } }) })

    const card = await screen.findByRole('link', { name: /Học tiếp: Câu bị động/ })
    expect(card).toHaveTextContent('Ngữ pháp · B2 · 5 câu')
    expect(card).toHaveAttribute('href', '/exercises/lessons/5')
    expect(app.callsTo('GET /api/exercises')[0].params).toEqual({ skill: 'GRAMMAR' })
  })
})
