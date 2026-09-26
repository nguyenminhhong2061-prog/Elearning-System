import { useEffect, useRef, useState } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { Page } from '@/components/layout/Page'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { Tag } from '@/components/ui/Tag'
import { pronounce } from '@/lib/speech'
import { assessPronunciation } from '../api/exercisesApi'
import { useCompleteAttempt } from '../api/exercisesQueries'
import { ExerciseHeading } from '../components/ExerciseHeading'
import { ResultCard } from '../components/ResultCard'
import { ScoreRing } from '../components/ScoreRing'
import { MAX_RECORDING_MS, MIN_RECORDING_MS, scoreBand } from '../constants'
import { formatPlayTime } from '../time'
import { AssessmentView } from './AssessmentView'
import { isRecordingSupported } from './recorder'
import { useRecorder } from './useRecorder'

const DARK_OUTLINE =
  'cursor-pointer rounded-lg border border-sidebar-line px-3 py-3 text-label font-semibold text-sidebar-text hover:bg-sidebar-raised focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50'
const DARK_PRIMARY =
  'cursor-pointer rounded-lg bg-brand px-3 py-3 text-label font-semibold text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const BAND_TAG = { good: 'success', fair: 'warning', poor: 'danger' }

function MicIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  )
}

function SpeakerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  )
}

/** Vietnamese message for a failed grading request (exceptions of B3). */
function assessmentErrorMessage(error) {
  if (error?.status === 422) return 'Không nhận diện được giọng nói. Hãy nói to, rõ và gần micro hơn rồi thử lại.'
  if (error?.status === 413) return 'Bản ghi quá dài. Hãy chỉ đọc mục đang luyện rồi thử lại.'
  if (error?.status === 400) return 'Bản ghi không hợp lệ. Hãy thử ghi lại.'
  if (error?.status === 503) return 'Chưa chấm được lúc này vì dịch vụ chấm phát âm đang bận. Hãy thử lại sau ít phút.'
  return describeApiError(error, 'Chưa chấm được lúc này. Hãy thử lại sau.')
}

/** "Câu 6/15" for a sentence, "Từ 6/15" otherwise (a word, or a short phrase such as "a record"), as the design's pill. */
function itemLabel(item) {
  return item.text.trim().split(/\s+/).length >= 3 ? 'Câu' : 'Từ'
}

/**
 * B3, pronunciation: one word or sentence at a time on the design's dark card. The learner hears the model, records
 * themselves, and the server (an AI speech service) returns a score with tips. They may try again as often as they
 * like, skip an item, or go on; at the end the attempt is completed with each item's best score.
 *
 * @param {object} props see GrammarExercise
 */
export function PronunciationExercise({ lesson, attemptId, nextLesson, onRestart, restarting, restartError, onChatContext }) {
  const items = lesson.pronunciationItems
  const [index, setIndex] = useState(0)
  const [assessing, setAssessing] = useState(false)
  const [assessment, setAssessment] = useState(null)
  const [assessError, setAssessError] = useState(null)
  const [best, setBest] = useState(() => new Map()) // itemId -> best overall score
  const [recordingUrl, setRecordingUrl] = useState(null)
  const complete = useCompleteAttempt(attemptId)
  const supported = isRecordingSupported()
  const summaryArea = useRef(null)

  const item = items[index]
  const isLast = index === items.length - 1

  const recorder = useRecorder({
    maxMs: MAX_RECORDING_MS,
    async onRecorded({ wav, durationMs }) {
      if (durationMs < MIN_RECORDING_MS) {
        setAssessError('Bản ghi quá ngắn. Hãy bấm dừng sau khi đọc xong.')
        return
      }
      setRecordingUrl(URL.createObjectURL(wav))
      setAssessing(true)
      try {
        const result = await assessPronunciation(attemptId, item.id, wav)
        setAssessment(result)
        setBest((previous) => new Map(previous).set(item.id, Math.max(previous.get(item.id) ?? 0, result.overallScore)))
      } catch (error) {
        setAssessError(assessmentErrorMessage(error))
      } finally {
        setAssessing(false)
      }
    },
  })

  useEffect(() => {
    onChatContext({ pronunciationItemId: item.id })
  }, [item.id, onChatContext])

  // Each recording gets an object URL for "Nghe lại giọng bạn"; the previous one is released.
  useEffect(() => (recordingUrl ? () => URL.revokeObjectURL(recordingUrl) : undefined), [recordingUrl])

  useEffect(() => {
    if (complete.isSuccess) summaryArea.current?.querySelector('h2')?.focus()
  }, [complete.isSuccess])

  function resetItem() {
    setAssessment(null)
    setAssessError(null)
    setRecordingUrl(null)
    recorder.clearError()
  }

  function startRecording() {
    setAssessError(null)
    recorder.start()
  }

  function goOn() {
    if (isLast) {
      complete.mutate({})
      return
    }
    setIndex(index + 1)
    resetItem()
  }

  if (complete.isSuccess) {
    const summary = complete.data.pronunciation ?? { averageScore: complete.data.scorePercent, practicedCount: best.size, itemCount: items.length }
    const average = Math.round(summary.averageScore)
    return (
      <Page title={lesson.title} width="focus" className="pb-20" heading={<ExerciseHeading skill={lesson.skill} title={lesson.title} />}>
        <div ref={summaryArea} className="flex flex-col gap-6">
          <ResultCard
            skill={lesson.skill}
            ring={
              <ScoreRing tone={scoreBand(average)} fraction={average / 100} label={`Điểm trung bình ${average} trên 100`}>
                {average}
              </ScoreRing>
            }
            title="Hoàn thành bài luyện phát âm"
            details={`Đã luyện ${summary.practicedCount}/${summary.itemCount} mục · điểm trung bình ${average}`}
            isPersonalBest={complete.data.isPersonalBest}
            nextLesson={nextLesson}
            onRestart={onRestart}
            restarting={restarting}
            restartError={restartError}
            restartLabel="Luyện lại"
          />
          <ul aria-label="Điểm tốt nhất từng mục" className="flex flex-col divide-y divide-line rounded-xl border border-line bg-white">
            {items.map((practiced) => {
              const score = best.get(practiced.id)
              return (
                <li key={practiced.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span lang="en" className="text-sm font-semibold text-ink">
                    {practiced.text}
                  </span>
                  {score === undefined ? (
                    <Tag>Bỏ qua</Tag>
                  ) : (
                    <Tag variant={BAND_TAG[scoreBand(score)]}>{Math.round(score)} điểm</Tag>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </Page>
    )
  }

  const recording = recorder.status === 'recording'
  const busy = recorder.status !== 'idle' || assessing
  const error = recorder.error ?? assessError

  let body
  if (!supported) {
    body = (
      <p role="alert" className="rounded-lg bg-danger-bg px-4 py-3 text-label font-semibold text-danger">
        Trình duyệt này không ghi âm được (cần Chrome, Edge, Firefox hoặc Safari bản mới, và trang mở bằng HTTPS).
      </p>
    )
  } else if (assessing || recorder.status === 'processing') {
    body = (
      <div role="status" className="flex flex-col items-center gap-3 py-8 text-label text-muted-light">
        <Spinner label={null} className="size-8 border-sidebar-raised border-t-brand" />
        Đang chấm điểm…
      </div>
    )
  } else if (assessment) {
    body = (
      <>
        {/* A single word is already on the card in large type; colouring it again below adds nothing. */}
        <AssessmentView assessment={assessment} showWords={assessment.words.length > 1} />
        <div className="flex w-full flex-wrap gap-2">
          {recordingUrl && (
            <button type="button" onClick={() => new Audio(recordingUrl).play().catch(() => {})} className={`${DARK_OUTLINE} w-full`}>
              ▶ Nghe lại giọng bạn
            </button>
          )}
          <button type="button" onClick={resetItem} className={`${DARK_OUTLINE} flex-1`}>
            Thử lại
          </button>
          <button type="button" onClick={goOn} disabled={complete.isPending} className={`${DARK_PRIMARY} flex-1`}>
            {isLast ? (complete.isPending ? 'Đang lưu…' : 'Xem kết quả') : 'Tiếp tục'}
          </button>
        </div>
      </>
    )
  } else {
    body = (
      <>
        <button
          type="button"
          onClick={recording ? recorder.stop : startRecording}
          disabled={recorder.status === 'starting'}
          aria-label={recording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
          className={`flex size-24 cursor-pointer items-center justify-center rounded-full bg-brand text-white ring-10 ring-brand/16 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-brand disabled:cursor-wait ${recording ? 'animate-pulse' : ''}`}
        >
          {recording ? <span aria-hidden="true" className="size-6.5 rounded-md bg-white" /> : <MicIcon />}
        </button>
        <p aria-live="polite" className="text-label text-muted-light">
          {recording
            ? `Đang ghi âm ${formatPlayTime(recorder.elapsedMs)} / ${formatPlayTime(MAX_RECORDING_MS)}, bấm để dừng`
            : recorder.status === 'starting'
              ? 'Đang mở micro…'
              : 'Bấm micro để ghi âm và chấm điểm phát âm'}
        </p>
      </>
    )
  }

  return (
    <Page
      title={lesson.title}
      width="focus"
      className="pb-20"
      heading={
        <ExerciseHeading
          skill={lesson.skill}
          title={lesson.title}
          aside={
            <button
              type="button"
              onClick={goOn}
              disabled={busy || complete.isPending}
              className="cursor-pointer text-label font-medium text-muted hover:text-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLast ? 'Kết thúc' : 'Bỏ qua mục này'}
            </button>
          }
        />
      }
    >
      <section
        aria-label={`${itemLabel(item)} ${index + 1} trên ${items.length}`}
        className="flex animate-screen-in flex-col items-center gap-5 rounded-2xl bg-sidebar-deep p-9 text-center"
        key={item.id}
      >
        <span className="rounded-full bg-sidebar-raised px-3 py-1.25 text-xs font-semibold text-muted-light">
          {itemLabel(item)} {index + 1}/{items.length}
        </span>
        <div className="flex flex-col items-center gap-2">
          <p lang="en" className="text-[32px] leading-10 font-bold break-words text-white">
            {item.text}
          </p>
          {item.ipa && <p className="font-mono text-sm text-muted-light">{item.ipa}</p>}
        </div>
        <button
          type="button"
          onClick={() => pronounce(item.text, { audioUrl: item.audioUrl })}
          disabled={recording}
          className={`${DARK_OUTLINE} flex items-center gap-2 px-4 py-2`}
        >
          <SpeakerIcon />
          Nghe mẫu
        </button>
        {item.notes && <p className="text-label text-sidebar-text">{item.notes}</p>}
        {body}
        {error && !assessing && (
          <p role="alert" className="w-full rounded-lg bg-danger-bg px-4 py-3 text-label font-semibold text-danger">
            {error}
          </p>
        )}
      </section>
      {complete.isError && <Alert variant="error">{describeApiError(complete.error, 'Chưa lưu được kết quả. Hãy thử lại.')}</Alert>}
    </Page>
  )
}
