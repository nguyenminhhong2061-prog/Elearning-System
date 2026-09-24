import { useState } from 'react'
import { TextField } from './TextField'

/** TextField for passwords with a show/hide toggle. Accepts the same props as TextField. */
export function PasswordField(props) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={visible}
          className="cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-brand-dark hover:bg-brand-tint focus-visible:outline-2 focus-visible:outline-brand"
        >
          {visible ? 'Ẩn' : 'Hiện'}
        </button>
      }
    />
  )
}
