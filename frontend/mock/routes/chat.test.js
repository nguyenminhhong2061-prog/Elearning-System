import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '../http.js'
import { chatRoutes, resetChatData } from './chat'

// The chat history endpoints of docs/api/chatbot.md, as the mock answers them (same page shape as the backend).

function call(method, path, { userId = 1, body = {}, query = '' } = {}) {
  const route = chatRoutes.find((candidate) => candidate.method === method && candidate.pattern.test(path))
  return route.handle({ userId, match: route.pattern.exec(path), body, searchParams: new URLSearchParams(query) })
}

/** Sends a message and lets the assistant's "thinking" delay pass. */
async function ask(sessionId, content, userId = 1) {
  const outcome = call('POST', `/api/chat/sessions/${sessionId}/messages`, { userId, body: { content } }).then(
    (reply) => ({ reply }),
    (error) => ({ error }),
  )
  await vi.runAllTimersAsync()
  const { reply, error } = await outcome
  if (error) throw error
  return reply
}

beforeEach(() => {
  vi.useFakeTimers()
  resetChatData()
})
afterEach(() => vi.useRealTimers())

describe('chat history', () => {
  it('lists only the learner own sessions, most recently used first', async () => {
    const first = call('POST', '/api/chat/sessions')
    vi.advanceTimersByTime(1000)
    const second = call('POST', '/api/chat/sessions')
    call('POST', '/api/chat/sessions', { userId: 2 })
    vi.advanceTimersByTime(1000)
    await ask(first.id, 'Luyện nghe thế nào?')

    const page = call('GET', '/api/chat/sessions', { query: 'page=0' })

    expect(page).toMatchObject({ last: true, totalElements: 2 })
    expect(page.content.map((session) => session.id)).toEqual([first.id, second.id])
    expect(page.content[0]).toEqual({
      id: first.id,
      title: 'Hỏi đáp chung',
      lessonId: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })

  it('keeps each question with its answer, newest first, and nothing when the AI fails', async () => {
    const session = call('POST', '/api/chat/sessions')
    const answer = await ask(session.id, 'Luyện nghe thế nào?')
    await expect(ask(session.id, 'thử lỗi #503')).rejects.toThrow(HttpError)

    const page = call('GET', `/api/chat/sessions/${session.id}/messages`)

    expect(page.totalElements).toBe(2)
    expect(page.content.map((message) => message.role)).toEqual(['ASSISTANT', 'USER'])
    expect(page.content[0]).toEqual(answer)
    expect(page.content[1]).toMatchObject({ content: 'Luyện nghe thế nào?', sources: [] })
  })

  it('hides another learner session and rejects a negative page', () => {
    const session = call('POST', '/api/chat/sessions', { userId: 2 })

    expect(() => call('GET', `/api/chat/sessions/${session.id}/messages`)).toThrow(HttpError)
    expect(() => call('GET', '/api/chat/sessions', { query: 'page=-1' })).toThrow(HttpError)
  })
})
