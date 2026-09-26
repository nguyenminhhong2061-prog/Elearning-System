import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { ATTEMPT_ID, baseRoutes, renderApp } from './testFixtures'

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
    [MESSAGES]: () =>
      reply('Thì hiện tại hoàn thành (**has/have + V3**):\n\n- *for* + khoảng thời gian\n- *since* + mốc thời gian', [
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
  it('opens a session on the first question, sends the exercise context and shows the formatted answer', async () => {
    app = renderApp('/exercises/lessons/3', chatRoutes())
    const user = userEvent.setup()
    await screen.findByText('Câu 1/2')

    const panel = await openAssistant(user)
    expect(screen.getByRole('button', { name: 'Hỏi trợ lý AI' })).toHaveAttribute('aria-expanded', 'true')
    const input = within(panel).getByRole('textbox', { name: 'Câu hỏi cho trợ lý AI' })
    expect(input).toHaveFocus()
    expect(within(panel).getByRole('button', { name: 'Giải thích câu này giúp tôi' })).toBeInTheDocument()

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

  it('shows HTML in an answer as text instead of running it', async () => {
    app = renderApp('/exercises/lessons/3', chatRoutes({ [MESSAGES]: () => reply('<img src=x onerror="alert(1)"> **ok**') }))
    const user = userEvent.setup()
    await screen.findByText('Câu 1/2')
    const panel = await openAssistant(user)

    await user.click(within(panel).getByRole('button', { name: 'Mẹo để nhớ cấu trúc này' }))

    expect(await within(panel).findByText('ok', { selector: 'strong' })).toBeInTheDocument()
    expect(panel).toHaveTextContent('<img src=x onerror="alert(1)">')
    expect(panel.querySelector('img')).toBeNull()
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

    const review = (await screen.findByRole('heading', { name: 'Câu cần xem lại (1)' })).closest('section')
    await user.click(within(review).getByRole('button', { name: 'Hỏi trợ lý AI về câu này →' }))
    const panel = screen.getByRole('dialog', { name: 'Trợ lý AI' })
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

    expect(screen.getByRole('dialog', { name: 'Trợ lý AI' })).toBeInTheDocument()
  })
})
