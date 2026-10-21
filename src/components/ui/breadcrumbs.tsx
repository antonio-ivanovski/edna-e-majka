import { Link } from '@tanstack/react-router'

import { ChevronRight } from 'lucide-react'

export type BreadcrumbItem = {
  label: string
  to?: string
  params?: Record<string, string>
}

/** Simple breadcrumb trail used on product, category and producer pages. */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Патека"
      className="flex flex-wrap items-center gap-1 px-4 pt-4 text-sm text-black/50"
    >
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1">
          {index > 0 ? <ChevronRight aria-hidden="true" className="size-3.5" /> : null}
          {item.to ? (
            <Link
              to={item.to}
              params={item.params as never}
              className="hover:text-black/80 hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-black/70">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
