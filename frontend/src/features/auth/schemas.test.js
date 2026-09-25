import { describe, expect, it } from 'vitest'
import { changePasswordSchema, loginSchema, registerSchema } from './schemas'

/** First error message per field, or {} when the input is valid. */
function errorsOf(schema, input) {
  const result = schema.safeParse(input)
  if (result.success) return {}
  const messages = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    messages[field] ??= issue.message
  }
  return messages
}

const validRegistration = {
  fullName: 'Nguyễn Minh Hồng',
  email: 'hong@example.com',
  password: 'matkhau123',
  confirmPassword: 'matkhau123',
}

describe('loginSchema', () => {
  it('only requires both fields, leaving credential rules to the server', () => {
    expect(errorsOf(loginSchema, { email: 'admin@localhost', password: 'x' })).toEqual({})
    expect(errorsOf(loginSchema, { email: '  ', password: '' })).toEqual({
      email: 'Vui lòng nhập email.',
      password: 'Vui lòng nhập mật khẩu.',
    })
  })

  it('trims the email but never the password', () => {
    const result = loginSchema.parse({ email: '  a@b.vn  ', password: ' pw ' })

    expect(result).toEqual({ email: 'a@b.vn', password: ' pw ' })
  })
})

describe('registerSchema', () => {
  it('accepts valid input and trims the name and email like the backend does', () => {
    const result = registerSchema.parse({
      ...validRegistration,
      fullName: '  Nguyễn Minh Hồng ',
      email: ' hong@example.com ',
    })

    expect(result.fullName).toBe('Nguyễn Minh Hồng')
    expect(result.email).toBe('hong@example.com')
  })

  it('requires every field', () => {
    expect(errorsOf(registerSchema, { fullName: '', email: '', password: '', confirmPassword: '' })).toEqual({
      fullName: 'Vui lòng nhập họ và tên.',
      email: 'Vui lòng nhập email.',
      password: 'Vui lòng nhập mật khẩu.',
      confirmPassword: 'Vui lòng nhập lại mật khẩu.',
    })
  })

  it('rejects an invalid email', () => {
    expect(errorsOf(registerSchema, { ...validRegistration, email: 'not-an-email' }).email).toBe('Email không hợp lệ.')
  })

  it('enforces the backend length limits on name and email', () => {
    expect(errorsOf(registerSchema, { ...validRegistration, fullName: 'a'.repeat(151) }).fullName).toBe(
      'Họ và tên tối đa 150 ký tự.',
    )
    // 251 + the 5 characters of "@b.vn" = 256, one over the limit.
    expect(errorsOf(registerSchema, { ...validRegistration, email: `${'a'.repeat(251)}@b.vn` }).email).toBe(
      'Email tối đa 255 ký tự.',
    )
  })

  it('requires at least 8 characters in the password', () => {
    const errors = errorsOf(registerSchema, { ...validRegistration, password: '1234567', confirmPassword: '1234567' })

    expect(errors.password).toBe('Mật khẩu phải có ít nhất 8 ký tự.')
  })

  it('limits the password to 72 bytes, not 72 characters', () => {
    const ascii72 = 'a'.repeat(72)
    expect(errorsOf(registerSchema, { ...validRegistration, password: ascii72, confirmPassword: ascii72 })).toEqual({})

    const ascii73 = 'a'.repeat(73)
    expect(errorsOf(registerSchema, { ...validRegistration, password: ascii73, confirmPassword: ascii73 }).password).toMatch(
      /tối đa 72 byte/,
    )

    // 25 characters, but each "ệ" is 3 bytes in UTF-8, so 75 bytes: fine for the backend's character count,
    // yet BCrypt would silently ignore the tail.
    const accented = 'ệ'.repeat(25)
    expect(errorsOf(registerSchema, { ...validRegistration, password: accented, confirmPassword: accented }).password).toMatch(
      /tối đa 72 byte/,
    )
  })

  it('requires the confirmation to match', () => {
    expect(errorsOf(registerSchema, { ...validRegistration, confirmPassword: 'khac-hoan-toan' }).confirmPassword).toBe(
      'Mật khẩu nhập lại không khớp.',
    )
  })
})

describe('changePasswordSchema', () => {
  const valid = { currentPassword: 'matkhaucu1', newPassword: 'matkhaumoi1', confirmPassword: 'matkhaumoi1' }

  it('accepts a valid change', () => {
    expect(errorsOf(changePasswordSchema, valid)).toEqual({})
  })

  it('rejects a new password equal to the current one, as the backend does', () => {
    const same = { currentPassword: 'matkhau123', newPassword: 'matkhau123', confirmPassword: 'matkhau123' }

    expect(errorsOf(changePasswordSchema, same).newPassword).toBe('Mật khẩu mới phải khác mật khẩu hiện tại.')
  })

  it('applies the same length rules to the new password', () => {
    const tooShort = { ...valid, newPassword: 'ngan', confirmPassword: 'ngan' }

    expect(errorsOf(changePasswordSchema, tooShort).newPassword).toBe('Mật khẩu phải có ít nhất 8 ký tự.')
  })

  it('requires the confirmation to match the new password', () => {
    expect(errorsOf(changePasswordSchema, { ...valid, confirmPassword: 'khac' }).confirmPassword).toBe(
      'Mật khẩu nhập lại không khớp.',
    )
  })

  it('requires the current password', () => {
    expect(errorsOf(changePasswordSchema, { ...valid, currentPassword: '' }).currentPassword).toBe(
      'Vui lòng nhập mật khẩu hiện tại.',
    )
  })
})
