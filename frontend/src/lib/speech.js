// Pronunciation of an English word. A recorded audio file (vocabulary.audio_url) is used when there is one;
// otherwise the browser's speech synthesis reads the word ("phát âm tự động" in A1). Both can be unavailable or
// blocked (autoplay rules, no voices), and that must never break the lesson, so every failure is ignored.

let currentAudio = null

function stop() {
  currentAudio?.pause()
  currentAudio = null
  try {
    window.speechSynthesis?.cancel()
  } catch {
    // Not supported.
  }
}

/** True when this browser can read text aloud. */
export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function'
}

/**
 * @param {string} text
 * @param {{ audioUrl?: string | null }} [options]
 */
export function pronounce(text, { audioUrl } = {}) {
  stop()
  try {
    if (audioUrl) {
      currentAudio = new Audio(audioUrl)
      currentAudio.play().catch(() => {})
      return
    }
    if (!canSpeak()) return
    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.lang = 'en-GB' // the phonetics shown are British
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  } catch {
    // Pronunciation is a nice-to-have.
  }
}

export { stop as stopPronouncing }
