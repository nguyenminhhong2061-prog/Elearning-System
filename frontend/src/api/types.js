// Shapes of the backend's JSON, written as JSDoc typedefs so editors can autocomplete and warn about wrong
// fields. There is no runtime code here. Use them like this:
//   /** @param {import('@/api/types').User} user */
//
// Keep in sync with the records in datn/src/main/java/com/example/datn/modules/**/dto.

/**
 * @typedef {'LEARNER' | 'ADMIN'} UserRole
 * @typedef {'ACTIVE' | 'LOCKED'} UserStatus
 * @typedef {'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'} CefrLevel
 */

/**
 * UserResponse.
 * @typedef {object} User
 * @property {number} id
 * @property {string} fullName
 * @property {string} email
 * @property {UserRole} role
 * @property {UserStatus} status
 * @property {CefrLevel | null} currentLevel null until the learner's level has been determined
 * @property {string} createdAt ISO-8601 instant
 */

/**
 * AuthTokenResponse, returned by POST /api/auth/login.
 * @typedef {object} AuthToken
 * @property {string} accessToken JWT to send as "Authorization: Bearer <token>"
 * @property {string} tokenType always "Bearer"
 * @property {number} expiresIn lifetime of the token in seconds
 * @property {User} user
 */

/**
 * ApiErrorResponse, the body of every error the backend returns. `message` is English and, for validation
 * errors, has the form "field: reason", so it is not shown to users as is (see errorMessages.js).
 * @typedef {object} ApiErrorBody
 * @property {string} timestamp
 * @property {number} status
 * @property {string} message
 */

export {}
