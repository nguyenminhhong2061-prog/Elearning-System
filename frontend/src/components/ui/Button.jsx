import { Link } from 'react-router'
import { buttonClasses } from './buttonClasses'
import { Spinner } from './Spinner'

/**
 * While `loading` is true the button is disabled (so a form cannot be submitted twice) and shows a spinner
 * in front of its label.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {loading && <Spinner label={null} className="size-4 border-current/30 border-t-current" />}
      {children}
    </button>
  )
}

/** A router link styled as a button, for actions that go to another page ("Học 20 từ →"). */
export function ButtonLink({ variant = 'primary', size = 'md', className, ...props }) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />
}
