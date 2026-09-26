import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { lazyPage } from '@/lib/lazyPage'
import { RouteBoundary } from './RouteBoundary'

afterEach(() => vi.restoreAllMocks())

// React reports errors caught by a boundary on console.error; the tests expecting one keep the output clean.
function silenceCaughtErrors() {
  vi.spyOn(console, 'error').mockImplementation(() => {})
}

function Layout() {
  return (
    <>
      <nav>
        <Link to="/other">Trang khác</Link>
      </nav>
      <RouteBoundary>
        <Outlet />
      </RouteBoundary>
    </>
  )
}

function renderPage(page) {
  return render(
    <MemoryRouter initialEntries={['/page']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="page" element={page} />
          <Route path="other" element={<h1>Trang khác</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

const chunkError = () => Promise.reject(new TypeError('Failed to fetch dynamically imported module'))

describe('RouteBoundary', () => {
  it('shows a spinner while the page code downloads, then the page', async () => {
    let finishDownload
    const ReadyPage = lazyPage(() => new Promise((resolve) => (finishDownload = resolve)), 'ReadyPage')

    renderPage(<ReadyPage />)
    expect(screen.getByRole('status', { name: 'Đang tải' })).toBeInTheDocument()

    finishDownload({ ReadyPage: () => <h1>Sẵn sàng</h1> })

    expect(await screen.findByRole('heading', { name: 'Sẵn sàng' })).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Đang tải' })).not.toBeInTheDocument()
  })

  it('explains a failed download and offers a reload, while the rest of the layout keeps working', async () => {
    silenceCaughtErrors()
    const BrokenPage = lazyPage(chunkError, 'BrokenPage', { onLoadFailure: () => false })

    renderPage(<BrokenPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được trang này')
    expect(screen.getByRole('button', { name: 'Tải lại trang' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Trang khác' })).toBeInTheDocument()
  })

  it('keeps waiting instead of showing an error while the browser reloads', async () => {
    const onLoadFailure = vi.fn(() => true)
    const BrokenPage = lazyPage(chunkError, 'BrokenPage', { onLoadFailure })

    renderPage(<BrokenPage />)

    await waitFor(() => expect(onLoadFailure).toHaveBeenCalledOnce())
    expect(screen.getByRole('status', { name: 'Đang tải' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('treats a wrong export name as a bug, not as a failed download', async () => {
    silenceCaughtErrors()
    const onLoadFailure = vi.fn(() => true)
    const MisnamedPage = lazyPage(() => Promise.resolve({ OtherPage: () => null }), 'MisnamedPage', {
      onLoadFailure,
    })

    renderPage(<MisnamedPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Đã xảy ra lỗi khi hiển thị trang này.')
    expect(onLoadFailure).not.toHaveBeenCalled()
  })

  it('shows a general message when a page crashes, and clears it when the user goes elsewhere', async () => {
    silenceCaughtErrors()
    const user = userEvent.setup()
    function CrashingPage() {
      throw new Error('Cannot read properties of undefined')
    }

    renderPage(<CrashingPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Đã xảy ra lỗi khi hiển thị trang này.')

    await user.click(screen.getByRole('link', { name: 'Trang khác' }))

    expect(await screen.findByRole('heading', { name: 'Trang khác' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
