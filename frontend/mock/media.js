import { encodeWav } from '../src/features/exercises/pronunciation/wav.js'
import { MOCK_LESSONS } from './exerciseFixtures.js'

// Audio files of the mock listening lessons. There are no recordings, so each passage is generated: a soft tone with a
// syllable-like pulse during every transcript segment (one pitch per speaker) and silence in between. That is enough
// to try the player: playing, seeking, speeds, and the highlighted subtitle following the audio.
//
// <audio> cannot send the Authorization header, so these files are public (the real backend must allow its media path
// too, see docs/api/exercises.md). Range requests are supported because browsers need them to seek.

const SAMPLE_RATE = 8000
const PITCHES = [330, 440, 392]
const cache = new Map()

export function listeningAudioUrl(lessonId) {
  return `/mock-media/listening-${lessonId}.wav`
}

/** Model audio of a pronunciation item, as the admin pages show it (a short tone: the mock has no voice). */
export function pronunciationAudioUrl(itemId) {
  return `/mock-media/pronunciation-${itemId}.wav`
}

function buildTone(itemId) {
  const durationMs = 900 + (itemId % 4) * 300
  return buildAudio({ durationMs, segments: [{ startMs: 0, endMs: durationMs, speaker: 'model' }] })
}

function buildAudio(passage) {
  const frames = Math.ceil((passage.durationMs / 1000) * SAMPLE_RATE)
  const samples = new Float32Array(frames)
  const speakers = [...new Set(passage.segments.map((segment) => segment.speaker))]
  for (const segment of passage.segments) {
    const pitch = PITCHES[speakers.indexOf(segment.speaker) % PITCHES.length]
    const start = Math.floor((segment.startMs / 1000) * SAMPLE_RATE)
    const end = Math.min(frames, Math.floor((segment.endMs / 1000) * SAMPLE_RATE))
    for (let frame = start; frame < end; frame += 1) {
      const t = (frame - start) / SAMPLE_RATE
      const syllable = 0.5 - 0.5 * Math.cos(2 * Math.PI * 4 * t)
      const fade = Math.min(1, (frame - start) / 400, (end - frame) / 400)
      samples[frame] = 0.18 * syllable * fade * Math.sin(2 * Math.PI * pitch * t)
    }
  }
  return Buffer.from(encodeWav(samples, SAMPLE_RATE))
}

function audioFor(lessonId) {
  const lesson = MOCK_LESSONS.find((candidate) => candidate.id === lessonId && candidate.passage)
  if (!lesson) return null
  if (!cache.has(lessonId)) cache.set(lessonId, buildAudio(lesson.passage))
  return cache.get(lessonId)
}

/** Answers GET /mock-media/…; returns false when the path is not a media file (the request goes on). */
export function serveMedia(req, res) {
  const match = /^\/mock-media\/(listening|pronunciation)-(\d+)\.wav$/.exec(new URL(req.url, 'http://localhost').pathname)
  if (!match || req.method !== 'GET') return false
  const data = match[1] === 'listening' ? audioFor(Number(match[2])) : buildTone(Number(match[2]))
  if (!data) {
    res.statusCode = 404
    res.end()
    return true
  }

  res.setHeader('Content-Type', 'audio/wav')
  res.setHeader('Accept-Ranges', 'bytes')
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '')
  if (range && (range[1] !== '' || range[2] !== '')) {
    const start = range[1] === '' ? Math.max(0, data.length - Number(range[2])) : Number(range[1])
    const end = range[1] === '' || range[2] === '' ? data.length - 1 : Math.min(Number(range[2]), data.length - 1)
    if (start > end) {
      res.statusCode = 416
      res.setHeader('Content-Range', `bytes */${data.length}`)
      res.end()
      return true
    }
    res.statusCode = 206
    res.setHeader('Content-Range', `bytes ${start}-${end}/${data.length}`)
    res.setHeader('Content-Length', end - start + 1)
    res.end(data.subarray(start, end + 1))
    return true
  }
  res.statusCode = 200
  res.setHeader('Content-Length', data.length)
  res.end(data)
  return true
}
