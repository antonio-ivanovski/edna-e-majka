import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { isFavoriteProduct, toggleFavoriteProduct } from '#/server/functions/favorites'

/** A heart that toggles a product in the signed-in user's favorites. */
export function FavoriteButton({ productId }: { productId: string }) {
  const [favorited, setFavorited] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const handle = setTimeout(() => {
      void isFavoriteProduct({ data: { productId } }).then((result) => {
        if (result._tag === 'Success') {
          setFavorited(result.success.favorited)
        }
        setLoaded(true)
      })
    }, 0)

    return () => clearTimeout(handle)
  }, [productId])

  const toggle = async () => {
    const result = await toggleFavoriteProduct({ data: { productId } })

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
      className="cursor-pointer rounded-full p-1 text-black/40 hover:text-danger"
      onClick={() => void toggle()}
    >
      <Heart className={favorited ? 'fill-danger text-danger' : ''} />
    </button>
  )
}
