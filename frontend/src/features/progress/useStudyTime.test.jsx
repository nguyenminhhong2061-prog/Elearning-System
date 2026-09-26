import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installFakeBackend } from '@/test/fakeBackend'
import { STUDY_MINUTE_MS, useStudyTime } from './useStudyTime'

let backend
let visibility

function StudyScreen() {
  useStudyTime()
  return null
}

beforeEach(() => {
  vi.useFakeTimers()
  visibility = 'visible'
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
  backend = installFakeBackend({ 'POST /api/progress/study-time': () => ({ status: 204 }) })
})

afterEach(() => {
  backend.restore()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const sent = () => backend.calls.map((call) => call.body)

async function minutePasses() {
  await act(() => vi.advanceTimersByTimeAsync(STUDY_MINUTE_MS))
}

describe('useStudyTime', () => {
  it('adds a minute for each minute with something done on a visible study screen', async () => {
    render(<StudyScreen />)

    await minutePasses()
    fireEvent.keyDown(document, { key: ' ' })
    await minutePasses()

    expect(sent()).toEqual([{ minutes: 1 }, { minutes: 1 }])
  })

  it('counts nothing once the learner stopped doing anything, or while the tab is hidden', async () => {
    render(<StudyScreen />)
    await minutePasses()
    await minutePasses() // nothing done during this minute
    expect(sent()).toHaveLength(1)

    fireEvent.pointerDown(document)
    visibility = 'hidden'
    await minutePasses()
    expect(sent()).toHaveLength(1)
  })

  it('treats playing audio as studying, and stops counting when the screen closes', async () => {
    const view = render(<StudyScreen />)
    await minutePasses()
    const audio = document.createElement('audio')
    document.body.append(audio)
    audio.dispatchEvent(new Event('timeupdate')) // does not bubble; heard by the capturing listener
    await minutePasses()
    expect(sent()).toHaveLength(2)

    view.unmount()
    await minutePasses()
    expect(sent()).toHaveLength(2)
    audio.remove()
  })
})
