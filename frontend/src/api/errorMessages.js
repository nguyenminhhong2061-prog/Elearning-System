import { isApiError } from './ApiError'

/**
 * Vietnamese message for failures that mean the same thing everywhere. Anything specific to one screen
 * (wrong password, duplicate email...) is decided by that screen, and `fallback` is what it shows otherwise.
 * The backend's own English message is never shown to users.
 *
 * @param {unknown} error
 * @param {string} [fallback]
 */
export function describeApiError(error, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.') {
  if (!isApiError(error)) return fallback

  if (error.status === 0) return 'Không kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại.'
  if (error.status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (error.status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
  return fallback
}
