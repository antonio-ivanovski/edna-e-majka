import { useNavigate, useSearch } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useState } from 'react'

import { Button } from '#/components/ui/button'

/** The header search: one box, one red button, straight to the search page. */
export function SearchForm() {
  const navigate = useNavigate()
  const currentSearch = useSearch({ strict: false }) as { q?: string }
  const [term, setTerm] = useState(currentSearch.q ?? '')

  return (
    <form
      role="search"
      className="mx-2 my-1 flex min-w-0 flex-1 basis-64 items-stretch"
      onSubmit={(event) => {
        event.preventDefault()

        const query = term.trim()
        if (!query) {
          return
        }

        void navigate({ to: '/search', search: { q: query } })
      }}
    >
      <label htmlFor="site-search" className="sr-only">
        Пребарај сите производи
      </label>
      <input
        id="site-search"
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Пребарај сите производи"
        className="h-9 w-full min-w-0 rounded-l-[0.2857rem] rounded-r-none border border-r-0 border-line bg-white px-3 text-sm placeholder:text-black/35 focus:z-10 focus:border-accent-strong focus:ring-1 focus:ring-accent-strong focus:outline-none"
      />
      <Button type="submit" variant="primary" className="rounded-l-none">
        <Search aria-hidden="true" className="size-4" />
        Пребарај
      </Button>
    </form>
  )
}
