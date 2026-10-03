import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/app/App'
import { tokenStorage } from '@/api/tokenStorage'
import { addDays, todayInVietnam } from '@/lib/dates'
import { installFakeBackend, learner } from '@/test/fakeBackend'
import '@/test/preloadPages'

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

const reviewedToday = `${today}T03:00:00Z`

// 25 reviewed words: word2 and word5 are mastered, word1 and word3 were reviewed today, the rest are being learned.
const HISTORY = Array.from({ length: 25 }, (_, index) => {
  const overrides = {
    0: { lastReviewedAt: reviewedToday },
    1: { lastReviewResult: 'REMEMBERED', learningStatus: 'MASTERED', nextReviewAt: addDays(today, 1) },
    2: { lastReviewedAt: reviewedToday },
    4: { lastReviewResult: 'REMEMBERED', learningStatus: 'MASTERED', nextReviewAt: addDays(today, 20) },
  }
  return reviewed(200 + index, `word${index + 1}`, `nghĩa ${index + 1}`, overrides[index])
})

const SUMMARY = {
  dueToday: 4,
  learningCount: 23,
  masteredCount: 2,
  reviewedToday: 2,
  upcoming: Array.from({ length: 7 }, (_, index) => ({ date: addDays(today, index + 1), count: index === 0 ? 3 : 0 })),
}

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
    // Filters like the backend of docs/api/learning.md.
    'GET /api/learning/history': ({ params }) => {
      const matching = HISTORY.filter(
        (word) =>
          (!params.status || word.learningStatus === params.status) &&
          (!params.reviewedToday || word.lastReviewedAt === reviewedToday),
      )
      return {
        data: {
          items: matching.slice(params.page * params.size, params.page * params.size + params.size),
          page: params.page,
          size: params.size,
          totalItems: matching.length,
          totalPages: Math.ceil(matching.length / params.size),
        },
      }
    },
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
    expect(screen.getByText('Đang học').nextSibling).toHaveTextContent('23')
    expect(screen.getByText('Đã thuộc').nextSibling).toHaveTextContent('2')
    expect(screen.getByText('Đã ôn hôm nay').nextSibling).toHaveTextContent('2')

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

  it('lists the words behind a count when it is chosen, and every word again when it is chosen twice', async () => {
    renderAt('/vocabulary?tab=history')
    const user = userEvent.setup()
    await screen.findByText('word1')

    await user.click(screen.getByRole('link', { name: 'Đã thuộc: 2 từ. Xem danh sách' }))

    const mastered = await screen.findByRole('region', { name: 'Từ đã thuộc (2)' })
    expect(within(mastered).getByText('word2')).toBeInTheDocument()
    expect(within(mastered).getByText('word5')).toBeInTheDocument()
    expect(within(mastered).queryByText('word1')).not.toBeInTheDocument()
    expect(within(mastered).getByRole('status')).toHaveTextContent('Đang hiển thị 2 từ đã thuộc')
    expect(screen.getByTestId('location')).toHaveTextContent('/vocabulary?tab=history&show=mastered')

    const chosen = screen.getByRole('link', { name: 'Đã thuộc: 2 từ. Bỏ chọn' })
    expect(chosen).toHaveAttribute('aria-current', 'true')
    await user.click(chosen)

    expect(await screen.findByRole('heading', { name: 'Từ đã ôn gần đây' })).toBeInTheDocument()
    expect(screen.getByText('word1')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/vocabulary\?tab=history$/)
  })

  it('shows the words being learned and the words reviewed today, from the URL or a click', async () => {
    renderAt('/vocabulary?tab=history&show=learning')
    const user = userEvent.setup()

    const learning = await screen.findByRole('region', { name: 'Từ đang học (23)' })
    await waitFor(() => expect(within(learning).getByText('word1')).toBeInTheDocument())
    expect(within(learning).queryByText('word2')).not.toBeInTheDocument()
    expect(within(learning).getByRole('button', { name: 'Xem thêm (còn 3)' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Đã ôn hôm nay: 2 từ. Xem danh sách' }))

    const reviewedNow = await screen.findByRole('region', { name: 'Từ đã ôn hôm nay (2)' })
    expect(within(reviewedNow).getByText('word1')).toBeInTheDocument()
    expect(within(reviewedNow).getByText('word3')).toBeInTheDocument()
    expect(within(reviewedNow).queryByText('word4')).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Xem tất cả từ đã ôn' }))

    expect(await screen.findByRole('heading', { name: 'Từ đã ôn gần đây' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xem thêm (còn 5)' })).toBeInTheDocument()
  })

  it('explains an empty count', async () => {
    renderAt('/vocabulary?tab=history&show=mastered', {
      'GET /api/learning/history': () => ({ data: { items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 } }),
    })

    expect(await screen.findByRole('heading', { name: 'Từ đã thuộc (0)' })).toBeInTheDocument()
    expect(screen.getByText(/Chưa có từ nào đã thuộc/)).toBeInTheDocument()
  })

  it('ignores an unknown choice in the URL', async () => {
    renderAt('/vocabulary?tab=history&show=toString')

    expect(await screen.findByRole('heading', { name: 'Từ đã ôn gần đây' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Đang học: 23 từ. Xem danh sách' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Bỏ chọn/ })).not.toBeInTheDocument()
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
