import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { ROLES } from '@/api/constants'
import { tokenStorage } from '@/api/tokenStorage'
import { admin, installFakeBackend, learner } from '@/test/fakeBackend'
import { AuthProvider } from '../context/AuthProvider'
import { ProtectedRoute } from './ProtectedRoute'

let backend

afterEach(() => backend?.restore())

function renderAdminOnlyPage(currentUser) {
  tokenStorage.save({ accessToken: 'stored-token', expiresIn: 3600 })
  backend = installFakeBackend({ 'GET /api/users/me': () => ({ data: currentUser }) })

  render(
    <MemoryRouter initialEntries={['/admin']}>
      <AuthProvider>
        <Routes>
          <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
            <Route path="/admin" element={<p>Bảng điều khiển quản trị</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute with roles', () => {
  it('lets a user with an allowed role in', async () => {
    renderAdminOnlyPage(admin)

    expect(await screen.findByText('Bảng điều khiển quản trị')).toBeInTheDocument()
  })

  it('shows the forbidden page to a signed-in user whose role is not allowed', async () => {
    renderAdminOnlyPage(learner)

    expect(await screen.findByRole('heading', { name: 'Không có quyền truy cập' })).toBeInTheDocument()
    expect(screen.queryByText('Bảng điều khiển quản trị')).not.toBeInTheDocument()
  })

  it('sends a user whose role is not allowed to redirectTo when it is given', async () => {
    tokenStorage.save({ accessToken: 'stored-token', expiresIn: 3600 })
    backend = installFakeBackend({ 'GET /api/users/me': () => ({ data: admin }) })

    render(
      <MemoryRouter initialEntries={['/vocabulary']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute roles={[ROLES.LEARNER]} redirectTo="/admin" />}>
              <Route path="/vocabulary" element={<p>Từ vựng của người học</p>} />
            </Route>
            <Route path="/admin" element={<p>Bảng điều khiển quản trị</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Bảng điều khiển quản trị')).toBeInTheDocument()
    expect(screen.queryByText('Từ vựng của người học')).not.toBeInTheDocument()
  })
})
