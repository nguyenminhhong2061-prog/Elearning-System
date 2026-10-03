import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { ATTEMPT_ID, baseRoutes, READING_LESSON, gradeReading, LESSONS, renderApp } from './testFixtures'
import '@/test/preloadPages'

// Lesson lists and the reading exercise (scenario 9), against docs/api/exercises.md.

let app
afterEach(() => app?.backend.restore())

const RESULT = {
  attemptId: ATTEMPT_ID,
  lessonId: 3,
  correctCount: 1,
  questionCount: 2,
  earnedPoints: 1,
  totalPoints: 2,
  scorePercent: 50,
  bestScorePercent: 80,
  isPersonalBest: false,
  review: [
    { questionId: 31, correct: false, optionId: 311, answer: null, correctOptionId: 312, correctAnswer: 'has lived', explanation: 'Hành động kéo dài tới hiện tại dùng hiện tại hoàn thành.' },
    { questionId: 32, correct: true, optionId: null, answer: 'seen', correctOptionId: null, correctAnswer: 'seen', explanation: 'Sau have dùng V3.' },
  ],
  translations: [],
  pronunciation: null,
}

function readingRoutes(overrides) {
  return baseRoutes({
    [`POST /api/exercise-attempts/${ATTEMPT_ID}/complete`]: () => ({ data: RESULT }),
    ...overrides,
  })
}

describe('lesson list', () => {
  it('groups the reading lessons by level, easiest first, with the learner’s best score (scenario 9, steps 2 to 4)', async () => {
    app = renderApp('/exercises', baseRoutes())

    expect(await screen.findByText('Đã hoàn thành 1 / 3 bài đọc hiểu')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Bài tập' })).toBeInTheDocument()
    const tabs = screen.getByRole('navigation', { name: 'Kỹ năng' })
    expect(within(tabs).getAllByRole('link').map((link) => link.textContent)).toEqual(['Đọc hiểu', 'Viết', 'Nghe hiểu', 'Phát âm'])
    expect(screen.getByRole('link', { name: 'Đọc hiểu' })).toHaveAttribute('aria-current', 'page')
    expect(app.callsTo('GET /api/exercises')[0].params).toEqual({ skill: 'READING' })

    const levels = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(levels).toEqual(['A1 · Mới bắt đầu', 'B1 · Trung cấpTrình độ của bạn', 'B2 · Trung cao cấp'])

    const done = screen.getByRole('link', { name: /Thì hiện tại hoàn thành/ })
    expect(done).toHaveAttribute('href', '/exercises/lessons/3')
    expect(done).toHaveTextContent('Trung bình')
    expect(done).toHaveTextContent('2 câu · khoảng 8 phút')
    expect(done).toHaveTextContent('Tốt nhất 80% · 2 lần')
    expect(screen.getByRole('link', { name: /Câu bị động/ })).toHaveTextContent('Chưa làm')
  })

  it('switches skills with the pill tabs and keeps the skill in the URL', async () => {
    app = renderApp('/exercises', baseRoutes())
    const user = userEvent.setup()
    await screen.findByRole('link', { name: /Thì hiện tại đơn/ })

    await user.click(screen.getByRole('link', { name: 'Nghe hiểu' }))

    expect(await screen.findByRole('link', { name: /Hội thoại tại sân bay/ })).toHaveAttribute('href', '/exercises/lessons/11')
    expect(screen.getByTestId('location')).toHaveTextContent('/exercises?skill=listening')
    expect(screen.getByText('Đã hoàn thành 0 / 1 bài nghe')).toBeInTheDocument()
    expect(app.callsTo('GET /api/exercises').at(-1).params).toEqual({ skill: 'LISTENING' })
  })

  it('shows the grammar lessons of a backend not updated yet as reading lessons, and no writing lesson', async () => {
    const legacy = LESSONS.READING.map((lesson) => ({ ...lesson, skill: 'GRAMMAR' }))
    app = renderApp(
      '/exercises',
      baseRoutes({
        'GET /api/exercises': ({ params }) => (params.skill === 'GRAMMAR' ? { data: legacy } : { status: 400, data: { status: 400, message: 'Request parameter has an invalid value' } }),
      }),
    )
    const user = userEvent.setup()

    expect(await screen.findByRole('link', { name: /Thì hiện tại hoàn thành/ })).toHaveAttribute('href', '/exercises/lessons/3')
    expect(app.callsTo('GET /api/exercises').map((call) => call.params.skill)).toEqual(['READING', 'GRAMMAR'])
    await user.click(screen.getByRole('link', { name: 'Viết' }))
    expect(await screen.findByRole('heading', { name: 'Chưa có bài tập' })).toBeInTheDocument()
  })

  it('says when a skill has no lessons yet, and offers a retry when loading fails', async () => {
    let fail = true
    app = renderApp(
      '/exercises?skill=pronunciation',
      baseRoutes({ 'GET /api/exercises': () => (fail ? { status: 500, data: {} } : { data: [] }) }),
    )
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent('Máy chủ đang gặp sự cố')
    fail = false
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByRole('heading', { name: 'Chưa có bài tập' })).toBeInTheDocument()
  })
})

describe('reading exercise', () => {
  it('starts one attempt, grades each answer with the server and ends with the score and the questions to review', async () => {
    app = renderApp('/exercises/lessons/3', readingRoutes())
    const user = userEvent.setup()

    expect(await screen.findByRole('heading', { level: 1, name: 'Thì hiện tại hoàn thành' })).toBeInTheDocument()
    expect(screen.getByText('Câu 1/2')).toBeInTheDocument()
    expect(app.callsTo('POST /api/exercises/3/attempts')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Kiểm tra' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Xem gợi ý' }))
    expect(screen.getByText(/hành động kéo dài tới bây giờ/)).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'lives' }))
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))

    expect(await screen.findByText(/Chưa đúng\. Đáp án đúng:/)).toHaveTextContent('has lived')
    expect(app.callsTo(`POST /api/exercise-attempts/${ATTEMPT_ID}/responses`)[0].body).toEqual({ questionId: 31, optionId: 311 })
    expect(screen.getByRole('radio', { name: /has lived.*đáp án đúng/ })).toBeDisabled()
    expect(screen.getByRole('radio', { name: /lives.*chưa đúng/ })).toBeChecked()
    const next = screen.getByRole('button', { name: 'Câu tiếp theo →' })
    expect(next).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(await screen.findByText('Câu 2/2')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Đáp án của bạn' }), ' seen ')
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))

    expect(await screen.findByText('✓ Chính xác!')).toBeInTheDocument()
    expect(app.callsTo(`POST /api/exercise-attempts/${ATTEMPT_ID}/responses`)[1].body).toEqual({ questionId: 32, answer: 'seen' })

    await user.click(screen.getByRole('button', { name: 'Xem kết quả' }))

    const result = (await screen.findByRole('heading', { name: 'Hoàn thành bài tập' })).closest('section')
    expect(app.callsTo(`POST /api/exercise-attempts/${ATTEMPT_ID}/complete`)[0].body).toEqual({ responses: [] })
    expect(within(result).getByRole('img', { name: 'Đúng 1 trên 2 câu' })).toBeInTheDocument()
    expect(result).toHaveTextContent('Điểm 50% · Cao nhất 80%')
    expect(within(result).getByRole('link', { name: 'Bài tiếp theo' })).toHaveAttribute('href', '/exercises/lessons/5')

    // Step 16: every question is listed again, right or wrong.
    const review = screen.getByRole('heading', { name: 'Xem lại từng câu · đúng 1/2' }).closest('section')
    const items = within(review).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Câu 1 · ✗ Sai')
    expect(items[0]).toHaveTextContent('Bạn trả lời: lives')
    expect(items[0]).toHaveTextContent('Đáp án đúng: has lived')
    expect(items[1]).toHaveTextContent('Câu 2 · ✓ Đúng')
    expect(items[1]).toHaveTextContent('Bạn trả lời: seen')
    expect(items[1]).not.toHaveTextContent('Đáp án đúng')
  })

  it('shows the passage beside a question about it, and only then (scenario 9, step 13)', async () => {
    app = renderApp('/exercises/lessons/8', readingRoutes())
    const user = userEvent.setup()

    expect(await screen.findByText('Câu 1/2')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'A trip to Ha Long Bay' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'saw' }))
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    await user.click(await screen.findByRole('button', { name: 'Câu tiếp theo →' }))

    const passage = await screen.findByRole('region', { name: 'A trip to Ha Long Bay' })
    expect(within(passage).getByText('Bài đọc')).toBeInTheDocument()
    expect(within(passage).getByText('We spent one night on a boat.')).toBeInTheDocument()
    expect(screen.getByText('How did they get to Ha Long Bay?')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'By bus' }))
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByText('✓ Chính xác!')).toBeInTheDocument()
    expect(passage).toBeInTheDocument()
  })

  it('picks answers with the number keys', async () => {
    app = renderApp('/exercises/lessons/3', readingRoutes())
    const user = userEvent.setup()
    await screen.findByText('Câu 1/2')

    await user.keyboard('2')

    expect(screen.getByRole('radio', { name: 'has lived' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Kiểm tra' })).toBeEnabled()
  })

  it('keeps the answer when grading fails so it can be sent again', async () => {
    let fail = true
    app = renderApp(
      '/exercises/lessons/3',
      readingRoutes({
        [`POST /api/exercise-attempts/${ATTEMPT_ID}/responses`]: ({ body }) => (fail ? { networkError: true } : { data: gradeReading(body) }),
      }),
    )
    const user = userEvent.setup()
    await user.click(await screen.findByRole('radio', { name: 'has lived' }))
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Không kết nối được máy chủ')
    expect(screen.getByRole('radio', { name: 'has lived' })).toBeChecked()

    fail = false
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByText('✓ Chính xác!')).toBeInTheDocument()
  })

  it('starts a new attempt for "Làm lại"', async () => {
    app = renderApp(
      '/exercises/lessons/3',
      readingRoutes({ 'GET /api/exercises/3': () => ({ data: { ...READING_LESSON, questions: [READING_LESSON.questions[0]] } }) }),
    )
    const user = userEvent.setup()
    await user.click(await screen.findByRole('radio', { name: 'has lived' }))
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    await user.click(await screen.findByRole('button', { name: 'Xem kết quả' }))
    await user.click(await screen.findByRole('button', { name: 'Làm lại' }))

    expect(await screen.findByText('Câu 1/1')).toBeInTheDocument()
    expect(app.callsTo('POST /api/exercises/3/attempts')).toHaveLength(2)
    expect(app.callsTo('POST /api/exercises/3/attempts')[1].params).toEqual({ restart: true })
    expect(screen.getByRole('radio', { name: 'has lived' })).not.toBeChecked()
    expect(screen.queryByText('✓ Chính xác!')).not.toBeInTheDocument()
  })

  it('retries both the lesson and the attempt with one "Thử lại" when opening failed', async () => {
    let down = true
    app = renderApp(
      '/exercises/lessons/3',
      readingRoutes({
        'GET /api/exercises/3': () => (down ? { status: 500, data: {} } : { data: READING_LESSON }),
        'POST /api/exercises/3/attempts': () => (down ? { status: 500, data: {} } : { status: 201, data: { attemptId: ATTEMPT_ID } }),
      }),
    )
    const user = userEvent.setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Máy chủ đang gặp sự cố')

    down = false
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByText('Câu 1/2')).toBeInTheDocument()
    // A failed opening must not throw away an unfinished attempt: retrying still asks to pick it up.
    expect(app.callsTo('POST /api/exercises/3/attempts').every((call) => call.params === undefined)).toBe(true)
  })

  it('says the lesson does not exist for an unknown id', async () => {
    app = renderApp(
      '/exercises/lessons/99',
      baseRoutes({
        'GET /api/exercises/99': () => ({ status: 404, data: {} }),
        'POST /api/exercises/99/attempts': () => ({ status: 404, data: {} }),
      }),
    )

    expect(await screen.findByText('Bài tập này không tồn tại hoặc chưa được mở.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('link', { name: '← Về danh sách bài tập' })).toHaveAttribute('href', '/exercises'))
  })
})

describe('picking up an unfinished lesson', () => {
  const ATTEMPTS = 'POST /api/exercises/3/attempts'
  const RESPONSES = `POST /api/exercise-attempts/${ATTEMPT_ID}/responses`
  const resumed = { status: 200, data: { attemptId: ATTEMPT_ID, startedAt: '2026-09-25T02:00:00Z', resumed: true, responses: [RESULT.review[0]], pronunciation: [] } }

  it('opens at the first question not answered and keeps the earlier answers', async () => {
    app = renderApp('/exercises/lessons/3', readingRoutes({ [ATTEMPTS]: () => resumed }))
    const user = userEvent.setup()

    expect(await screen.findByText('Câu 2/2')).toBeInTheDocument()
    expect(screen.getByText(/Giữ lại/)).toHaveTextContent('Làm tiếp từ lần trước. Giữ lại 1/2 câu đã trả lời.')
    expect(screen.getByRole('progressbar', { name: 'Tiến độ bài làm' })).toHaveAttribute('aria-valuetext', 'Đã trả lời 1 / 2 câu')

    await user.type(screen.getByLabelText('Đáp án của bạn'), 'seen')
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    await user.click(await screen.findByRole('button', { name: 'Xem kết quả' }))

    expect(await screen.findByRole('heading', { name: 'Hoàn thành bài tập' })).toBeInTheDocument()
    expect(app.callsTo(RESPONSES).map((call) => call.body)).toEqual([{ questionId: 32, answer: 'seen' }])
    expect(screen.queryByText(/Làm tiếp từ lần trước/)).not.toBeInTheDocument()
  })

  it('shows the last question already graded when every question was answered', async () => {
    const allAnswered = { ...resumed, data: { ...resumed.data, responses: RESULT.review } }
    app = renderApp('/exercises/lessons/3', readingRoutes({ [ATTEMPTS]: () => allAnswered }))

    expect(await screen.findByText('Câu 2/2')).toBeInTheDocument()
    expect(screen.getByLabelText('Đáp án của bạn')).toHaveValue('seen')
    expect(screen.getByRole('button', { name: 'Xem kết quả' })).toBeEnabled()
  })

  it('starts over from the first question with "Làm lại từ đầu"', async () => {
    app = renderApp(
      '/exercises/lessons/3',
      readingRoutes({
        [ATTEMPTS]: ({ params }) =>
          params?.restart ? { status: 201, data: { attemptId: ATTEMPT_ID, startedAt: '2026-09-27T02:00:00Z', resumed: false, responses: [], pronunciation: [] } } : resumed,
      }),
    )
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Làm lại từ đầu' }))

    expect(await screen.findByText('Câu 1/2')).toBeInTheDocument()
    expect(screen.queryByText(/Làm tiếp từ lần trước/)).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'lives' })).not.toBeChecked()
    expect(app.callsTo(ATTEMPTS).map((call) => call.params)).toEqual([undefined, { restart: true }])
  })

  it('marks the lessons that can be picked up in the list', async () => {
    const inProgress = { attemptId: 57, doneCount: 1, lastActivityAt: '2026-09-26T14:10:00Z' }
    const lessons = LESSONS.READING.map((lesson) => (lesson.id === 3 ? { ...lesson, progress: { ...lesson.progress, inProgress } } : lesson))
    app = renderApp('/exercises', baseRoutes({ 'GET /api/exercises': () => ({ data: lessons }) }))

    expect(await screen.findByRole('link', { name: /Thì hiện tại hoàn thành/ })).toHaveTextContent('Đang làm dở · 1/2 câu')
    expect(screen.getByRole('link', { name: /Câu bị động/ })).not.toHaveTextContent('Đang làm dở')
  })
})
