import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'

import { Button } from '#/components/ui/button'

const THEME_EVENT = 'edna-theme-change'

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

  const toggle = () => {
    const next = !dark

    document.documentElement.classList.toggle('dark', next)

    try {
      window.localStorage.setItem('edna-theme', next ? 'dark' : 'light')
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
      aria-pressed={dark}
      title={dark ? 'Светла тема' : 'Темна тема'}
    >
      <Sun aria-hidden="true" className="hidden size-4 dark:block" />
      <Moon aria-hidden="true" className="size-4 dark:hidden" />
    </Button>
  )
}
