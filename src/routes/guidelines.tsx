import { createFileRoute } from '@tanstack/react-router'

import { Panel } from '#/components/ui/panel'

export const Route = createFileRoute('/guidelines')({
  head: () => ({ meta: [{ title: 'Водич за производители | ЕДНА Е МАЈКА' }] }),
  component: GuidelinesPage,
})

function GuidelinesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Водич за производители</h1>
      <Panel className="mt-6 space-y-4 p-6 text-ink">
        <p>
          Регистрирајте ја вашата продавница, додајте ги производите со пакувања и цени, и прикачете
          квалитетни слики. Првата слика се прикажува на картичката.
        </p>
        <h2 className="font-semibold text-ink">Совети</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Користете јасни наслови и описи.</li>
          <li>Наведете ги сите пакувања со цени.</li>
          <li>Одговарајте брзо на барањата од купувачите.</li>
          <li>Ажурирајте ја достапноста на производите.</li>
        </ul>
      </Panel>
    </div>
  )
}
