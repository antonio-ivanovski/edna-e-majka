import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'

/** Full width, like the original: the footer sits outside the white column. */
export function SiteFooter() {
  return (
    <footer className="mt-2.5 flex flex-col items-center gap-2 border-t border-border-strong py-2.5 text-center text-ink-muted">
      <p>
        © {new Date().getFullYear()}{' '}
        <Link to="/" className="underline-offset-4 hover:underline">
          ednaemajka.mk
        </Link>
        . Сите права задржани.
      </p>
      <nav aria-label="Правни" className="flex flex-wrap justify-center gap-3 text-sm">
        <Link to="/terms" className="underline-offset-4 hover:underline">
          Услови
        </Link>
        <Link to="/privacy" className="underline-offset-4 hover:underline">
          Приватност
        </Link>
        <Link to="/cookies" className="underline-offset-4 hover:underline">
          Колачиња
        </Link>
        <Link to="/guidelines" className="underline-offset-4 hover:underline">
          Водич
        </Link>
      </nav>
      <p className="flex items-center gap-1">
        Направено со
        <Heart aria-hidden="true" className="size-3.5 text-danger" fill="currentColor" />
        <span className="sr-only">љубов</span>
      </p>
    </footer>
  )
}
