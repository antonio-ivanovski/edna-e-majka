import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '#/components/ui/button'
import { isFollowingStore, toggleFollowStore } from '#/server/functions/favorites'
import { toResult } from '#/lib/server-result'
import { favoriteKeys } from '#/lib/queries/favorites'

export function FollowButton({ storeId }: { storeId: string }) {
  const queryClient = useQueryClient()
  const [following, setFollowing] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const handle = setTimeout(() => {
      void isFollowingStore({ data: { storeId } }).then((wire) => {
        const result = toResult(wire)

        if (result._tag === 'Success') {
          setFollowing(result.success.following)
        }
        setLoaded(true)
      })
    }, 0)

    return () => clearTimeout(handle)
  }, [storeId])

  const toggle = async () => {
    const result = toResult(await toggleFollowStore({ data: { storeId } }))

    if (result._tag === 'Failure') {
      toast.error('Треба да сте најавени.')
      return
    }

    setFollowing(result.success.following)
    void queryClient.invalidateQueries({ queryKey: favoriteKeys.all })
    toast.success(
      result.success.following ? 'Го следите производителот.' : 'Престанавте да го следите.',
    )
  }

  if (!loaded) {
    return null
  }

  return (
    <Button
      type="button"
      variant={following ? 'outline' : 'positive'}
      size="sm"
      aria-pressed={following}
      onClick={() => void toggle()}
    >
      {following ? 'Следите' : 'Следи'}
    </Button>
  )
}
