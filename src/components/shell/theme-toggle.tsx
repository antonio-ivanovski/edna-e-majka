import { useEffect, useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'

import { Button } from '#/components/ui/button'

const THEME_EVENT = 'edna-theme-change'
const THEME_KEY = 'edna-theme'

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(THEME_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

function isDark() {
  return document.documentElement.classList.contains('dark')
}

/**
 * Switches between the light and dark theme, remembered in the browser.
 *
 * The theme is applied by a small script in the document head, before the
 * first paint, so the page never flashes the wrong colours. This component
 * only reflects the state the document is already in.
 */
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false)
  // False on the server and first paint, true after hydration, so
  // aria-pressed matches the server snapshot until the client takes over.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applySystemTheme = () => {
      try {
        if (window.localStorage.getItem(THEME_KEY) !== null) {
          return
        }
      } catch {
        return
      }
      document.documentElement.classList.toggle('dark', media.matches)
      window.dispatchEvent(new Event(THEME_EVENT))
    }
    media.addEventListener('change', applySystemTheme)
    return () => {
      media.removeEventListener('change', applySystemTheme)
    }
  }, [])

  const toggle = () => {
    const next = !dark

    document.documentElement.classList.toggle('dark', next)

    try {
      window.localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
    } catch {
      // The theme is a convenience; a browser that refuses to remember it
      // still switches for this visit.
    }

    window.dispatchEvent(new Event(THEME_EVENT))
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      iconOnly
      onClick={toggle}
      aria-label={dark ? 'Светла тема' : 'Темна тема'}
      aria-pressed={mounted ? dark : undefined}
      title={dark ? 'Светла тема' : 'Темна тема'}
    >
      <Sun aria-hidden="true" className="hidden size-4 dark:block" />
      <Moon aria-hidden="true" className="size-4 dark:hidden" />
    </Button>
  )
}
