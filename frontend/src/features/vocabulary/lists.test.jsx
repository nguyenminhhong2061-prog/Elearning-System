import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/app/App'
import { tokenStorage } from '@/api/tokenStorage'
import { installFakeBackend, learner } from '@/test/fakeBackend'

// Personal lists (A3), against docs/api/custom-lists.md.

const LISTS = [
  { id: 5, name: 'Phỏng vấn xin việc', createdAt: '2026-09-25T08:00:00Z', wordCount: 4, learnedCount: 1, dueCount: 0 },
  { id: 6, name: 'Email công việc', createdAt: '2026-09-24T08:00:00Z', wordCount: 0, learnedCount: 0, dueCount: 0 },
]

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

const LIST_WORDS = [word(101, 'interview', 'buổi phỏng vấn'), word(102, 'salary', 'mức lương', { learningStatus: 'LEARNING' })]
const BANK = [word(101, 'interview', 'buổi phỏng vấn'), word(103, 'revenue', 'doanh thu')]
const page = (items) => ({ items, page: 0, size: 50, totalItems: items.length, totalPages: 1 })

function routes(overrides = {}) {
  return {
    'GET /api/users/me': () => ({ data: { ...learner, currentLevel: 'B1' } }),
    'GET /api/topics': () => ({ data: [] }),
    'GET /api/learning/summary': () => ({ data: { dueToday: 0, learningCount: 0, masteredCount: 0, reviewedToday: 0, upcoming: [] } }),
    'GET /api/custom-lists': () => ({ data: LISTS }),
    'GET /api/custom-lists/5': () => ({ data: LISTS[0] }),
    'GET /api/custom-lists/5/words': () => ({ data: page(LIST_WORDS) }),
    'GET /api/vocabulary': ({ params }) => ({
      data: page(BANK.filter((candidate) => candidate.word.includes(params.q ?? '') || candidate.meaning.includes(params.q ?? ''))),
    }),
    'POST /api/custom-lists': ({ body }) => ({ status: 201, data: { ...LISTS[0], id: 9, name: body.name } }),
    'GET /api/custom-lists/9': () => ({ data: { ...LISTS[0], id: 9, name: 'Du lịch hè' } }),
    'GET /api/custom-lists/9/words': () => ({ data: page([]) }),
    ...overrides,
  }
}

let backend

afterEach(() => backend?.restore())

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

function renderAt(path, overrides) {
  tokenStorage.save({ accessToken: 'stored-token', expiresIn: 3600 })
  backend = installFakeBackend(routes(overrides))
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  )
}

const callsTo = (key) => backend.calls.filter((call) => call.key === key)
const location = () => screen.getByTestId('location')

describe('lists tab', () => {
  it('shows the learner’s lists with their counts, and the count in the tab', async () => {
    renderAt('/vocabulary?tab=lists')

    const first = await screen.findByRole('link', { name: /Phỏng vấn xin việc/ })
    expect(first).toHaveTextContent('4 từ · 25% đã học')
    expect(first).toHaveAttribute('href', '/vocabulary/lists/5')
    expect(screen.getByRole('link', { name: /Email công việc/ })).toHaveTextContent('Chưa có từ')
    expect(screen.getByRole('link', { name: 'Danh sách của tôi (2)' })).toHaveAttribute('aria-current', 'page')
  })

  it('invites a learner without lists to create one', async () => {
    renderAt('/vocabulary?tab=lists', { 'GET /api/custom-lists': () => ({ data: [] }) })

    expect(await screen.findByText(/Bạn chưa có danh sách nào/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Tạo danh sách mới' })).toBeInTheDocument()
  })
})

describe('creating a list', () => {
  it('names it, adds a typed word and a word from the vocabulary, and opens the new list', async () => {
    renderAt('/vocabulary?tab=lists')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '+ Tạo danh sách mới' }))
    const dialog = await screen.findByRole('dialog', { name: 'Tạo danh sách riêng' })
    const create = within(dialog).getByRole('button', { name: 'Tạo danh sách' })
    expect(create).toBeDisabled()

    await user.type(within(dialog).getByLabelText('Tên danh sách'), 'Du lịch hè')
    expect(create).toBeEnabled()

    // A typed entry that is not "word — meaning" is refused with an explanation.
    const entry = within(dialog).getByLabelText('Thêm từ')
    await user.type(entry, 'negotiate{Enter}')
    expect(within(dialog).getByText(/Nhập theo dạng “từ — nghĩa”/)).toBeInTheDocument()

    await user.clear(entry)
    await user.type(entry, 'negotiate — thương lượng')
    await user.click(within(dialog).getByRole('button', { name: 'Thêm' }))
    expect(within(dialog).getByRole('list', { name: 'Từ đã chọn' })).toHaveTextContent('negotiate — thương lượng')

    // A suggestion from the shared vocabulary.
    await user.type(entry, 'reven')
    await user.click(await within(dialog).findByRole('button', { name: /revenue — doanh thu/ }))

    // Removing a chosen word.
    await user.type(entry, 'interview')
    await user.click(await within(dialog).findByRole('button', { name: /interview — buổi phỏng vấn/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Bỏ “interview — buổi phỏng vấn”' }))

    await user.click(create)

    await screen.findByRole('heading', { name: 'Du lịch hè' })
    expect(callsTo('POST /api/custom-lists')[0].body).toEqual({
      name: 'Du lịch hè',
      vocabularyIds: [103],
      newWords: [{ word: 'negotiate', meaning: 'thương lượng' }],
    })
    expect(location()).toHaveTextContent('/vocabulary/lists/9')
  })

  it('can be started from the dashed card on the topics tab', async () => {
    renderAt('/vocabulary', {
      'GET /api/topics': () => ({
        data: [{ id: 1, name: 'Kinh doanh', description: null, imageUrl: null, wordCount: 2, learnedCount: 0, dueCount: 0 }],
      }),
    })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Tạo danh sách riêng' }))

    expect(await screen.findByRole('dialog', { name: 'Tạo danh sách riêng' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('list page', () => {
  it('shows the words and a study button', async () => {
    renderAt('/vocabulary/lists/5')

    expect(await screen.findByRole('heading', { name: 'Phỏng vấn xin việc' })).toBeInTheDocument()
    expect(screen.getByText('4 từ · Đã học 1 / 4 từ')).toBeInTheDocument()
    expect(await screen.findByText('interview')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Học danh sách này →' })).toHaveAttribute('href', '/vocabulary/lists/5/study')
    expect(screen.getByRole('link', { name: '← Danh sách của tôi' })).toHaveAttribute('href', '/vocabulary?tab=lists')
  })

  it('renames the list', async () => {
    renderAt('/vocabulary/lists/5', {
      'PUT /api/custom-lists/5': ({ body }) => ({ data: { ...LISTS[0], name: body.name } }),
    })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Đổi tên' }))
    const input = screen.getByLabelText('Tên danh sách')
    await user.clear(input)
    await user.type(input, '  Phỏng vấn IT  ')
    await user.click(screen.getByRole('button', { name: 'Lưu' }))

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument())
    expect(callsTo('PUT /api/custom-lists/5')[0].body).toEqual({ name: 'Phỏng vấn IT' })
  })

  it('removes a word from the list', async () => {
    renderAt('/vocabulary/lists/5', { 'DELETE /api/custom-lists/5/words/102': () => ({ status: 204 }) })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Bỏ “salary” khỏi danh sách' }))

    await waitFor(() => expect(callsTo('DELETE /api/custom-lists/5/words/102')).toHaveLength(1))
  })

  it('adds a word from the vocabulary, marking words already in the list', async () => {
    renderAt('/vocabulary/lists/5', {
      'GET /api/vocabulary': () => ({ data: page(BANK) }), // both a word of the list and a new one match
      'POST /api/custom-lists/5/words': ({ body }) => ({ status: 201, data: BANK.find((item) => item.id === body.vocabularyId) }),
    })
    const user = userEvent.setup()
    await screen.findByText('interview')

    await user.type(screen.getByRole('searchbox', { name: 'Tìm từ trong kho từ vựng' }), 'view')

    expect(await screen.findByRole('button', { name: '“interview” đã có trong danh sách' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Thêm “revenue”' }))

    expect(await screen.findByText('Đã thêm “revenue” vào danh sách.')).toBeInTheDocument()
    expect(callsTo('POST /api/custom-lists/5/words')[0].body).toEqual({ vocabularyId: 103 })
  })

  it('adds a word typed by the learner, defaulting to their level', async () => {
    renderAt('/vocabulary/lists/5', {
      'POST /api/custom-lists/5/words/new': ({ body }) => ({ status: 201, data: word(10_000, body.word, body.meaning) }),
    })
    const user = userEvent.setup()
    await screen.findByText('interview')

    await user.click(screen.getByRole('button', { name: 'Thêm từ tự nhập' }))
    expect(await screen.findByText('Vui lòng nhập từ.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Từ tiếng Anh'), 'negotiate')
    await user.type(screen.getByLabelText('Nghĩa'), 'thương lượng')
    await user.click(screen.getByRole('button', { name: 'Thêm từ tự nhập' }))

    expect(await screen.findByText('Đã thêm “negotiate” vào danh sách.')).toBeInTheDocument()
    expect(callsTo('POST /api/custom-lists/5/words/new')[0].body).toEqual({
      word: 'negotiate',
      meaning: 'thương lượng',
      difficultyLevel: 'B1',
      phonetic: null,
      exampleSentence: null,
    })
    expect(screen.getByLabelText('Từ tiếng Anh')).toHaveValue('')
  })

  it('deletes the list after confirmation and returns to the lists tab', async () => {
    renderAt('/vocabulary/lists/5', { 'DELETE /api/custom-lists/5': () => ({ status: 204 }) })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Xóa' }))
    const dialog = await screen.findByRole('dialog', { name: 'Xóa danh sách?' })
    await user.click(within(dialog).getByRole('button', { name: 'Xóa danh sách' }))

    await waitFor(() => expect(location()).toHaveTextContent('/vocabulary?tab=lists'))
    expect(callsTo('DELETE /api/custom-lists/5')).toHaveLength(1)
  })

  it('shows "not found" for a list that is not the learner’s', async () => {
    renderAt('/vocabulary/lists/7', {
      'GET /api/custom-lists/7': () => ({ status: 404, data: { status: 404, message: 'List not found' } }),
      'GET /api/custom-lists/7/words': () => ({ status: 404, data: { status: 404, message: 'List not found' } }),
    })

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy danh sách' })).toBeInTheDocument()
  })

  it('studies the list', async () => {
    renderAt('/vocabulary/lists/5/study', {
      'GET /api/learning/session': () => ({
        data: {
          source: { type: 'LIST', id: 5, name: 'Phỏng vấn xin việc' },
          cards: [{ ...LIST_WORDS[0], lastReviewResult: null, reviewCount: 0, nextReviewAt: null, lastReviewedAt: null }],
        },
      }),
    })

    expect(await screen.findByText('Thẻ 1 trên 1: interview')).toBeInTheDocument()
    expect(callsTo('GET /api/learning/session')[0].params).toMatchObject({ listId: 5 })
  })
})
