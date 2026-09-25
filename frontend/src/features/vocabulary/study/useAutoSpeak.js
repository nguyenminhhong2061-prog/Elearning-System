import { useCallback, useState } from 'react'

const STORAGE_KEY = 'linguastep.autoSpeak'

function readSetting() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

/** "Tự động phát âm" preference (on by default), remembered in this browser only. */
export function useAutoSpeak() {
  const [enabled, setEnabled] = useState(readSetting)

  const update = useCallback((next) => {
    setEnabled(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
    } catch {
      // Storage blocked: the choice lasts until the page is reloaded.
    }
  }, [])

  return [enabled, update]
}
