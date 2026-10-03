// The URLs of the app's pages, in one place. Links use these instead of typing paths, so a page can be found from any
// link to it, and a URL changes in one place. app/router.jsx declares the same paths: change both together.
// A fixed URL is a string; a URL with a parameter is a function.
//
// So far this covers the account pages and module A (vocabulary and games); the other modules still type their paths.

export const paths = {
  home: '/',

  // Account
  login: '/login',
  register: '/register',
  changePassword: '/account/change-password',

  // Module A: vocabulary. The vocabulary page has three tabs: topics (no ?tab=), lists and history.
  vocabulary: '/vocabulary',
  /** The topics tab with a search, which the topic page's back link returns to. */
  vocabularySearch: (term) => (term ? `/vocabulary?q=${encodeURIComponent(term)}` : '/vocabulary'),
  vocabularyLists: '/vocabulary?tab=lists',
  /** The history tab, optionally showing the words behind one statistic (learning, mastered, today). */
  vocabularyHistory: (show) => (show ? `/vocabulary?tab=history&show=${show}` : '/vocabulary?tab=history'),
  topic: (topicId) => `/vocabulary/topics/${topicId}`,
  topicStudy: (topicId) => `/vocabulary/topics/${topicId}/study`,
  list: (listId) => `/vocabulary/lists/${listId}`,
  listStudy: (listId) => `/vocabulary/lists/${listId}/study`,
  review: '/vocabulary/review',

  // Module A: games
  games: '/vocabulary/games',
  game: (gameId) => `/vocabulary/games/${gameId}`,
}
