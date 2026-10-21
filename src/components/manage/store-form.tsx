import { useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { toast } from 'sonner'

import { Schema } from 'effect'
import { Button } from '#/components/ui/button'
import { Field, Input, Textarea } from '#/components/ui/field'
import { Message } from '#/components/ui/message'
import { imageUrl } from '#/lib/images'
import { effectResolver } from '#/lib/effect-resolver'
import {
  deleteStoreAvatar,
  deleteStoreCover,
  uploadStoreAvatar,
  uploadStoreCover,
} from '#/lib/uploads'
import { applyForStore, updateStore } from '#/server/functions/manage'
import type { OwnerStore } from '#/server/queries/manage'

/**
 * The form always has a value for the two optional addresses: an empty string.
 * Exported because the admin dashboard edits a shop with the same fields.
 */
export const storeFormSchema = Schema.Struct({
  name: Schema.Trim.pipe(Schema.check(Schema.isMinLength(3)), Schema.check(Schema.isMaxLength(120))),
  description: Schema.Trim.pipe(Schema.check(Schema.isMinLength(30)), Schema.check(Schema.isMaxLength(4000))),
  email: Schema.String.pipe(Schema.check(Schema.isPattern(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/)), Schema.check(Schema.isMaxLength(200))),
  phone: Schema.Trim.pipe(Schema.check(Schema.isMinLength(6)), Schema.check(Schema.isMaxLength(60))),
  facebook: Schema.Trim.pipe(Schema.check(Schema.isMaxLength(300))),
  instagram: Schema.Trim.pipe(Schema.check(Schema.isMaxLength(300))),
  city: Schema.Trim.pipe(Schema.check(Schema.isMaxLength(120))),
  hours: Schema.Trim.pipe(Schema.check(Schema.isMaxLength(200))),
})

export type StoreFormValues = Schema.Schema.Type<typeof storeFormSchema>

/** The six fields of a shop, without the form around them. */
export function StoreFields({
  register,
  errors,
}: {
  register: UseFormRegister<StoreFormValues>
  errors: FieldErrors<StoreFormValues>
}) {
  return (
    <>
      <Field label="Име на продавницата" htmlFor="store-name" error={errors.name?.message}>
        <Input id="store-name" aria-invalid={Boolean(errors.name)} {...register('name')} />
      </Field>

      <Field label="Опис" htmlFor="store-description" error={errors.description?.message}>
        <Textarea
          id="store-description"
          rows={6}
          aria-invalid={Boolean(errors.description)}
          {...register('description')}
        />
      </Field>

      <div className="grid gap-x-5 sm:grid-cols-2">
        <Field label="Е-маил адреса" htmlFor="store-email" error={errors.email?.message}>
          <Input
            id="store-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </Field>

        <Field label="Телефонски број" htmlFor="store-phone" error={errors.phone?.message}>
          <Input
            id="store-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+389 70 000 000"
            aria-invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
        </Field>

        <Field
          label="Facebook"
          htmlFor="store-facebook"
          error={errors.facebook?.message}
          className="[&_label]:font-normal [&_label]:text-black/60"
        >
          <Input
            id="store-facebook"
            placeholder="facebook.com/…"
            aria-invalid={Boolean(errors.facebook)}
            {...register('facebook')}
          />
        </Field>

        <Field
          label="Instagram"
          htmlFor="store-instagram"
          error={errors.instagram?.message}
          className="[&_label]:font-normal [&_label]:text-black/60"
        >
          <Input
            id="store-instagram"
            placeholder="instagram.com/…"
            aria-invalid={Boolean(errors.instagram)}
            {...register('instagram')}
          />
        </Field>

        <Field
          label="Град / регион"
          htmlFor="store-city"
          error={errors.city?.message}
          className="[&_label]:font-normal [&_label]:text-black/60"
        >
          <Input
            id="store-city"
            placeholder="Скопје"
            aria-invalid={Boolean(errors.city)}
            {...register('city')}
          />
        </Field>

        <Field
          label="Работно време"
          htmlFor="store-hours"
          error={errors.hours?.message}
          className="[&_label]:font-normal [&_label]:text-black/60"
        >
          <Input
            id="store-hours"
            placeholder="Пон–Пет 09:00–17:00"
            aria-invalid={Boolean(errors.hours)}
            {...register('hours')}
          />
        </Field>
      </div>
    </>
  )
}

/**
 * The shop, as the producer describes it. The same form applies for a shop and
 * edits one afterwards; the only difference is which server function it calls.
 */
export function StoreForm({
  store,
  onSaved,
}: {
  store?: OwnerStore
  onSaved?: (storeId: string) => void
}) {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StoreFormValues>({
    resolver: effectResolver(storeFormSchema),
    defaultValues: {
      name: store?.name ?? '',
      description: store?.description ?? '',
      email: store?.email ?? '',
      phone: store?.phone ?? '',
      facebook: store?.facebook ?? '',
      instagram: store?.instagram ?? '',
      city: store?.city ?? '',
      hours: store?.hours ?? '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError('')

    if (store) {
      const result = await updateStore({ data: { ...values, storeId: store.id } })

      if (result._tag === 'Failure') {
        setServerError(result.failure.message)
        return
      }

      await router.invalidate()
      toast.success('Податоците за продавницата се зачувани.')

      return
    }

    const result = await applyForStore({ data: values })

    if (result._tag === 'Failure') {
      setServerError(result.failure.message)
      return
    }

    await router.invalidate()
    toast.success('Продавницата е регистрирана.')
    onSaved?.(result.success.storeId)
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <StoreFields register={register} errors={errors} />

      {serverError ? (
        <Message variant="error" className="mb-5">
          <p>{serverError}</p>
        </Message>
      ) : null}

      <Button type="submit" variant="positive" size="lg" disabled={isSubmitting}>
        {isSubmitting ? 'Зачувуваме…' : store ? 'Зачувај' : 'Регистрирај продавница'}
      </Button>

      {!store ? (
        <p className="mt-3 text-sm text-black/45">
          Продавницата се појавува меѓу производителите штом ќе помине автоматската проверка.
        </p>
      ) : null}
    </form>
  )
}

/** The shop logo, replaced in place: the old file is removed from the bucket. */
export function StoreAvatarField({ store }: { store: OwnerStore }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const current = imageUrl(store.avatarKey)

  const onPick = async (files: FileList | null) => {
    const file = files?.[0]

    if (!file) {
      return
    }

    setBusy(true)
    setError('')

    const result = await uploadStoreAvatar(store.id, file)

    if (result._tag === 'Failure') {
      setError(result.failure.message)
    } else {
      await router.invalidate()
    }

    setBusy(false)

    if (input.current) {
      input.current.value = ''
    }
  }

  const onRemove = async () => {
    setBusy(true)
    setError('')

    const result = await deleteStoreAvatar(store.id)

    if (result._tag === 'Failure') {
      setError(result.failure.message)
    } else {
      await router.invalidate()
    }

    setBusy(false)
  }

  return (
    <Field label="Лого на продавницата">
      <div className="flex items-center gap-4">
        {current ? (
          <img
            src={current}
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
          {current ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={() => void onRemove()}>
              Отстрани
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </Field>
  )
}

/** The banner above the shop header, replaced in place like the logo. */
export function StoreCoverField({ store }: { store: OwnerStore }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const current = imageUrl(store.coverKey)

  const onPick = async (files: FileList | null) => {
    const file = files?.[0]

    if (!file) {
      return
    }

    setBusy(true)
    setError('')

    const result = await uploadStoreCover(store.id, file)

    if (result._tag === 'Failure') {
      setError(result.failure.message)
    } else {
      await router.invalidate()
    }

    setBusy(false)

    if (input.current) {
      input.current.value = ''
    }
  }

  const onRemove = async () => {
    setBusy(true)
    setError('')

    const result = await deleteStoreCover(store.id)

    if (result._tag === 'Failure') {
      setError(result.failure.message)
    } else {
      await router.invalidate()
    }

    setBusy(false)
  }

  return (
    <Field label="Cover слика на продавницата">
      <div className="flex flex-wrap items-center gap-4">
        {current ? (
          <img
            src={current}
            alt=""
            width={240}
            height={90}
            className="h-[90px] w-[240px] rounded-[0.2857rem] border border-line object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-[90px] w-[240px] items-center justify-center rounded-[0.2857rem] border border-dashed border-line bg-black/[0.02] text-xs text-black/40"
          >
            Нема cover слика
          </span>
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
          {current ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={() => void onRemove()}>
              Отстрани
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </Field>
  )
}
