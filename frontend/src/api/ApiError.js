/**
 * Every failed API call rejects with this error, whatever went wrong underneath, so callers only handle one type.
 *
 * `status` is the HTTP status, or 0 when there was no response at all (server down, no network, timeout).
 * `message` is the backend's English message and is meant for logs. Show users a translated message instead
 * (see errorMessages.js).
 */
export class ApiError extends Error {
  constructor(status, message, { body, cause } = {}) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
    /** @type {import('./types').ApiErrorBody | undefined} */
    this.body = body
  }
}

export function isApiError(error) {
  return error instanceof ApiError
}
