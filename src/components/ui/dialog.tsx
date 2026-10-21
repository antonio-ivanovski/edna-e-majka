import { X } from 'lucide-react'
import { Dialog as RadixDialog } from 'radix-ui'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'
import { Button } from './button'

/** Semantic UI's modal widths, kept so the dialogs feel the same size. */
const sizes = {
  tiny: 'max-w-[540px]',
  small: 'max-w-[750px]',
  default: 'max-w-[850px]',
}

export function Dialog({
  trigger,
  title,
  description,
  children,
  footer,
  size = 'default',
  className,
  open,
  onOpenChange,
  closeOnDimmerClick = true,
  closeOnEscape = true,
}: {
  trigger?: ReactNode
  title: ReactNode
  description?: ReactNode | undefined
  children: ReactNode
  footer?: ReactNode | undefined
  size?: keyof typeof sizes
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  closeOnDimmerClick?: boolean
  closeOnEscape?: boolean
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger> : null}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <RadixDialog.Content
          // Passing it explicitly only when there is no description: Radix
          // links the two itself otherwise, and warns without either.
          {...(description ? {} : { 'aria-describedby': undefined })}
          onInteractOutside={(event) => {
            if (!closeOnDimmerClick) {
              event.preventDefault()
            }
          }}
          onEscapeKeyDown={(event) => {
            if (!closeOnEscape) {
              event.preventDefault()
            }
          }}
          className={cn(
            'fixed top-1/2 left-1/2 z-50 max-h-[88vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[0.2857rem] bg-white shadow-[0_1px_3px_1px_rgba(34,36,38,0.15)] focus:outline-none',
            sizes[size],
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <RadixDialog.Title className="text-lg font-bold text-black/[0.87]">
              {title}
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <Button variant="ghost" size="sm" iconOnly aria-label="Затвори">
                <X className="size-4" />
              </Button>
            </RadixDialog.Close>
          </div>
          {description ? (
            <RadixDialog.Description className="px-6 pt-4 text-sm text-black/60">
              {description}
            </RadixDialog.Description>
          ) : null}
          <div className="px-6 py-5">{children}</div>
          {footer ? (
            <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-footer px-6 py-4">
              {footer}
            </div>
          ) : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
