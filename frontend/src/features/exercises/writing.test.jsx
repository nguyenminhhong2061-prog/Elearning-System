import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { ATTEMPT_ID, baseRoutes, renderApp, WRITING_GRADES, writingResult } from './testFixtures'
import { feedbackSummary, formatTotal, scoreText, writingOutcome } from './writing/writing'
import '@/test/preloadPages'

// The writing exercise (scenario 10), against docs/api/exercises.md: each answer is graded by the AI.

let app
afterEach(() => app?.backend.restore())

const RESPONSES = `POST /api/exercise-attempts/${ATTEMPT_ID}/responses`
const COMPLETE = `POST /api/exercise-attempts/${ATTEMPT_ID}/complete`
const regradePath = (questionId) => `POST /api/exercise-attempts/${ATTEMPT_ID}/responses/${questionId}/grade`
const ANSWERS = { 41: 'I booked the hotel room before two weeks.', 42: 'We spent three hours getting to Da Lat.' }

const RESULT = {
  attemptId: ATTEMPT_ID,
  lessonId: 33,
  correctCount: 1,
  questionCount: 2,
  earnedPoints: 3,
  totalPoints: 4,
  scorePercent: 75,
  bestScorePercent: 75,
  isPersonalBest: false,
  review: [writingResult(41, { answer: ANSWERS[41] }), writingResult(42, { answer: ANSWERS[42] })],
  translations: [],
  pronunciation: null,
}

function writingRoutes(overrides) {
  return baseRoutes({ [COMPLETE]: () => ({ data: RESULT }), ...overrides })
}

describe('writing helpers', () => {
  it('writes points like the scenario and colours each answer by its share', () => {
    expect(scoreText({ awardedPoints: 1, maxPoints: 2 })).toBe('1.0/2')
    expect(scoreText({ awardedPoints: 1.5, maxPoints: 2 })).toBe('1.5/2')
    expect(formatTotal(12)).toBe('12')
    expect(formatTotal(9.5)).toBe('9.5')
    expect(writingOutcome(undefined)).toBeUndefined()
    expect(writingOutcome({ graded: false })).toBe('pending')
    expect(writingOutcome({ graded: true, awardedPoints: 2, maxPoints: 2 })).toBe(true)
    expect(writingOutcome({ graded: true, awardedPoints: 0, maxPoints: 2 })).toBe(false)
    expect(writingOutcome({ graded: true, awardedPoints: 1.5, maxPoints: 2 })).toBe('partial')
    expect(feedbackSummary('Chia đúng thì. Nhưng "before two weeks" chưa tự nhiên.')).toBe('Chia đúng thì.')
  })
})

describe('writing lessons', () => {
  it('have their own tab (scenario 10, steps 1 and 2)', async () => {
    app = renderApp('/exercises?skill=writing', baseRoutes())

    expect(await screen.findByText('Đã hoàn thành 1 / 2 bài viết')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Viết' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Viết về chuyến đi/ })).toHaveTextContent('Chưa làm')
    expect(screen.getByRole('link', { name: /Email công việc ngắn/ })).toHaveTextContent('Tốt nhất 83% · 1 lần')
    expect(app.callsTo('GET /api/exercises')[0].params).toEqual({ skill: 'WRITING' })
  })
})

describe('writing exercise', () => {
  it('supports paragraph translation and shows rubric, suggested translation, and specific corrections', async () => {
    const submitted = 'Thời tiết thay đổi nhiều ở nước tôi. Chúng tôi có bốn mùa.'
    const translationAssessment = {
      level: 'Rất tốt',
      criteria: [
        { name: 'Độ chính xác ngữ nghĩa', scorePercent: 98, comment: 'Truyền đạt đầy đủ và chính xác ý nghĩa.' },
        { name: 'Văn phong và sự trôi chảy', scorePercent: 96, comment: 'Diễn đạt tự nhiên, mạch lạc.' },
      ],
      suggestedTranslation: 'Thời tiết ở đất nước tôi thay đổi rất nhiều. Chúng tôi có bốn mùa rõ rệt.',
      suggestions: ['Có thể lược bỏ từ “thường” để bám sát câu gốc hơn.'],
      errors: [{ sourcePhrase: 'People go to the beach', learnerVersion: 'Mọi người thường ra bãi biển', correction: 'Mọi người ra bãi biển', explanation: 'Câu gốc không dùng trạng từ often.' }],
    }
    const graded = {
      questionId: 351, graded: true, correct: null, answer: submitted, optionId: null,
      awardedPoints: 98, maxPoints: 100, feedback: 'Bản dịch rất tốt và đầy đủ.', sampleAnswers: [], explanation: null,
      translationAssessment,
    }
    const completed = {
      attemptId: ATTEMPT_ID, lessonId: 35, correctCount: 0, questionCount: 1,
      earnedPoints: 98, totalPoints: 100, scorePercent: 98, bestScorePercent: 98, isPersonalBest: true,
      review: [graded], translations: [], pronunciation: null,
    }
    app = renderApp('/exercises/lessons/35', baseRoutes({
      'POST /api/exercise-attempts/55/responses': () => ({ data: graded }),
      'POST /api/exercise-attempts/55/complete': () => ({ data: completed }),
    }))
    const user = userEvent.setup()

    expect(await screen.findByText('Dịch đoạn văn')).toBeInTheDocument()
    expect(screen.getByText('Dịch đoạn văn sau sang tiếng Việt:')).toBeInTheDocument()
    const box = screen.getByRole('textbox', { name: 'Câu trả lời của bạn' })
    expect(box).toHaveAttribute('lang', 'vi')
    expect(box).toHaveAttribute('rows', '10')
    await user.type(box, submitted)
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))

    expect(await screen.findByText('Điểm 98/100')).toBeInTheDocument()
    expect(screen.getByText('Đánh giá theo tiêu chí · Rất tốt')).toBeInTheDocument()
    expect(screen.getByText('Độ chính xác ngữ nghĩa')).toBeInTheDocument()
    expect(screen.getByText(translationAssessment.suggestedTranslation)).toBeInTheDocument()
    expect(screen.getByText('Các lỗi cần chú ý')).toBeInTheDocument()
    expect(screen.getByText('Mọi người ra bãi biển')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Xem kết quả' }))
    expect(await screen.findByRole('heading', { name: 'Hoàn thành bài tập' })).toBeInTheDocument()
    const [item] = screen.getByRole('heading', { name: 'Xem lại từng câu' }).closest('section').querySelectorAll('li')
    await user.click(within(item).getByRole('button', { name: 'Xem chi tiết' }))
    expect(within(item).getByText('Gợi ý cải thiện')).toBeVisible()
  })

  it('sends each answer to the AI and shows its points, feedback and sample answers (scenario 10, steps 4 to 14)', async () => {
    let finishGrading
    app = renderApp(
      '/exercises/lessons/33',
      writingRoutes({
        // The first answer waits for the AI, so "Đang chấm…" can be seen.
        [RESPONSES]: ({ body }) =>
          body.questionId === 41
            ? new Promise((resolve) => {
                finishGrading = () => resolve({ data: writingResult(41) })
              })
            : { data: writingResult(body.questionId) },
      }),
    )
    const user = userEvent.setup()

    expect(await screen.findByText('Câu 1/2')).toBeInTheDocument()
    expect(screen.getByText('← Bài tập viết')).toBeInTheDocument()
    expect(screen.getByText('Dịch câu')).toBeInTheDocument()
    expect(screen.getByText('Dịch sang tiếng Anh:')).toBeInTheDocument()
    expect(screen.getByText('Tôi đã đặt phòng khách sạn trước hai tuần.')).toBeInTheDocument()
    // Branch 5a: nothing written, nothing to check.
    expect(screen.getByRole('button', { name: 'Kiểm tra' })).toBeDisabled()
    // Branch 5b: the hint, without the sample answers.
    await user.click(screen.getByRole('button', { name: 'Xem gợi ý' }))
    expect(screen.getByText(/Chú ý cách nói 'trước bao lâu'/)).toBeInTheDocument()

    const box = screen.getByRole('textbox', { name: 'Câu trả lời của bạn' })
    await user.type(box, ANSWERS[41])
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByRole('button', { name: 'Đang chấm…' })).toBeDisabled()
    finishGrading()

    expect(await screen.findByText('Điểm 1.0/2')).toBeInTheDocument()
    expect(app.callsTo(RESPONSES)[0].body).toEqual({ questionId: 41, answer: ANSWERS[41] })
    expect(screen.getByText(WRITING_GRADES[41].feedback)).toBeInTheDocument()
    expect(screen.getByText('I booked the hotel room two weeks in advance.')).toBeInTheDocument()
    expect(screen.getByText(WRITING_GRADES[41].explanation)).toBeInTheDocument()
    // Branch 8a: what was sent cannot be changed in this attempt.
    expect(screen.getByRole('textbox', { name: 'Câu trả lời của bạn' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Câu trả lời của bạn' })).toHaveValue(ANSWERS[41])
    expect(screen.getByRole('progressbar', { name: 'Tiến độ bài làm' })).toHaveAttribute('aria-valuetext', 'Đã trả lời 1 / 2 câu')

    await user.click(screen.getByRole('button', { name: 'Câu tiếp theo →' }))
    expect(await screen.findByText('Câu 2/2')).toBeInTheDocument()
    expect(screen.getByText('Viết lại câu')).toBeInTheDocument()
    expect(screen.getByText('We spent …')).toBeInTheDocument()
    // Ctrl+Enter checks, Enter alone starts a new line.
    await user.type(screen.getByRole('textbox', { name: 'Câu trả lời của bạn' }), `${ANSWERS[42]}{Control>}{Enter}{/Control}`)
    expect(await screen.findByText('Điểm 2.0/2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Xem kết quả' }))
    const result = (await screen.findByRole('heading', { name: 'Hoàn thành bài tập' })).closest('section')
    expect(app.callsTo(COMPLETE)[0].body).toEqual({ responses: [] })
    expect(within(result).getByRole('img', { name: 'Đạt 3 trên 4 điểm' })).toHaveTextContent('3/4')
    expect(result).toHaveTextContent('Điểm 75% · Cao nhất 75%')

    const review = screen.getByRole('heading', { name: 'Xem lại từng câu' }).closest('section')
    const [first] = within(review).getAllByRole('listitem')
    expect(first).toHaveTextContent('Câu 1 · Dịch câu · 1.0/2 điểm')
    expect(first).toHaveTextContent(`Câu trả lời của bạn: ${ANSWERS[41]}`)
    expect(within(first).queryByText('I booked a hotel room two weeks ahead.')).not.toBeVisible()
    await user.click(within(first).getByRole('button', { name: 'Xem chi tiết' }))
    expect(within(first).getByText('I booked a hotel room two weeks ahead.')).toBeVisible()
    expect(within(first).getByRole('button', { name: 'Ẩn chi tiết' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps an answer the AI could not grade and sends it again, then completes (branches 7b and 14a)', async () => {
    let aiUp = false
    app = renderApp(
      '/exercises/lessons/33',
      writingRoutes({
        [RESPONSES]: ({ body }) => ({ data: writingResult(body.questionId, { graded: body.questionId !== 41 }) }),
        [regradePath(41)]: () => ({ data: writingResult(41, { graded: aiUp }) }),
      }),
    )
    const user = userEvent.setup()

    await user.type(await screen.findByRole('textbox', { name: 'Câu trả lời của bạn' }), ANSWERS[41])
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    expect(await screen.findByText('Chưa chấm được câu này')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Câu trả lời của bạn' })).toBeDisabled()
    expect(screen.getByRole('progressbar', { name: 'Tiến độ bài làm' })).toHaveAttribute('aria-valuetext', 'Đã trả lời 1 / 2 câu, 1 câu chưa chấm')

    // Still down: nothing changes, the answer is not scored.
    await user.click(screen.getByRole('button', { name: 'Gửi chấm lại' }))
    await waitFor(() => expect(app.callsTo(regradePath(41))).toHaveLength(1))
    expect(screen.getByText('Chưa chấm được câu này')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Câu tiếp theo →' }))
    await user.type(await screen.findByRole('textbox', { name: 'Câu trả lời của bạn' }), ANSWERS[42])
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    await user.click(await screen.findByRole('button', { name: 'Xem kết quả' }))

    // No total while an answer is not graded.
    expect(await screen.findByRole('heading', { name: 'Chưa có tổng điểm' })).toHaveFocus()
    expect(screen.getByText(/^Còn 1 câu chưa chấm\./)).toBeInTheDocument()
    expect(app.callsTo(COMPLETE)).toHaveLength(0)

    aiUp = true
    await user.click(screen.getByRole('button', { name: 'Gửi chấm lại các câu chưa chấm' }))
    expect(await screen.findByRole('heading', { name: 'Hoàn thành bài tập' })).toBeInTheDocument()
    expect(app.callsTo(regradePath(41))).toHaveLength(2)
    expect(app.callsTo(COMPLETE)).toHaveLength(1)
  })

  it('picks up an attempt at the next question and says which answers wait for grading (branch 13a)', async () => {
    app = renderApp(
      '/exercises/lessons/33',
      writingRoutes({
        'POST /api/exercises/33/attempts': () => ({
          data: { attemptId: ATTEMPT_ID, startedAt: '2026-09-26T02:00:00Z', resumed: true, responses: [writingResult(41, { graded: false, answer: ANSWERS[41] })], pronunciation: [] },
        }),
      }),
    )

    expect(await screen.findByText('Câu 2/2')).toBeInTheDocument()
    expect(screen.getByText(/1\/2 câu đã trả lời, 1 câu chưa chấm/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Làm lại từ đầu' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Câu trả lời của bạn' })).toBeEnabled()
  })
})
