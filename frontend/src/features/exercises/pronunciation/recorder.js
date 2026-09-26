import { encodeWav } from './wav'

// Microphone recording for the pronunciation exercise. MediaRecorder records in whatever the browser prefers
// (WebM/Opus in Chrome, MP4/AAC in Safari); the same browser can decode it again, and an OfflineAudioContext then
// resamples it to 16 kHz mono for encodeWav. This avoids the deprecated ScriptProcessorNode and a worklet file.

export const TARGET_SAMPLE_RATE = 16_000

function audioContextClass() {
  return typeof window === 'undefined' ? undefined : (window.AudioContext ?? window.webkitAudioContext)
}

/**
 * True when this browser can record and convert audio. getUserMedia also needs a secure page (HTTPS or localhost),
 * which is why navigator.mediaDevices can be missing.
 */
export function isRecordingSupported() {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof window.MediaRecorder === 'function' &&
    typeof audioContextClass() === 'function' &&
    typeof window.OfflineAudioContext === 'function'
  )
}

/**
 * Asks for the microphone and starts recording.
 * @returns {Promise<{ stop: () => Promise<Blob>, cancel: () => void }>} stop() resolves with the raw recording
 */
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  })
  const release = () => stream.getTracks().forEach((track) => track.stop())

  let recorder
  try {
    recorder = new window.MediaRecorder(stream)
  } catch (error) {
    release()
    throw error
  }
  const chunks = []
  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  })
  const stopped = new Promise((resolve) => recorder.addEventListener('stop', resolve, { once: true }))
  recorder.start()

  return {
    async stop() {
      if (recorder.state !== 'inactive') recorder.stop()
      await stopped
      release()
      return new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
    },
    cancel() {
      if (recorder.state !== 'inactive') recorder.stop()
      release()
    },
  }
}

/**
 * Converts a browser recording to a 16 kHz mono WAV file.
 * @param {Blob} recording
 * @returns {Promise<{ wav: Blob, durationMs: number }>}
 */
export async function toWav(recording) {
  const AudioContextClass = audioContextClass()
  const context = new AudioContextClass()
  try {
    const decoded = await context.decodeAudioData(await recording.arrayBuffer())
    const frames = Math.max(1, Math.ceil(decoded.duration * TARGET_SAMPLE_RATE))
    // A one-channel offline context mixes stereo down and resamples in one pass.
    const offline = new window.OfflineAudioContext(1, frames, TARGET_SAMPLE_RATE)
    const source = offline.createBufferSource()
    source.buffer = decoded
    source.connect(offline.destination)
    source.start()
    const rendered = await offline.startRendering()
    const wav = new Blob([encodeWav(rendered.getChannelData(0), TARGET_SAMPLE_RATE)], { type: 'audio/wav' })
    return { wav, durationMs: decoded.duration * 1000 }
  } finally {
    context.close().catch(() => {})
  }
}

/** Vietnamese explanation of a failure to record or convert (a DOMException from the browser). */
export function recordingErrorMessage(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Trình duyệt chưa cho phép dùng micro. Hãy cho phép quyền micro (biểu tượng ổ khóa cạnh thanh địa chỉ) rồi thử lại.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'Không tìm thấy micro. Hãy kết nối micro rồi thử lại.'
    case 'NotReadableError':
      return 'Micro đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.'
    case 'EncodingError':
      return 'Không xử lý được bản ghi âm. Hãy thử ghi lại.'
    default:
      return 'Không ghi âm được. Hãy thử lại.'
  }
}
