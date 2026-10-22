import { effectResolver } from '#/lib/effect-resolver'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { StoreFields, storeFormSchema, type StoreFormValues } from '#/components/manage/store-form'
import { Button } from '#/components/ui/button'
import { Message } from '#/components/ui/message'
import { adminUpdateStore } from '#/server/functions/admin'
import type { AdminStore } from '#/server/queries/admin'

/**
 * An admin correcting a shop's details. The same fields the owner sees, saved
 * through the admin endpoint, which does not touch ownership or status.
 */
export function AdminStoreForm({ store }: { store: AdminStore }) {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StoreFormValues>({
    resolver: effectResolver(storeFormSchema),
    defaultValues: {
      name: store.name,
      description: store.description,
      email: store.email,
      phone: store.phone,
      facebook: store.facebook ?? '',
      instagram: store.instagram ?? '',
      city: store.city ?? '',
      hours: store.hours ?? '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError('')

    const result = await adminUpdateStore({ data: { ...values, storeId: store.id } })

    if (result._tag === 'Failure') {
      setServerError(result.failure.message)
      return
    }

    await router.invalidate()
    toast.success('Податоците за продавницата се зачувани.')
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <StoreFields register={register} errors={errors} />

      {serverError ? (
        <Message variant="error" className="mb-5">
          <p>{serverError}</p>
        </Message>
      ) : null}

      <Button type="submit" variant="positive" disabled={isSubmitting}>
        {isSubmitting ? 'Зачувуваме…' : 'Зачувај податоци'}
      </Button>
    </form>
  )
}
