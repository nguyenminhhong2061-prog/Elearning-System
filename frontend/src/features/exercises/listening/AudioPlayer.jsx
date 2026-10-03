import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { cx } from '@/lib/cx'
import { PLAYBACK_RATES } from '../constants'
import { formatPlayTime } from '../time'

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" />
    </svg>
  )
}

/** "0.75x", "1x", "1.25x" as in the design. */
const rateLabel = (rate) => `${rate}x`

/**
 * The design's listening player: a round play button, a seekable progress bar with the times, and three speeds. It
 * drives a hidden native <audio> element, so the browser still handles buffering and formats.
 *
 * `ref` exposes `playFrom(ms)` for the transcript ("nghe lại câu này").
 *
 * @param {object} props
 * @param {string} props.src
 * @param {number} props.durationMs used until the file's own duration is known
 * @param {number} props.rate
 * @param {(rate: number) => void} props.onRateChange
 * @param {(positionMs: number) => void} [props.onPosition]
 * @param {(failed: boolean) => void} [props.onFailedChange] the file could not be loaded, or loads again after "Tải lại"
 * @param {import('react').Ref<{ playFrom: (ms: number) => void }>} [props.ref]
 */
export function AudioPlayer({ src, durationMs, rate, onRateChange, onPosition, onFailedChange, ref }) {
  const audio = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(durationMs)
  const [failed, setFailed] = useState(false)

  function markFailed(value) {
    setFailed(value)
    onFailedChange?.(value)
  }

  // Scenario 11, branch 5a: "Tải lại" asks the browser for the file again.
  function reload() {
    markFailed(false)
    audio.current?.load()
  }

  useImperativeHandle(ref, () => ({
    playFrom(ms) {
      const element = audio.current
      if (!element) return
      element.currentTime = ms / 1000
      setPosition(ms)
      element.play().catch(() => {})
    },
  }))

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = rate
  }, [rate])

  function toggle() {
    const element = audio.current
    if (element.paused) {
      element.play().catch(() => markFailed(true))
    } else {
      element.pause()
    }
  }

  function seek(ms) {
    audio.current.currentTime = ms / 1000
    setPosition(ms)
    onPosition?.(ms)
  }

  const percent = duration > 0 ? Math.min(100, (position / duration) * 100) : 0
  const back5 = () => seek(Math.max(0, position - 5000))

  return (
    <div className="flex flex-col gap-2">
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => {
          const ms = event.currentTarget.currentTime * 1000
          setPosition(ms)
          onPosition?.(ms)
        }}
        onLoadedMetadata={(event) => {
          const seconds = event.currentTarget.duration
          if (Number.isFinite(seconds) && seconds > 0) setDuration(seconds * 1000)
          event.currentTarget.playbackRate = rate // some browsers reset the rate when a source loads
        }}
        onError={() => markFailed(true)}
      />
      <div className="flex flex-wrap items-center gap-3.5">
        <button
          type="button"
          onClick={toggle}
          disabled={failed}
          aria-label={playing ? 'Tạm dừng' : 'Phát'}
          className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-line"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          type="button"
          onClick={back5}
          disabled={failed}
          className="flex-none cursor-pointer rounded-md border border-line bg-white px-2.5 py-1.25 text-xs font-semibold text-ink-soft hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          Lùi 5 giây
        </button>
        <div className="flex min-w-40 flex-1 flex-col gap-1.5">
          <div className="relative rounded-full has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-brand">
            <div className="h-1.25 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-brand" style={{ width: `${percent}%` }} />
            </div>
            {/* The native range input does the seeking (mouse, touch, arrow keys); it is invisible over the bar. */}
            <input
              type="range"
              min={0}
              max={Math.max(1, Math.round(duration))}
              step={1000}
              value={Math.round(position)}
              disabled={failed}
              onChange={(event) => seek(Number(event.target.value))}
              aria-label="Vị trí phát"
              aria-valuetext={`${formatPlayTime(position)} trên ${formatPlayTime(duration)}`}
              className="absolute inset-x-0 -top-2 h-5 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
          </div>
          <div className="flex justify-between font-mono text-xs text-muted">
            <span>{formatPlayTime(position)}</span>
            <span>{formatPlayTime(duration)}</span>
          </div>
        </div>
        <div role="group" aria-label="Tốc độ phát" className="flex gap-1">
          {PLAYBACK_RATES.map((option) => {
            const selected = option === rate
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => onRateChange(option)}
                className={cx(
                  'cursor-pointer rounded-md border px-2.5 py-1.25 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                  selected ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink-soft hover:bg-surface-alt',
                )}
              >
                {rateLabel(option)}
              </button>
            )
          })}
        </div>
      </div>
      {failed && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-label font-semibold text-danger">
          Không tải được bài nghe, vui lòng thử lại
          <button
            type="button"
            onClick={reload}
            className="cursor-pointer rounded-md border border-danger px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger-bg"
          >
            Tải lại
          </button>
        </div>
      )}
    </div>
  )
}
