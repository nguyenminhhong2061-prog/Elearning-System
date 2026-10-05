import { useEffect, useRef, useState } from 'react'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useRecordPassagePlay } from '../api/testsQueries'

/**
 * The recording of a listening passage, played a limited number of times per attempt. The server counts the plays:
 * each play is asked for first and only starts once the server has counted it. There is no pause or seek bar, so one
 * play is one listen from start to end; leaving the passage stops it.
 */
function ListeningPlayer({ attemptId, passage, playCount, onPlayed }) {
  const audio = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [audioFailed, setAudioFailed] = useState(false)
  const record = useRecordPassagePlay()
  const left = Math.max(passage.maxPlays - playCount, 0)

  useEffect(() => {
    const element = audio.current
    return () => element?.pause()
  }, [])

  function play() {
    setAudioFailed(false)
    record.mutate(
      { attemptId, passageId: passage.id },
      {
        onSuccess: (result) => {
          onPlayed(passage.id, result.playCount)
          const element = audio.current
          if (!element) return
          element.currentTime = 0
          setPlaying(true)
          Promise.resolve(element.play()).catch(() => {
            setPlaying(false)
            setAudioFailed(true)
          })
        },
        // 409: the server says no play is left (counted in another tab, for example).
        onError: (error) => {
          if (error.status === 409) onPlayed(passage.id, passage.maxPlays)
        },
      },
    )
  }

  let label = `Nghe (còn ${left} lần)`
  if (playing) label = 'Đang phát…'
  else if (left === 0) label = 'Đã hết lượt nghe'

  return (
    <div className="flex flex-col gap-2">
      <audio
        ref={audio}
        src={passage.audioUrl}
        preload="auto"
        onEnded={() => setPlaying(false)}
        onError={() => {
          setPlaying(false)
          setAudioFailed(true)
        }}
      />
      <Button
        onClick={play}
        loading={record.isPending}
        disabled={playing || left === 0}
        className="self-start"
      >
        {label}
      </Button>
      <p className="text-label text-muted">
        Mỗi bài nghe được nghe tối đa {passage.maxPlays} lần. Bài nghe phát một mạch từ đầu đến cuối, không tạm dừng hay
        tua lại được; chuyển sang phần khác thì bài nghe dừng.
      </p>
      {record.isError && record.error.status !== 409 && (
        <Alert variant="error">{describeApiError(record.error, 'Không phát được bài nghe. Vui lòng thử lại.')}</Alert>
      )}
      {audioFailed && <Alert variant="error">Không phát được file âm thanh của bài nghe.</Alert>}
    </div>
  )
}

/**
 * The passage the current question is about, shown above it: the text to read, or the recording to listen to. It
 * stays on screen (and keeps playing) while the learner moves between the questions of the same passage.
 *
 * @param {object} props
 * @param {number} props.attemptId
 * @param {import('../types').TestPassage} props.passage
 * @param {number} props.playCount how many times its recording has been played in this attempt
 * @param {(passageId: number, playCount: number) => void} props.onPlayed
 */
export function PassageView({ attemptId, passage, playCount, onPlayed }) {
  const listening = Boolean(passage.audioUrl)
  return (
    <Card role="region" aria-label={listening ? 'Bài nghe' : 'Đoạn đọc'} className="flex flex-col gap-3">
      <h2 className="text-label font-semibold text-muted">
        {listening ? 'Bài nghe' : 'Đoạn đọc'}
        {passage.title ? `: ${passage.title}` : ''}
      </h2>
      {listening && (
        <ListeningPlayer attemptId={attemptId} passage={passage} playCount={playCount} onPlayed={onPlayed} />
      )}
      {passage.content && <p className="text-body whitespace-pre-line text-ink">{passage.content}</p>}
    </Card>
  )
}
