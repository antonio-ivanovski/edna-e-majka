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
    <nav aria-label="Администрација" className="flex flex-wrap gap-1 border-b border-line">
      {LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-black/50 hover:text-black/80 data-[status=active]:border-accent data-[status=active]:text-black/[0.95]"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
