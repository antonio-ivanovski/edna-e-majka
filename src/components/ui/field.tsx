import {
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react'

import { cn } from '#/lib/utils'

/**
 * Label, control and error message, in the order the legacy forms had them.
 *
 * The field wires the control to the message on its own: the error gets an id
 * derived from the control, and the control is given `aria-invalid` and
 * `aria-describedby` so a screen reader reads the problem with the field
 * rather than somewhere else on the page.
 */
export function Field({
  label,
  error,
  htmlFor,
  required,
  className,
  children,
}: {
  label?: ReactNode
  error?: ReactNode
  htmlFor?: string
  required?: boolean
  className?: string
  children: ReactNode
}) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined
  const describedBy = errorId

  const control =
    isValidElement(children) && describedBy
      ? cloneElement(
          children as ReactElement<{
            'aria-invalid'?: boolean | undefined
            'aria-describedby'?: string | undefined
          }>,
          {
            'aria-invalid': error ? true : undefined,
            'aria-describedby': describedBy,
          },
        )
      : children

  const labelText = (
    <>
      {label}
      {required ? (
        <>
          <span aria-hidden="true" className="text-danger">
            {' '}
            *
          </span>
          <span className="sr-only"> (задолжително)</span>
        </>
      ) : null}
    </>
  )

  return (
    <div className={cn('mb-5', className)}>
      {label ? (
        htmlFor ? (
          <label htmlFor={htmlFor} className="mb-1 block text-sm font-bold text-ink">
            {labelText}
          </label>
        ) : (
          <span className="mb-1 block text-sm font-bold text-ink">{labelText}</span>
        )
      ) : null}
      {control}
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}

const controlStyles =
  'w-full rounded-card border border-border bg-surface-raised px-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent-strong focus:ring-1 focus:ring-accent-strong focus:outline-none aria-invalid:border-danger'

type InputProps = ComponentProps<'input'> & {
  /** Trailing unit, as in the price fields that read `МКД`. */
  suffix?: ReactNode
}

export function Input({ className, suffix, ...props }: InputProps) {
  if (suffix) {
    return (
      <div className="flex">
        <input className={cn(controlStyles, 'h-9 rounded-r-none', className)} {...props} />
        <span className="flex h-9 items-center rounded-r-card border border-l-0 border-border bg-surface-raised px-3 text-sm text-ink">
          {suffix}
        </span>
      </div>
    )
  }

  return <input className={cn(controlStyles, 'h-9', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(controlStyles, 'py-2', className)} {...props} />
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(controlStyles, 'h-9 pr-8', className)} {...props} />
}
