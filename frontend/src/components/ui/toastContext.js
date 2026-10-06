import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

/** Shows a confirmation from any page inside <ToastProvider> (Toast.jsx). @returns {(message: string, detail?: string) => void} */
export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used inside <ToastProvider>')
  return show
}
