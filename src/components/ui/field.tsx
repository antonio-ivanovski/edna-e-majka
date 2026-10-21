import type { ComponentProps, ReactNode } from 'react'

import { cn } from '#/lib/utils'

/** Label, control and error message, in the order the legacy forms had them. */
export function Field({
  label,
  error,
  htmlFor,
  className,
  children,
}: {
  label?: ReactNode
  error?: ReactNode
  htmlFor?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('mb-5', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="mb-1 block text-sm font-bold text-black/[0.87]">
          {label}
        </label>
      ) : null}
      {children}
      {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
    </div>
  )
}

const controlStyles =
  'w-full rounded-[0.2857rem] border border-line bg-white px-3 text-sm text-black/[0.87] placeholder:text-black/35 focus:border-accent-strong focus:ring-1 focus:ring-accent-strong focus:outline-none aria-invalid:border-danger'

type InputProps = ComponentProps<'input'> & {
  /** Trailing unit, as in the price fields that read `МКД`. */
  suffix?: ReactNode
}

export function Input({ className, suffix, ...props }: InputProps) {
  if (suffix) {
    return (
      <div className="flex">
        <input className={cn(controlStyles, 'h-9 rounded-r-none', className)} {...props} />
        <span className="flex h-9 items-center rounded-r-[0.2857rem] border border-l-0 border-line bg-white px-3 text-sm text-black/[0.87]">
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
