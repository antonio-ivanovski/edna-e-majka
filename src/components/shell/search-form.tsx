import { useNavigate, useSearch } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { Button } from '#/components/ui/button'
import { searchSuggestions } from '#/server/functions/search'
import { clearRecentSearches, recordRecentSearch, readRecentSearches } from '#/lib/recent-searches'
import { findHighlightIndices } from '#/lib/translit'
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
  const requestIdRef = useRef(0)
  const listId = useId()

  // Follow the address bar: back/forward or a submitted search elsewhere
  // rewrites `?q=`, and the box should show it. Deferred a tick like the
  // recents read below so the sync stays out of the render pass.
  useEffect(() => {
    const handle = setTimeout(() => setTerm(currentSearch.q ?? ''), 0)
    return () => clearTimeout(handle)
  }, [currentSearch.q])

  useEffect(() => {
    const handle = setTimeout(() => setRecent(readRecentSearches()), 0)
    return () => clearTimeout(handle)
  }, [])

  // Fetch suggestions as the term changes, with a short delay. A request id
  // guards the debounce: a slow response for an older term is dropped so it
  // never overwrites fresher results or moves the highlight.
  useEffect(() => {
    const query = term.trim()

    if (query.length < 2) {
      const handle = setTimeout(() => setSuggestions(null), 0)
      return () => clearTimeout(handle)
    }

    const requestId = (requestIdRef.current += 1)
    const handle = setTimeout(() => {
      void searchSuggestions({ data: { query } })
        .then((result) => {
          if (requestIdRef.current !== requestId) {
            return
          }
          setSuggestions(result)
          setActive(-1)
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) {
            return
          }
          setSuggestions(null)
        })
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

  const goToProduct = (slug: string | null, id: string) => {
    setOpen(false)
    setActive(-1)
    void navigate({ to: '/products/$productId', params: { productId: slug ?? id } })
  }

  const goToStore = (slug: string | null, id: string) => {
    setOpen(false)
    setActive(-1)
    void navigate({ to: '/producers/$storeId', params: { storeId: slug ?? id } })
  }

  const showRecents = term.trim() === ''

  const suggestionLabels = new Set([
    ...(suggestions?.products.map((product) => product.title.toLowerCase()) ?? []),
    ...(suggestions?.stores.map((store) => store.name.toLowerCase()) ?? []),
  ])
  const visibleRecents = showRecents
    ? recent.filter((entry) => !suggestionLabels.has(entry.toLowerCase()))
    : []

  const suggestionItems: DropdownItem[] = [
    ...(suggestions?.products.map((product) => ({
      key: `product-${product.id}`,
      label: product.title,
      run: () => goToProduct(product.slug, product.id),
    })) ?? []),
    ...(suggestions?.stores.map((store) => ({
      key: `store-${store.id}`,
      label: store.name,
      detail: 'продавница',
      run: () => goToStore(store.slug, store.id),
    })) ?? []),
  ]

  const recentItems: DropdownItem[] = visibleRecents.map((entry) => ({
    key: `recent-${entry}`,
    label: entry,
    run: () => submit(entry),
  }))

  const items: DropdownItem[] = [...suggestionItems, ...recentItems]

  const clearRecents = () => {
    clearRecentSearches()
    setRecent([])
    setActive(-1)
  }

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
    } else if (event.key === 'Home' && open && items.length > 0) {
      event.preventDefault()
      setActive(0)
    } else if (event.key === 'End' && open && items.length > 0) {
      event.preventDefault()
      setActive(items.length - 1)
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault()
      pick(active)
    } else if (event.key === 'Escape') {
      // Prevent the browser clearing a type=search box and reopening the
      // dropdown on the now-empty value in Chromium.
      event.preventDefault()
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
      <p aria-live="polite" className="sr-only">
        {open && items.length > 0 ? `${items.length} предлози` : ''}
      </p>
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
          className="h-9 w-full min-w-0 rounded-l-card rounded-r-none border border-r-0 border-border bg-surface-raised px-3 text-sm placeholder:text-ink-subtle focus:z-10 focus:border-accent-strong focus-visible:outline-2 focus-visible:outline-focus"
        />
        <Button type="submit" variant="primary" className="rounded-l-none" aria-label="Пребарај">
          <Search aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Пребарај</span>
        </Button>
      </form>

      {open && items.length > 0 ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-card border border-border bg-surface-raised shadow-lg">
          <ul role="listbox" id={listId} aria-label="Предлози" className="py-1">
            {suggestionItems.length > 0 ? (
              <li
                role="presentation"
                aria-hidden="true"
                className="px-3 pt-1 text-xs text-ink-subtle"
              >
                Предлози
              </li>
            ) : null}
            {suggestionItems.map((item, index) => (
              <li key={item.key} role="presentation">
                <button
                  type="button"
                  role="option"
                  tabIndex={-1}
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
                    <span className="shrink-0 text-xs text-ink-subtle">{item.detail}</span>
                  ) : null}
                </button>
              </li>
            ))}
            {recentItems.length > 0 ? (
              <li
                role="presentation"
                className="flex items-center justify-between px-3 pt-1 text-xs text-ink-subtle"
              >
                <span aria-hidden="true">Неодамнешни</span>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={clearRecents}
                  className="cursor-pointer hover:underline"
                >
                  Исчисти
                </button>
              </li>
            ) : null}
            {recentItems.map((item, offset) => {
              const index = suggestionItems.length + offset
              return (
                <li key={item.key} role="presentation">
                  <button
                    type="button"
                    role="option"
                    tabIndex={-1}
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
                      <span className="shrink-0 text-xs text-ink-subtle">{item.detail}</span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

/** The matched part stands out, so it is clear why the row is suggested. */
function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) {
    return <>{text}</>
  }

  const hit = findHighlightIndices(text, query)

  if (!hit) {
    return <>{text}</>
  }

  const [at, end] = hit

  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent font-bold text-inherit">{text.slice(at, end)}</mark>
      {text.slice(end)}
    </>
  )
}
