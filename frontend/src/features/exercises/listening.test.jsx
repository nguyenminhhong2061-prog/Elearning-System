import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ATTEMPT_ID, baseRoutes, renderApp } from './testFixtures'
import '@/test/preloadPages'

// The listening exercise (B2), against docs/api/exercises.md. jsdom has no media playback, so play() and pause() are
// replaced by versions that only fire the events a browser would.

let app
let restoreMedia

beforeEach(() => {
  const proto = window.HTMLMediaElement.prototype
  const paused = Object.getOwnPropertyDescriptor(proto, 'paused')
  const play = vi.spyOn(proto, 'play').mockImplementation(function play() {
    this.playing = true
    this.dispatchEvent(new Event('play'))
    return Promise.resolve()
  })
  const pause = vi.spyOn(proto, 'pause').mockImplementation(function pause() {
    this.playing = false
    this.dispatchEvent(new Event('pause'))
  })
  Object.defineProperty(proto, 'paused', {
    configurable: true,
    get() {
      return !this.playing
    },
  })
  restoreMedia = () => {
    play.mockRestore()
    pause.mockRestore()
    Object.defineProperty(proto, 'paused', paused)
  }
})

afterEach(() => {
  app?.backend.restore()
  restoreMedia()
})

const RESULT = {
  attemptId: ATTEMPT_ID,
  lessonId: 11,
  correctCount: 1,
  questionCount: 2,
  earnedPoints: 1,
  totalPoints: 2,
  scorePercent: 50,
  bestScorePercent: 50,
  isPersonalBest: true,
  review: [
    { questionId: 1111, correct: true, optionId: 11111, answer: null, correctOptionId: 11111, correctAnswer: 'Quầy làm thủ tục', explanation: 'Check-in counter là quầy làm thủ tục.' },
    { questionId: 1112, correct: false, optionId: null, answer: '2', correctOptionId: null, correctAnswer: '12', explanation: '"counter number twelve".' },
  ],
  translations: [
    { segmentId: 1101, translation: 'Xin lỗi, quầy làm thủ tục ở đâu?' },
    { segmentId: 1102, translation: 'Đó là quầy số mười hai.' },
    { segmentId: 1103, translation: 'Mấy giờ bắt đầu lên máy bay?' },
  ],
  pronunciation: null,
}

function listeningRoutes() {
  return baseRoutes({ [`POST /api/exercise-attempts/${ATTEMPT_ID}/complete`]: () => ({ data: RESULT }) })
}

describe('listening exercise', () => {
  it('plays the passage at the chosen speed and follows it in the subtitles', async () => {
    app = renderApp('/exercises/lessons/11', listeningRoutes())
    const user = userEvent.setup()
    await screen.findByRole('heading', { level: 1, name: 'Hội thoại tại sân bay' })
    const audio = document.querySelector('audio')
    expect(audio).toHaveAttribute('src', '/media/airport.mp3')
    expect(screen.getByRole('slider', { name: 'Vị trí phát' })).toHaveAttribute('aria-valuetext', '0:00 trên 0:29')

    await user.click(screen.getByRole('button', { name: 'Phát' }))
    expect(screen.getByRole('button', { name: 'Tạm dừng' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '1.25x' }))
    expect(screen.getByRole('button', { name: '1.25x' })).toHaveAttribute('aria-pressed', 'true')
    expect(audio.playbackRate).toBe(1.25)

    // Subtitles are off until asked for (reading them would give the answers away).
    expect(screen.queryByRole('list', { name: 'Phụ đề' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: 'Hiện phụ đề' }))
    const subtitles = screen.getByRole('list', { name: 'Phụ đề' })

    audio.currentTime = 7
    fireEvent.timeUpdate(audio)
    expect(within(subtitles).getByRole('button', { name: /counter number twelve/ })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('0:07')).toBeInTheDocument()

    await user.click(within(subtitles).getByRole('button', { name: /boarding start/ }))
    expect(audio.currentTime).toBe(12)
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2)
  })

  it('hides the subtitles while answering, asks before handing in empty questions, then shows the answers', async () => {
    app = renderApp('/exercises/lessons/11', listeningRoutes())
    const user = userEvent.setup()
    await screen.findByRole('heading', { level: 1, name: 'Hội thoại tại sân bay' })

    // Scenario 11, step 8: the first answer hides the subtitles and locks them until hand-in.
    await user.click(screen.getByRole('switch', { name: 'Hiện phụ đề' }))
    expect(screen.getByRole('list', { name: 'Phụ đề' })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Quầy làm thủ tục' }))
    expect(screen.queryByRole('list', { name: 'Phụ đề' })).not.toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Hiện phụ đề' })).toBeDisabled()
    expect(screen.getByText(/Phụ đề tạm ẩn trong lúc bạn trả lời câu hỏi/)).toBeInTheDocument()

    // Branch 9a: an empty question is announced; staying sends nothing.
    await user.click(screen.getByRole('button', { name: 'Nộp bài' }))
    const dialog = await screen.findByRole('dialog', { name: 'Nộp bài?' })
    expect(within(dialog).getByText('Còn 1 câu chưa trả lời. Câu chưa trả lời được tính sai.')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Làm tiếp' }))
    expect(screen.queryByRole('dialog', { name: 'Nộp bài?' })).not.toBeInTheDocument()
    expect(app.callsTo(`POST /api/exercise-attempts/${ATTEMPT_ID}/complete`)).toHaveLength(0)

    await user.type(screen.getByRole('textbox', { name: 'Đáp án của bạn' }), '2')
    await user.click(screen.getByRole('button', { name: '0.75x' }))
    await user.click(screen.getByRole('button', { name: 'Nộp bài' }))

    expect(await screen.findByRole('heading', { name: 'Hoàn thành bài nghe' })).toBeInTheDocument()
    expect(app.callsTo(`POST /api/exercise-attempts/${ATTEMPT_ID}/complete`)[0].body).toEqual({
      responses: [
        { questionId: 1111, optionId: 11111 },
        { questionId: 1112, answer: '2' },
      ],
      playbackRate: 0.75,
    })
    expect(screen.getByText('Kỷ lục mới!')).toBeInTheDocument()
    expect(screen.getByText(/Chưa đúng\. Đáp án đúng:/)).toHaveTextContent('12')
    expect(screen.queryByRole('button', { name: 'Nộp bài' })).not.toBeInTheDocument()

    // The transcript opens with the translation under each segment, which can be hidden again.
    expect(screen.getByText('Đó là quầy số mười hai.')).toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: 'Hiện bản dịch' }))
    expect(screen.queryByText('Đó là quầy số mười hai.')).not.toBeInTheDocument()
    expect(screen.getByText('It’s counter number twelve.')).toBeInTheDocument()
  })

  it('hands in with an empty question counted wrong once the learner confirms', async () => {
    app = renderApp('/exercises/lessons/11', listeningRoutes())
    const user = userEvent.setup()
    await screen.findByRole('heading', { level: 1, name: 'Hội thoại tại sân bay' })

    await user.click(screen.getByRole('radio', { name: 'Quầy làm thủ tục' }))
    await user.click(screen.getByRole('button', { name: 'Nộp bài' }))
    await user.click(within(await screen.findByRole('dialog', { name: 'Nộp bài?' })).getByRole('button', { name: 'Nộp bài' }))

    expect(await screen.findByRole('heading', { name: 'Hoàn thành bài nghe' })).toBeInTheDocument()
    expect(app.callsTo(`POST /api/exercise-attempts/${ATTEMPT_ID}/complete`)[0].body.responses).toEqual([
      { questionId: 1111, optionId: 11111 },
    ])
  })

  it('goes back five seconds, and offers to load the recording again when it failed (branch 5a)', async () => {
    const load = vi.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    app = renderApp('/exercises/lessons/11', listeningRoutes())
    const user = userEvent.setup()
    await screen.findByRole('heading', { level: 1, name: 'Hội thoại tại sân bay' })
    const audio = document.querySelector('audio')

    audio.currentTime = 12
    fireEvent.timeUpdate(audio)
    await user.click(screen.getByRole('button', { name: 'Lùi 5 giây' }))
    expect(audio.currentTime).toBe(7)

    fireEvent.error(audio)
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được bài nghe, vui lòng thử lại')
    expect(screen.getByRole('radio', { name: 'Quầy làm thủ tục' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Đáp án của bạn' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Tải lại' }))
    expect(load).toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Quầy làm thủ tục' })).toBeEnabled()
    load.mockRestore()
  })
})
