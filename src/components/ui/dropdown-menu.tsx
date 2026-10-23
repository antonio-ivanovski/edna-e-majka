import { DropdownMenu as RadixDropdownMenu } from 'radix-ui'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

/** The white bordered menu the header, the user avatar and sorting all use. */
export function DropdownMenu({
  trigger,
  children,
  align = 'start',
  className,
}: {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}) {
  return (
    <RadixDropdownMenu.Root>
      <RadixDropdownMenu.Trigger asChild>{trigger}</RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          align={align}
          sideOffset={4}
          className={cn(
            'z-50 min-w-[11rem] rounded-card border border-border bg-surface-raised py-1 shadow-lift',
            className,
          )}
        >
          {children}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  )
}

const itemStyles =
  'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-ink-muted outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-hover data-[highlighted]:text-ink'

export function DropdownMenuItem({
  children,
  icon,
  disabled,
  asChild,
  onSelect,
  className,
}: {
  children: ReactNode
  icon?: ReactNode
  disabled?: boolean
  /** Render a link or button instead of a plain menu item. */
  asChild?: boolean
  onSelect?: (event: Event) => void
  className?: string
}) {
  return (
    <RadixDropdownMenu.Item
      asChild={asChild}
      disabled={disabled}
      onSelect={onSelect}
      className={cn(itemStyles, className)}
    >
      {asChild ? (
        children
      ) : (
        <>
          {icon ? <span className="text-ink-faint">{icon}</span> : null}
          {children}
        </>
      )}
    </RadixDropdownMenu.Item>
  )
}

export function DropdownMenuSeparator() {
  return <RadixDropdownMenu.Separator className="bg-line my-1 h-px" />
}
