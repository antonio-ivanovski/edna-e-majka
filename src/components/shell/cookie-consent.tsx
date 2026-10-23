import { useEffect, useState } from 'react'

import { Button } from '#/components/ui/button'
import { useTranslation } from 'react-i18next'

const STORAGE_KEY = 'edna-cookie-consent'

/** A small banner at the bottom: the visitor chooses once, then it stays gone. */
export function CookieConsent() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        if (!window.localStorage.getItem(STORAGE_KEY)) {
          setVisible(true)
        }
      } catch {
        // Storage can be blocked; show nothing rather than nagging.
      }
    }, 0)

    return () => clearTimeout(handle)
  }, [])

  const decide = (value: 'accepted' | 'rejected') => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // Ignore.
    }

    setVisible(false)
  }

  if (!visible) {
    return null
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Согласност за колачиња"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-raised px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink">
          Користиме колачиња за да се сеќаваме на вашите поставки и да го подобриме сајтот. Повеќе
          во{' '}
          <a href="/cookies" className="font-semibold text-accent-ink hover:underline">
            {t('cookie.policy')}
          </a>
          .
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => decide('rejected')}>
            {t('cookie.reject')}
          </Button>
          <Button type="button" variant="positive" size="sm" onClick={() => decide('accepted')}>
            {t('cookie.accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}
