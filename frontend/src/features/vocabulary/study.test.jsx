import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '@/app/App'
import { tokenStorage } from '@/api/tokenStorage'
import { installFakeBackend, learner } from '@/test/fakeBackend'

// Flashcard sessions (A1) and the review reminder (A2), against the contract in docs/api/learning.md.

const TOPIC = { id: 1, name: 'Kinh doanh', description: null, imageUrl: null, wordCount: 26, learnedCount: 12, dueCount: 3 }

function card(id, word, meaning, overrides = {}) {
  return {
    id,
    topicId: 1,
    createdBy: null,
    word,
    meaning,
    exampleSentence: null,
    phonetic: null,
    audioUrl: null,
    imageUrl: null,
    difficultyLevel: 'B1',
    learningStatus: 'NEW',
    lastReviewResult: null,
    reviewCount: 0,
    nextReviewAt: null,
    lastReviewedAt: null,
    ...overrides,
  }
}

const CARDS = [
  card(101, 'revenue', 'doanh thu', {
    phonetic: '/ˈrevənjuː/',
    exampleSentence: "The company's revenue grew by 20% last year.",
    learningStatus: 'LEARNING',
    lastReviewResult: 'VAGUE',
    nextReviewAt: '2026-09-25',
  }),
  card(102, 'profit', 'lợi nhuận'),
  card(103, 'budget', 'ngân sách'),
]

const summary = (dueToday) => ({ dueToday, learningCount: 5, masteredCount: 2, reviewedToday: 0, upcoming: [] })

function routes(overrides = {}) {
  return {
    'GET /api/users/me': () => ({ data: learner }),
    'GET /api/learning/summary': () => ({ data: summary(0) }),
    'GET /api/topics': () => ({ data: [TOPIC] }),
    'GET /api/topics/1': () => ({ data: TOPIC }),
    'GET /api/vocabulary': () => ({ data: { items: [], page: 0, size: 20, totalItems: 26, totalPages: 2 } }),
    'GET /api/learning/session': ({ params }) => ({
      data: {
        source: params.topicId ? { type: 'TOPIC', id: 1, name: 'Kinh doanh' } : { type: 'DUE', id: null, name: null },
        cards: CARDS,
      },
    }),
    'POST /api/learning/reviews': ({ body }) => ({
      data: { vocabularyId: body.vocabularyId, learningStatus: 'LEARNING', lastReviewResult: body.result, reviewCount: 1, intervalDays: 1, nextReviewAt: '2026-09-26' },
    }),
    ...overrides,
  }
}

let backend

afterEach(() => {
  backend?.restore()
  delete window.speechSynthesis
  delete window.SpeechSynthesisUtterance
})

function renderAt(path, routeOverrides) {
  tokenStorage.save({ accessToken: 'stored-token', expiresIn: 3600 })
  backend = installFakeBackend(routes(routeOverrides))
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

const callsTo = (key) => backend.calls.filter((call) => call.key === key)
const announced = (text) => screen.findByText(text) // the screen-reader live region names the current card

describe('studying a topic', () => {
  it('flips cards, rates them with buttons, keys or a click, saves each rating, and ends with a summary', async () => {
    renderAt('/vocabulary/topics/1')
    const user = userEvent.setup()

    // Due words plus words never studied: min(20, 3 + 26 - 12) = 17.
    await user.click(await screen.findByRole('link', { name: 'Học 17 từ →' }))
    await announced('Thẻ 1 trên 3: revenue')
    expect(callsTo('GET /api/learning/session')[0].params).toMatchObject({ topicId: 1 })
    expect(screen.queryByRole('group', { name: 'Bạn nhớ từ này đến đâu?' })).not.toBeInTheDocument()
    expect(screen.getByText('Lật thẻ để tự đánh giá mức độ nhớ')).toBeInTheDocument()

    // 1. The flip button, then the "Nhớ rõ" button.
    await user.click(screen.getByRole('button', { name: 'Bấm vào thẻ để lật' }))
    await announced('Nghĩa: doanh thu')
    expect(screen.getByText('/ˈrevənjuː/')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Nhớ rõ' }))

    // 2. Keyboard only: Space flips, 2 = "Nhớ mơ hồ".
    await announced('Thẻ 2 trên 3: profit')
    await user.keyboard(' ')
    await announced('Nghĩa: lợi nhuận')
    await user.keyboard('2')

    // 3. A click on the card itself flips it; 1 = "Chưa nhớ".
    await announced('Thẻ 3 trên 3: budget')
    await user.click(screen.getAllByText('budget')[0])
    await announced('Nghĩa: ngân sách')
    await user.keyboard('1')

    expect(await screen.findByRole('heading', { name: 'Hoàn thành phiên ôn tập' })).toBeInTheDocument()
    expect(screen.getByText('Nhớ rõ: 1')).toBeInTheDocument()
    expect(screen.getByText('Nhớ mơ hồ: 1')).toBeInTheDocument()
    expect(screen.getByText('Chưa nhớ: 1')).toBeInTheDocument()
    expect(callsTo('POST /api/learning/reviews').map((call) => call.body)).toEqual([
      { vocabularyId: 101, result: 'REMEMBERED' },
      { vocabularyId: 102, result: 'VAGUE' },
      { vocabularyId: 103, result: 'FORGOT' },
    ])
    expect(screen.getByRole('link', { name: 'Về chủ đề' })).toHaveAttribute('href', '/vocabulary/topics/1')

    // "Học tiếp" asks for a new session from the same topic.
    await user.click(screen.getByRole('button', { name: 'Học tiếp' }))
    await announced('Thẻ 1 trên 3: revenue')
    expect(callsTo('GET /api/learning/session')).toHaveLength(2)
  })

  it('keeps the card and says so when a rating could not be saved, then goes on once it is', async () => {
    let attempts = 0
    renderAt('/vocabulary/topics/1/study', {
      'POST /api/learning/reviews': ({ body }) =>
        ++attempts === 1
          ? { status: 500, data: { status: 500, message: 'boom' } }
          : { data: { vocabularyId: body.vocabularyId, learningStatus: 'LEARNING', lastReviewResult: body.result } },
    })
    const user = userEvent.setup()

    await announced('Thẻ 1 trên 3: revenue')
    await user.keyboard(' ')
    await user.click(await screen.findByRole('button', { name: 'Nhớ rõ' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Máy chủ đang gặp sự cố')
    expect(screen.getByText('Nghĩa: doanh thu')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Nhớ rõ' }))

    await announced('Thẻ 2 trên 3: profit')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps what was already rated when the learner leaves halfway', async () => {
    renderAt('/vocabulary/topics/1/study')
    const user = userEvent.setup()

    await announced('Thẻ 1 trên 3: revenue')
    await user.keyboard(' ')
    await user.keyboard('3')
    await announced('Thẻ 2 trên 3: profit')

    await user.click(screen.getByRole('link', { name: 'Thoát phiên học' }))

    expect(await screen.findByRole('heading', { name: 'Kinh doanh · 26 từ' })).toBeInTheDocument()
    expect(callsTo('POST /api/learning/reviews')).toHaveLength(1)
  })

  it('says so when a topic has nothing left to study', async () => {
    renderAt('/vocabulary/topics/1/study', {
      'GET /api/learning/session': () => ({ data: { source: { type: 'TOPIC', id: 1, name: 'Kinh doanh' }, cards: [] } }),
    })

    expect(await screen.findByText(/Không còn từ mới hay từ đến hạn ôn trong chủ đề “Kinh doanh”/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Về chủ đề' })).toHaveAttribute('href', '/vocabulary/topics/1')
  })

  it('shows "not found" for an unknown topic', async () => {
    renderAt('/vocabulary/topics/1/study', {
      'GET /api/learning/session': () => ({ status: 404, data: { status: 404, message: 'Topic not found' } }),
    })

    expect(await screen.findByText('Chủ đề này không tồn tại hoặc đã bị xóa.')).toBeInTheDocument()
  })

  it('reads the word aloud when a card appears and when asked, without flipping the card', async () => {
    const speak = vi.fn()
    window.speechSynthesis = { speak, cancel: vi.fn() }
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text
      }
    }
    renderAt('/vocabulary/topics/1/study')
    const user = userEvent.setup()

    await announced('Thẻ 1 trên 3: revenue')
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1))
    expect(speak.mock.calls[0][0]).toMatchObject({ text: 'revenue', lang: 'en-GB' })

    await user.click(screen.getByRole('button', { name: 'Nghe phát âm' }))

    expect(speak).toHaveBeenCalledTimes(2)
    expect(screen.getByText('Thẻ 1 trên 3: revenue')).toBeInTheDocument() // still the front

    // Turning automatic pronunciation off is remembered for the next cards.
    await user.click(screen.getByRole('checkbox', { name: 'Tự động phát âm' }))
    // While the checkbox has focus, Space belongs to it; the digit shortcuts still work.
    await user.keyboard(' ')
    expect(screen.getByRole('checkbox', { name: 'Tự động phát âm' })).toBeChecked()
    await user.keyboard(' ') // off again (turning it on read the current word once more)
    const spokenSoFar = speak.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Bấm vào thẻ để lật' }))
    await user.keyboard('3')
    await announced('Thẻ 2 trên 3: profit')
    expect(speak).toHaveBeenCalledTimes(spokenSoFar)
  })
})

describe('review reminder (A2)', () => {
  it('invites the learner to review what is due, and reviews only that', async () => {
    renderAt('/vocabulary', { 'GET /api/learning/summary': () => ({ data: summary(2) }) })
    const user = userEvent.setup()

    expect(await screen.findByText('Bạn có 2 từ cần ôn hôm nay')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Ôn tập ngay →' }))

    await announced('Thẻ 1 trên 3: revenue')
    const params = callsTo('GET /api/learning/session')[0].params
    expect(params.topicId).toBeUndefined()
    expect(params.listId).toBeUndefined()
  })

  it('also shows on the home page', async () => {
    renderAt('/', { 'GET /api/learning/summary': () => ({ data: summary(5) }) })

    expect(await screen.findByRole('link', { name: 'Bạn có 5 từ cần ôn hôm nay. Ôn tập ngay' })).toHaveAttribute(
      'href',
      '/vocabulary/review',
    )
  })

  it('stays hidden when nothing is due', async () => {
    renderAt('/vocabulary')

    await screen.findByRole('link', { name: /Kinh doanh/ })
    expect(screen.queryByText(/từ cần ôn hôm nay/)).not.toBeInTheDocument()
  })

  it('says so when a review session finds nothing due', async () => {
    renderAt('/vocabulary/review', {
      'GET /api/learning/session': () => ({ data: { source: { type: 'DUE', id: null, name: null }, cards: [] } }),
    })

    expect(await screen.findByText(/Hôm nay bạn không có từ nào cần ôn/)).toBeInTheDocument()
  })
})
