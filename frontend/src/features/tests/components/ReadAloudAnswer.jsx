import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { isRecordingSupported } from '@/features/exercises/pronunciation/recorder'
import { useRecorder } from '@/features/exercises/pronunciation/useRecorder'

function uploadErrorMessage(error) {
  if (error?.status === 503) {
    return 'Dịch vụ chấm phát âm chưa sẵn sàng. Bản ghi của bạn vẫn được giữ, hãy gửi lại sau ít phút.'
  }
  if (error?.status === 409) return 'Bài kiểm tra đã được nộp nên không lưu được bản ghi này.'
  return describeApiError(error, 'Không gửi được bản ghi âm. Vui lòng thử lại.')
}

/**
 * The answer of a read-aloud question: the sentence to read and a recorder. The recording is sent as soon as it is
 * made and the learner can listen to it and record again (the last one counts). How it was pronounced is only shown
 * in the result, after the test is submitted.
 *
 * @param {object} props
 * @param {import('../types').TestQuestion} props.question
 * @param {boolean} props.recorded the server has a recording for this question
 * @param {{ status: 'saving' | 'saved' | 'error', url: string, error: unknown } | undefined} props.upload the
 *   recording made on this visit, if any
 * @param {(wav: Blob) => void} props.onRecorded
 * @param {() => void} props.onRetry sends the recording again after a failed upload
 */
export function ReadAloudAnswer({ question, recorded, upload, onRecorded, onRetry }) {
  const recorder = useRecorder({
    maxMs: question.maxRecordingSeconds * 1000,
    onRecorded: ({ wav }) => onRecorded(wav),
  })
  const recording = recorder.status === 'recording'
  const saving = upload?.status === 'saving'

  let label = recorded || upload ? 'Ghi lại' : 'Ghi âm'
  if (recording) label = 'Dừng ghi âm'
  else if (recorder.status === 'starting') label = 'Đang mở micro…'

  let status = `Bản ghi dài tối đa ${question.maxRecordingSeconds} giây.`
  if (recording) {
    status = `Đang ghi âm ${Math.floor(recorder.elapsedMs / 1000)}/${question.maxRecordingSeconds} giây, bấm để dừng.`
  } else if (saving) {
    status = 'Đang xử lý bản ghi âm… Lần đầu có thể mất vài phút.'
  } else if (upload?.status === 'saved') {
    status = 'Đã lưu bản ghi âm. Bạn có thể ghi lại; bản ghi cuối cùng được tính.'
  } else if (recorded && !upload) {
    status = 'Bạn đã ghi âm câu này. Bạn có thể ghi lại; bản ghi cuối cùng được tính.'
  }

  return (
    <div className="flex flex-col gap-4">
      <blockquote
        aria-label="Câu cần đọc"
        className="rounded-lg border border-brand-tint-line bg-brand-tint px-4 py-3.5 text-lg font-semibold text-ink"
      >
        {question.referenceText}
      </blockquote>

      {isRecordingSupported() ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={recording ? 'danger' : 'primary'}
            onClick={recording ? recorder.stop : recorder.start}
            // One upload at a time: a newer recording must not be overtaken by an older one still being processed.
            disabled={recorder.status === 'starting' || recorder.status === 'processing' || saving}
          >
            {label}
          </Button>
          <p aria-live="polite" className="text-label text-muted">
            {status}
          </p>
        </div>
      ) : (
        <Alert variant="error">
          Trình duyệt này không ghi âm được. Hãy mở bài kiểm tra bằng trình duyệt khác (Chrome, Edge, Firefox hoặc
          Safari bản mới) để trả lời câu này.
        </Alert>
      )}

      {recorder.error && <Alert variant="error">{recorder.error}</Alert>}

      {upload && (
        <audio controls src={upload.url} aria-label="Bản ghi âm của bạn" className="w-full">
          Trình duyệt của bạn không phát được âm thanh này.
        </audio>
      )}

      {upload?.status === 'error' && (
        <Alert variant="error" className="flex flex-wrap items-center justify-between gap-3">
          <span>{uploadErrorMessage(upload.error)}</span>
          <button type="button" onClick={onRetry} className="cursor-pointer font-semibold underline">
            Gửi lại
          </button>
        </Alert>
      )}

      <p className="text-label text-muted">Kết quả chấm phát âm hiện sau khi bạn nộp bài.</p>
    </div>
  )
}
