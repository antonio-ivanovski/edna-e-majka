import '#/styles/app.css'
import '@fontsource-variable/literata'
import '@fontsource-variable/onest'

import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'

import { AmberBar } from '#/components/shell/amber-bar'
import { SiteFooter } from '#/components/shell/site-footer'
import { SiteHeader } from '#/components/shell/site-header'
import { Button } from '#/components/ui/button'
import { getShellConfig } from '#/server/functions/config'
import { listStores } from '#/server/functions/stores'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ЕДНА Е МАЈКА' },
      { name: 'description', content: 'Тука се сите домашни производи.' },
      { name: 'theme-color', content: '#db2828' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'ЕДНА Е МАЈКА' },
      { property: 'og:title', content: 'ЕДНА Е МАЈКА' },
      { property: 'og:description', content: 'Тука се сите домашни производи.' },
      { property: 'og:image', content: '/edna-e-majka-og.jpg' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
  }),
  /**
   * The header needs the producer list and whether Google is configured. It
   * runs once per document, not on every client navigation.
   */
  loader: async () => {
    const [stores, config] = await Promise.all([listStores(), getShellConfig()])

    return { stores, ...config }
  },
  component: RootComponent,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="font-display text-3xl font-semibold">Страницата не е најдена</h1>
      <p className="mt-3 text-black/60">Проверете ја адресата или почете од почетната страница.</p>
      <Button asChild variant="primary" className="mt-6">
        <Link to="/">Кон почетната</Link>
      </Button>
    </div>
  ),
  errorComponent: ({ error, reset }: { error: unknown; reset: () => void }) => (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center" role="alert">
      <h1 className="font-display text-3xl font-semibold">Нешто тргна наопаку</h1>
      <p className="mt-3 text-black/60">Страницата не можеше да се вчита. Обидете се повторно.</p>
      <p className="mt-1 text-sm text-black/40">{error instanceof Error ? error.message : ''}</p>
      <Button type="button" variant="primary" className="mt-6" onClick={reset}>
        Обиди се повторно
      </Button>
    </div>
  ),
})

function RootComponent() {
  const { stores, googleEnabled } = Route.useLoaderData()

  return (
    <RootDocument>
      <div className="flex min-h-screen flex-col">
        <AmberBar />
        <div className="mx-auto flex w-full max-w-[80rem] flex-1 flex-col bg-white shadow-[0_0_20px_rgba(34,36,38,0.04)]">
          <SiteHeader stores={stores} googleEnabled={googleEnabled} />
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
        <SiteFooter />
      </div>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="mk">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
        <Scripts />
      </body>
    </html>
  )
}
