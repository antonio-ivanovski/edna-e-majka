import { createFileRoute } from '@tanstack/react-router'

import { Panel } from '#/components/ui/panel'

export const Route = createFileRoute('/cookies')({
  head: () => ({ meta: [{ title: 'Политика за колачиња | ЕДНА Е МАЈКА' }] }),
  component: CookiesPage,
})

function CookiesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Политика за колачиња</h1>
      <Panel className="mt-6 space-y-4 p-6 text-ink">
        <p>
          Користиме само неопходни колачиња за најава и безбедност на сесијата. Не користиме
          колачиња за следење или рекламирање.
        </p>
        <p>
          Можете да ги избришете колачињата во вашиот прелистувач; со тоа ќе се одјавите од
          платформата.
        </p>
      </Panel>
    </div>
  )
}
