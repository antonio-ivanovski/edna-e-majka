import { createFileRoute } from '@tanstack/react-router'

import { SignInForm } from '#/components/auth/sign-in-form'
import { getShellConfig } from '#/server/functions/config'

export const Route = createFileRoute('/sign-in')({
  loader: () => getShellConfig(),
  head: () => ({
    meta: [{ title: 'Најава | ЕДНА Е МАЈКА' }, { name: 'robots', content: 'noindex' }],
  }),
  component: SignInPage,
})

function SignInPage() {
  const { googleEnabled } = Route.useLoaderData()

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Најава</h1>
      <p className="mt-2 mb-6 text-ink-muted">
        Внесете ја вашата е-маил адреса и ќе ви пратиме линк за најава. Лозинка не ви треба.
      </p>
      <SignInForm googleEnabled={googleEnabled} />
    </div>
  )
}
