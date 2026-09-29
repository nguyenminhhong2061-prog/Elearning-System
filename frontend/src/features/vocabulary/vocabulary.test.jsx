import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/app/App'
import { tokenStorage } from '@/api/tokenStorage'
import { installFakeBackend, learner, loginResponse } from '@/test/fakeBackend'
import '@/test/preloadPages'

// Data shaped exactly as docs/api/vocabulary.md describes it.
const TOPICS = [
  { id: 1, name: 'Kinh doanh', description: 'Từ vựng trong công việc', imageUrl: null, wordCount: 26, learnedCount: 12, dueCount: 3 },
  { id: 2, name: 'Du lịch', description: null, imageUrl: null, wordCount: 12, learnedCount: 0, dueCount: 0 },
  { id: 3, name: 'Thể thao', description: null, imageUrl: null, wordCount: 0, learnedCount: 0, dueCount: 0 },
]

const NOTHING_DUE = { dueToday: 0, learningCount: 0, masteredCount: 0, reviewedToday: 0, upcoming: [] }

function word(id, text, meaning, overrides = {}) {
  return {
    id,
    topicId: 1,
    createdBy: null,
    word: text,
    meaning,
    exampleSentence: null,
    phonetic: null,
    audioUrl: null,
    imageUrl: null,
    difficultyLevel: 'B1',
    learningStatus: 'NEW',
    ...overrides,
  }
}

// 26 business words: the first 12 learned, like TOPICS[0].
const BUSINESS_WORDS = Array.from({ length: 26 }, (_, index) =>
  word(100 + index, `word${String(index + 1).padStart(2, '0')}`, `nghĩa ${index + 1}`, {
    learningStatus: index < 12 ? (index % 2 ? 'MASTERED' : 'LEARNING') : 'NEW',
  }),
)

function pageOf(allItems, { page = 0, size = 20 } = {}) {
  return {
    items: allItems.slice(page * size, page * size + size),
    page,
    size,
    totalItems: allItems.length,
    totalPages: Math.ceil(allItems.length / size),
  }
}

/** Serves the vocabulary endpoints the way the contract describes. */
function vocabularyRoutes(overrides = {}) {
  return {
    'GET /api/topics': () => ({ data: TOPICS }),
    'GET /api/learning/summary': () => ({ data: NOTHING_DUE }),
    'GET /api/topics/1': () => ({ data: TOPICS[0] }),
    'GET /api/topics/3': () => ({ data: TOPICS[2] }),
    'GET /api/vocabulary': ({ params }) => {
      if (params.q) {
        const found = params.q === 'du lich' ? [word(300, 'passport', 'hộ chiếu', { topicId: 2 })] : []
        return { data: pageOf(found, { size: params.size }) }
      }
      const items = params.topicId === 1 ? BUSINESS_WORDS : []
      return { data: pageOf(items, { page: params.page, size: params.size }) }
    },
    ...overrides,
  }
}

let backend

afterEach(() => backend?.restore())

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

function renderSignedIn(path, routes = vocabularyRoutes()) {
  tokenStorage.save({ accessToken: 'stored-token', expiresIn: 3600 })
  backend = installFakeBackend({ 'GET /api/users/me': () => ({ data: learner }), ...routes })
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  )
}

const callsTo = (key) => backend.calls.filter((call) => call.key === key)
const searchBox = () => screen.getByRole('searchbox', { name: 'Tìm chủ đề hoặc từ' })

describe('topics page', () => {
  it('lists every topic with its word count and learning progress', async () => {
    renderSignedIn('/vocabulary')

    const business = await screen.findByRole('link', { name: /Kinh doanh/ })
    expect(business).toHaveTextContent('26 từ · 46% đã học')
    expect(business).toHaveAttribute('href', '/vocabulary/topics/1')
    expect(screen.getByRole('link', { name: /Du lịch/ })).toHaveTextContent('12 từ · Chưa học')
    expect(screen.getByRole('link', { name: /Thể thao/ })).toHaveTextContent('Chưa có từ')
    expect(screen.getByText('Đã học 12 / 38 từ · 3 chủ đề')).toBeInTheDocument()
  })

  it('filters topics as the user types, ignoring accents, searches words, and keeps the search in the URL', async () => {
    renderSignedIn('/vocabulary')
    const user = userEvent.setup()
    await screen.findByRole('link', { name: /Kinh doanh/ })

    await user.type(searchBox(), 'du lich')

    expect(screen.getByRole('link', { name: /Du lịch/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Kinh doanh/ })).not.toBeInTheDocument()
    // Words come from the server once typing pauses.
    const result = await screen.findByRole('link', { name: /passport — hộ chiếu/ })
    expect(result).toHaveTextContent('Du lịch')
    expect(result).toHaveAttribute('href', '/vocabulary/topics/2')
    expect(callsTo('GET /api/vocabulary').at(-1).params).toMatchObject({ q: 'du lich', size: 10 })
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/vocabulary?q=du+lich'))
  })

  it('asks for two characters before searching words, and says when nothing matches', async () => {
    renderSignedIn('/vocabulary')
    const user = userEvent.setup()
    await screen.findByRole('link', { name: /Kinh doanh/ })

    await user.type(searchBox(), 'x')

    expect(await screen.findByText('Gõ ít nhất 2 ký tự để tìm từ.')).toBeInTheDocument()
    expect(screen.getByText('Không tìm thấy chủ đề phù hợp.')).toBeInTheDocument()

    await user.type(searchBox(), 'yz')

    expect(await screen.findByText('Không tìm thấy từ phù hợp.')).toBeInTheDocument()
    // No request was sent for the one-letter term.
    expect(callsTo('GET /api/vocabulary').map((call) => call.params.q)).toEqual(['xyz'])
  })

  it('clears the search with its own button and puts the cursor back in the box', async () => {
    renderSignedIn('/vocabulary?q=kinh')
    const user = userEvent.setup()
    await screen.findByRole('link', { name: /Kinh doanh/ })

    await user.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }))

    expect(searchBox()).toHaveValue('')
    expect(searchBox()).toHaveFocus()
    expect(screen.getByRole('link', { name: /Du lịch/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xóa tìm kiếm' })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/vocabulary$/))
  })

  it('restores a search from the URL', async () => {
    renderSignedIn('/vocabulary?q=kinh')

    await screen.findByRole('link', { name: /Kinh doanh/ })
    expect(searchBox()).toHaveValue('kinh')
    expect(screen.queryByRole('link', { name: /Du lịch/ })).not.toBeInTheDocument()
  })

  it('says so when there are no topics yet', async () => {
    renderSignedIn('/vocabulary', vocabularyRoutes({ 'GET /api/topics': () => ({ data: [] }) }))

    expect(await screen.findByText(/Chưa có chủ đề nào/)).toBeInTheDocument()
  })

  it('reports a failed load and recovers on retry', async () => {
    let attempts = 0
    renderSignedIn(
      '/vocabulary',
      vocabularyRoutes({
        'GET /api/topics': () => (++attempts === 1 ? { status: 500, data: { status: 500, message: 'boom' } } : { data: TOPICS }),
      }),
    )
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent('Máy chủ đang gặp sự cố')
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByRole('link', { name: /Kinh doanh/ })).toBeInTheDocument()
  })

  it('does not reuse one account’s data for the next account on the same browser', async () => {
    // A second learner: admins have their own area and never open the learner pages.
    const otherLearner = { ...learner, id: 8, fullName: 'Trần Thị Lan', email: 'lan@example.com' }
    renderSignedIn('/vocabulary', { ...vocabularyRoutes(), 'POST /api/auth/login': () => ({ data: loginResponse(otherLearner) }) })
    const user = userEvent.setup()
    await screen.findByRole('link', { name: /Kinh doanh/ })

    await user.click(screen.getByRole('button', { name: /Đăng xuất/ }))
    await user.type(await screen.findByLabelText('Email'), 'lan@example.com')
    await user.type(screen.getByLabelText('Mật khẩu'), 'matkhau123')
    await user.click(screen.getByRole('button', { name: /Đăng nhập →/ }))
    await user.click(await screen.findByRole('link', { name: 'Từ vựng' }))
    await screen.findByRole('link', { name: /Kinh doanh/ })

    // Fetched again for the new account instead of being served from the previous account's cache.
    expect(callsTo('GET /api/topics')).toHaveLength(2)
  })
})

describe('topic page', () => {
  it('shows the topic and loads its words page by page', async () => {
    renderSignedIn('/vocabulary')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('link', { name: /Kinh doanh/ }))

    expect(await screen.findByRole('heading', { name: 'Kinh doanh · 26 từ' })).toBeInTheDocument()
    expect(screen.getByText('Đã học 12 / 26 từ')).toBeInTheDocument()
    expect(await screen.findByText(/word01/)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(20)
    expect(screen.getAllByText('Đã học', { exact: true })).toHaveLength(12)

    await user.click(screen.getByRole('button', { name: 'Xem thêm từ (còn 6)' }))

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(26))
    expect(screen.queryByRole('button', { name: /Xem thêm từ/ })).not.toBeInTheDocument()
    expect(callsTo('GET /api/vocabulary').map((call) => call.params)).toEqual([
      { topicId: 1, page: 0, size: 20 },
      { topicId: 1, page: 1, size: 20 },
    ])
    // The sidebar still shows the vocabulary section as the current one.
    expect(screen.getByRole('link', { name: 'Từ vựng' })).toHaveAttribute('aria-current', 'page')
  })

  it('goes back to the search the user came from', async () => {
    renderSignedIn('/vocabulary?q=kinh')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('link', { name: /Kinh doanh/ }))
    await user.click(await screen.findByRole('link', { name: '← Chủ đề' }))

    expect(await screen.findByRole('searchbox', { name: 'Tìm chủ đề hoặc từ' })).toHaveValue('kinh')
    expect(screen.getByTestId('location')).toHaveTextContent('/vocabulary?q=kinh')
  })

  it('says so for a topic without words', async () => {
    renderSignedIn('/vocabulary/topics/3')

    expect(await screen.findByRole('heading', { name: 'Thể thao · 0 từ' })).toBeInTheDocument()
    expect(await screen.findByText('Chủ đề này chưa có từ nào.')).toBeInTheDocument()
  })

  it('shows "not found" for an unknown topic', async () => {
    renderSignedIn(
      '/vocabulary/topics/999',
      vocabularyRoutes({
        'GET /api/topics/999': () => ({ status: 404, data: { status: 404, message: 'Topic not found' } }),
      }),
    )

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy chủ đề' })).toBeInTheDocument()
  })

  it('does not call the API for an id that is not a number', async () => {
    renderSignedIn('/vocabulary/topics/abc')

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy chủ đề' })).toBeInTheDocument()
    expect(backend.calls.map((call) => call.key)).toEqual(['GET /api/users/me'])
  })
})
