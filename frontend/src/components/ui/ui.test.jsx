import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Alert } from './Alert'
import { Button } from './Button'
import { PasswordField } from './PasswordField'
import { TextField } from './TextField'

describe('Button', () => {
  it('calls onClick when enabled', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Lưu</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled and marked busy while loading, so a form cannot be submitted twice', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Đăng nhập
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Đăng nhập' })
    await userEvent.click(button)

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(onClick).not.toHaveBeenCalled()
    // The spinner is decorative: it neither changes the button's name nor adds a second live region.
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('does not submit forms unless type="submit" is given', () => {
    render(<Button>Không gửi</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
})

describe('TextField', () => {
  it('links the label to the input', () => {
    render(<TextField label="Email" />)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('marks the input invalid and describes it with the error message', () => {
    render(<TextField label="Email" error="Email không hợp lệ." />)

    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Email không hợp lệ.')
  })

  it('shows the hint only while there is no error', () => {
    const { rerender } = render(<TextField label="Mật khẩu" hint="Từ 8 ký tự" />)
    expect(screen.getByText('Từ 8 ký tự')).toBeInTheDocument()

    rerender(<TextField label="Mật khẩu" hint="Từ 8 ký tự" error="Quá ngắn" />)
    expect(screen.queryByText('Từ 8 ký tự')).not.toBeInTheDocument()
    expect(screen.getByText('Quá ngắn')).toBeInTheDocument()
  })
})

describe('PasswordField', () => {
  it('hides the password by default and reveals it on toggle', async () => {
    render(<PasswordField label="Mật khẩu" />)
    const input = screen.getByLabelText('Mật khẩu')
    expect(input).toHaveAttribute('type', 'password')

    await userEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }))
    expect(input).toHaveAttribute('type', 'text')

    await userEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }))
    expect(input).toHaveAttribute('type', 'password')
  })
})

describe('Alert', () => {
  it('announces errors with role="alert" and other variants with role="status"', () => {
    render(
      <>
        <Alert variant="error">Lỗi</Alert>
        <Alert variant="success">Xong</Alert>
      </>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Lỗi')
    expect(screen.getByRole('status')).toHaveTextContent('Xong')
  })
})
