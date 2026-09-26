import { useEffect } from 'react'
import { recordStudyTime } from './api/progressApi'

export const STUDY_MINUTE_MS = 60_000

/**
 * Counts study time for the home page (docs/api/progress.md, POST /api/progress/study-time): while a study screen is
 * open, every minute in which the tab was visible and the learner did something (a click, a key, audio playing) adds
 * one minute. An idle or hidden tab adds nothing. A minute lost to a network error is simply not counted.
 *
 * Call it once in each study screen: flashcards, exercises, games (and tests later).
 */
export function useStudyTime() {
  useEffect(() => {
    let lastActivity = Date.now() // opening the screen counts as doing something
    const onActivity = () => {
      lastActivity = Date.now()
    }
    // timeupdate does not bubble, but a capturing listener on the document still hears it (listening exercises).
    const events = [
      ['pointerdown', false],
      ['keydown', false],
      ['timeupdate', true],
    ]
    for (const [type, capture] of events) document.addEventListener(type, onActivity, { capture, passive: true })

    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible' || Date.now() - lastActivity > STUDY_MINUTE_MS) return
      recordStudyTime(1).catch(() => {})
    }, STUDY_MINUTE_MS)

    return () => {
      clearInterval(timer)
      for (const [type, capture] of events) document.removeEventListener(type, onActivity, { capture })
    }
  }, [])
}
