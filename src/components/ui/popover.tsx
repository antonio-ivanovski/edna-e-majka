import { Popover as RadixPopover } from 'radix-ui'
import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

/** Semantic's popup: a small bordered card that opens on hover or focus. */
export function Popover({
  trigger,
  children,
  className,
}: {
  trigger: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <RadixPopover.Root>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          sideOffset={6}
          align="start"
          collisionPadding={12}
          className={cn(
            'z-50 max-w-[250px] rounded-[0.2857rem] border border-[#d4d4d5] bg-white px-4 py-3 text-sm shadow-[0_2px_4px_0_rgba(34,36,38,0.12),0_2px_10px_0_rgba(34,36,38,0.15)]',
            className,
          )}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}
