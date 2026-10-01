import { delay, HttpError } from '../http.js'
import { MOCK_LESSONS } from '../exerciseFixtures.js'
import { findAttempt, findLesson, isWriting } from './exercises.js'

// docs/api/chatbot.md. There is no AI here: answers are written from the lesson data, following the rule the contract
// suggests for the real assistant (a hint before the learner has answered, the full explanation afterwards).
// A message containing "#503" fails like an unavailable AI service, and "#429" like a rate limit, to try the error
// states (the /__mock page can also make every message fail).

const THINKING_MS = 900
const HISTORY_PAGE_SIZE = 20
const MESSAGE_PAGE_SIZE = 50
const sessions = new Map() // id -> { id, userId, lessonId, title, createdAt, updatedAt, messages: [] }
let nextSessionId = 1
let nextMessageId = 1

/** Forgets every chat session (the /__mock page's reset). */
export function resetChatData() {
  sessions.clear()
}

/** A page as the backend's chat endpoints return it: { content, last, totalElements }. */
function chatPage(items, searchParams, size) {
  const page = Number(searchParams.get('page') ?? 0)
  if (!Number.isInteger(page) || page < 0) throw new HttpError(400, 'Page must not be negative')
  return { content: items.slice(page * size, (page + 1) * size), last: (page + 1) * size >= items.length, totalElements: items.length }
}

const newestFirst = (a, b) => b.at.localeCompare(a.at) || b.id - a.id

function toSession(session) {
  const { id, title, lessonId, createdAt, updatedAt } = session
  return { id, title, lessonId, createdAt, updatedAt }
}

function ownSession(userId, id) {
  const session = sessions.get(id)
  if (!session || session.userId !== userId) throw new HttpError(404, 'Chat session not found')
  return session
}

function findQuestion(id) {
  for (const lesson of MOCK_LESSONS) {
    const question = lesson.questions.find((candidate) => candidate.id === id)
    if (question) return { lesson, question }
  }
  return null
}

function findItem(id) {
  for (const lesson of MOCK_LESSONS) {
    const item = lesson.pronunciationItems.find((candidate) => candidate.id === id)
    if (item) return item
  }
  return null
}

function correctAnswerOf(question) {
  return question.correctOptionId ? question.options.find((option) => option.id === question.correctOptionId).text : question.accepted[0]
}

function generalReply(content) {
  const text = content.toLowerCase()
  if (text.includes('hoàn thành') || text.includes('quá khứ đơn')) {
    return [
      '**Hiện tại hoàn thành** (have/has + V3) nối quá khứ với hiện tại; **quá khứ đơn** (V2) nói về việc đã xong ở một thời điểm xác định.',
      '',
      '- *I have lived here for five years.* → vẫn đang sống ở đây.',
      '- *I lived there in 2019.* → chuyện đã qua, có mốc thời gian.',
      '',
      'Dấu hiệu: `for`, `since`, `ever`, `just` thường đi với hiện tại hoàn thành; `yesterday`, `ago`, `in 2019` đi với quá khứ đơn.',
    ].join('\n')
  }
  if (text.includes('-ed') || text.includes(' ed')) {
    return 'Đuôi **-ed** có 3 cách đọc:\n\n1. /ɪd/ sau âm /t/, /d/: *wanted*, *decided*\n2. /t/ sau âm vô thanh (/k/, /p/, /s/, /ʃ/, /tʃ/): *worked*, *watched*\n3. /d/ sau các âm còn lại: *played*, *cleaned*'
  }
  if (text.includes('nghe')) {
    return 'Một vài mẹo luyện nghe:\n\n- Nghe lần đầu để nắm ý chính, chưa bật phụ đề.\n- Nghe lại đoạn khó ở tốc độ **0.75x**.\n- Bấm vào một câu trong phụ đề để nghe lại riêng câu đó.'
  }
  return 'Mình là trợ lý giả của `npm run dev:mock`. Khi có backend thật, câu trả lời sẽ do AI tạo ra dựa trên bài bạn đang làm.'
}

/** A writing question (scenario 10): hints before the learner wrote anything, the AI's grading and samples after. */
function writingReply(lesson, question, response) {
  const sources = [{ title: `Bài: ${lesson.title}` }]
  if (!response) {
    return {
      content: `Bạn chưa viết câu này nên mình gợi ý thôi nhé:\n\n- ${question.hint ?? 'Xác định thì và cấu trúc câu cần dùng trước.'}\n- Viết một câu ngắn, đúng ngữ pháp, rồi mới làm cho tự nhiên hơn.\n\nViết xong và được chấm, hỏi lại để xem câu mẫu.`,
      sources,
    }
  }
  if (!response.graded) {
    return { content: 'Câu của bạn đã được lưu nhưng **chưa được chấm**. Bấm "Gửi chấm lại", chấm xong mình giải thích kỹ hơn nhé.', sources }
  }
  const samples = question.sampleAnswers.map((sample) => `- *${sample}*`).join('\n')
  return {
    content: `Câu của bạn được **${response.awardedPoints}/${response.maxPoints}** điểm. ${response.feedback}\n\nCâu mẫu:\n${samples}\n\n${question.explanation ?? ''}`,
    sources,
  }
}

function replyFor(userId, session, body) {
  const found = body.questionId ? findQuestion(body.questionId) : null
  if (found) {
    const { lesson, question } = found
    const attempt = body.attemptId ? findAttempt(userId, body.attemptId) : undefined
    if (isWriting(question)) return writingReply(lesson, question, attempt?.responses.get(question.id))
    const answered = attempt?.responses.has(question.id)
    if (!answered) {
      return {
        content: `Bạn chưa trả lời câu này nên mình gợi ý thôi nhé:\n\n- ${question.hint ?? 'Tìm từ khóa về thời gian hoặc chủ ngữ trong câu.'}\n- Loại các đáp án sai ngữ pháp trước.\n\nTrả lời xong, hỏi lại để xem giải thích đầy đủ.`,
        sources: [{ title: `Bài: ${lesson.title}` }],
      }
    }
    return {
      content: `Đáp án đúng là **${correctAnswerOf(question)}**.\n\n${question.explanation}\n\nĐể nhớ lâu:\n- Gạch chân từ khóa trong câu.\n- Tự đặt thêm một câu tương tự.`,
      sources: [{ title: `Bài: ${lesson.title}` }],
    }
  }
  const item = body.pronunciationItemId ? findItem(body.pronunciationItemId) : null
  if (item) {
    return {
      content: `**${item.text}** đọc là \`${item.ipa}\`. ${item.notes ?? ''}\n\nCách luyện:\n1. Bấm "Nghe mẫu" và nghe 2 đến 3 lần.\n2. Đọc chậm từng âm tiết, nhấn vào âm tiết mang trọng âm.\n3. Ghi âm và so với mẫu.`,
      sources: [],
    }
  }
  const lesson = session.lessonId ? findLesson(session.lessonId) : null
  if (lesson?.skill === 'LISTENING') return { content: generalReply('nghe'), sources: [{ title: `Bài: ${lesson.title}` }] }
  return { content: generalReply(body.content), sources: [] }
}

export const chatRoutes = [
  {
    method: 'GET',
    pattern: /^\/api\/chat\/sessions$/,
    handle({ userId, searchParams }) {
      const own = [...sessions.values()]
        .filter((session) => session.userId === userId)
        .map((session) => ({ ...session, at: session.updatedAt }))
        .sort(newestFirst)
      return chatPage(own.map(toSession), searchParams, HISTORY_PAGE_SIZE)
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/chat\/sessions$/,
    status: 201,
    handle({ userId, body }) {
      const lesson = body.lessonId ? findLesson(body.lessonId) : null
      if (body.lessonId && !lesson) throw new HttpError(404, 'Lesson not found')
      if (body.questionId && !findQuestion(body.questionId)) throw new HttpError(404, 'Question not found')
      const now = new Date().toISOString()
      const session = {
        id: nextSessionId++,
        userId,
        lessonId: lesson?.id ?? null,
        title: lesson?.title ?? 'Hỏi đáp chung',
        createdAt: now,
        updatedAt: now,
        messages: [],
      }
      sessions.set(session.id, session)
      return toSession(session)
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/chat\/sessions\/(\d+)\/messages$/,
    handle({ userId, match, searchParams }) {
      const session = ownSession(userId, Number(match[1]))
      const messages = session.messages.map((message) => ({ ...message, at: message.createdAt })).sort(newestFirst)
      return chatPage(messages.map(({ at: _at, ...message }) => message), searchParams, MESSAGE_PAGE_SIZE)
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/chat\/sessions\/(\d+)\/messages$/,
    status: 201,
    async handle({ userId, match, body }) {
      const session = ownSession(userId, Number(match[1]))
      const content = typeof body.content === 'string' ? body.content.trim() : ''
      if (!content || content.length > 1000) throw new HttpError(400, 'content must be 1 to 1000 characters')
      const askedAt = new Date().toISOString()
      await delay(THINKING_MS)
      if (content.includes('#503')) throw new HttpError(503, 'AI service unavailable')
      if (content.includes('#429')) throw new HttpError(429, 'Too many messages')
      const reply = replyFor(userId, session, { ...body, content })
      // As on the server, the question and the answer are stored together, and only when the AI has answered.
      const answer = { id: nextMessageId + 1, role: 'ASSISTANT', createdAt: new Date().toISOString(), ...reply }
      session.messages.push({ id: nextMessageId, role: 'USER', content, createdAt: askedAt, sources: [] }, answer)
      nextMessageId += 2
      session.updatedAt = answer.createdAt
      return answer
    },
  },
]
