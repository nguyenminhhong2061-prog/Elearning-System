import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/app/App'
import { tokenStorage } from '@/api/tokenStorage'
import { addDays, todayInVietnam } from '@/lib/dates'
import { admin, installFakeBackend } from '@/test/fakeBackend'
import '@/test/preloadPages'

// Data shaped as docs/api/admin.md describes it, following scenarios 19–26 of Analysis/Scenarios.md (docs/English Learning System).

const today = todayInVietnam()

const TOPICS = [
  { id: 1, name: 'Kinh doanh', description: 'Công việc', imageUrl: null, wordCount: 26, minLevel: 'A2', maxLevel: 'C1', missingAudioCount: 26, missingExampleCount: 0, learnerCount: 64, updatedAt: '2026-09-25T03:00:00Z' },
  { id: 2, name: 'Du lịch', description: 'Sân bay, khách sạn và những chuyến đi.', imageUrl: null, wordCount: 22, minLevel: 'A1', maxLevel: 'B2', missingAudioCount: 22, missingExampleCount: 12, learnerCount: 97, updatedAt: '2026-09-25T03:00:00Z' },
  { id: 3, name: 'Thể thao', description: null, imageUrl: null, wordCount: 0, minLevel: null, maxLevel: null, missingAudioCount: 0, missingExampleCount: 0, learnerCount: 0, updatedAt: null },
]

const word = (id, text, meaning, overrides = {}) => ({
  id,
  topicId: 2,
  word: text,
  phonetic: null,
  meaning,
  exampleSentence: null,
  audioUrl: null,
  imageUrl: null,
  difficultyLevel: 'A2',
  learnerCount: 0,
  listCount: 0,
  updatedAt: '2026-09-25T03:00:00Z',
  ...overrides,
})

const LUGGAGE = word(105, 'luggage', 'hành lý', { phonetic: '/ˈlʌɡɪdʒ/', learnerCount: 14, listCount: 2 })
const PASSPORT = word(104, 'passport', 'hộ chiếu', { learnerCount: 12, listCount: 3 })
const VISA = word(130, 'visa', 'thị thực', { difficultyLevel: 'B1' })
const page = (items) => ({ items, page: 0, size: 10, totalItems: items.length, totalPages: 1 })

const STATS = {
  from: addDays(today, -29),
  to: today,
  generatedAt: '2026-09-29T03:30:00Z',
  learners: { total: 128, newInPeriod: 12 },
  activeToday: 37,
  reviews: 4812,
  exercisesCompleted: 356,
  testsSubmitted: 96,
  dailyActive: Array.from({ length: 30 }, (_, index) => ({ date: addDays(today, index - 29), count: 10 + index })),
  levels: { A1: 22, A2: 31, B1: 38, B2: 19, C1: 6, C2: 2, NONE: 10 },
  topTopics: [{ topicId: 2, name: 'Du lịch', reviews: 1126 }],
  topLessons: [{ lessonId: 1, title: 'Thì hiện tại đơn', skill: 'GRAMMAR', cefrLevel: 'A1', attempts: 168, averageScore: 84 }],
  attention: {
    wordsMissingAudio: 180,
    wordsMissingExample: 48,
    lessonsWithIssues: [{ lessonId: 2, title: 'Hội thoại tại sân bay', issue: 'MISSING_AUDIO' }],
    periodicTestGap: { weekStart: '2026-10-04', weekEnd: '2026-10-10' },
    lockedUsers: 3,
  },
}

const NAM = {
  id: 1087,
  fullName: 'Phạm Văn Nam',
  email: 'nam.pv@gmail.com',
  currentLevel: 'A2',
  status: 'ACTIVE',
  createdAt: '2026-09-15T02:00:00Z',
  lastActiveAt: null,
}
const NAM_DETAIL = {
  ...NAM,
  stats: { wordsLearned: 12, wordsMastered: 0, streakDays: 0, lastStudyDate: '2026-09-20', exercisesCompleted: 1, exerciseAverageScore: 50, testsSubmitted: 1, lastTestDate: '2026-09-16' },
  recentActivity: [{ at: '2026-09-20T12:30:00Z', type: 'EXERCISE', title: 'Thì hiện tại đơn', detail: '50%' }],
  levelHistory: [
    { level: 'A2', changedAt: '2026-09-16T13:05:00Z', source: 'Kiểm tra tổng hợp tháng 9 · 38 điểm' },
    { level: null, changedAt: '2026-09-15T02:00:00Z', source: 'Đăng ký tài khoản' },
  ],
  plan: null,
}

let backend

afterEach(() => backend?.restore())

function Location() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

function renderAdmin(path, routes = {}) {
  tokenStorage.save({ accessToken: 'stored-token', expiresIn: 3600 })
  backend = installFakeBackend({
    'GET /api/users/me': () => ({ data: admin }),
    'GET /api/admin/stats': () => ({ data: STATS }),
    'GET /api/admin/topics': () => ({ data: TOPICS }),
    'GET /api/admin/vocabulary': () => ({ data: page([PASSPORT, LUGGAGE]) }),
    ...routes,
  })
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <Location />
    </MemoryRouter>,
  )
}

const callsTo = (key) => backend.calls.filter((call) => call.key === key)
const location = () => screen.getByTestId('location').textContent

describe('admin area', () => {
  it('sends an admin opening the learner home page to the overview (scenario 26)', async () => {
    renderAdmin('/')

    expect(await screen.findByRole('heading', { level: 1, name: 'Tổng quan hệ thống' })).toBeInTheDocument()
    expect(location()).toBe('/admin')
    const nav = screen.getByRole('navigation', { name: 'Điều hướng quản trị' })
    expect(within(nav).getByRole('link', { name: 'Người dùng' })).toHaveAttribute('href', '/admin/users')
    expect(await screen.findByText('+12 người mới trong kỳ')).toBeInTheDocument()
    expect(screen.getByText('4.812')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Bài nghe “Hội thoại tại sân bay” thiếu file audio/ })).toHaveAttribute('href', '/admin/lessons/2')
    expect(screen.getByRole('link', { name: /Chưa có đề định kỳ tuần 41 \(đề hiện tại đóng 03\/10\)/ })).toHaveAttribute('href', '/admin/tests')
    expect(screen.getByRole('link', { name: /180 từ chưa có audio/ })).toHaveAttribute('href', '/admin/vocabulary?missing=AUDIO')
    expect(callsTo('GET /api/admin/stats')[0].params).toEqual({ from: addDays(today, -29), to: today })
  })

  it('asks for another period and rejects a start after the end (scenario 26, step 3 and branch 3a)', async () => {
    renderAdmin('/admin')
    const user = userEvent.setup()
    await screen.findByText('+12 người mới trong kỳ')

    await user.click(screen.getByRole('button', { name: '7 ngày' }))
    await waitFor(() => expect(callsTo('GET /api/admin/stats').at(-1).params).toEqual({ from: addDays(today, -6), to: today }))

    await user.click(screen.getByRole('button', { name: 'Tùy chọn…' }))
    await user.clear(screen.getByLabelText('Từ ngày'))
    await user.type(screen.getByLabelText('Từ ngày'), '20/09/2026')
    await user.clear(screen.getByLabelText('Đến ngày'))
    await user.type(screen.getByLabelText('Đến ngày'), '10/09/2026')
    await user.click(screen.getByRole('button', { name: 'Xem số liệu' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Ngày bắt đầu phải trước hoặc trùng ngày kết thúc.')
  })

  it('shows "no activity" for a period without any', async () => {
    const quiet = { ...STATS, dailyActive: STATS.dailyActive.map((day) => ({ ...day, count: 0 })), activeToday: 0 }
    renderAdmin('/admin', { 'GET /api/admin/stats': () => ({ data: quiet }) })

    expect(await screen.findByText('Chưa có hoạt động trong kỳ này')).toBeInTheDocument()
  })
})

describe('vocabulary administration', () => {
  it('edits a word: required fields, unsaved-changes question, then a saved toast (scenario 19)', async () => {
    renderAdmin('/admin/vocabulary/topics/2', { 'PUT /api/vocabulary/105': ({ body }) => ({ data: { ...LUGGAGE, ...body } }) })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Sửa “luggage”' }))
    const drawer = screen.getByRole('dialog', { name: 'Sửa từ “luggage”' })
    expect(within(drawer).getByText('14 người học đang học từ này.')).toBeInTheDocument()
    expect(within(drawer).getByText('Đang thiếu: mặt sau thẻ flashcard của từ này chưa có câu ví dụ.')).toBeInTheDocument()

    await user.clear(within(drawer).getByLabelText('Nghĩa *'))
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    expect(await within(drawer).findByText('Vui lòng nhập nghĩa.')).toBeInTheDocument()
    expect(within(drawer).getByText(/còn 1 ô bắt buộc chưa điền/)).toBeInTheDocument()

    await user.click(within(drawer).getByRole('button', { name: 'Đóng' }))
    const confirm = screen.getByRole('dialog', { name: 'Bỏ các thay đổi?' })
    expect(confirm).toHaveTextContent('Bạn đã sửa nghĩa của “luggage” nhưng chưa lưu.')
    await user.click(within(confirm).getByRole('button', { name: 'Tiếp tục sửa' }))

    await user.type(within(drawer).getByLabelText('Nghĩa *'), 'hành lý (va li)')
    await user.type(within(drawer).getByLabelText('Câu ví dụ'), 'How many pieces of luggage are you checking in?')
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    expect(await screen.findByText('Nghĩa và câu ví dụ của “luggage” đã được cập nhật.')).toBeInTheDocument()
    expect(callsTo('PUT /api/vocabulary/105')[0].body).toMatchObject({
      topicId: 2,
      word: 'luggage',
      meaning: 'hành lý (va li)',
      exampleSentence: 'How many pieces of luggage are you checking in?',
      difficultyLevel: 'A2',
      audioUrl: null,
    })
  })

  it('adds words and keeps topic and level for the next one; a duplicate opens the existing word (scenario 20)', async () => {
    renderAdmin('/admin/vocabulary/topics/2', {
      'GET /api/admin/vocabulary': ({ params }) => ({ data: page(params.q?.toLowerCase() === 'passport' ? [PASSPORT] : params.q ? [] : [PASSPORT, LUGGAGE]) }),
      'POST /api/vocabulary': ({ body }) => ({ status: 201, data: { ...VISA, ...body } }),
    })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '+ Thêm từ' }))
    const drawer = screen.getByRole('dialog', { name: 'Thêm từ vào chủ đề “Du lịch”' })
    await user.type(within(drawer).getByLabelText('Từ *'), 'visa')
    await user.type(within(drawer).getByLabelText('Nghĩa *'), 'thị thực')
    await user.click(within(drawer).getByRole('radio', { name: 'B1' }))
    await user.click(screen.getByRole('button', { name: 'Lưu và thêm tiếp' }))

    expect(await screen.findByText('Đã thêm “visa” vào chủ đề Du lịch.')).toBeInTheDocument()
    expect(callsTo('POST /api/vocabulary')[0].body).toMatchObject({ topicId: 2, word: 'visa', meaning: 'thị thực', difficultyLevel: 'B1' })
    expect(within(drawer).getByLabelText('Từ *')).toHaveValue('')
    expect(within(drawer).getByRole('radio', { name: 'B1' })).toBeChecked()

    await user.type(within(drawer).getByLabelText('Từ *'), 'Passport')
    await user.type(within(drawer).getByLabelText('Nghĩa *'), 'hộ chiếu')
    await user.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(await within(drawer).findByText(/Từ “passport” đã có trong chủ đề Du lịch./)).toBeInTheDocument()
    expect(callsTo('POST /api/vocabulary')).toHaveLength(1)

    await user.click(within(drawer).getByRole('button', { name: 'Mở từ đã có →' }))
    expect(await screen.findByRole('dialog', { name: 'Sửa từ “passport”' })).toBeInTheDocument()
  })

  it('archives a word people study and deletes an unused one for good (scenario 21)', async () => {
    renderAdmin('/admin/vocabulary/topics/2', {
      'GET /api/admin/vocabulary': () => ({ data: page([PASSPORT, VISA]) }),
      'DELETE /api/vocabulary/104': () => ({ data: { result: 'ARCHIVED' } }),
      'DELETE /api/vocabulary/130': () => ({ data: { result: 'DELETED' } }),
    })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Xóa “passport”' }))
    let dialog = screen.getByRole('dialog', { name: 'Xóa từ “passport”?' })
    expect(dialog).toHaveTextContent('12 người học đang học từ này, và từ này nằm trong 3 danh sách riêng của người học.')
    expect(dialog).toHaveTextContent('Lưu trữ')
    await user.click(within(dialog).getByRole('button', { name: 'Xóa từ' }))
    expect(await screen.findByText('Người học không gặp lại “passport” trong phiên học mới.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Xóa “visa”' }))
    dialog = screen.getByRole('dialog', { name: 'Xóa vĩnh viễn từ “visa”?' })
    await user.click(within(dialog).getByRole('button', { name: 'Xóa vĩnh viễn' }))
    expect(await screen.findByText('Đã xóa vĩnh viễn “visa”.')).toBeInTheDocument()
    expect(callsTo('DELETE /api/vocabulary/130')).toHaveLength(1)
  })

  it('refuses a duplicate topic name and blocks deleting a topic that still has words (scenario 22)', async () => {
    renderAdmin('/admin/vocabulary', { 'POST /api/topics': ({ body }) => ({ status: 201, data: { id: 9, ...body } }) })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '+ Thêm chủ đề' }))
    let dialog = screen.getByRole('dialog', { name: 'Thêm chủ đề' })
    await user.type(within(dialog).getByLabelText('Tên chủ đề *'), 'du lịch')
    await user.click(within(dialog).getByRole('button', { name: 'Lưu' }))
    expect(await within(dialog).findByText('Đã có chủ đề tên “du lịch”.')).toBeInTheDocument()
    expect(callsTo('POST /api/topics')).toHaveLength(0)

    await user.clear(within(dialog).getByLabelText('Tên chủ đề *'))
    await user.type(within(dialog).getByLabelText('Tên chủ đề *'), 'Mua sắm')
    await user.click(within(dialog).getByRole('button', { name: 'Lưu' }))
    expect(await screen.findByText('Đã thêm chủ đề “Mua sắm”.')).toBeInTheDocument()
    expect(callsTo('POST /api/topics')[0].body).toEqual({ name: 'Mua sắm', description: null, imageUrl: null })

    await user.click(screen.getByRole('button', { name: 'Xóa chủ đề Du lịch' }))
    dialog = screen.getByRole('dialog', { name: 'Chưa xóa được chủ đề “Du lịch”' })
    expect(dialog).toHaveTextContent('Chủ đề còn 22 từ, hãy chuyển các từ sang chủ đề khác hoặc xóa từ trước.')
    expect(within(dialog).getByRole('link', { name: 'Xem 22 từ →' })).toHaveAttribute('href', '/admin/vocabulary/topics/2')
  })

})

describe('user administration', () => {
  it('finds a learner, opens the profile, locks and unlocks the account (scenario 25)', async () => {
    let detail = NAM_DETAIL
    renderAdmin('/admin/users', {
      'GET /api/admin/users/summary': () => ({ data: { total: 128, active: 125, locked: 3 } }),
      'GET /api/admin/users': ({ params }) => ({ data: page(params.q === 'khoa.do' ? [] : [NAM]) }),
      'GET /api/admin/users/1087': () => ({ data: detail }),
      'PATCH /api/admin/users/1087': ({ body }) => {
        detail = { ...detail, status: body.status }
        return { data: detail }
      },
    })
    const user = userEvent.setup()

    expect(await screen.findByText('128 người học · 3 tài khoản đang bị khóa')).toBeInTheDocument()
    await user.type(screen.getByRole('searchbox', { name: 'Tìm người học' }), 'khoa.do')
    expect(await screen.findByText('Không tìm thấy người dùng phù hợp')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Xóa tìm kiếm' }).at(-1))

    await user.type(screen.getByRole('searchbox', { name: 'Tìm người học' }), 'nam.pv')
    expect(await screen.findByText('1 kết quả cho “nam.pv”')).toBeInTheDocument()
    expect(callsTo('GET /api/admin/users').at(-1).params).toMatchObject({ q: 'nam.pv', sort: 'NEWEST', page: 0, size: 10 })
    await user.click(screen.getByRole('link', { name: 'Xem Phạm Văn Nam' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Phạm Văn Nam' })).toBeInTheDocument()
    expect(screen.getByText('điểm TB 50%')).toBeInTheDocument()
    expect(screen.getByText('16/09/2026 · Kiểm tra tổng hợp tháng 9 · 38 điểm')).toBeInTheDocument()
    expect(screen.getByText('Chưa có kế hoạch học.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Khóa tài khoản' }))
    const lock = screen.getByRole('dialog', { name: 'Khóa tài khoản Phạm Văn Nam?' })
    expect(lock).toHaveTextContent('đăng xuất ngay')
    await user.click(within(lock).getByRole('button', { name: 'Khóa tài khoản' }))

    expect(await screen.findByText('Đã khóa tài khoản Phạm Văn Nam')).toBeInTheDocument()
    expect(callsTo('PATCH /api/admin/users/1087')[0].body).toEqual({ status: 'LOCKED' })
    expect(screen.getByRole('note')).toHaveTextContent('Tài khoản đang bị khóa')

    await user.click(screen.getByRole('button', { name: 'Mở khóa' }))
    await user.click(within(screen.getByRole('dialog', { name: 'Mở khóa tài khoản Phạm Văn Nam?' })).getByRole('button', { name: 'Mở khóa' }))
    expect(await screen.findByText('Đã mở khóa tài khoản Phạm Văn Nam')).toBeInTheDocument()
    expect(callsTo('PATCH /api/admin/users/1087')[1].body).toEqual({ status: 'ACTIVE' })
  })
})

describe('list filters in the URL', () => {
  it('keeps both filters when two are changed before the page re-renders', async () => {
    renderAdmin('/admin/users', {
      'GET /api/admin/users/summary': () => ({ data: { total: 128, active: 125, locked: 3 } }),
      'GET /api/admin/users': () => ({ data: page([NAM]) }),
    })
    await screen.findByRole('link', { name: 'Xem Phạm Văn Nam' })

    // Two changes in the same tick, as a fast click on a second filter can do.
    act(() => {
      fireEvent.change(screen.getByLabelText('Trình độ'), { target: { value: 'NONE' } })
      fireEvent.change(screen.getByLabelText('Sắp xếp'), { target: { value: 'NAME' } })
    })

    await waitFor(() => expect(location()).toBe('/admin/users?level=NONE&sort=NAME'))
    await waitFor(() => expect(callsTo('GET /api/admin/users').at(-1).params).toMatchObject({ level: 'NONE', sort: 'NAME' }))
  })
})

describe('test administration', () => {
  const week40 = {
    id: 100,
    title: 'Kiểm tra định kỳ — tuần 40',
    type: 'PERIODIC',
    startDate: '2026-09-26',
    endDate: '2026-10-03',
    status: 'OPEN',
    questionCount: 1,
    skills: ['READING'],
    submissions: 28,
    averageScore: 72,
  }
  const question = {
    id: 1001,
    skill: 'READING',
    type: 'MULTIPLE_CHOICE',
    points: 1,
    audioUrl: null,
    content: 'Choose the correct form: She ___ (live) in Hanoi for five years.',
    options: [
      { id: 1, text: 'lives', correct: false },
      { id: 2, text: 'has lived', correct: true },
    ],
    acceptedAnswers: [],
  }

  it('warns about next week and duplicates the open test into a draft for it (scenario 24)', async () => {
    const copy = { ...week40, id: 101, title: 'Kiểm tra định kỳ — tuần 41', startDate: '2026-10-04', endDate: '2026-10-10', status: 'DRAFT', submissions: 0, averageScore: null, duplicatedFrom: { id: 100, title: week40.title }, questions: [question] }
    renderAdmin('/admin/tests', {
      'GET /api/admin/tests': () => ({ data: [week40] }),
      'POST /api/admin/tests/100/duplicate': () => ({ status: 201, data: copy }),
      'GET /api/admin/tests/101': () => ({ data: copy }),
      'PUT /api/admin/tests/101': ({ body }) => ({ data: { ...copy, ...body, status: body.draft ? 'DRAFT' : 'UPCOMING' } }),
    })
    const user = userEvent.setup()

    expect(await screen.findByText('Chưa có đề định kỳ cho tuần 41.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Nhân bản đề tuần 40 thành tuần 41' }))
    const dialog = screen.getByRole('dialog', { name: 'Nhân bản “Kiểm tra định kỳ — tuần 40”' })
    expect(within(dialog).getByLabelText('Ngày mở *')).toHaveValue('04/10/2026')
    await user.click(within(dialog).getByRole('button', { name: 'Tạo bản nháp' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Kiểm tra định kỳ — tuần 41' })).toBeInTheDocument()
    expect(callsTo('POST /api/admin/tests/100/duplicate')[0].body).toEqual({ title: 'Kiểm tra định kỳ — tuần 41', startDate: '2026-10-04', endDate: '2026-10-10' })
    expect(location()).toBe('/admin/tests/101')

    const end = screen.getByLabelText('Ngày đóng *')
    await user.clear(end)
    await user.type(end, '01/10/2026')
    await user.click(screen.getByRole('button', { name: 'Lưu đề' }))
    expect(await screen.findByText('Ngày đóng phải sau ngày mở.')).toBeInTheDocument()

    await user.clear(end)
    await user.type(end, '10/10/2026')
    await user.click(screen.getByRole('radio', { name: /Mở theo lịch/ }))
    await user.click(screen.getByRole('button', { name: 'Lưu đề' }))
    expect(await screen.findByText('“Kiểm tra định kỳ — tuần 41” sẽ mở theo lịch.')).toBeInTheDocument()
    expect(callsTo('PUT /api/admin/tests/101')[0].body).toMatchObject({
      title: 'Kiểm tra định kỳ — tuần 41',
      startDate: '2026-10-04',
      endDate: '2026-10-10',
      draft: false,
      questions: [{ id: 1001, skill: 'READING', type: 'MULTIPLE_CHOICE', options: [{ id: 1, text: 'lives', correct: false }, { id: 2, text: 'has lived', correct: true }] }],
    })
  })

  it('keeps answers of a test with submissions locked', async () => {
    renderAdmin('/admin/tests/100', { 'GET /api/admin/tests/100': () => ({ data: { ...week40, duplicatedFrom: null, questions: [question] } }) })

    expect(await screen.findByText(/Đề đã có 28 bài nộp:/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'B là đáp án đúng' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Xóa câu' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Ngày mở *')).toBeDisabled()
  })
})

describe('lesson administration', () => {
  const lesson = {
    id: 1,
    title: 'Thì hiện tại đơn',
    description: null,
    topic: null,
    skill: 'GRAMMAR',
    cefrLevel: 'A1',
    difficulty: 'EASY',
    estimatedMinutes: 5,
    status: 'PUBLISHED',
    attempts: 168,
    updatedAt: '2026-09-27T12:00:00Z',
    issues: [],
    questions: [
      { id: 101, type: 'MULTIPLE_CHOICE', prompt: 'She ___ to school every day.', hint: null, explanation: null, points: 1, options: [{ id: 1011, text: 'go', correct: false }, { id: 1012, text: 'goes', correct: true }], acceptedAnswers: [] },
    ],
    passage: null,
    pronunciationItems: [],
  }

  it('lists lessons with their problems and filters by skill (scenario 23, step 2)', async () => {
    renderAdmin('/admin/lessons', {
      'GET /api/admin/lessons': () => ({
        data: [
          { id: 1, title: 'Thì hiện tại đơn', skill: 'GRAMMAR', cefrLevel: 'A1', difficulty: 'EASY', status: 'PUBLISHED', questionCount: 2, segmentCount: 0, itemCount: 0, attempts: 168, updatedAt: null, issues: [] },
          { id: 2, title: 'Hội thoại tại sân bay', skill: 'LISTENING', cefrLevel: 'A2', difficulty: 'MEDIUM', status: 'PUBLISHED', questionCount: 2, segmentCount: 2, itemCount: 0, attempts: 112, updatedAt: null, issues: ['MISSING_AUDIO'] },
        ],
      }),
    })
    const user = userEvent.setup()

    const row = (await screen.findByRole('link', { name: 'Hội thoại tại sân bay' })).closest('tr')
    expect(within(row).getByText('Thiếu file audio')).toBeInTheDocument()
    expect(within(row).getByText('2 câu hỏi · 2 đoạn phụ đề')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Ngữ pháp (1)' }))
    expect(screen.queryByRole('link', { name: 'Hội thoại tại sân bay' })).not.toBeInTheDocument()
  })

  it('refuses a question without a correct answer, then saves the lesson (scenario 23, steps 3–12)', async () => {
    renderAdmin('/admin/lessons/1', {
      'GET /api/admin/lessons/1': () => ({ data: lesson }),
      'PUT /api/admin/lessons/1': ({ body }) => ({ data: { ...lesson, ...body, updatedAt: '2026-09-29T08:00:00Z' } }),
    })
    const user = userEvent.setup()

    expect(await screen.findByText('Bài đang xuất bản: thay đổi áp dụng cho các lượt làm mới; lượt đã nộp giữ nguyên điểm.')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: '+ Thêm câu hỏi' })[0])
    const second = screen.getByRole('heading', { name: 'Câu 2' }).closest('article')
    await user.type(within(second).getByLabelText('Đề bài *'), 'They ___ like coffee.')
    await user.type(within(second).getByLabelText('Nội dung lựa chọn A'), "don't")
    await user.type(within(second).getByLabelText('Nội dung lựa chọn B'), "doesn't")
    await user.click(within(second).getAllByRole('button', { name: /^Bỏ lựa chọn/ }).at(-1))
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    expect(await within(second).findByText('Chọn đúng 1 đáp án đúng.')).toBeInTheDocument()
    expect(callsTo('PUT /api/admin/lessons/1')).toHaveLength(0)

    await user.click(within(second).getByRole('radio', { name: 'A là đáp án đúng' }))
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    expect(await screen.findByText('Bài “Thì hiện tại đơn” đã được cập nhật.')).toBeInTheDocument()
    const body = callsTo('PUT /api/admin/lessons/1')[0].body
    expect(body.questions).toHaveLength(2)
    expect(body.questions[1]).toEqual({
      type: 'MULTIPLE_CHOICE',
      prompt: 'They ___ like coffee.',
      hint: null,
      explanation: null,
      points: 1,
      options: [
        { text: "don't", correct: true },
        { text: "doesn't", correct: false },
      ],
      acceptedAnswers: [],
    })
  })
})
