/**
 * Entries of the sidebar, in the order and with the labels of the design. Each module owns one section:
 * add or change an entry here when a module gets its pages, and register its routes in app/router.jsx.
 * `end: true` makes the entry active only on exactly that path (needed for "/", which prefixes every path).
 */
export const NAV_ITEMS = [
  { label: 'Tiến độ', to: '/', end: true },
  { label: 'Từ vựng', to: '/vocabulary' },
  { label: 'Bài tập', to: '/exercises' },
  { label: 'Kiểm tra', to: '/tests' },
  { label: 'Kế hoạch', to: '/plan' },
]
