import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { nowMs } from '#/lib/clock'
import { cooperationMessageSchema } from '#/lib/schemas'
import { submitCooperationMessage } from '#/server/functions/contact'

import { Button } from '#/components/ui/button'
import { Field, Input, Textarea } from '#/components/ui/field'
import { Message } from '#/components/ui/message'

/** The honeypot and the start time are added on submit, not asked from anyone. */
const formSchema = cooperationMessageSchema
  .omit({ startedAt: true, honeypot: true })
  .extend({ honeypot: z.string() })

type FormValues = z.input<typeof formSchema>

/** The form behind the amber bar's "Соработка", loaded only when it opens. */
export function CooperationForm({ onSent }: { onSent: () => void }) {
  const [startedAt] = useState(() => nowMs())
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', phone: '', website: '', message: '', honeypot: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError('')

    try {
      const result = await submitCooperationMessage({ data: { ...values, startedAt } })

      if (result.ok) {
        onSent()
        return
      }

      setServerError(result.message)
    } catch {
      setServerError('Грешка при праќање на пораката. Обидете се повторно.')
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <p className="mb-5 font-bold text-black/[0.87]">
        Пополнете ја формата за соработка и стапете во контакт со нашиот тим.
      </p>

      {serverError ? (
        <Message
          variant="error"
          className="mb-5"
          title="Грешка при праќање на порака. Обидете се повторно или пратете ни е-маил на sorabotka@ednaemajka.mk."
        >
          <p>{serverError}</p>
        </Message>
      ) : null}

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Име и презиме" htmlFor="cooperation-name" error={errors.name?.message}>
          <Input
            id="cooperation-name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </Field>
        <Field label="Телефонски број" htmlFor="cooperation-phone" error={errors.phone?.message}>
          <Input
            id="cooperation-phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
        </Field>
        <Field label="Е-маил адреса" htmlFor="cooperation-email" error={errors.email?.message}>
          <Input
            id="cooperation-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </Field>
        <Field label="Веб-сајт или Facebook или Instagram" htmlFor="cooperation-website">
          <Input id="cooperation-website" {...register('website')} />
        </Field>
      </div>

      <Field label="Порака" htmlFor="cooperation-message">
        <Textarea id="cooperation-message" rows={5} {...register('message')} />
      </Field>

      {/* Invisible to people, irresistible to bots. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute size-0 opacity-0"
        {...register('honeypot')}
      />

      <Button type="submit" variant="positive" fluid disabled={isSubmitting}>
        {isSubmitting ? 'Испраќаме…' : 'Испрати'}
      </Button>
    </form>
  )
}
