import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/app/App'
import { tokenStorage } from '@/api/tokenStorage'
import { installFakeBackend, learner } from '@/test/fakeBackend'

// Vocabulary games and the leaderboard (A4), against docs/api/games.md.

const GAMES = [
  { id: 1, name: 'Đoán nghĩa', gameType: 'GUESS_MEANING', timeLimitSeconds: 90, questionCount: 2, myBestScore: 150 },
  { id: 2, name: 'Trắc nghiệm nhanh', gameType: 'QUICK_QUIZ', timeLimitSeconds: 1, questionCount: 2, myBestScore: null },
  { id: 3, name: 'Ghép từ', gameType: 'WORD_MATCH', timeLimitSeconds: 60, questionCount: 2, myBestScore: null },
]

const CHOICE_ROUND = {
  gameId: 1,
  gameType: 'GUESS_MEANING',
  timeLimitSeconds: 90,
  playToken: 'token-1',
  questions: [
    { id: 11, prompt: 'revenue', phonetic: '/ˈrevənjuː/', points: 1, options: [{ id: 101, content: 'doanh thu' }, { id: 102, content: 'lợi nhuận' }] },
    { id: 12, prompt: 'budget', phonetic: null, points: 1, options: [{ id: 201, content: 'ngân sách' }, { id: 202, content: 'hợp đồng' }] },
  ],
  matchOptions: null,
}
const CHOICE_ANSWERS = { 11: 101, 12: 201 }

const MATCH_ROUND = {
  gameId: 3,
  gameType: 'WORD_MATCH',
  timeLimitSeconds: 60,
  playToken: 'token-3',
  questions: [
    { id: 31, prompt: 'revenue', phonetic: null, points: 1, options: [] },
    { id: 32, prompt: 'profit', phonetic: null, points: 1, options: [] },
  ],
  matchOptions: [
    { id: 302, content: 'lợi nhuận' },
    { id: 301, content: 'doanh thu' },
  ],
}
const MATCH_ANSWERS = { 31: 301, 32: 302 }

const LEADERBOARD = {
  periodType: 'WEEK',
  periodStart: '2026-09-21',
  updatedAt: new Date().toISOString(),
  entries: [
    { rank: 1, userId: 900, displayName: 'Minh', totalScore: 420 },
    { rank: 2, userId: 901, displayName: 'Lan', totalScore: 365 },
    { rank: 3, userId: 902, displayName: 'Huy', totalScore: 310 },
    { rank: 4, userId: 903, displayName: 'Trang', totalScore: 198 },
  ],
  me: { rank: 24, totalScore: 120 },
}

const RESULT = { sessionId: 1, score: 130, correctCount: 1, questionCount: 2, timeBonus: 0, bestScore: 150, isPersonalBest: false }

function routes(overrides = {}) {
  return {
    'GET /api/users/me': () => ({ data: learner }),
    'GET /api/games': () => ({ data: GAMES }),
    'GET /api/games/leaderboard': ({ params }) => ({ data: { ...LEADERBOARD, periodType: params.period } }),
    'GET /api/games/1/play': () => ({ data: CHOICE_ROUND }),
    'POST /api/games/1/check': ({ body }) => ({
      data: { correct: CHOICE_ANSWERS[body.questionId] === body.optionId, correctOptionId: CHOICE_ANSWERS[body.questionId] },
    }),
    'POST /api/games/1/sessions': () => ({ status: 201, data: RESULT }),
    'GET /api/games/3/play': () => ({ data: MATCH_ROUND }),
    'POST /api/games/3/check': ({ body }) => ({
      data: { correct: MATCH_ANSWERS[body.questionId] === body.optionId, correctOptionId: null },
    }),
    'POST /api/games/3/sessions': () => ({ status: 201, data: { ...RESULT, score: 20, correctCount: 2, isPersonalBest: true } }),
    'GET /api/games/2/play': () => ({ data: { ...CHOICE_ROUND, gameId: 2, gameType: 'QUICK_QUIZ', timeLimitSeconds: 1, playToken: 'token-2' } }),
    'POST /api/games/2/sessions': () => ({ status: 201, data: { ...RESULT, score: 0, correctCount: 0 } }),
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

describe('games page', () => {
  it('lists the three games with the learner’s best score', async () => {
    renderAt('/vocabulary/games')

    const first = (await screen.findByRole('heading', { name: 'Đoán nghĩa' })).closest('li')
    expect(first).toHaveTextContent('Kỷ lục 150')
    expect(first).toHaveTextContent('90 giây')
    expect(screen.getByRole('heading', { name: 'Ghép từ' }).closest('li')).toHaveTextContent('Chưa chơi')
    expect(screen.getByRole('link', { name: 'Chơi Ghép từ' })).toHaveAttribute('href', '/vocabulary/games/3')
  })

  it('shows the weekly leaderboard with the podium and the learner’s own rank, and switches to the month', async () => {
    renderAt('/vocabulary/games')
    const user = userEvent.setup()

    const board = (await screen.findByRole('heading', { name: 'Bảng xếp hạng tuần' })).closest('section')
    const podium = await within(board).findByRole('list', { name: 'Ba người dẫn đầu' })
    expect(within(podium).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('Lan'),
      expect.stringContaining('Minh'),
      expect.stringContaining('Huy'),
    ])
    expect(within(podium).getByText('Hạng 1, 420 điểm')).toBeInTheDocument()
    expect(within(board).getByRole('list', { name: 'Các hạng tiếp theo' })).toHaveTextContent('Trang')
    expect(within(board).getByRole('list', { name: 'Hạng của bạn' })).toHaveTextContent(/24.*Bạn.*120/)

    await user.click(within(board).getByRole('button', { name: 'Tháng' }))

    expect(await screen.findByRole('heading', { name: 'Bảng xếp hạng tháng' })).toBeInTheDocument()
    expect(callsTo('GET /api/games/leaderboard').map((call) => call.params.period)).toEqual(['WEEK', 'MONTH'])
  })

  it('is announced by a banner on the vocabulary page', async () => {
    renderAt('/vocabulary', {
      'GET /api/topics': () => ({ data: [] }),
      'GET /api/learning/summary': () => ({ data: { dueToday: 0, learningCount: 0, masteredCount: 0, reviewedToday: 0, upcoming: [] } }),
      'GET /api/custom-lists': () => ({ data: [] }),
    })

    expect(await screen.findByRole('link', { name: /Trò chơi từ vựng & Bảng xếp hạng/ })).toHaveAttribute('href', '/vocabulary/games')
  })
})

describe('playing', () => {
  it('checks each choice, colours it, and hands the finished round in to be scored by the server', async () => {
    renderAt('/vocabulary/games/1')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Bắt đầu' }))

    expect(await screen.findByText('revenue')).toBeInTheDocument()
    expect(screen.getByText('Câu 1/2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'doanh thu' }))
    expect(await screen.findByText('Chính xác!')).toBeInTheDocument()
    expect(screen.getByLabelText('Điểm tạm tính')).toHaveTextContent('10 điểm')
    expect(callsTo('POST /api/games/1/check')[0].body).toEqual({ playToken: 'token-1', questionId: 11, optionId: 101 })

    // Second question by keyboard: 2 = the second option, which is wrong.
    expect(await screen.findByText('budget')).toBeInTheDocument()
    await user.keyboard('2')
    expect(await screen.findByText('Chưa đúng, đáp án đúng được tô xanh.')).toBeInTheDocument()

    expect(await screen.findByText('Điểm của bạn')).toBeInTheDocument()
    expect(screen.getByText('130')).toBeInTheDocument()
    expect(screen.getByText('Đúng 1/2 câu')).toBeInTheDocument()
    const handIn = callsTo('POST /api/games/1/sessions')
    expect(handIn).toHaveLength(1)
    expect(handIn[0].body).toEqual({
      playToken: 'token-1',
      answers: [
        { questionId: 11, optionId: 101, responseTimeMs: expect.any(Number) },
        { questionId: 12, optionId: 202, responseTimeMs: expect.any(Number) },
      ],
    })
  })

  it('matches words with meanings, ignoring wrong pairs, then hands the round in', async () => {
    renderAt('/vocabulary/games/3')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Bắt đầu' }))
    const tile = (name) => screen.getByRole('button', { name })

    await user.click(await screen.findByRole('button', { name: 'revenue' }))
    expect(tile('revenue')).toHaveAttribute('aria-pressed', 'true')
    await user.click(tile('lợi nhuận'))
    await waitFor(() => expect(tile('revenue')).toHaveAttribute('aria-pressed', 'false'))

    await user.click(tile('revenue'))
    await user.click(tile('doanh thu'))
    expect(await screen.findByRole('button', { name: 'revenue (đã ghép)' })).toBeInTheDocument()

    await user.click(tile('profit'))
    await user.click(tile('lợi nhuận'))

    expect(await screen.findByText('Kỷ lục mới!')).toBeInTheDocument()
    expect(callsTo('POST /api/games/3/check').map((call) => call.body.optionId)).toEqual([302, 301, 302])
    expect(callsTo('POST /api/games/3/sessions')[0].body.answers).toEqual([
      { questionId: 31, optionId: 301, responseTimeMs: expect.any(Number) },
      { questionId: 32, optionId: 302, responseTimeMs: expect.any(Number) },
    ])
  })

  it('hands the round in by itself when the time is up', async () => {
    renderAt('/vocabulary/games/2')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Bắt đầu' }))
    expect(await screen.findByLabelText('Thời gian còn lại')).toHaveTextContent('00:01')

    expect(await screen.findByText('Điểm của bạn', {}, { timeout: 4000 })).toBeInTheDocument()
    expect(callsTo('POST /api/games/2/sessions')[0].body.answers).toEqual([
      { questionId: 11, optionId: null, responseTimeMs: null },
      { questionId: 12, optionId: null, responseTimeMs: null },
    ])
  })

  it('asks before leaving a round, and then saves nothing', async () => {
    renderAt('/vocabulary/games/1')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Bắt đầu' }))
    await user.click(await screen.findByRole('button', { name: 'Thoát ván' }))
    const dialog = await screen.findByRole('dialog', { name: 'Thoát ván này?' })
    await user.click(within(dialog).getByRole('button', { name: 'Thoát ván' }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/vocabulary\/games$/))
    expect(callsTo('POST /api/games/1/sessions')).toHaveLength(0)
  })

  it('offers to hand the round in again when that failed', async () => {
    let attempts = 0
    renderAt('/vocabulary/games/1', {
      'POST /api/games/1/sessions': () => (++attempts === 1 ? { status: 500, data: { status: 500, message: 'boom' } } : { status: 201, data: RESULT }),
    })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Bắt đầu' }))
    await user.click(await screen.findByRole('button', { name: 'doanh thu' }))
    await screen.findByText('budget')
    await user.click(screen.getByRole('button', { name: 'ngân sách' }))

    await user.click(await screen.findByRole('button', { name: 'Gửi lại kết quả' }))

    expect(await screen.findByText('Điểm của bạn')).toBeInTheDocument()
    expect(callsTo('POST /api/games/1/sessions')).toHaveLength(2)
  })

  it('shows "not found" for an unknown game', async () => {
    renderAt('/vocabulary/games/99')

    expect(await screen.findByText('Trò chơi này không tồn tại.')).toBeInTheDocument()
  })
})
