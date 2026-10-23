import { useState } from 'react'

import { Button } from '#/components/ui/button'

/**
 * Share actions that matter in the Macedonian market. The address is built
 * inside the handlers: the page is in the browser by then, so the link is
 * always the one the visitor is looking at. Nothing here may touch `window`
 * during render, or the server render of the product page falls over.
 */
export function ShareButtons({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false)

  const shareUrl = () => `${window.location.origin}${path}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked; the other buttons still work.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
        {copied ? 'Копирано' : 'Копирај линк'}
      </Button>
      <button
        type="button"
        className="inline-flex cursor-pointer items-center rounded-card border border-border px-3 py-1.5 text-sm font-semibold hover:bg-hover"
        onClick={() =>
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl())}`,
            '_blank',
            'noopener,noreferrer',
          )
        }
      >
        Facebook
      </button>
      <button
        type="button"
        className="inline-flex cursor-pointer items-center rounded-card border border-border px-3 py-1.5 text-sm font-semibold hover:bg-hover"
        onClick={() => {
          const shareText = `${title} ${shareUrl()}`
          window.location.href = `viber://forward?text=${encodeURIComponent(shareText)}`
        }}
      >
        Viber
      </button>
      <button
        type="button"
        className="inline-flex cursor-pointer items-center rounded-card border border-border px-3 py-1.5 text-sm font-semibold hover:bg-hover"
        onClick={() => {
          const shareText = `${title} ${shareUrl()}`
          window.open(
            `https://wa.me/?text=${encodeURIComponent(shareText)}`,
            '_blank',
            'noopener,noreferrer',
          )
        }}
      >
        WhatsApp
      </button>
    </div>
  )
}
