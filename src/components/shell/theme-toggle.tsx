import { useEffect, useState } from 'react'

import { Button } from '#/components/ui/button'

/** Switches between the light and dark theme, remembered in the browser. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        const stored = window.localStorage.getItem('edna-theme')
        const isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)

        setDark(isDark)
        document.documentElement.classList.toggle('dark', isDark)
      } catch {
        // Ignore.
      }
    }, 0)

    return () => clearTimeout(handle)
  }, [])

  const toggle = () => {
    const next = !dark

    setDark(next)

    document.documentElement.classList.toggle('dark', next)

    try {
      window.localStorage.setItem('edna-theme', next ? 'dark' : 'light')
    } catch {
      // Ignore.
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={toggle} aria-label="Смени тема">
      {dark ? '☀' : '☾'}
    </Button>
  )
}
