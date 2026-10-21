import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'

import { StoreForm } from '#/components/manage/store-form'
import { Button } from '#/components/ui/button'
import { Message } from '#/components/ui/message'
import { getManageHome } from '#/server/functions/manage'
import { requireViewer } from '#/server/functions/session'

export const Route = createFileRoute('/manage/new')({
  beforeLoad: () => requireViewer(),
  loader: () => getManageHome(),
  head: () => ({
    meta: [
      { title: 'Регистрација на продавница | ЕДНА Е МАЈКА' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: NewStorePage,
})

function NewStorePage() {
  const { store } = Route.useLoaderData()
  const navigate = useNavigate()

  if (store) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <Message variant="info" title="Веќе имате продавница">
          <p className="mt-1">Едно лице управува со една продавница. Продолжете кон вашата.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/manage">Кон продавницата</Link>
          </Button>
        </Message>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Регистрација на продавница</h1>
      <p className="mt-2 mb-6 text-black/60">
        Кажете ни со што се занимавате и како да ве контактираат. Продавницата се регистрира веднаш,
        а автоматската проверка решава дали ќе се појави јавно или ќе чека рачен преглед.
      </p>

      <StoreForm onSaved={() => void navigate({ to: '/manage' })} />
    </div>
  )
}
