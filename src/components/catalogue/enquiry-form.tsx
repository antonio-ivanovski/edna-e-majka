import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Schema } from 'effect'
// (inlined)
import { effectResolver } from '#/lib/effect-resolver'
import { submitEnquiry } from '#/server/functions/contact'

import { Button } from '#/components/ui/button'
import { Field, Input, Textarea } from '#/components/ui/field'
import { Message } from '#/components/ui/message'
import { Email } from '#/api/schemas/common'
import { toResult } from '#/lib/server-result'

const formSchema = Schema.Struct({
  name: Schema.Trim.pipe(
    Schema.check(Schema.isMinLength(2)),
    Schema.check(Schema.isMaxLength(120)),
  ),
  email: Email,
  phone: Schema.optional(Schema.Trim.pipe(Schema.check(Schema.isMaxLength(60)))),
  message: Schema.Trim.pipe(
    Schema.check(Schema.isMinLength(10)),
    Schema.check(Schema.isMaxLength(2000)),
  ),
  honeypot: Schema.String.pipe(Schema.check(Schema.isMaxLength(0))),
})

type FormValues = Schema.Schema.Type<typeof formSchema>

export function EnquiryForm({ storeId, productId }: { storeId: string; productId?: string }) {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')
  const [startedAt] = useState(() => Date.now())

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: effectResolver(formSchema), defaultValues: { honeypot: '' } })

  const onSubmit = handleSubmit(async (values) => {
    setServerError('')

    let result: Awaited<ReturnType<typeof submitEnquiry>>

    try {
      result = toResult(
        await submitEnquiry({
          data: {
            storeId,
            productId,
            name: values.name,
            email: values.email,
            phone: values.phone,
            message: values.message,
            honeypot: values.honeypot,
            startedAt,
          },
        }),
      )
    } catch {
      setServerError(
        'Пораката не можеше да се испрати. Проверете ја врската и обидете се повторно.',
      )
      return
    }

    if (result._tag === 'Failure') {
      setServerError(result.failure.message)
      return
    }
    setSent(true)
  })

  if (sent) {
    return (
      <Message variant="success" title="Пораката е испратена">
        <p>Производителот ќе ви одговори на вашата е-маил адреса.</p>
      </Message>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <Field label="Име" htmlFor="enquiry-name" error={errors.name?.message}>
        <Input id="enquiry-name" {...register('name')} />
      </Field>
      <Field label="Е-маил" htmlFor="enquiry-email" error={errors.email?.message}>
        <Input id="enquiry-email" type="email" {...register('email')} />
      </Field>
      <Field label="Телефон" htmlFor="enquiry-phone" error={errors.phone?.message}>
        <Input id="enquiry-phone" type="tel" {...register('phone')} />
      </Field>
      <Field label="Порака" htmlFor="enquiry-message" error={errors.message?.message}>
        <Textarea id="enquiry-message" rows={4} {...register('message')} />
      </Field>
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="sr-only"
        {...register('honeypot')}
      />
      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}
      <Button type="submit" variant="positive" disabled={isSubmitting}>
        {isSubmitting ? 'Испраќаме…' : 'Испрати порака'}
      </Button>
    </form>
  )
}
