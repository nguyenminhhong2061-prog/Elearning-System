import { z } from 'zod'

// Validation rules for the auth forms, in Vietnamese. They mirror the backend's rules (RegisterRequest,
// LoginRequest, ChangePasswordRequest) so users see a friendly message before any request is sent; the
// backend still validates everything itself.

const MAX_FULL_NAME = 150
const MAX_EMAIL = 255
const MIN_PASSWORD = 8
// The backend allows 72 characters because BCrypt only reads the first 72 *bytes*. Accented Vietnamese
// letters take 2-3 bytes in UTF-8, so the limit is checked in bytes here to stay safe.
const MAX_PASSWORD_BYTES = 72

const byteLength = (value) => new TextEncoder().encode(value).length

const newPassword = z
  .string()
  .min(1, 'Vui lòng nhập mật khẩu.')
  .min(MIN_PASSWORD, `Mật khẩu phải có ít nhất ${MIN_PASSWORD} ký tự.`)
  .refine(
    (value) => byteLength(value) <= MAX_PASSWORD_BYTES,
    `Mật khẩu quá dài (tối đa ${MAX_PASSWORD_BYTES} byte; chữ có dấu chiếm nhiều byte hơn chữ thường).`,
  )

const confirmPassword = z.string().min(1, 'Vui lòng nhập lại mật khẩu.')

/** Login only checks presence: the server decides what a valid email and password look like. */
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
})

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập họ và tên.')
      .max(MAX_FULL_NAME, `Họ và tên tối đa ${MAX_FULL_NAME} ký tự.`),
    email: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập email.')
      .max(MAX_EMAIL, `Email tối đa ${MAX_EMAIL} ký tự.`)
      .pipe(z.email('Email không hợp lệ.')),
    password: newPassword,
    confirmPassword,
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp.',
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.'),
    newPassword,
    confirmPassword,
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp.',
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ['newPassword'],
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
  })
