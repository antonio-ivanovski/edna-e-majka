import { useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Field, Input } from '#/components/ui/field'
import { Message } from '#/components/ui/message'
import { type Schema } from 'effect'
import { Profile } from '#/api/schemas'
import { effectResolver } from '#/lib/effect-resolver'
import { deleteUserAvatar, uploadUserAvatar } from '#/lib/uploads'

type ProfileValues = Schema.Schema.Type<typeof Profile>
import { updateAccount } from '#/server/functions/account'



/** The name and the picture on the account. */
export function AccountProfileForm({ name, image }: { name: string; image: string | null }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: effectResolver(Profile),
    defaultValues: { name },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError('')

    const result = await updateAccount({ data: { name: values.name } })

    if (result._tag === 'Failure') {
      setServerError(result.failure.message)
      return
    }

    await router.invalidate()
    toast.success('Податоците се зачувани.')
  })

  const onPick = async (files: FileList | null) => {
    const file = files?.[0]

    if (!file) {
      return
    }

    setBusy(true)

    const result = await uploadUserAvatar(file)

    setBusy(false)

    if (result._tag === 'Failure') {
      toast.error(result.failure.message)
    } else {
      await router.invalidate()
    }

    if (input.current) {
      input.current.value = ''
    }
  }

  const onRemove = async () => {
    setBusy(true)

    const result = await deleteUserAvatar()

    setBusy(false)

    if (result._tag === 'Failure') {
      toast.error(result.failure.message)
    } else {
      await router.invalidate()
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label="Име" htmlFor="account-name" error={errors.name?.message}>
        <Input id="account-name" aria-invalid={Boolean(errors.name)} {...register('name')} />
      </Field>

      <Field label="Слика">
        <div className="flex flex-wrap items-center gap-4">
          {image ? (
            <img
              src={image}
              alt=""
              width={64}
              height={64}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <span aria-hidden="true" className="size-16 rounded-full bg-black/[0.05]" />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => void onPick(event.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              {busy ? 'Прикачуваме…' : 'Изберете слика'}
            </Button>
            {image ? (
              <Button type="button" variant="ghost" disabled={busy} onClick={() => void onRemove()}>
                Отстрани
              </Button>
            ) : null}
          </div>
        </div>
      </Field>

      {serverError ? (
        <Message variant="error">
          <p>{serverError}</p>
        </Message>
      ) : null}

      <Button type="submit" variant="positive" disabled={isSubmitting || busy}>
        {isSubmitting ? 'Зачувуваме…' : 'Зачувај'}
      </Button>
    </form>
  )
}
