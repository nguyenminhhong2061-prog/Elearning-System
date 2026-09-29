import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/app/App'
import { tokenStorage } from '@/api/tokenStorage'
import { installFakeBackend, learner, loginResponse } from '@/test/fakeBackend'
import '@/test/preloadPages'

let backend

afterEach(() => backend?.restore())

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

/** Puts a valid session in storage, as if the user had logged in earlier and then reloaded the page. */
function signInBeforeStart(accessToken = 'stored-token') {
  tokenStorage.save({ accessToken, expiresIn: 3600 })
}

const heading = (name) => screen.findByRole('heading', { name })

async function logIn(user, email = 'hong@example.com', password = 'matkhau123') {
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Mật khẩu'), password)
  await user.click(screen.getByRole('button', { name: /Đăng nhập →/ }))
}

describe('route protection', () => {
  it('sends a visitor to the login page and, after login, back to the page they wanted', async () => {
    backend = installFakeBackend({ 'POST /api/auth/login': () => ({ data: loginResponse() }) })
    const user = userEvent.setup()

    renderApp('/account/change-password')
    await heading('Đăng nhập')
    await logIn(user)

    await heading('Đổi mật khẩu')
    expect(backend.calls[0]).toMatchObject({
      key: 'POST /api/auth/login',
      body: { email: 'hong@example.com', password: 'matkhau123' },
    })
    expect(tokenStorage.get()?.accessToken).toBe('token-abc')
  })

  it('redirects a signed-in user away from the login page', async () => {
    signInBeforeStart()
    backend = installFakeBackend({ 'GET /api/users/me': () => ({ data: learner }) })

    renderApp('/login')

    await heading(/Chào Hồng/)
  })

  it('shows the not-found page for unknown addresses', async () => {
    backend = installFakeBackend({})

    renderApp('/khong-co-trang-nay')

    await heading('Không tìm thấy trang')
  })
})

describe('login', () => {
  it('shows one message for wrong credentials and neither logs out nor claims the session expired', async () => {
    backend = installFakeBackend({
      'POST /api/auth/login': () => ({ status: 401, data: { status: 401, message: 'Invalid credentials' } }),
    })
    const user = userEvent.setup()

    renderApp('/login')
    await heading('Đăng nhập')
    await logIn(user, 'hong@example.com', 'sai-mat-khau')

    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng.')
    expect(screen.queryByText(/hết hạn/)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(tokenStorage.get()).toBeNull()
  })

  it('tells a locked account apart from wrong credentials', async () => {
    backend = installFakeBackend({
      'POST /api/auth/login': () => ({ status: 403, data: { status: 403, message: 'Account is locked' } }),
    })
    const user = userEvent.setup()

    renderApp('/login')
    await heading('Đăng nhập')
    await logIn(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Tài khoản của bạn đã bị khóa')
  })

  it('reports an unreachable server', async () => {
    backend = installFakeBackend({ 'POST /api/auth/login': () => ({ networkError: true }) })
    const user = userEvent.setup()

    renderApp('/login')
    await heading('Đăng nhập')
    await logIn(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Không kết nối được máy chủ')
  })

  it('validates in the browser and sends nothing when the form is empty', async () => {
    backend = installFakeBackend({})
    const user = userEvent.setup()

    renderApp('/login')
    await heading('Đăng nhập')
    await user.click(screen.getByRole('button', { name: /Đăng nhập →/ }))

    expect(await screen.findByText('Vui lòng nhập email.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument()
    expect(backend.calls).toHaveLength(0)
  })

  it('lets the user reveal the password they typed', async () => {
    backend = installFakeBackend({})
    const user = userEvent.setup()

    renderApp('/login')
    await heading('Đăng nhập')
    await user.type(screen.getByLabelText('Mật khẩu'), 'matkhau123')
    expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }))

    expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('type', 'text')
  })
})

describe('registration', () => {
  async function fillRegistration(user, overrides = {}) {
    const values = {
      name: 'Nguyễn Minh Hồng',
      email: 'hong@example.com',
      password: 'matkhau123',
      confirm: 'matkhau123',
      ...overrides,
    }
    await user.type(screen.getByLabelText('Họ và tên'), values.name)
    await user.type(screen.getByLabelText('Email'), values.email)
    await user.type(screen.getByLabelText('Mật khẩu'), values.password)
    await user.type(screen.getByLabelText('Nhập lại mật khẩu'), values.confirm)
    await user.click(screen.getByRole('button', { name: /Đăng ký →/ }))
  }

  it('creates the account, signs the new learner in and lands on the home page', async () => {
    backend = installFakeBackend({
      'POST /api/auth/register': () => ({ status: 201, data: learner }),
      'POST /api/auth/login': () => ({ data: loginResponse() }),
    })
    const user = userEvent.setup()

    renderApp('/register')
    await heading('Tạo tài khoản')
    await fillRegistration(user)

    await heading(/Chào Hồng/)
    // The confirmation field is a browser-only check and must not be sent to the server.
    expect(backend.calls[0]).toEqual({
      key: 'POST /api/auth/register',
      body: { fullName: 'Nguyễn Minh Hồng', email: 'hong@example.com', password: 'matkhau123' },
      authorization: undefined,
    })
    expect(backend.calls[1].key).toBe('POST /api/auth/login')
  })

  it('reports an email that is already registered on the email field', async () => {
    backend = installFakeBackend({
      'POST /api/auth/register': () => ({ status: 409, data: { status: 409, message: 'Email already registered' } }),
    })
    const user = userEvent.setup()

    renderApp('/register')
    await heading('Tạo tài khoản')
    await fillRegistration(user)

    expect(await screen.findByText(/Email này đã được đăng ký/)).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('heading', { name: 'Tạo tài khoản' })).toBeInTheDocument()
  })

  it('does not send anything when the two passwords differ', async () => {
    backend = installFakeBackend({})
    const user = userEvent.setup()

    renderApp('/register')
    await heading('Tạo tài khoản')
    await fillRegistration(user, { confirm: 'khong-giong-nhau' })

    expect(await screen.findByText('Mật khẩu nhập lại không khớp.')).toBeInTheDocument()
    expect(backend.calls).toHaveLength(0)
  })

  it('sends the user to the login page when the account was created but the automatic login failed', async () => {
    backend = installFakeBackend({
      'POST /api/auth/register': () => ({ status: 201, data: learner }),
      'POST /api/auth/login': () => ({ status: 500, data: { status: 500, message: 'boom' } }),
    })
    const user = userEvent.setup()

    renderApp('/register')
    await heading('Tạo tài khoản')
    await fillRegistration(user)

    await heading('Đăng nhập')
    expect(screen.getByRole('status')).toHaveTextContent('Tạo tài khoản thành công')
  })
})

describe('session on start-up', () => {
  it('confirms a stored token with the server before showing the app', async () => {
    signInBeforeStart('stored-token')
    backend = installFakeBackend({ 'GET /api/users/me': () => ({ data: learner }) })

    renderApp('/')

    await heading(/Chào Hồng/)
    // The first request confirms the stored token; the home page may then load its own data.
    expect(backend.calls[0]).toEqual({ key: 'GET /api/users/me', body: undefined, authorization: 'Bearer stored-token' })
  })

  it('falls back to the login page, with an explanation, when the server rejects the stored token', async () => {
    signInBeforeStart()
    backend = installFakeBackend({
      'GET /api/users/me': () => ({ status: 401, data: { status: 401, message: 'Authentication required' } }),
    })

    renderApp('/plan')

    await heading('Đăng nhập')
    expect(screen.getByRole('status')).toHaveTextContent('Phiên đăng nhập đã hết hạn')
    expect(tokenStorage.get()).toBeNull()
  })

  it('does not even ask the server about a token that has already expired', async () => {
    localStorage.setItem(tokenStorage.key, JSON.stringify({ accessToken: 'old', expiresAt: Date.now() - 1000 }))
    backend = installFakeBackend({})

    renderApp('/')

    await heading('Đăng nhập')
    expect(backend.calls).toHaveLength(0)
  })

  it('offers a retry instead of logging the user out when the server cannot be reached', async () => {
    signInBeforeStart()
    let attempts = 0
    backend = installFakeBackend({
      'GET /api/users/me': () => (++attempts === 1 ? { networkError: true } : { data: learner }),
    })
    const user = userEvent.setup()

    renderApp('/')

    await heading('Không kết nối được máy chủ')
    expect(tokenStorage.get()).not.toBeNull()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    await heading(/Chào Hồng/)
  })

  it('signs this tab out when the user logs out in another tab', async () => {
    signInBeforeStart()
    backend = installFakeBackend({ 'GET /api/users/me': () => ({ data: learner }) })

    renderApp('/')
    await heading(/Chào Hồng/)

    act(() => {
      tokenStorage.clear()
      window.dispatchEvent(new StorageEvent('storage', { key: tokenStorage.key, newValue: null }))
    })

    await heading('Đăng nhập')
  })
})

describe('logout', () => {
  it('returns to the login page and, on the next login, starts from the home page', async () => {
    signInBeforeStart()
    backend = installFakeBackend({
      'GET /api/users/me': () => ({ data: learner }),
      'POST /api/auth/login': () => ({ data: loginResponse() }),
    })
    const user = userEvent.setup()

    renderApp('/account/change-password')
    await heading('Đổi mật khẩu')

    await user.click(screen.getByRole('button', { name: /Đăng xuất/ }))

    await heading('Đăng nhập')
    expect(tokenStorage.get()).toBeNull()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    await logIn(user)

    // Not back on "Đổi mật khẩu": the user chose to leave, so there is no page to return to.
    await heading(/Chào Hồng/)
  })
})

describe('change password', () => {
  async function fillChange(user, { current = 'matkhaucu1', next = 'matkhaumoi1', confirm = next } = {}) {
    await user.type(screen.getByLabelText('Mật khẩu hiện tại'), current)
    await user.type(screen.getByLabelText('Mật khẩu mới'), next)
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), confirm)
    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }))
  }

  async function openChangePassword(extraRoutes = {}) {
    signInBeforeStart()
    backend = installFakeBackend({ 'GET /api/users/me': () => ({ data: learner }), ...extraRoutes })
    renderApp('/account/change-password')
    await heading('Đổi mật khẩu')
  }

  it('confirms success and clears the form', async () => {
    await openChangePassword({ 'POST /api/auth/change-password': () => ({ status: 204 }) })
    const user = userEvent.setup()

    await fillChange(user)

    expect(await screen.findByRole('status')).toHaveTextContent('Đã đổi mật khẩu thành công.')
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toHaveValue('')
    expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue('')
    expect(backend.calls.at(-1)).toMatchObject({
      key: 'POST /api/auth/change-password',
      body: { currentPassword: 'matkhaucu1', newPassword: 'matkhaumoi1' },
      authorization: 'Bearer stored-token',
    })
  })

  it('reports a wrong current password on that field', async () => {
    await openChangePassword({
      'POST /api/auth/change-password': () => ({
        status: 400,
        data: { status: 400, message: 'Current password is incorrect' },
      }),
    })
    const user = userEvent.setup()

    await fillChange(user)

    expect(await screen.findByText('Mật khẩu hiện tại không đúng.')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toHaveAttribute('aria-invalid', 'true')
  })

  it('refuses a new password equal to the current one without calling the server', async () => {
    await openChangePassword()
    const user = userEvent.setup()

    await fillChange(user, { current: 'matkhau123', next: 'matkhau123' })

    expect(await screen.findByText('Mật khẩu mới phải khác mật khẩu hiện tại.')).toBeInTheDocument()
    expect(backend.calls.filter((call) => call.key.includes('change-password'))).toHaveLength(0)
  })

  it('signs the user out with an explanation when the session turns out to have ended', async () => {
    await openChangePassword({
      'POST /api/auth/change-password': () => ({
        status: 401,
        data: { status: 401, message: 'Authentication required' },
      }),
    })
    const user = userEvent.setup()

    await fillChange(user)

    await heading('Đăng nhập')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Phiên đăng nhập đã hết hạn'))
    expect(tokenStorage.get()).toBeNull()
  })
})

describe('sidebar', () => {
  it('shows the signed-in user and a placeholder while the level is not determined', async () => {
    signInBeforeStart()
    backend = installFakeBackend({ 'GET /api/users/me': () => ({ data: learner }) })

    renderApp('/')

    await heading(/Chào Hồng/)
    expect(screen.getByText('hong@example.com')).toBeInTheDocument()
    expect(screen.getByText('Chưa xác định')).toBeInTheDocument()
  })

  it('shows the learner level when it is known', async () => {
    signInBeforeStart()
    backend = installFakeBackend({ 'GET /api/users/me': () => ({ data: { ...learner, currentLevel: 'B1' } }) })

    renderApp('/')

    await heading(/Chào Hồng/)
    // The home page shows the levels too (the level journey), so look in the sidebar only.
    const sidebar = screen.getByRole('complementary')
    expect(within(sidebar).getByText('B1')).toBeInTheDocument()
    expect(within(sidebar).queryByText('Chưa xác định')).not.toBeInTheDocument()
  })

  it('closes the phone menu with Escape (focus back on its button) and after following a link', async () => {
    signInBeforeStart()
    backend = installFakeBackend({ 'GET /api/users/me': () => ({ data: learner }) })
    const user = userEvent.setup()
    const phoneMenu = () => document.getElementById('mobile-menu')

    renderApp('/')
    await heading(/Chào Hồng/)

    await user.click(screen.getByRole('button', { name: 'Mở menu' }))
    expect(phoneMenu()).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(phoneMenu()).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mở menu' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Mở menu' }))
    await user.click(within(phoneMenu()).getByRole('link', { name: 'Đổi mật khẩu' }))
    await heading('Đổi mật khẩu')
    expect(phoneMenu()).not.toBeInTheDocument()
  })
})
