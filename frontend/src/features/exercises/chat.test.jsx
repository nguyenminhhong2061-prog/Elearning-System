import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { ATTEMPT_ID, baseRoutes, renderApp } from './testFixtures'
import '@/test/preloadPages'

// The AI assistant panel (B4), against docs/api/chatbot.md.

let app
afterEach(() => app?.backend.restore())

const SESSIONS = 'POST /api/chat/sessions'
const MESSAGES = 'POST /api/chat/sessions/9/messages'

function reply(content, sources = []) {
  return { status: 201, data: { id: 31, role: 'ASSISTANT', content, createdAt: '2026-09-26T02:03:00Z', sources } }
}

function chatRoutes(overrides) {
  return baseRoutes({
    [SESSIONS]: () => ({ status: 201, data: { id: 9, title: 'Thì hiện tại hoàn thành', createdAt: '2026-09-26T02:00:00Z' } }),
    'GET /api/chat/sessions': () => ({ data: { content: [], last: true } }),
    'GET /api/chat/sessions/9/messages': () => ({ data: { content: [], last: true } }),
    [MESSAGES]: () =>
      reply('<p>Thì hiện tại hoàn thành (<strong>has/have + V3</strong>):</p><ul><li><em>for</em> + khoảng thời gian</li><li><em>since</em> + mốc thời gian</li></ul>', [
        { title: 'Ngữ pháp: thì hiện tại hoàn thành' },
      ]),
    ...overrides,
  })
}

async function openAssistant(user) {
  await user.click(await screen.findByRole('button', { name: 'Hỏi trợ lý AI' }))
  return screen.getByRole('dialog', { name: 'Trợ lý AI' })
}

describe('AI assistant', () => {
  it('opens saved history and continues a session without creating another one', async () => {
    app = renderApp('/exercises', chatRoutes({
      'GET /api/chat/sessions': () => ({ data: { content: [{ id: 9, title: 'Hỏi đáp chung', lessonId: null, createdAt: '2026-09-26T02:00:00Z', updatedAt: '2026-09-26T02:03:00Z' }], last: true } }),
      'GET /api/chat/sessions/9/messages': () => ({ data: { content: [
        { id: 31, role: 'ASSISTANT', content: '<p>Hãy luyện nghe mỗi ngày.</p>', sources: [] },
        { id: 30, role: 'USER', content: 'Luyện nghe sao?', sources: [] },
      ], last: true } }),
    }))
    const user = userEvent.setup()
    const panel = await openAssistant(user)
    await user.click(within(panel).getByRole('button', { name: 'Lịch sử' }))
    const savedSession = await within(panel).findByRole('button', { name: /Hỏi đáp chung/ })
    await waitFor(() => expect(savedSession).toBeEnabled())
    await user.click(savedSession)
    expect(within(panel).getByText('Luyện nghe sao?')).toBeInTheDocument()
    expect(within(panel).getByText('Hãy luyện nghe mỗi ngày.')).toBeInTheDocument()
    await user.type(within(panel).getByRole('textbox', { name: 'Câu hỏi cho trợ lý AI' }), 'Còn cách nào?{Enter}')
    await within(panel).findByText('has/have + V3', { selector: 'strong' })
    expect(app.callsTo(SESSIONS)).toHaveLength(0)
    expect(app.callsTo(MESSAGES)).toHaveLength(1)
  })

  it('opens a session on the first question, sends the exercise context and shows the formatted answer', async () => {
    app = renderApp('/exercises/lessons/3', chatRoutes())
    const user = userEvent.setup()
    await screen.findByText('Câu 1/2')

    const panel = await openAssistant(user)
    expect(screen.getByRole('button', { name: 'Hỏi trợ lý AI' })).toHaveAttribute('aria-expanded', 'true')
    const input = within(panel).getByRole('textbox', { name: 'Câu hỏi cho trợ lý AI' })
    expect(input).toHaveFocus()
    expect(within(panel).getByRole('button', { name: 'Giải thích câu này giúp tôi' })).toBeInTheDocument()
    // Scenario 13, step 3: the panel says which question it is about.
    expect(within(panel).getByText('Câu 1 – Thì hiện tại hoàn thành: She ___ (live) in Hanoi for five years.')).toBeInTheDocument()

    await user.type(input, 'Vì sao dùng has lived?{Enter}')

    const log = within(panel).getByRole('log')
    expect(await within(log).findByText('has/have + V3', { selector: 'strong' })).toBeInTheDocument()
    expect(within(log).getAllByRole('listitem')).toHaveLength(2)
    expect(log).toHaveTextContent('Nguồn: Ngữ pháp: thì hiện tại hoàn thành')
    expect(input).toHaveValue('')
    expect(app.callsTo(SESSIONS)[0].body).toEqual({ lessonId: 3, questionId: 31 })
    expect(app.callsTo(MESSAGES)[0].body).toEqual({
      content: 'Vì sao dùng has lived?',
      questionId: 31,
      attemptId: ATTEMPT_ID,
      pronunciationItemId: null,
    })

    // One session per page: the next question reuses it, with the context of the question now on screen.
    await user.click(screen.getByRole('radio', { name: 'has lived' }))
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    await user.click(await screen.findByRole('button', { name: 'Câu tiếp theo →' }))
    await user.click(within(panel).getByRole('textbox', { name: 'Câu hỏi cho trợ lý AI' }))
    await user.keyboard('Còn câu này?{Enter}')
    await waitFor(() => expect(within(log).getAllByText('has/have + V3', { selector: 'strong' })).toHaveLength(2))
    expect(app.callsTo(SESSIONS)).toHaveLength(1)
    expect(app.callsTo(MESSAGES)[1].body).toMatchObject({ content: 'Còn câu này?', questionId: 32 })
  })

  it('reopens the latest chat of this lesson when the learner comes back to it (scenario 13, branch 2a)', async () => {
    app = renderApp('/exercises/lessons/3', chatRoutes({
      'GET /api/chat/sessions': () => ({ data: { content: [
        { id: 8, title: 'Hỏi đáp chung', lessonId: null, createdAt: '2026-09-26T03:00:00Z', updatedAt: '2026-09-26T03:00:00Z' },
        { id: 9, title: 'Thì hiện tại hoàn thành', lessonId: 3, createdAt: '2026-09-26T02:00:00Z', updatedAt: '2026-09-26T02:03:00Z' },
      ], last: true } }),
      'GET /api/chat/sessions/9/messages': () => ({ data: { content: [
        { id: 31, role: 'ASSISTANT', content: '<p>Câu này nói về trải nghiệm.</p>', sources: [] },
        { id: 30, role: 'USER', content: 'Tại sao không dùng saw?', sources: [] },
      ], last: true } }),
    }))
    const user = userEvent.setup()
    await screen.findByText('Câu 1/2')

    const panel = await openAssistant(user)
    expect(await within(panel).findByText('Tại sao không dùng saw?')).toBeInTheDocument()
    expect(within(panel).getByText('Câu này nói về trải nghiệm.')).toBeInTheDocument()

    await user.type(within(panel).getByRole('textbox', { name: 'Câu hỏi cho trợ lý AI' }), 'Thêm ví dụ?{Enter}')
    await within(panel).findByText('has/have + V3', { selector: 'strong' })
    expect(app.callsTo(SESSIONS)).toHaveLength(0)
    expect(app.callsTo(MESSAGES)).toHaveLength(1)
  })

  it('renders allowed HTML but drops dangerous tags and attributes', async () => {
    app = renderApp('/exercises/lessons/3', chatRoutes({ [MESSAGES]: () => reply('<p onclick="alert(1)"><strong>ok</strong><img src=x onerror="alert(1)"><script>alert(1)</script></p>') }))
    const user = userEvent.setup()
    await screen.findByText('Câu 1/2')
    const panel = await openAssistant(user)

    await user.click(within(panel).getByRole('button', { name: 'Cho tôi thêm ví dụ tương tự' }))

    expect(await within(panel).findByText('ok', { selector: 'strong' })).toBeInTheDocument()
    expect(panel.querySelector('img')).toBeNull()
    expect(panel.querySelector('script')).toBeNull()
    expect(panel.querySelector('p[onclick]')).toBeNull()
    expect(panel).not.toHaveTextContent('alert(1)')
  })

  it('says when the AI cannot answer and sends the same question again', async () => {
    let fail = true
    app = renderApp('/exercises', chatRoutes({ [MESSAGES]: () => (fail ? { status: 503, data: {} } : reply('Đây là câu trả lời.')) }))
    const user = userEvent.setup()
    const panel = await openAssistant(user)

    await user.type(within(panel).getByRole('textbox', { name: 'Câu hỏi cho trợ lý AI' }), 'Mẹo luyện nghe?{Enter}')
    expect(await within(panel).findByRole('alert')).toHaveTextContent('Trợ lý AI không thể trả lời lúc này, hãy thử lại sau.')
    expect(app.callsTo(SESSIONS)[0].body).toEqual({ lessonId: null, questionId: null })

    fail = false
    await user.click(within(panel).getByRole('button', { name: 'Gửi lại' }))
    expect(await within(panel).findByText('Đây là câu trả lời.')).toBeInTheDocument()
    expect(within(panel).getAllByText('Mẹo luyện nghe?')).toHaveLength(1)
    expect(within(panel).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('closes with Escape and gives focus back to the button', async () => {
    app = renderApp('/exercises', chatRoutes())
    const user = userEvent.setup()
    await openAssistant(user)

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog', { name: 'Trợ lý AI' })).not.toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: 'Hỏi trợ lý AI' })
    expect(toggle).toHaveFocus()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('asks about the reviewed question from the result, not about the last one answered', async () => {
    app = renderApp(
      '/exercises/lessons/3',
      chatRoutes({
        [`POST /api/exercise-attempts/${ATTEMPT_ID}/complete`]: () => ({
          data: {
            attemptId: ATTEMPT_ID,
            lessonId: 3,
            correctCount: 1,
            questionCount: 2,
            earnedPoints: 1,
            totalPoints: 2,
            scorePercent: 50,
            bestScorePercent: 50,
            isPersonalBest: false,
            review: [
              { questionId: 31, correct: false, optionId: 311, answer: null, correctOptionId: 312, correctAnswer: 'has lived', explanation: null },
              { questionId: 32, correct: true, optionId: null, answer: 'seen', correctOptionId: null, correctAnswer: 'seen', explanation: null },
            ],
            translations: [],
            pronunciation: null,
          },
        }),
      }),
    )
    const user = userEvent.setup()
    await user.click(await screen.findByRole('radio', { name: 'lives' }))
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    await user.click(await screen.findByRole('button', { name: 'Câu tiếp theo →' }))
    await user.type(screen.getByRole('textbox', { name: 'Đáp án của bạn' }), 'seen{Enter}')
    await user.click(await screen.findByRole('button', { name: 'Xem kết quả' }))

    const review = (await screen.findByRole('heading', { name: /^Xem lại từng câu/ })).closest('section')
    await user.click(within(review).getAllByRole('button', { name: 'Hỏi trợ lý AI về câu này →' })[0])
    const panel = screen.getByRole('dialog', { name: 'Trợ lý AI' })
    expect(within(panel).getByText(/^Câu 1 – .*Bạn chọn: lives \(sai\)$/)).toBeInTheDocument()
    await user.type(within(panel).getByRole('textbox', { name: 'Câu hỏi cho trợ lý AI' }), 'Vì sao sai?{Enter}')

    await within(panel).findByText('has/have + V3', { selector: 'strong' })
    expect(app.callsTo(MESSAGES)[0].body).toMatchObject({ questionId: 31, attemptId: ATTEMPT_ID })
  })

  it('opens from the "ask about this question" link under a graded answer', async () => {
    app = renderApp('/exercises/lessons/3', chatRoutes())
    const user = userEvent.setup()
    await user.click(await screen.findByRole('radio', { name: 'lives' }))
    await user.click(screen.getByRole('button', { name: 'Kiểm tra' }))

    await user.click(await screen.findByRole('button', { name: 'Hỏi trợ lý AI về câu này →' }))

    const panel = screen.getByRole('dialog', { name: 'Trợ lý AI' })
    expect(within(panel).getByText(/^Câu 1 – .*Bạn chọn: lives \(sai\)$/)).toBeInTheDocument()
  })
})
