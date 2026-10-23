import { Link } from '@tanstack/react-router'

/**
 * The four admin sections. `data-[status=active]` is what the router puts on
 * the current link, so the underline follows the page without a lookup.
 */
const LINKS = [
  { to: '/admin/stores', label: 'Продавници' },
  { to: '/admin/products', label: 'Производи' },
  { to: '/admin/users', label: 'Корисници' },
  { to: '/admin/messages', label: 'Пораки' },
] as const

export function AdminNav() {
  return (
    <nav aria-label="Администрација" className="flex flex-wrap gap-1 border-b border-border">
      {LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-ink-subtle hover:text-ink data-[status=active]:border-accent data-[status=active]:text-ink"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
