import type { ReactNode } from 'react'

import { cn } from '#/lib/utils'

/**
 * The tables the manage and admin screens are built from: one bordered row per
 * record, the heading in small caps, the first column taking the room it needs.
 * Wrapped in a scroller so a narrow phone never breaks the page.
 */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-[0.2857rem] border border-line', className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  )
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-surface-subtle text-left text-[0.7857rem] font-bold tracking-wide text-black/60 uppercase">
      {children}
    </thead>
  )
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="border-t border-line align-middle">{children}</tr>
}

export function TableHeaderCell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <th className={cn('px-3 py-2 font-bold whitespace-nowrap', className)}>{children}</th>
}

export function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn('px-3 py-2.5', className)}>{children}</td>
}
