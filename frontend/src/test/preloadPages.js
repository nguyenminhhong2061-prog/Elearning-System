// For tests that render the whole app (<App />). The app loads each page on demand (lazyPage in app/router.jsx), so
// without this the first test of a file would import the page it opens inside its findBy wait, which under parallel
// load can exceed the timeout. Import this from the test file, not from setup.js: the test file's vi.mock calls are
// hoisted above its imports, so they still apply to the pages, whereas setup.js runs before them.
import.meta.glob(['/src/pages/*.jsx', '/src/features/*/pages/*.jsx'], { eager: true })
