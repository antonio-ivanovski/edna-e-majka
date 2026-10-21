import { Search } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/field'
import { cn } from '#/lib/utils'

export type FilterOption<Value extends string> = {
  /** Omitted for "everything". */
  value?: Value
  label: string
}

/**
 * The status filters above an admin table: a row of text buttons like the
 * catalogue's sort row, with the URL as the only state.
 */
export function AdminFilters<Value extends string>({
  label,
  options,
  current,
  onChange,
}: {
  label: string
  options: readonly FilterOption<Value>[]
  current?: Value | undefined
  onChange: (value: Value | undefined) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-0.5">
      {options.map((option) => {
        const active = (option.value ?? '') === (current ?? '')

        return (
          <button
            key={option.value ?? 'all'}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'cursor-pointer rounded-[0.2857rem] px-2.5 py-1.5 text-sm font-semibold',
              active
                ? 'bg-black/[0.06] text-black/[0.95]'
                : 'text-black/50 hover:bg-black/[0.03] hover:text-black/75',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * The text filter. Uncontrolled with a key on the value the URL holds, so
 * clearing the filters from anywhere empties the box too.
 */
export function AdminSearch({
  value,
  placeholder,
  onSubmit,
}: {
  value?: string | undefined
  placeholder: string
  onSubmit: (term: string) => void
}) {
  return (
    <form
      key={value ?? ''}
      role="search"
      onSubmit={(event) => {
        event.preventDefault()

        const field = new FormData(event.currentTarget).get('q')

        onSubmit(typeof field === 'string' ? field.trim() : '')
      }}
      className="flex items-center gap-2"
    >
      <label htmlFor="admin-search" className="sr-only">
        {placeholder}
      </label>
      <Input
        id="admin-search"
        name="q"
        type="search"
        defaultValue={value ?? ''}
        placeholder={placeholder}
        className="h-9 w-full sm:w-64"
      />
      <Button type="submit" variant="outline" size="sm" className="h-9">
        <Search aria-hidden="true" className="size-4" />
        Барај
      </Button>
    </form>
  )
}
