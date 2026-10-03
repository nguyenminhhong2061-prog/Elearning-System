import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { PasswordField } from '@/components/ui/PasswordField'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '../context/useAuth'
import { loginSchema } from '../schemas'

const LOCKED_MESSAGE = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'

function loginErrorMessage(error) {
  // The backend uses one 401 message for an unknown email and a wrong password, so do the same here.
  if (error?.status === 401) return 'Email hoặc mật khẩu không đúng.'
  if (error?.status === 403) return LOCKED_MESSAGE
  return describeApiError(error, 'Không thể đăng nhập. Vui lòng thử lại.')
}

export function LoginPage() {
  const { login, endReason } = useAuth()
  const location = useLocation()
  const [submitError, setSubmitError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    // Coming from registration, the new account's email is already filled in.
    defaultValues: { email: location.state?.email ?? '', password: '' },
  })

  async function onSubmit(values) {
    setSubmitError(null)
    try {
      // On success the session starts and GuestRoute redirects, so there is nothing more to do here.
      await login(values)
    } catch (error) {
      setSubmitError(loginErrorMessage(error))
    }
  }

  return (
    <>
      <title>Đăng nhập · LinguaStep</title>
      <h1 className="text-title font-bold text-ink">Đăng nhập</h1>

      {endReason === 'expired' && <Alert variant="info">Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.</Alert>}
      {/* Signed out because an admin locked the account while it was in use (scenario 25). */}
      {endReason === 'locked' && !submitError && <Alert variant="error">{LOCKED_MESSAGE}</Alert>}
      {location.state?.registered && (
        <Alert variant="success">Tạo tài khoản thành công. Hãy đăng nhập để bắt đầu học.</Alert>
      )}
      {submitError && <Alert variant="error">{submitError}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="ban@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Mật khẩu"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập →'}
        </Button>
      </form>

      <p className="text-center text-label text-muted">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-semibold">
          Đăng ký
        </Link>
      </p>
    </>
  )
}
