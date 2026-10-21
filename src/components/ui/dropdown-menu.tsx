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
            'z-50 min-w-[11rem] rounded-[0.2857rem] border border-line bg-white py-1 shadow-[0_2px_4px_0_rgba(34,36,38,0.12),0_2px_10px_0_rgba(34,36,38,0.15)]',
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
  'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-black/60 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-black/[0.04] data-[highlighted]:text-black/[0.95]'

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
          {icon ? <span className="text-black/40">{icon}</span> : null}
          {children}
        </>
      )}
    </RadixDropdownMenu.Item>
  )
}

export function DropdownMenuSeparator() {
  return <RadixDropdownMenu.Separator className="my-1 h-px bg-line" />
}
