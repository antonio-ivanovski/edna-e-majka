import { useEffect, useRef } from 'react'

/**
 * A marker at the end of the list. When it comes into view, the next page is
 * asked for; the visitor never presses a button to see more.
 */
export function InfiniteScrollTrigger({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current

    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onVisible()
        }
      },
      // It starts a little before the marker is really on the screen.
      { rootMargin: '600px 0px' },
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [onVisible])

  return <div ref={ref} aria-hidden="true" className="h-px w-full" />
}
