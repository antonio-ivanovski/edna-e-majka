import { useNavigate, useSearch } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '#/components/ui/button'
import { searchSuggestions } from '#/server/functions/search'
import { recordRecentSearch, readRecentSearches } from '#/lib/recent-searches'

type Suggestion = Awaited<ReturnType<typeof searchSuggestions>>

/** The header search: one box, suggestions as you type, recent searches below. */
export function SearchForm() {
  const navigate = useNavigate()
  const currentSearch = useSearch({ strict: false }) as { q?: string }
  const [term, setTerm] = useState(currentSearch.q ?? '')
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null)
  const [recent, setRecent] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setRecent(readRecentSearches())
  }, [])

  // Fetch suggestions as the term changes, with a short delay.
  useEffect(() => {
    const query = term.trim()

    if (query.length < 2) {
      setSuggestions(null)
      return
    }

    const handle = setTimeout(() => {
      void searchSuggestions({ data: { query } })
        .then((result) => setSuggestions(result))
        .catch(() => setSuggestions(null))
    }, 200)

    return () => clearTimeout(handle)
  }, [term])

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)

    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const submit = (query: string) => {
    const trimmed = query.trim()

    if (!trimmed) {
      return
    }

    recordRecentSearch(trimmed)
    setRecent(readRecentSearches())
    setOpen(false)
    setTerm(trimmed)

    void navigate({ to: '/search', search: { q: trimmed } })
  }

  const hasSuggestions =
    suggestions && (suggestions.products.length > 0 || suggestions.stores.length > 0)

  return (
    <div
      ref={containerRef}
      className="relative mx-2 my-1 flex min-w-0 flex-1 basis-64 items-stretch"
    >
      <form
        role="search"
        className="flex min-w-0 flex-1 items-stretch"
        onSubmit={(event) => {
          event.preventDefault()
          submit(term)
        }}
      >
        <label htmlFor="site-search" className="sr-only">
          Пребарај сите производи
        </label>
        <input
          id="site-search"
          type="search"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Пребарај сите производи"
          className="h-9 w-full min-w-0 rounded-l-[0.2857rem] rounded-r-none border border-r-0 border-line bg-white px-3 text-sm placeholder:text-black/35 focus:z-10 focus:border-accent-strong focus:ring-1 focus:ring-accent-strong focus:outline-none"
        />
        <Button type="submit" variant="primary" className="rounded-l-none">
          <Search aria-hidden="true" className="size-4" />
          Пребарај
        </Button>
      </form>

      {open && (recent.length > 0 || hasSuggestions) ? (
        <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-[0.2857rem] border border-line bg-white shadow-lg">
          {hasSuggestions ? (
            <ul className="py-1">
              {suggestions!.products.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/[0.04]"
                    onClick={() => submit(product.title)}
                  >
                    <Search aria-hidden="true" className="size-3.5 text-black/30" />
                    {product.title}
                  </button>
                </li>
              ))}
              {suggestions!.stores.map((store) => (
                <li key={store.id}>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/[0.04]"
                    onClick={() => submit(store.name)}
                  >
                    <Search aria-hidden="true" className="size-3.5 text-black/30" />
                    {store.name}
                    <span className="ml-auto text-xs text-black/40">продавница</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {recent.length > 0 ? (
            <div className="border-t border-line py-1">
              <p className="px-3 py-1 text-xs font-semibold text-black/40">
                Неодамнешни пребарувања
              </p>
              <ul>
                {recent.map((entry) => (
                  <li key={entry}>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/[0.04]"
                      onClick={() => submit(entry)}
                    >
                      {entry}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
