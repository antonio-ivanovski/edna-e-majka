import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { CatalogueList } from '#/components/catalogue/catalogue-list'
import { ContactDialog } from '#/components/shell/contact-dialog'
import { Message } from '#/components/ui/message'
import { CATEGORIES } from '#/lib/categories'
import { imageUrl } from '#/lib/images'
import { readRecentlyViewed, type RecentProduct } from '#/lib/recently-viewed'
import { parseProductSearch, resolveProductSearch } from '#/lib/search-params'
import { listProducts } from '#/server/functions/products'
import { PRODUCT_PAGE_SIZE } from '#/lib/pagination'

export const Route = createFileRoute('/')({
  validateSearch: parseProductSearch,
  loaderDeps: ({ search }) => resolveProductSearch(search),
  loader: async ({ deps }) => ({
    params: deps,
    page: await listProducts({ data: deps }),
  }),
  head: () => ({
    meta: [{ title: 'ЕДНА Е МАЈКА' }],
  }),
  component: HomePage,
})

function HomePage() {
  const { page, params } = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const [recent, setRecent] = useState<RecentProduct[]>([])

  useEffect(() => {
    setRecent(readRecentlyViewed())
  }, [])

  return (
    <div>
      <Message className="m-2.5">
        <h1 className="mb-4 font-display text-[1.6rem] leading-snug font-semibold">
          Добредојдовте на ЕДНА Е МАЈКА
        </h1>
        <p>
          „Една е мајка“ е онлајн платформа која служи како огласник за домашни производи. Тука
          индивидуални произведувачи на домашни производи со висок квалитет ги објавуваат своите
          производи, додека купувачите на лесен и прегледен начин имаат пристап на истите.
        </p>
        <p>
          Користењето на платформата е бесплатно за сите, нема никакви трошоци ни за огласување на
          производите, ниту за купување на истите.
        </p>
        <p>
          Доколку сте производител и сакате да огласите вашите производи или сакате да видите
          производите на вашиот омилен производител,{' '}
          <ContactDialog
            trigger={
              <button
                type="button"
                className="cursor-pointer font-bold underline underline-offset-2"
              >
                контактирајте нѐ.
              </button>
            }
          />
        </p>
      </Message>

      <div className="flex flex-wrap items-stretch justify-around">
        {CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            to="/categories/$slug"
            params={{ slug: category.slug }}
            className="flex-[1_1_100px] cursor-pointer p-[15px] text-center font-semibold transition-transform duration-200 ease-out hover:scale-105 hover:bg-[radial-gradient(closest-side,#ffc145,#ffc14500)]"
          >
            <img src={category.icon} alt="" width={80} height={80} className="mx-auto h-20 w-20" />
            <span className="block pt-1.5">{category.title}</span>
          </Link>
        ))}
      </div>

      {recent.length > 0 ? (
        <section className="px-4 pt-4">
          <h2 className="font-display text-xl font-semibold">Неодамна прегледани</h2>
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {recent.map((item) => (
              <Link
                key={item.id}
                to="/products/$productId"
                params={{ productId: item.id }}
                className="flex flex-col items-center gap-2 rounded border border-line bg-white p-3 text-center hover:shadow"
              >
                {item.imageKey ? (
                  <img
                    src={imageUrl(item.imageKey)}
                    alt={item.title}
                    width={120}
                    height={90}
                    className="h-[90px] w-full rounded object-cover"
                  />
                ) : null}
                <span className="line-clamp-2 text-sm font-semibold">{item.title}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <CatalogueList
        products={page.items}
        total={page.total}
        sort={params.sort}
        direction={params.direction}
        page={params.page}
        pageSize={PRODUCT_PAGE_SIZE}
        emptyTitle="Сѐ уште нема објавени производи."
        emptyDescription="Штом производителите ги објават своите производи, тие ќе се појават тука."
        onParamsChange={(next) => void navigate({ search: (prev) => ({ ...prev, ...next }) })}
      />
    </div>
  )
}
