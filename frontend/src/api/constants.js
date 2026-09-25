// String values exactly as the backend serializes them in JSON. The database stores lowercase, but the API
// returns the enum names, so these are uppercase. Always use these constants instead of string literals:
// in plain JavaScript a typo such as 'Admin' would silently never match.

export const ROLES = Object.freeze({
  LEARNER: 'LEARNER',
  ADMIN: 'ADMIN',
})

export const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  LOCKED: 'LOCKED',
})

export const CEFR_LEVELS = Object.freeze(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
