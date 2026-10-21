import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Schema } from 'effect'
import { Button } from '#/components/ui/button'
import { Field, Input } from '#/components/ui/field'
import { Message } from '#/components/ui/message'
import { effectResolver } from '#/lib/effect-resolver'
import { authClient } from '#/lib/auth-client'

const emailSchema = Schema.Struct({
  email: Schema.String.pipe(Schema.check(Schema.isPattern(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/))),
})

type EmailValues = Schema.Schema.Type<typeof emailSchema>

/**
 * Passwordless sign-in: one address, one link. The same form serves the header
 * dialog and the sign-in page.
 */
export function SignInForm({
  googleEnabled,
  onSent,
}: {
  googleEnabled: boolean
  onSent?: () => void
}) {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailValues>({ resolver: effectResolver(emailSchema), defaultValues: { email: '' } })

  const onSubmit = handleSubmit(async ({ email }) => {
    setError('')

    const { error: requestError } = await authClient.signIn.magicLink({
      email,
      callbackURL: '/manage',
    })

    if (requestError) {
      setError(requestError.message || 'Не успеавме да го испратиме линкот. Обидете се повторно.')
      return
    }

    setSentTo(email)
    onSent?.()
  })

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <Message variant="success" title="Проверете ја електронската пошта.">
          <p>
            Испративме линк за најава на <strong>{sentTo}</strong>. Линкот важи 15 минути и може да
            се искористи само еднаш.
          </p>
        </Message>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => setSentTo(null)}>
            Испрати повторно
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={onSubmit} noValidate>
        <Field label="Електронска пошта" htmlFor="sign-in-email" error={errors.email?.message}>
          <Input
            id="sign-in-email"
            type="email"
            autoComplete="email"
            placeholder="ime@primer.mk"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </Field>

        {error ? (
          <Message variant="error" className="mb-4">
            <p>{error}</p>
          </Message>
        ) : null}

        <Button type="submit" variant="primary" fluid disabled={isSubmitting}>
          {isSubmitting ? 'Испраќаме…' : 'Испрати линк за најава'}
        </Button>
      </form>

      {googleEnabled ? (
        <>
          <div className="flex items-center gap-3 text-xs text-black/40">
            <span className="h-px flex-1 bg-line" />
            или
            <span className="h-px flex-1 bg-line" />
          </div>
          <Button
            type="button"
            variant="outline"
            fluid
            disabled={googleLoading}
            onClick={async () => {
              setGoogleLoading(true)
              setError('')
              const { error: googleError } = await authClient.signIn.social({
                provider: 'google',
                callbackURL: '/manage',
              })

              if (googleError) {
                setError(googleError.message || 'Најавата со Google не успеа. Обидете се повторно.')
                setGoogleLoading(false)
              }
            }}
          >
            {googleLoading ? 'Пренасочуваме…' : 'Продолжи со Google'}
          </Button>
        </>
      ) : null}

      <p className="text-xs text-black/45">
        Без лозинки: ќе добиете еднократен линк на вашата адреса, со важност од 15 минути.
      </p>
    </div>
  )
}
