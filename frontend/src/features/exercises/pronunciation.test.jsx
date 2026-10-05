import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pronounce } from '@/lib/speech'
import { startRecording, toWav } from './pronunciation/recorder'
import { ASSESSMENT, ATTEMPT_ID, baseRoutes, renderApp } from './testFixtures'
import '@/test/preloadPages'

// The pronunciation exercise (B3), against docs/api/exercises.md. jsdom has no microphone or audio decoding, so the
// recorder module is replaced; its own logic (WAV encoding) is tested in pronunciation/wav.test.js.

vi.mock('./pronunciation/recorder', async (importOriginal) => ({
  ...(await importOriginal()),
  isRecordingSupported: () => true,
  startRecording: vi.fn(),
  toWav: vi.fn(),
}))

vi.mock('@/lib/speech', async (importOriginal) => ({ ...(await importOriginal()), pronounce: vi.fn() }))

let app
const WAV = new Blob(['RIFF'], { type: 'audio/wav' })

beforeEach(() => {
  startRecording.mockResolvedValue({ stop: vi.fn().mockResolvedValue({ blob: new Blob(['raw']), elapsedMs: 1500 }), cancel: vi.fn() })
  toWav.mockResolvedValue({ wav: WAV, durationMs: 1200 })
  URL.createObjectURL = vi.fn(() => 'blob:recording')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  app?.backend.restore()
  vi.clearAllMocks()
})

const RECORDING = `POST /api/exercise-attempts/${ATTEMPT_ID}/pronunciation/801`
const COMPLETE = `POST /api/exercise-attempts/${ATTEMPT_ID}/complete`

function pronunciationRoutes(overrides) {
  return baseRoutes({
    [RECORDING]: () => ({ status: 201, data: ASSESSMENT }),
    [COMPLETE]: () => ({
      data: {
        attemptId: ATTEMPT_ID,
        lessonId: 21,
        correctCount: 1,
        questionCount: 2,
        earnedPoints: 86,
        totalPoints: 200,
        scorePercent: 43,
        bestScorePercent: 43,
        isPersonalBest: true,
        review: [],
        translations: [],
        pronunciation: { averageScore: 86, practicedCount: 1, itemCount: 2 },
      },
    }),
    ...overrides,
  })
}

async function record(user) {
  await user.click(screen.getByRole('button', { name: 'Bắt đầu ghi âm' }))
  await user.click(await screen.findByRole('button', { name: 'Dừng ghi âm' }))
}

describe('pronunciation exercise', () => {
  it('plays the model, records the learner, sends the WAV and shows OpenPronounce IPA feedback', async () => {
    app = renderApp('/exercises/lessons/21', pronunciationRoutes())
    const user = userEvent.setup()
    const card = (await screen.findByText('Từ 1/2')).closest('section')
    expect(within(card).getByText('/səˌsteɪnəˈbɪləti/')).toBeInTheDocument()

    await user.click(within(card).getByRole('button', { name: 'Nghe mẫu' }))
    expect(pronounce).toHaveBeenCalledWith('sustainability', { audioUrl: null })

    await user.click(screen.getByRole('button', { name: 'Bắt đầu ghi âm' }))
    expect(await screen.findByText(/Đang ghi âm 0:00 \/ 0:10/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Dừng ghi âm' }))

    expect(await screen.findByRole('img', { name: 'Điểm phát âm 86 trên 100' })).toBeInTheDocument()
    expect(app.callsTo(RECORDING)[0].body).toBe(WAV)
    expect(card).toHaveTextContent('Khớp âm vị ≈90% · Khớp từ ≈82%')
    expect(card).toHaveTextContent('Âm dự kiến /səsteɪnəbɪləti/')
    expect(card).toHaveTextContent('/ɪ/ → /i/')
    expect(card).toHaveTextContent('Máy nghe được: “sustainability”')
    expect(card).toHaveTextContent('Kiểm tra lại phát âm từ sustainability.')
    expect(within(card).getByRole('button', { name: '▶ Nghe lại giọng bạn' })).toBeInTheDocument()

    await user.click(within(card).getByRole('button', { name: 'Thử lại' }))
    expect(screen.getByRole('button', { name: 'Bắt đầu ghi âm' })).toBeInTheDocument()
  })

  it('shows phoneme substitutions and omitted words in a sentence', async () => {
    app = renderApp(
      '/exercises/lessons/21',
      pronunciationRoutes({
        [`POST /api/exercise-attempts/${ATTEMPT_ID}/pronunciation/802`]: () => ({
          status: 201,
          data: {
            ...ASSESSMENT,
            itemId: 802,
            errors: [
              {
                word: 'reach', expectedIpa: 'riːtʃ', heardIpa: 'riːs', confidence: 76,
                errorType: 'MISPRONUNCIATION',
                phones: [{ expected: 'tʃ', heard: 's', confidence: 82 }],
              },
              {
                word: 'agreement', expectedIpa: 'əɡriːmənt', heardIpa: '', confidence: 91,
                errorType: 'OMISSION', phones: [],
              },
            ],
          },
        }),
      }),
    )
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Bỏ qua mục này' }))
    const card = (await screen.findByText('Câu 2/2')).closest('section')

    await record(user)

    await screen.findByRole('img', { name: /Điểm phát âm/ })
    expect(card).toHaveTextContent('reach')
    expect(card).toHaveTextContent('/tʃ/ → /s/')
    expect(card).toHaveTextContent('agreement')
    expect(card).toHaveTextContent('không nghe rõ')
  })

  it('explains a recording without speech, a blocked microphone, and a recording that is too short', async () => {
    app = renderApp('/exercises/lessons/21', pronunciationRoutes({ [RECORDING]: () => ({ status: 422, data: {} }) }))
    const user = userEvent.setup()
    await screen.findByText('Từ 1/2')

    await record(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Không nhận diện được giọng nói')

    startRecording.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'))
    await user.click(screen.getByRole('button', { name: 'Bắt đầu ghi âm' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Trình duyệt chưa cho phép dùng micro')

    toWav.mockResolvedValueOnce({ wav: WAV, durationMs: 100 })
    await record(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Bản ghi quá ngắn')
    expect(app.callsTo(RECORDING)).toHaveLength(1)
  })

  it('says "too short" when stop is pressed at once, without trying to convert the empty recording', async () => {
    // Stopped straight away, a browser recording is often empty and cannot be decoded at all.
    startRecording.mockResolvedValueOnce({ stop: vi.fn().mockResolvedValue({ blob: new Blob([]), elapsedMs: 80 }), cancel: vi.fn() })
    app = renderApp('/exercises/lessons/21', pronunciationRoutes())
    const user = userEvent.setup()
    await screen.findByText('Từ 1/2')

    await record(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Bản ghi quá ngắn')
    expect(toWav).not.toHaveBeenCalled()
    expect(app.callsTo(RECORDING)).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Bắt đầu ghi âm' })).toBeInTheDocument()
  })

  it('goes through the items, lets the last one be skipped, and ends with each item’s best score', async () => {
    app = renderApp('/exercises/lessons/21', pronunciationRoutes())
    const user = userEvent.setup()
    await screen.findByText('Từ 1/2')

    await record(user)
    await user.click(await screen.findByRole('button', { name: 'Tiếp tục' }))

    expect(await screen.findByText('Câu 2/2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Kết thúc' }))

    expect(await screen.findByRole('heading', { name: 'Hoàn thành bài luyện phát âm' })).toBeInTheDocument()
    expect(app.callsTo(COMPLETE)[0].body).toEqual({ responses: [] })
    expect(screen.getByText('Đã luyện 1/2 mục · điểm trung bình 86')).toBeInTheDocument()
    const scores = screen.getByRole('list', { name: 'Điểm tốt nhất từng mục' })
    expect(within(scores).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'sustainability1 lần thử86 điểm',
      'We need to reach an agreement.Bỏ qua',
    ])
    expect(screen.getByRole('button', { name: 'Luyện lại' })).toBeInTheDocument()
  })
})

describe('picking up an unfinished pronunciation lesson', () => {
  it('keeps the best scores already earned and opens at the first item not recorded', async () => {
    app = renderApp(
      '/exercises/lessons/21',
      pronunciationRoutes({
        'POST /api/exercises/21/attempts': () => ({
          status: 200,
          data: { attemptId: ATTEMPT_ID, startedAt: '2026-09-25T02:00:00Z', resumed: true, responses: [], pronunciation: [{ itemId: 801, tryCount: 2, bestScore: 74 }] },
        }),
      }),
    )
    const user = userEvent.setup()

    expect(await screen.findByText('Câu 2/2')).toBeInTheDocument()
    expect(screen.getByText(/Giữ lại/)).toHaveTextContent('Giữ lại 1/2 mục đã luyện và điểm cao nhất.')

    await user.click(screen.getByRole('button', { name: 'Kết thúc' }))

    const scores = await screen.findByRole('list', { name: 'Điểm tốt nhất từng mục' })
    expect(within(scores).getByText('74 điểm')).toBeInTheDocument()
    expect(within(scores).getByText('Bỏ qua')).toBeInTheDocument()
  })
})
