import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/app/App'
import { tokenStorage } from '@/api/tokenStorage'
import { addDays, todayInVietnam } from '@/lib/dates'
import { installFakeBackend, learner } from '@/test/fakeBackend'

// The "Lịch sử học" tab (A2: schedule and history), against docs/api/learning.md.

const today = todayInVietnam()

function reviewed(id, word, meaning, overrides = {}) {
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
    learningStatus: 'LEARNING',
    lastReviewResult: 'VAGUE',
    reviewCount: 2,
    nextReviewAt: today,
    lastReviewedAt: '2026-09-24T08:00:00Z',
    ...overrides,
  }
}

const SUMMARY = {
  dueToday: 4,
  learningCount: 18,
  masteredCount: 17,
  reviewedToday: 3,
  upcoming: Array.from({ length: 7 }, (_, index) => ({ date: addDays(today, index + 1), count: index === 0 ? 3 : 0 })),
}

const HISTORY = Array.from({ length: 25 }, (_, index) =>
  reviewed(200 + index, `word${index + 1}`, `nghĩa ${index + 1}`, index === 1 ? { lastReviewResult: 'REMEMBERED', learningStatus: 'MASTERED', nextReviewAt: addDays(today, 1) } : {}),
)

let backend

afterEach(() => backend?.restore())

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

function renderAt(path, overrides = {}) {
  tokenStorage.save({ accessToken: 'stored-token', expiresIn: 3600 })
  backend = installFakeBackend({
    'GET /api/users/me': () => ({ data: learner }),
    'GET /api/topics': () => ({ data: [] }),
    'GET /api/learning/summary': () => ({ data: SUMMARY }),
    'GET /api/learning/history': ({ params }) => ({
      data: {
        items: HISTORY.slice(params.page * params.size, params.page * params.size + params.size),
        page: params.page,
        size: params.size,
        totalItems: HISTORY.length,
        totalPages: Math.ceil(HISTORY.length / params.size),
      },
    }),
    ...overrides,
  })
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('history tab', () => {
  it('is reached from the tab bar and marked as the current tab', async () => {
    renderAt('/vocabulary')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('link', { name: 'Lịch sử học' }))

    expect(await screen.findByRole('heading', { name: 'Lịch ôn 7 ngày tới' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lịch sử học' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('location')).toHaveTextContent('/vocabulary?tab=history')
  })

  it('shows what is due, the counts and the next seven days', async () => {
    renderAt('/vocabulary?tab=history')

    expect(await screen.findByRole('link', { name: 'Bạn có 4 từ cần ôn hôm nay. Ôn tập ngay' })).toBeInTheDocument()
    expect(screen.getByText('Đang học').nextSibling).toHaveTextContent('18')
    expect(screen.getByText('Đã thuộc').nextSibling).toHaveTextContent('17')
    expect(screen.getByText('Đã ôn hôm nay').nextSibling).toHaveTextContent('3')

    const tomorrow = screen.getByText(/^Ngày mai,/).closest('li')
    expect(tomorrow).toHaveTextContent('3 từ')
    expect(screen.getAllByText('Không có')).toHaveLength(6)
  })

  it('lists recently reviewed words with their last rating and next review, 20 at a time', async () => {
    renderAt('/vocabulary?tab=history')
    const user = userEvent.setup()

    const first = (await screen.findByText('word1')).closest('li')
    expect(first).toHaveTextContent('Nhớ mơ hồ')
    expect(first).toHaveTextContent('Ôn lại hôm nay')
    const second = screen.getByText('word2').closest('li')
    expect(second).toHaveTextContent('Nhớ rõ')
    expect(second).toHaveTextContent('Đã thuộc · Ôn lại ngày mai')

    await user.click(screen.getByRole('button', { name: 'Xem thêm (còn 5)' }))

    await waitFor(() => expect(screen.getByText('word25')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /Xem thêm/ })).not.toBeInTheDocument()
  })

  it('invites a learner with no history to start', async () => {
    renderAt('/vocabulary?tab=history', {
      'GET /api/learning/summary': () => ({ data: { ...SUMMARY, dueToday: 0, learningCount: 0, masteredCount: 0, reviewedToday: 0 } }),
      'GET /api/learning/history': () => ({ data: { items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 } }),
    })

    expect(await screen.findByText(/Bạn chưa ôn từ nào/)).toBeInTheDocument()
    expect(screen.getByText('Cần ôn hôm nay').nextSibling).toHaveTextContent('0')
  })
})
