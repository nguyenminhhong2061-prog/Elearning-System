import { Component, Suspense } from 'react'
import { useLocation } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { PageLoadError } from '@/lib/lazyPage'
import { Page } from './Page'

/** Shown while a page's code downloads. It fades in late, so a fast download does not flash a spinner. */
function PageLoading() {
  return (
    <div className="grid min-h-60 animate-fade-in-late place-items-center">
      <Spinner className="size-8" />
    </div>
  )
}

function PageError({ error }) {
  const message =
    error instanceof PageLoadError
      ? 'Không tải được trang này. Có thể ứng dụng vừa được cập nhật hoặc kết nối mạng bị gián đoạn.'
      : 'Đã xảy ra lỗi khi hiển thị trang này.'

  return (
    <Page title="Không hiển thị được trang" width="focus">
      <Alert variant="error">{message}</Alert>
      {/* A page whose download failed stays failed until the app is loaded again, so retrying means reloading. */}
      <Button variant="outline" className="self-start" onClick={() => window.location.reload()}>
        Tải lại trang
      </Button>
    </Page>
  )
}

/** Error boundaries are still class-only in React. Clears the error when `resetKey` changes. */
class PageErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error) {
    return { error }
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey === state.resetKey ? null : { error: null, resetKey: props.resetKey }
  }

  render() {
    return this.state.error ? <PageError error={this.state.error} /> : this.props.children
  }
}

/**
 * Wraps the routed page of a layout (`<RouteBoundary><Outlet /></RouteBoundary>`): shows a spinner while a lazy
 * page's code downloads, and an error with a reload button when the page cannot be shown, so the rest of the layout
 * (sidebar, menu) keeps working. Going to another address clears the error.
 *
 * Navigations run in a transition (react-router 7 default), so when a page is already on screen React keeps it there
 * until the next page is ready; the spinner only appears when the boundary has nothing to show yet.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.fallback] loading placeholder (default: a centred spinner)
 */
export function RouteBoundary({ fallback = <PageLoading />, children }) {
  const { pathname } = useLocation()

  return (
    <PageErrorBoundary resetKey={pathname}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </PageErrorBoundary>
  )
}
