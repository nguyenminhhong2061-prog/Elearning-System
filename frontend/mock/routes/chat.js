import { delay, HttpError } from '../http.js'
import { MOCK_LESSONS } from '../exerciseFixtures.js'
import { findAttempt, findLesson } from './exercises.js'

// docs/api/chatbot.md. There is no AI here: answers are written from the lesson data, following the rule the contract
// suggests for the real assistant (a hint before the learner has answered, the full explanation afterwards).
// A message containing "#503" fails like an unavailable AI service, and "#429" like a rate limit, to try the error
// states (the /__mock page can also make every message fail).

const THINKING_MS = 900
const sessions = new Map()
let nextSessionId = 1
let nextMessageId = 1

/** Forgets every chat session (the /__mock page's reset). */
export function resetChatData() {
  sessions.clear()
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

function replyFor(userId, session, body) {
  const found = body.questionId ? findQuestion(body.questionId) : null
  if (found) {
    const { lesson, question } = found
    const attempt = body.attemptId ? findAttempt(userId, body.attemptId) : undefined
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
    method: 'POST',
    pattern: /^\/api\/chat\/sessions$/,
    status: 201,
    handle({ userId, body }) {
      const lesson = body.lessonId ? findLesson(body.lessonId) : null
      if (body.lessonId && !lesson) throw new HttpError(404, 'Lesson not found')
      if (body.questionId && !findQuestion(body.questionId)) throw new HttpError(404, 'Question not found')
      const session = {
        id: nextSessionId++,
        userId,
        lessonId: lesson?.id ?? null,
        title: lesson?.title ?? 'Hỏi đáp chung',
        createdAt: new Date().toISOString(),
      }
      sessions.set(session.id, session)
      return { id: session.id, title: session.title, createdAt: session.createdAt }
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/chat\/sessions\/(\d+)\/messages$/,
    status: 201,
    async handle({ userId, match, body }) {
      const session = sessions.get(Number(match[1]))
      if (!session || session.userId !== userId) throw new HttpError(404, 'Chat session not found')
      const content = typeof body.content === 'string' ? body.content.trim() : ''
      if (!content || content.length > 1000) throw new HttpError(400, 'content must be 1 to 1000 characters')
      await delay(THINKING_MS)
      if (content.includes('#503')) throw new HttpError(503, 'AI service unavailable')
      if (content.includes('#429')) throw new HttpError(429, 'Too many messages')
      const reply = replyFor(userId, session, { ...body, content })
      return { id: nextMessageId++, role: 'ASSISTANT', createdAt: new Date().toISOString(), ...reply }
    },
  },
]
