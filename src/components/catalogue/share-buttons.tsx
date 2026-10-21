import { useEffect, useState } from 'react'

import { Button } from '#/components/ui/button'

/** Share actions relevant for the Macedonian market. */
export function ShareButtons({ path, title }: { path: string; title: string }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`)
  }, [path])
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
        {copied ? 'Копирано' : 'Копирај линк'}
      </Button>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center rounded border border-line px-3 py-1.5 text-sm font-semibold hover:bg-black/[0.03]"
      >
        Facebook
      </a>
      <a
        href={`viber://forward?text=${encodedTitle}%20${encodedUrl}`}
        className="inline-flex items-center rounded border border-line px-3 py-1.5 text-sm font-semibold hover:bg-black/[0.03]"
      >
        Viber
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center rounded border border-line px-3 py-1.5 text-sm font-semibold hover:bg-black/[0.03]"
      >
        WhatsApp
      </a>
    </div>
  )
}