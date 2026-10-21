import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'

/** Full width, like the original: the footer sits outside the white column. */
export function SiteFooter() {
  return (
    <footer className="mt-2.5 flex flex-col items-center gap-1 border-t border-line-strong py-2.5 text-center text-black/60">
      <p>
        © {new Date().getFullYear()}{' '}
        <Link to="/" className="underline-offset-4 hover:underline">
          ednaemajka.mk
        </Link>
        . Сите права задржани.
      </p>
      <p className="flex items-center gap-1">
        Направено со
        <Heart aria-hidden="true" className="size-3.5 text-danger" fill="currentColor" />
        <span className="sr-only">љубов</span>
      </p>
    </footer>
  )
}
