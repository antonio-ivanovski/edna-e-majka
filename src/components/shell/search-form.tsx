import { useNavigate, useSearch } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { Button } from '#/components/ui/button'
import { searchSuggestions } from '#/server/functions/search'
import { recordRecentSearch, readRecentSearches } from '#/lib/recent-searches'
import { cn } from '#/lib/utils'

type Suggestion = Awaited<ReturnType<typeof searchSuggestions>>

type DropdownItem = {
  key: string
  label: string
  detail?: string
  run: () => void
}

/**
 * The header search: one box, suggestions as you type, recent searches below.
 *
 * A combobox: arrow keys walk the rows, enter picks the highlighted one and
 * escape closes the list. The matched part of every suggestion is emphasised
 * so it is clear why the row is there.
 */
export function SearchForm() {
  const navigate = useNavigate()
  const currentSearch = useSearch({ strict: false }) as { q?: string }
  const [term, setTerm] = useState(currentSearch.q ?? '')
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null)
  const [recent, setRecent] = useState<string[]>([])
  const [active, setActive] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    const handle = setTimeout(() => setRecent(readRecentSearches()), 0)
    return () => clearTimeout(handle)
  }, [])

  // Fetch suggestions as the term changes, with a short delay.
  useEffect(() => {
    const query = term.trim()

    if (query.length < 2) {
      const handle = setTimeout(() => setSuggestions(null), 0)
      return () => clearTimeout(handle)
    }

    const handle = setTimeout(() => {
      void searchSuggestions({ data: { query } })
        .then((result) => {
          setSuggestions(result)
          setActive(-1)
        })
        .catch(() => setSuggestions(null))
    }, 200)

    return () => clearTimeout(handle)
  }, [term])

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setActive(-1)
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
    setActive(-1)
    setTerm(trimmed)

    void navigate({ to: '/search', search: { q: trimmed } })
  }

  const items: DropdownItem[] = [
    ...(suggestions?.products.map((product) => ({
      key: `product-${product.id}`,
      label: product.title,
      run: () => submit(product.title),
    })) ?? []),
    ...(suggestions?.stores.map((store) => ({
      key: `store-${store.id}`,
      label: store.name,
      detail: 'продавница',
      run: () => submit(store.name),
    })) ?? []),
    ...recent.map((entry) => ({
      key: `recent-${entry}`,
      label: entry,
      run: () => submit(entry),
    })),
  ]

  const pick = (index: number) => {
    const item = items[index]

    if (item) {
      item.run()
    }
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!open || items.length === 0) {
        return
      }

      event.preventDefault()

      setActive((current) => {
        const step = event.key === 'ArrowDown' ? 1 : -1
        const count = items.length + 1
        return ((current + 1 + step + count) % count) - 1
      })
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault()
      pick(active)
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  const trimmedTerm = term.trim()

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
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Пребарај сите производи"
          className="h-9 w-full min-w-0 rounded-l-card rounded-r-none border border-r-0 border-border bg-surface-raised px-3 text-sm placeholder:text-ink-faint focus:z-10 focus:border-accent-strong focus:ring-1 focus:ring-accent-strong focus:outline-none"
        />
        <Button type="submit" variant="primary" className="rounded-l-none" aria-label="Пребарај">
          <Search aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Пребарај</span>
        </Button>
      </form>

      {open && items.length > 0 ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-card border border-border bg-surface-raised shadow-lg">
          <ul role="listbox" id={listId} aria-label="Предлози" className="py-1">
            {items.map((item, index) => (
              <li key={item.key} role="presentation">
                <button
                  type="button"
                  role="option"
                  id={`${listId}-${index}`}
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(index)}
                  className={cn(
                    'flex w-full min-w-0 cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm break-words',
                    index === active ? 'bg-hover' : 'hover:bg-hover',
                  )}
                >
                  <Search aria-hidden="true" className="size-3.5 shrink-0 text-ink-faint" />
                  <span className="min-w-0 flex-1">
                    <Highlighted text={item.label} query={trimmedTerm} />
                  </span>
                  {item.detail ? (
                    <span className="shrink-0 text-xs text-ink-faint">{item.detail}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

/** The matched part stands out, so it is clear why the row is suggested. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const needle = query.toLocaleLowerCase('mk')

  if (!needle) {
    return <>{text}</>
  }

  const at = text.toLocaleLowerCase('mk').indexOf(needle)

  if (at < 0) {
    return <>{text}</>
  }

  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent font-bold text-inherit">
        {text.slice(at, at + needle.length)}
      </mark>
      {text.slice(at + needle.length)}
    </>
  )
}
