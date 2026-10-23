import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { isFavoriteProduct, toggleFavoriteProduct } from '#/server/functions/favorites'
import { toResult } from '#/lib/server-result'

/** A heart that toggles a product in the signed-in user's favorites. */
export function FavoriteButton({ productId }: { productId: string }) {
  const [favorited, setFavorited] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const handle = setTimeout(() => {
      void isFavoriteProduct({ data: { productId } }).then((wire) => {
        const result = toResult(wire)

        if (result._tag === 'Success') {
          setFavorited(result.success.favorited)
        }
        setLoaded(true)
      })
    }, 0)

    return () => clearTimeout(handle)
  }, [productId])

  const toggle = async () => {
    const result = toResult(await toggleFavoriteProduct({ data: { productId } }))

    if (result._tag === 'Failure') {
      toast.error('Треба да сте најавени.')
      return
    }

    setFavorited(result.success.favorited)
  }

  if (!loaded) {
    return null
  }

  return (
    <button
      type="button"
      aria-label={favorited ? 'Отстрани од омилени' : 'Додај во омилени'}
      aria-pressed={favorited}
      title={favorited ? 'Отстрани од омилени' : 'Додај во омилени'}
      className="cursor-pointer rounded-full p-2 text-ink-faint transition-colors hover:bg-hover hover:text-danger"
      onClick={() => void toggle()}
    >
      <Heart
        aria-hidden="true"
        className={`size-5 ${favorited ? 'fill-danger text-danger' : ''}`}
      />
    </button>
  )
}
