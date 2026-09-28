import { useEffect, useId, useRef, useState } from 'react'
import { cx } from '@/lib/cx'
import { createChatSession, getChatMessages, listChatSessions, sendChatMessage } from '../api/chatApi'
import { ChatHtml } from './ChatHtml'

const MAX_LENGTH = 1000

function savedMessages(page) {
  return [...page.content].reverse().map((message) => ({
    key: `saved-${message.id}`,
    role: message.role.toLowerCase(),
    content: message.content,
    sources: message.sources ?? [],
  }))
}

/** Offered on the lesson list, where no exercise is open. */
const GENERAL_SUGGESTIONS = [
  'Khác nhau giữa hiện tại hoàn thành và quá khứ đơn?',
  'Mẹo luyện nghe hiệu quả',
  'Cách phát âm đuôi -ed',
]

function SparkIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2.5l2.1 6.4 6.4 2.1-6.4 2.1L12 19.5l-2.1-6.4L3.5 11l6.4-2.1zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9z" />
    </svg>
  )
}

function Avatar() {
  return (
    <span aria-hidden="true" className="flex size-6 flex-none items-center justify-center rounded-full bg-brand text-white">
      <SparkIcon className="size-3.5" />
    </span>
  )
}

function AssistantBubble({ children }) {
  return (
    <div className="flex max-w-[92%] min-w-0 gap-2 self-start">
      <Avatar />
      <div className="min-w-0 break-words rounded-xl bg-surface-alt px-3.5 py-3 text-label leading-relaxed text-ink">{children}</div>
    </div>
  )
}

/** Vietnamese message for a failed question (exception of B4). */
function chatErrorMessage(error) {
  if (error?.status === 429) return 'Bạn gửi hơi nhanh. Hãy đợi một chút rồi gửi lại.'
  if (error?.status === 400) return 'Câu hỏi trống hoặc quá dài.'
  return 'Trợ lý AI không thể trả lời lúc này, hãy thử lại sau.'
}

/**
 * The design's floating "Hỏi trợ lý AI" button and chat panel (B4). The first message opens a chat session; each
 * message carries the ids of what the learner is doing (lesson, question, attempt, pronunciation item), from which the
 * server builds the AI's context. Saved sessions can be opened again across page visits.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {number | null} [props.lessonId]
 * @param {number | null} [props.attemptId]
 * @param {number | null} [props.questionId]
 * @param {number | null} [props.pronunciationItemId]
 * @param {string[]} [props.suggestions] questions offered before the first message
 */
export function ChatAssistant({
  open,
  onOpenChange,
  lessonId = null,
  attemptId = null,
  questionId = null,
  pronunciationItemId = null,
  suggestions = GENERAL_SUGGESTIONS,
}) {
  const [messages, setMessages] = useState([]) // { key, role: 'user' | 'assistant', content, sources?, error? }
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [view, setView] = useState('chat')
  const [sessions, setSessions] = useState([])
  const [sessionsPage, setSessionsPage] = useState(0)
  const [moreSessions, setMoreSessions] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState(false)
  const [olderPage, setOlderPage] = useState(0)
  const [hasOlder, setHasOlder] = useState(false)
  const [olderLoading, setOlderLoading] = useState(false)
  const [olderError, setOlderError] = useState(false)
  const sessionId = useRef(null)
  const sessionLessonId = useRef(null)
  const nextKey = useRef(1)
  const log = useRef(null)
  const olderScrollPosition = useRef(null)
  const input = useRef(null)
  const toggleButton = useRef(null)
  const panelId = useId()

  useEffect(() => {
    if (open && view === 'chat') input.current?.focus()
  }, [open, view])

  useEffect(() => {
    const element = log.current
    if (!element) return
    if (olderScrollPosition.current) {
      const { height, top } = olderScrollPosition.current
      element.scrollTop = top + element.scrollHeight - height
      olderScrollPosition.current = null
    } else {
      element.scrollTop = element.scrollHeight
    }
  }, [messages, pending, open])

  function close() {
    onOpenChange(false)
    toggleButton.current?.focus()
  }

  async function showHistory(page = 0) {
    if (historyLoading || pending) return
    setView('history')
    setHistoryLoading(true)
    setHistoryError(false)
    try {
      const result = await listChatSessions(page)
      setSessions((previous) => page === 0 ? result.content : [...previous, ...result.content])
      setSessionsPage(page)
      setMoreSessions(!result.last)
    } catch {
      setHistoryError(true)
    } finally {
      setHistoryLoading(false)
    }
  }

  async function openSession(session) {
    if (historyLoading) return
    setHistoryLoading(true)
    setHistoryError(false)
    try {
      const result = await getChatMessages(session.id)
      sessionId.current = session.id
      sessionLessonId.current = session.lessonId ?? null
      setMessages(savedMessages(result))
      setOlderPage(0)
      setHasOlder(!result.last)
      setDraft('')
      setView('chat')
    } catch {
      setHistoryError(true)
    } finally {
      setHistoryLoading(false)
    }
  }

  async function loadOlder() {
    if (olderLoading || !hasOlder || sessionId.current === null) return
    setOlderLoading(true)
    setOlderError(false)
    try {
      const page = olderPage + 1
      const result = await getChatMessages(sessionId.current, page)
      if (log.current) olderScrollPosition.current = { height: log.current.scrollHeight, top: log.current.scrollTop }
      setMessages((previous) => [...savedMessages(result), ...previous])
      setOlderPage(page)
      setHasOlder(!result.last)
    } catch {
      setOlderError(true)
    } finally {
      setOlderLoading(false)
    }
  }

  function startNewChat() {
    sessionId.current = null
    sessionLessonId.current = null
    setMessages([])
    setHasOlder(false)
    setDraft('')
    setView('chat')
  }

  async function ask(text, retryOf = null) {
    const content = text.trim()
    if (!content || pending) return
    const key = retryOf ?? nextKey.current++
    setMessages((previous) =>
      retryOf === null
        ? [...previous, { key, role: 'user', content }]
        : previous.map((message) => (message.key === retryOf ? { ...message, error: null } : message)),
    )
    if (retryOf === null) setDraft('')
    setPending(true)
    try {
      if (sessionId.current === null) {
        const session = await createChatSession({ lessonId, questionId })
        sessionId.current = session.id
        sessionLessonId.current = session.lessonId ?? lessonId
      }
      const sameLesson = sessionLessonId.current === null || sessionLessonId.current === lessonId
      const reply = await sendChatMessage(sessionId.current, {
        content,
        questionId: sameLesson ? questionId : null,
        attemptId: sameLesson ? attemptId : null,
        pronunciationItemId: sameLesson ? pronunciationItemId : null,
      })
      setMessages((previous) => [
        ...previous,
        { key: nextKey.current++, role: 'assistant', content: reply.content, sources: reply.sources ?? [] },
      ])
    } catch (error) {
      setMessages((previous) =>
        previous.map((message) => (message.key === key ? { ...message, error: chatErrorMessage(error) } : message)),
      )
    } finally {
      setPending(false)
    }
  }

  const asked = messages.some((message) => message.role === 'user')

  return (
    <div className="fixed right-[min(28px,4vw)] bottom-7 z-20 flex max-w-[calc(100vw-32px)] flex-col items-end gap-3">
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Trợ lý AI"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation()
              close()
            }
          }}
          className="flex h-[min(460px,70vh)] w-[min(380px,calc(100vw-32px))] animate-screen-in flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-xl shadow-ink/20"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <Avatar />
              <h2 className="text-sm font-semibold text-ink">{view === 'history' ? 'Lịch sử trò chuyện' : 'Trợ lý AI'}</h2>
            </div>
            {view === 'chat' ? (
              <button type="button" onClick={() => showHistory()} disabled={pending} className="ml-auto mr-2 cursor-pointer text-xs font-semibold text-brand-dark hover:underline disabled:opacity-50">Lịch sử</button>
            ) : (
              <button type="button" onClick={() => setView('chat')} className="ml-auto mr-2 cursor-pointer text-xs font-semibold text-brand-dark hover:underline">Trở lại</button>
            )}
            <button
              type="button"
              onClick={close}
              aria-label="Đóng trợ lý AI"
              className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-body text-muted hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-brand"
            >
              ✕
            </button>
          </div>

          {view === 'history' ? (
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4" aria-label="Các cuộc trò chuyện">
              <button type="button" onClick={startNewChat} disabled={historyLoading} className="rounded-lg border border-brand-tint-line bg-brand-tint px-3 py-2 text-left text-sm font-semibold text-brand-dark hover:border-brand disabled:opacity-50">+ Cuộc trò chuyện mới</button>
              {historyLoading && <p role="status" className="text-sm text-muted">Đang tải lịch sử…</p>}
              {historyError && <p role="alert" className="text-sm text-danger">Không tải được lịch sử. Hãy thử lại.</p>}
              {!historyLoading && !historyError && sessions.length === 0 && <p className="py-4 text-center text-sm text-muted">Chưa có cuộc trò chuyện nào.</p>}
              {sessions.map((session) => (
                <button key={session.id} type="button" onClick={() => openSession(session)} disabled={historyLoading} className="rounded-lg border border-line px-3 py-2.5 text-left hover:border-brand hover:bg-surface-alt disabled:opacity-50">
                  <span className="block truncate text-sm font-semibold text-ink">{session.title}</span>
                  <span className="text-xs text-muted">{new Date(session.updatedAt ?? session.createdAt).toLocaleString('vi-VN')}</span>
                </button>
              ))}
              {moreSessions && !historyLoading && <button type="button" onClick={() => showHistory(sessionsPage + 1)} className="py-2 text-sm font-semibold text-brand-dark hover:underline">Xem thêm</button>}
            </div>
          ) : <div ref={log} role="log" aria-label="Cuộc trò chuyện" className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {hasOlder && <button type="button" onClick={loadOlder} disabled={olderLoading} className="text-xs font-semibold text-brand-dark hover:underline disabled:opacity-50">{olderLoading ? 'Đang tải…' : 'Xem tin nhắn cũ hơn'}</button>}
            {olderError && <p role="alert" className="text-xs text-danger">Không tải được tin cũ. Hãy thử lại.</p>}
            <AssistantBubble>Bạn cần giải thích gì trong bài đang làm?</AssistantBubble>
            {messages.map((message) =>
              message.role === 'user' ? (
                <div key={message.key} className="flex max-w-[85%] flex-col items-end gap-1 self-end">
                  <p className="rounded-xl bg-brand px-3 py-2.5 text-label leading-normal whitespace-pre-wrap text-white">{message.content}</p>
                  {message.error && (
                    <p role="alert" className="text-right text-xs text-danger">
                      {message.error}{' '}
                      <button
                        type="button"
                        onClick={() => ask(message.content, message.key)}
                        disabled={pending}
                        className="cursor-pointer font-semibold text-brand-dark underline hover:text-brand disabled:cursor-wait"
                      >
                        Gửi lại
                      </button>
                    </p>
                  )}
                </div>
              ) : (
                <AssistantBubble key={message.key}>
                  <ChatHtml text={message.content} />
                  {message.sources.length > 0 && (
                    <p className="mt-2 text-xs text-muted">Nguồn: {message.sources.map((source) => source.title).join(', ')}</p>
                  )}
                </AssistantBubble>
              ),
            )}
            {pending && (
              <div className="flex gap-2 self-start">
                <Avatar />
                <div role="status" aria-label="Trợ lý đang trả lời" className="flex items-center gap-1 rounded-xl bg-surface-alt px-3 py-3.5">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="size-1.5 animate-bounce rounded-full bg-muted-light" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}
            {!asked && !pending && (
              <div className="mt-auto flex flex-wrap gap-1.5">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => ask(suggestion)}
                    className="cursor-pointer rounded-full border border-brand-tint-line bg-brand-tint px-3 py-1.5 text-left text-xs font-semibold text-brand-dark hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>}

          {view === 'chat' && <form
            onSubmit={(event) => {
              event.preventDefault()
              ask(draft)
            }}
            className="flex items-center gap-2 border-t border-line px-3.5 py-3"
          >
            <input
              ref={input}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={MAX_LENGTH}
              placeholder="Nhập câu hỏi của bạn…"
              aria-label="Câu hỏi cho trợ lý AI"
              className="min-w-0 flex-1 rounded-full border border-line px-3 py-2.5 text-label text-ink outline-none placeholder:text-muted-light focus:border-brand focus:ring-2 focus:ring-brand/25"
            />
            <button
              type="submit"
              disabled={pending || draft.trim() === ''}
              aria-label="Gửi"
              className="flex size-8.5 flex-none cursor-pointer items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-line"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2 8h10M8 3.5L12.5 8 8 12.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>}
        </div>
      )}

      <button
        ref={toggleButton}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => (open ? close() : onOpenChange(true))}
        className={cx(
          'flex h-13 cursor-pointer items-center gap-2.5 rounded-full bg-brand pr-5 pl-4 shadow-lg shadow-brand-dark/35 transition-colors hover:bg-brand-dark',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        )}
      >
        <span aria-hidden="true" className="flex size-5.5 flex-none items-center justify-center rounded-full bg-white text-brand">
          <SparkIcon className="size-3.5" />
        </span>
        <span className="text-sm font-semibold whitespace-nowrap text-white">Hỏi trợ lý AI</span>
      </button>
    </div>
  )
}
