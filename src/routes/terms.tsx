import { createFileRoute } from '@tanstack/react-router'

import { Panel } from '#/components/ui/panel'

export const Route = createFileRoute('/terms')({
  head: () => ({ meta: [{ title: 'Услови за користење | ЕДНА Е МАЈКА' }] }),
  component: TermsPage,
})

function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Услови за користење</h1>
      <Panel className="mt-6 space-y-4 p-6 text-ink">
        <p>
          Платформата „Една е Мајка“ е бесплатен огласник за домашни производи. Со користење на
          платформата се согласувате со условите подолу.
        </p>
        <h2 className="font-semibold text-ink">1. Содржина</h2>
        <p>
          Производителите се одговорни за точноста на описите, цените и сликите на своите производи.
          Платформата не е страна во договорите меѓу производител и купувач.
        </p>
        <h2 className="font-semibold text-ink">2. Забранета содржина</h2>
        <p>
          Забранети се измамнички, незаконски или штетни огласи. Платформата го задржува правото да
          отстрани содржина и да суспендира сметки.
        </p>
        <h2 className="font-semibold text-ink">3. Контакт</h2>
        <p>За прашања, контактирајте нѐ на info@ednaemajka.mk.</p>
      </Panel>
    </div>
  )
}
