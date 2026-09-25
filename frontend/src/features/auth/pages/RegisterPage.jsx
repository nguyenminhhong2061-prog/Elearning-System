import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { describeApiError } from '@/api/errorMessages'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { PasswordField } from '@/components/ui/PasswordField'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '../context/useAuth'
import { registerSchema } from '../schemas'

function registerErrorMessage(error) {
  if (error?.status === 400) return 'Thông tin đăng ký chưa hợp lệ. Vui lòng kiểm tra lại.'
  return describeApiError(error, 'Không thể tạo tài khoản. Vui lòng thử lại.')
}

export function RegisterPage() {
  const { register: registerAccount } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit({ fullName, email, password }) {
    setSubmitError(null)
    try {
      const { signedIn } = await registerAccount({ fullName, email, password })
      // When signed in, GuestRoute redirects to the home page. If only the automatic login failed, the account
      // exists, so the user is sent to log in by hand.
      if (!signedIn) navigate('/login', { replace: true, state: { registered: true } })
    } catch (error) {
      if (error?.status === 409) {
        setError(
          'email',
          { type: 'server', message: 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.' },
          { shouldFocus: true },
        )
      } else {
        setSubmitError(registerErrorMessage(error))
      }
    }
  }

  return (
    <>
      <title>Đăng ký · LinguaStep</title>
      <h1 className="text-title font-bold text-ink">Tạo tài khoản</h1>

      {submitError && <Alert variant="error">{submitError}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <TextField
          label="Họ và tên"
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
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
          autoComplete="new-password"
          hint="Từ 8 đến 72 ký tự."
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordField
          label="Nhập lại mật khẩu"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Đang tạo tài khoản…' : 'Đăng ký →'}
        </Button>
      </form>

      <p className="text-center text-label text-muted">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold">
          Đăng nhập
        </Link>
      </p>
    </>
  )
}
