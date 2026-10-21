/**
 * Demo data for local development and staging. Never run against production:
 * it clears the catalogue and puts fixture rows in its place.
 *
 * Runs outside the Worker with wrangler's platform proxy, so it uses the very
 * same local D1 database and R2 bucket as `pnpm dev`.
 *
 *   pnpm db:seed
 */
import { readFile } from 'node:fs/promises'

import { like } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { getPlatformProxy } from 'wrangler'

import type { CategorySlug } from '#/lib/categories'
import { buildSearchText } from '#/lib/translit'
import { user } from '#/server/db/auth-schema'
import { product, productCategory, productImage, productVariant, store } from '#/server/db/schema'

/** The images that already ship with the site, used as stand-in photos. */
const IMAGE_SOURCES = {
  landscape: {
    path: 'public/edna-e-majka-og.jpg',
    width: 1200,
    height: 630,
    contentType: 'image/jpeg',
  },
  square: {
    path: 'public/android-chrome-512x512.png',
    width: 512,
    height: 512,
    contentType: 'image/png',
  },
  avatar: {
    path: 'public/assets/avatar-placeholder.jpg',
    width: 600,
    height: 600,
    contentType: 'image/jpeg',
  },
  logo: { path: 'public/logo.png', width: 500, height: 370, contentType: 'image/png' },
} as const

type ImageSource = keyof typeof IMAGE_SOURCES

/** Demo accounts only: the domain is reserved and receives no mail. */
const DEMO_EMAIL_SUFFIX = '@demo.ednaemajka.mk'

type DemoStore = {
  id: string
  owner: { id: string; name: string; email: string }
  name: string
  description: string
  avatar: ImageSource
  phone: string
  facebook: string | null
  instagram: string | null
  status: 'active' | 'pending' | 'suspended'
  statusNote?: string
}

type DemoProduct = {
  id: string
  storeId: string
  title: string
  description: string
  categories: CategorySlug[]
  variants: { title: string; price: number }[]
  images: { source: ImageSource; alt: string }[]
  daysAgo: number
  status?: 'published' | 'archived'
}

const STORES: DemoStore[] = [
  {
    id: 'demo-store-medena-kukja',
    owner: {
      id: 'demo-user-marko',
      name: 'Марко Стојанов',
      email: `marko${DEMO_EMAIL_SUFFIX}`,
    },
    name: 'Медена куќа',
    description:
      'Семејна пчеларница од селото Сопот, Кавадарци. Работиме со акациев и ливадски мед од нашиот регион, без шеќер и без додатоци. Медот го вршиме два пати годишно и го полниме рачно.',
    avatar: 'avatar',
    phone: '+389 70 123 456',
    facebook: 'https://www.facebook.com/medenakukja',
    instagram: 'https://www.instagram.com/medenakukja',
    status: 'active',
  },
  {
    id: 'demo-store-babina-kujna',
    owner: {
      id: 'demo-user-elena',
      name: 'Елена Петрова',
      email: `elena${DEMO_EMAIL_SUFFIX}`,
    },
    name: 'Бабина кујна',
    description:
      'Домашни зимници по рецептите на баба ми: џемови, слатка, ајвар и тестенини. Сѐ што користиме доаѓа од нашиот двор или од соседите во Преспа. Готвиме во мали количини, на старо, без конзерванси.',
    avatar: 'square',
    phone: '+389 71 987 654',
    facebook: 'https://www.facebook.com/babinakujna',
    instagram: null,
    status: 'active',
  },
  {
    id: 'demo-store-sumska-berba',
    owner: {
      id: 'demo-user-jovana',
      name: 'Јована Ристеска',
      email: `jovana${DEMO_EMAIL_SUFFIX}`,
    },
    name: 'Шумска берба',
    description:
      'Ги бериме и сушиме печурките и шумските плодови од планините околу Крушево. Сушењето е на сонце и на воздух, без сулфур. Работиме само во сезона, кога шумата го дава најдоброто.',
    avatar: 'logo',
    phone: '+389 75 456 789',
    facebook: 'https://www.facebook.com/sumskaberba',
    instagram: 'https://www.instagram.com/sumskaberba',
    status: 'active',
  },
  {
    id: 'demo-store-cveten-med',
    owner: {
      id: 'demo-user-darko',
      name: 'Дарко Илиев',
      email: `darko${DEMO_EMAIL_SUFFIX}`,
    },
    name: 'Цветен мед',
    description:
      'Мала пчеларница од Велес која штотуку почнува со продажба на мед и пчелни производи преку интернет.',
    avatar: 'avatar',
    phone: '+389 78 111 222',
    facebook: null,
    instagram: null,
    status: 'pending',
    statusNote: 'Примената чека преглед од администратор.',
  },
  {
    id: 'demo-store-viktorija',
    owner: {
      id: 'demo-user-viktorija',
      name: 'Викторија Николова',
      email: `viktorija${DEMO_EMAIL_SUFFIX}`,
    },
    name: 'Викторија мед',
    description:
      'Продавница за мед и пчелни производи од Битола. Профилот е суспендиран додека не се проверат контакт податоците.',
    avatar: 'square',
    phone: '+389 76 333 444',
    facebook: null,
    instagram: null,
    status: 'suspended',
    statusNote: 'Неодговорен телефонски број при проверка.',
  },
]

const PRODUCTS: DemoProduct[] = [
  {
    id: 'demo-product-akaciev-med',
    storeId: 'demo-store-medena-kukja',
    title: 'Акациев мед',
    description:
      'Акациевиот мед е најсветлиот мед од нашата пчеларница. Има благ, речиси ванилов вкус и долго останува течен, па е идеален за деца и за разредување во чај.\n\nГо вршиме во мај, кога акацијата цвета во Кавадаречко. Овој мед не е пастеризиран и може да кристализира на пониска температура — тоа е знак за неговата природност.',
    categories: ['honey'],
    variants: [
      { title: '500 г', price: 450 },
      { title: '1 кг', price: 850 },
    ],
    images: [
      { source: 'landscape', alt: 'Акациев мед во тегла' },
      { source: 'square', alt: 'Акациев мед, затворена тегла' },
    ],
    daysAgo: 2,
  },
  {
    id: 'demo-product-livadski-med',
    storeId: 'demo-store-medena-kukja',
    title: 'Ливадски мед',
    description:
      'Ливадскиот мед се прави од она што ќе процвета на ливадите околу селото: детелина, мајчина душица, босилек. Потемен е од акациевиот и има поизразен аромат.\n\nОдличен е за секојдневна употреба, а најдобро му оди со топол чај или намачкан на препечена филија.',
    categories: ['honey'],
    variants: [{ title: '720 мл', price: 520 }],
    images: [{ source: 'landscape', alt: 'Ливадски мед' }],
    daysAgo: 6,
  },
  {
    id: 'demo-product-maticen-mlek',
    storeId: 'demo-store-medena-kukja',
    title: 'Матичен млеч',
    description:
      'Свеж матичен млеч, собран во мај и веднаш замрзнат, па доставен во термо пакување. Се чува во фрижидер.\n\nДневната доза за возрасни е од 100 до 300 мг наутро, на гладно. Не е наменет за лица со алергија на пчелни производи.',
    categories: ['bee-products'],
    variants: [{ title: '10 г', price: 1200 }],
    images: [{ source: 'square', alt: 'Матичен млеч во мало шише' }],
    daysAgo: 9,
  },
  {
    id: 'demo-product-propolis',
    storeId: 'demo-store-medena-kukja',
    title: 'Прополис капки',
    description:
      'Прополис растворен во вода и алкохол од жито, за капнување во грло при настинка. Едно шишенце од 30 мл содржи околу 600 капки.\n\nСе зема по 10 капки во малку вода, два пати на ден. Се чува на темно и ладно место.',
    categories: ['bee-products'],
    variants: [{ title: '30 мл', price: 600 }],
    images: [{ source: 'logo', alt: 'Прополис капки' }],
    daysAgo: 14,
  },
  {
    id: 'demo-product-dzem-kajsija',
    storeId: 'demo-store-babina-kujna',
    title: 'Домашен џем од кајсија',
    description:
      'Џемот се готви со кајсии од нашиот двор, со малку шеќер и лимон. Нема пектин и нема конзерванс: само овошје што полека се вари во бакарен казан.\n\nТеглата е 370 мл, а по отворање се чува во фрижидер до две недели.',
    categories: ['jams-jelly'],
    variants: [{ title: '370 мл', price: 280 }],
    images: [{ source: 'landscape', alt: 'Тегла домашен џем од кајсија' }],
    daysAgo: 1,
  },
  {
    id: 'demo-product-slatko-cresi',
    storeId: 'demo-store-babina-kujna',
    title: 'Слатко од цреши',
    description:
      'Црешите ги чистиме од коските со рака, а шеќерот го мериме на око, по старо: една мерка цреши, една мерка шеќер. Слаткото е густо и има цели плодови.\n\nОди со палачинки, со млад сирење или како полнење во колачи.',
    categories: ['jams-jelly'],
    variants: [{ title: '500 г', price: 350 }],
    images: [{ source: 'square', alt: 'Слатко од цреши во тегла' }],
    daysAgo: 4,
  },
  {
    id: 'demo-product-ajvar',
    storeId: 'demo-store-babina-kujna',
    title: 'Ајвар од печени пиперки',
    description:
      'Ајварот се пече на шпорет на дрва, па пиперките се лупат рачно — затоа има густа, влакнеста текстура, а не фина паста.\n\nГотвиме во септември, во голем казан, со малку модар патлиџан, оцет и сончогледово масло. Теглата е 550 г.',
    categories: ['spreads'],
    variants: [
      { title: '550 г', price: 300 },
      { title: '1 кг', price: 520 },
    ],
    images: [{ source: 'logo', alt: 'Ајвар во тегла' }],
    daysAgo: 11,
  },
  {
    id: 'demo-product-testenini',
    storeId: 'demo-store-babina-kujna',
    title: 'Домашни тестенини',
    description:
      'Тестенините се сушат на сонце, на даска, а тестото е од брашно, јајца од нашата кокошарник и малку сол. Пакетот е 400 г.\n\nСе варат за четири до пет минути и малото количество вода што ќе остане го прави сосот густ и сјаен.',
    categories: ['pasta'],
    variants: [{ title: '400 г', price: 180 }],
    images: [{ source: 'landscape', alt: 'Домашни тестенини на даска' }],
    daysAgo: 18,
  },
  {
    id: 'demo-product-vrganjci',
    storeId: 'demo-store-sumska-berba',
    title: 'Сушени вргањци',
    description:
      'Вргањците ги бериме во јули, во буковите шуми над Крушево. Ги сушиме на воздух, во сенка, па ги пакуваме цели или кришени.\n\nОвој бел вргањ најчесто се продава кришен: за супа, за сос во тава или за мешана тава со месо. Кесата е 100 г.',
    categories: ['mushrooms'],
    variants: [
      { title: '100 г', price: 500 },
      { title: '250 г', price: 1150 },
    ],
    images: [{ source: 'square', alt: 'Сушени вргањци' }],
    daysAgo: 3,
  },
  {
    id: 'demo-product-plodovi-med',
    storeId: 'demo-store-sumska-berba',
    title: 'Шумски плодови во мед',
    description:
      'Боровинки и капини собрани во август, заедно со ливадски мед. Нема шеќерен сируп: сѐ е овошје и мед.\n\nОдлично е за појадок со јогурт или како додаток во палачинки. Теглата е 250 г.',
    categories: ['forest-products'],
    variants: [{ title: '250 г', price: 420 }],
    images: [{ source: 'logo', alt: 'Шумски плодови во мед' }],
    daysAgo: 20,
  },
  {
    id: 'demo-product-suseno-ovosje',
    storeId: 'demo-store-sumska-berba',
    title: 'Сушено диво овошје',
    description:
      'Диви јаболка, цреши и коринки од шумата, сушени во сушара на дрва. Без сулфур и без шеќер: само овошје.\n\nСовршено оди со ореви и со малку мед за енергетска ужина. Кесата е 200 г.',
    categories: ['fruits'],
    variants: [
      { title: '200 г', price: 320 },
      { title: '500 г', price: 750 },
    ],
    images: [{ source: 'avatar', alt: 'Сушено диво овошје' }],
    daysAgo: 25,
  },
  {
    id: 'demo-product-arkaden-med',
    storeId: 'demo-store-medena-kukja',
    title: 'Мед од аркадија',
    description: 'Архивиран оглас. Медот од аркадија е веќе продаден.',
    categories: ['honey'],
    variants: [{ title: '500 г', price: 400 }],
    images: [{ source: 'landscape', alt: 'Мед од аркадија' }],
    daysAgo: 40,
    status: 'archived',
  },
]

const daysAgoDate = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

/** D1 allows a hundred bound parameters per statement, so rows go in chunks. */
const MAX_PARAMS_PER_STATEMENT = 90

async function insertInChunks<Row>(
  rows: Row[],
  columnsPerRow: number,
  run: (chunk: Row[]) => Promise<unknown>,
): Promise<void> {
  const chunkSize = Math.max(1, Math.floor(MAX_PARAMS_PER_STATEMENT / columnsPerRow))

  for (let index = 0; index < rows.length; index += chunkSize) {
    await run(rows.slice(index, index + chunkSize))
  }
}

async function uploadImage(bucket: R2Bucket, key: string, source: ImageSource): Promise<void> {
  const { path, contentType } = IMAGE_SOURCES[source]
  const body = await readFile(path)

  await bucket.put(key, body, {
    httpMetadata: { contentType, cacheControl: 'public, max-age=31536000' },
  })
}

/** The file name an image source stands in with, kept in its key. */
const sourceFile = (source: ImageSource) => IMAGE_SOURCES[source].path.split('/').pop() ?? 'image'

const avatarKey = (store: DemoStore) =>
  store.avatar ? `demo/stores/${store.id}/avatar-${sourceFile(store.avatar)}` : null

const productImageKey = (productId: string, index: number, source: ImageSource) =>
  `demo/products/${productId}/${index + 1}-${sourceFile(source)}`

async function main() {
  const platform = await getPlatformProxy<{ DB: D1Database; BUCKET: R2Bucket }>({
    configPath: 'wrangler.jsonc',
    persist: true,
  })

  const db = drizzle(platform.env.DB)
  const bucket = platform.env.BUCKET

  console.info('Clearing the demo catalogue…')

  // Children first: D1 enforces the foreign keys.
  await db.delete(productCategory)
  await db.delete(productVariant)
  await db.delete(productImage)
  await db.delete(product)
  await db.delete(store)
  await db.delete(user).where(like(user.email, `%${DEMO_EMAIL_SUFFIX}`))

  // The demo objects go too, so a re-seed never leaves orphans behind.
  const existing = await bucket.list({ prefix: 'demo/' })

  if (existing.objects.length > 0) {
    await bucket.delete(existing.objects.map((object) => object.key))
  }

  console.info('Uploading demo images…')

  // Every store and every listing gets its own object: an owner who replaces a
  // photo must not delete one that another page is showing.
  const uploads = [
    ...STORES.flatMap((store) => {
      const key = avatarKey(store)

      return key && store.avatar ? [{ key, source: store.avatar }] : []
    }),
    ...PRODUCTS.flatMap((product) =>
      product.images.map((image, index) => ({
        key: productImageKey(product.id, index, image.source),
        source: image.source,
      })),
    ),
  ]

  await Promise.all(uploads.map(({ key, source }) => uploadImage(bucket, key, source)))

  console.info('Writing stores…')

  await insertInChunks(
    STORES.map((demoStore) => ({
      id: demoStore.owner.id,
      name: demoStore.owner.name,
      email: demoStore.owner.email,
      emailVerified: true,
    })),
    4,
    (chunk) => db.insert(user).values(chunk),
  )

  await insertInChunks(
    STORES.map((demoStore) => ({
      id: demoStore.id,
      ownerId: demoStore.owner.id,
      name: demoStore.name,
      description: demoStore.description,
      avatarKey: avatarKey(demoStore),
      email: demoStore.owner.email,
      phone: demoStore.phone,
      facebook: demoStore.facebook,
      instagram: demoStore.instagram,
      status: demoStore.status,
      statusNote: demoStore.statusNote ?? null,
      createdAt: daysAgoDate(60),
      updatedAt: daysAgoDate(1),
    })),
    13,
    (chunk) => db.insert(store).values(chunk),
  )

  console.info('Writing products…')

  await insertInChunks(
    PRODUCTS.map((demoProduct) => ({
      id: demoProduct.id,
      storeId: demoProduct.storeId,
      title: demoProduct.title,
      description: demoProduct.description,
      searchText: buildSearchText(demoProduct.title, demoProduct.description),
      status: demoProduct.status ?? 'published',
      archivedAt: demoProduct.status === 'archived' ? daysAgoDate(demoProduct.daysAgo - 1) : null,
      createdAt: daysAgoDate(demoProduct.daysAgo),
      updatedAt: daysAgoDate(demoProduct.daysAgo),
    })),
    9,
    (chunk) => db.insert(product).values(chunk),
  )

  await insertInChunks(
    PRODUCTS.flatMap((demoProduct) =>
      demoProduct.variants.map((variant, index) => ({
        id: `${demoProduct.id}-variant-${index + 1}`,
        productId: demoProduct.id,
        title: variant.title,
        price: variant.price,
        position: index,
      })),
    ),
    5,
    (chunk) => db.insert(productVariant).values(chunk),
  )

  await insertInChunks(
    PRODUCTS.flatMap((demoProduct) =>
      demoProduct.images.map((image, index) => ({
        id: `${demoProduct.id}-image-${index + 1}`,
        productId: demoProduct.id,
        r2Key: productImageKey(demoProduct.id, index, image.source),
        width: IMAGE_SOURCES[image.source].width,
        height: IMAGE_SOURCES[image.source].height,
        alt: image.alt,
        position: index,
      })),
    ),
    7,
    (chunk) => db.insert(productImage).values(chunk),
  )

  await insertInChunks(
    PRODUCTS.flatMap((demoProduct) =>
      demoProduct.categories.map((categorySlug) => ({
        productId: demoProduct.id,
        categorySlug,
      })),
    ),
    2,
    (chunk) => db.insert(productCategory).values(chunk),
  )

  console.info(
    `Seeded ${STORES.length} stores and ${PRODUCTS.length} products. Sign in as ${STORES[0]?.owner.email ?? 'a demo owner'} to see the owner dashboard.`,
  )

  await platform.dispose()
}

await main()
