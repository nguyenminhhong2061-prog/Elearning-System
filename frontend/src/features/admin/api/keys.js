// Cache keys of the admin area, nested under ['admin'] so one invalidation can refresh a whole section.
export const adminKeys = {
  all: ['admin'],
  stats: (period) => ['admin', 'stats', period],
  topics: ['admin', 'topics'],
  words: ['admin', 'words'],
  wordPage: (filters) => ['admin', 'words', filters],
  lessons: ['admin', 'lessons'],
  lesson: (id) => ['admin', 'lessons', id],
  tests: ['admin', 'tests'],
  test: (id) => ['admin', 'tests', id],
  users: ['admin', 'users'],
  userPage: (filters) => ['admin', 'users', 'page', filters],
  usersSummary: ['admin', 'users', 'summary'],
  user: (id) => ['admin', 'users', 'detail', id],
}

// Admin numbers change with what other admins and every learner do: ask again each time a page opens.
export const FRESH_ON_OPEN = { staleTime: 0 }
