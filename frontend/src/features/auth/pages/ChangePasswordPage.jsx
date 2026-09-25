import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { describeApiError } from '@/api/errorMessages'
import { Page } from '@/components/layout/Page'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PasswordField } from '@/components/ui/PasswordField'
import { changePassword } from '../authApi'
import { changePasswordSchema } from '../schemas'

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' }

export function ChangePasswordPage() {
  const [submitError, setSubmitError] = useState(null)
  const [succeeded, setSucceeded] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_FORM,
  })

  async function onSubmit({ currentPassword, newPassword }) {
    setSubmitError(null)
    setSucceeded(false)
    try {
      await changePassword({ currentPassword, newPassword })
      reset(EMPTY_FORM)
      setSucceeded(true)
    } catch (error) {
      // The form already rules out "same password" and bad lengths, so a 400 here means the current password is
      // wrong. (A 401 means the session ended; the app has already signed the user out and moved them on.)
      if (error?.status === 400) {
        setError(
          'currentPassword',
          { type: 'server', message: 'Mật khẩu hiện tại không đúng.' },
          { shouldFocus: true },
        )
      } else {
        setSubmitError(describeApiError(error, 'Không thể đổi mật khẩu. Vui lòng thử lại.'))
      }
    }
  }

  return (
    <Page title="Đổi mật khẩu" width="focus">
      <Card className="flex flex-col gap-5 p-6 sm:p-8">
        {succeeded && <Alert variant="success">Đã đổi mật khẩu thành công.</Alert>}
        {submitError && <Alert variant="error">{submitError}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <PasswordField
            label="Mật khẩu hiện tại"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <PasswordField
            label="Mật khẩu mới"
            autoComplete="new-password"
            hint="Từ 8 đến 72 ký tự."
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <PasswordField
            label="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto sm:self-start sm:px-8">
            {isSubmitting ? 'Đang lưu…' : 'Đổi mật khẩu'}
          </Button>
        </form>
      </Card>
    </Page>
  )
}
