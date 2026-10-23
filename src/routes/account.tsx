import { createFileRoute } from '@tanstack/react-router'

import { DeleteAccountButton } from '#/components/account/delete-account-button'
import { AccountProfileForm } from '#/components/account/profile-form'
import { Button } from '#/components/ui/button'
import { Panel } from '#/components/ui/panel'
import { exportUserData, getAccount, getAccountStore } from '#/server/functions/account'
import { requireViewer } from '#/server/functions/session'

export const Route = createFileRoute('/account')({
  beforeLoad: () => requireViewer(),
  loader: async () => {
    const [account, store] = await Promise.all([getAccount(), getAccountStore()])

    return { account, store }
  },
  head: () => ({
    meta: [{ title: 'Мојата сметка | ЕДНА Е МАЈКА' }, { name: 'robots', content: 'noindex' }],
  }),
  component: AccountPage,
})

function AccountPage() {
  const { account, store } = Route.useLoaderData()

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Мојата сметка</h1>
      <p className="mt-1 text-ink-muted">{account.email}</p>

      <Panel className="mt-6 p-6">
        <h2 className="mb-4 font-display text-xl font-semibold">Податоци</h2>
        <AccountProfileForm name={account.name} image={account.image} />
      </Panel>

      <Panel className="mt-6 p-6">
        <h2 className="font-display text-xl font-semibold">Извези податоци</h2>
        <p className="mt-2 mb-4 text-ink-muted">
          Преземете ги вашите податоци (сметка, продавница, производи) во JSON формат.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            const data = await exportUserData()
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'edna-e-majka-data.json'
            link.click()
            URL.revokeObjectURL(url)
          }}
        >
          Извези JSON
        </Button>
      </Panel>

      <Panel className="mt-6 p-6">
        <h2 className="font-display text-xl font-semibold">Избриши сметката</h2>
        <p className="mt-2 mb-4 text-ink-muted">
          Со избришување на сметката остануваат без простор за враќање. Производите, сликите и
          продавницата ги бришеме заедно со сметката.
        </p>
        <DeleteAccountButton storeName={store?.name ?? null} />
      </Panel>
    </div>
  )
}
