import '#/styles/app.css'
import '#/lib/i18n'
import '@fontsource-variable/literata'
import '@fontsource-variable/onest'

import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'

import { AmberBar } from '#/components/shell/amber-bar'
import { CookieConsent } from '#/components/shell/cookie-consent'
import { SiteFooter } from '#/components/shell/site-footer'
import { SiteHeader } from '#/components/shell/site-header'
import { Button } from '#/components/ui/button'
import { getShellConfig } from '#/server/functions/config'
import { listStores } from '#/server/functions/stores'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: ({ loaderData }) => ({
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
      { property: 'og:locale', content: 'mk_MK' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'ЕДНА Е МАЈКА' },
      { name: 'twitter:description', content: 'Тука се сите домашни производи.' },
      { name: 'twitter:image', content: '/edna-e-majka-og.jpg' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
    scripts: loaderData?.assetsBaseUrl
      ? [{ children: `window.__ASSETS_BASE_URL__=${JSON.stringify(loaderData.assetsBaseUrl)}` }]
      : [],
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
      <p className="mt-3 text-black/60">
        Проверете ја адресата или почете од една од страниците подолу.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="primary">
          <Link to="/">Почетна</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/producers">Производители</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/categories/$slug" params={{ slug: 'honey' }}>
            Категории
          </Link>
        </Button>
      </div>
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:shadow"
      >
        Скокни на содржината
      </a>
      <div className="flex min-h-screen flex-col">
        <AmberBar />
        <div className="mx-auto flex w-full max-w-[80rem] flex-1 flex-col bg-white shadow-[0_0_20px_rgba(34,36,38,0.04)]">
          <SiteHeader stores={stores} googleEnabled={googleEnabled} />
          <main id="main-content" className="flex-1">
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
        <CookieConsent />
        <Scripts />
      </body>
    </html>
  )
}
