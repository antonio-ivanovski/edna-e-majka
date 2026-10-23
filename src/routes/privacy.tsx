import { createFileRoute } from '@tanstack/react-router'

import { Panel } from '#/components/ui/panel'

export const Route = createFileRoute('/privacy')({
  head: () => ({ meta: [{ title: 'Политика на приватност | ЕДНА Е МАЈКА' }] }),
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Политика на приватност</h1>
      <Panel className="mt-6 space-y-4 p-6 text-ink">
        <p>
          Собираме само податоци неопходни за функционирање на платформата: е-маил, име, податоци за
          продавницата и производите, како и технички податоци (IP, прелистувач).
        </p>
        <h2 className="font-semibold text-ink">Користење</h2>
        <p>
          Податоците се користат за најава, прикажување на производите и комуникација со
          производителите. Не продаваме податоци на трети страни.
        </p>
        <h2 className="font-semibold text-ink">Вашите права</h2>
        <p>
          Можете да побарате пристап, исправка или бришење на вашите податоци на info@ednaemajka.mk.
        </p>
        <h2 className="font-semibold text-ink">Колачиња</h2>
        <p>
          Користиме само неопходни колачиња за сесија и безбедност. Видете ја Политиката за
          колачиња.
        </p>
      </Panel>
    </div>
  )
}
