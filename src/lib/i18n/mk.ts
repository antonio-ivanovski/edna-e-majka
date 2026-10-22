/**
 * All Macedonian UI copy in one place. Future languages add a sibling file
 * (e.g. `en.ts`) and register it in `src/lib/i18n.ts`.
 */
export const mk = {
  common: {
    search: 'Пребарај',
    submit: 'Испрати',
    cancel: 'Откажи',
    save: 'Зачувај',
    delete: 'Избриши',
    edit: 'Уреди',
    loading: 'Вчитуваме…',
    notFound: 'Не е најдено',
  },
  nav: {
    home: 'Почетна',
    producers: 'Производители',
    categories: 'Категории',
    manage: 'Менаџирај',
    account: 'Мојата сметка',
    signIn: 'Најави се',
    signOut: 'Одјави се',
  },
  search: {
    placeholder: 'Пребарај сите производи',
    recent: 'Неодамнешни пребарувања',
    noResults: 'Нема производи',
  },
  cookie: {
    message: 'Користиме колачиња за да се сеќаваме на вашите поставки и да го подобриме сајтот.',
    policy: 'политиката за колачиња',
    accept: 'Прифати',
    reject: 'Одбиј',
  },
  product: {
    inStock: 'На залиха',
    outOfStock: 'Нема на залиха',
    onOrder: 'По нарачка',
    addToFavorites: 'Додај во омилени',
    removeFromFavorites: 'Отстрани од омилени',
    report: 'Пријави',
    contactProducer: 'Контактирајте го производителот',
    similar: 'Слични производи',
    moreFromProducer: 'Од истиот производител',
    recentlyViewed: 'Неодамна прегледани',
    featured: 'Издвоени производи',
  },
  producer: {
    follow: 'Следи',
    following: 'Следите',
    publicPage: 'Јавна страница',
  },
  manage: {
    title: 'Менаџирај',
    products: 'Производи',
    newProduct: 'Нов производ',
    storeData: 'Податоци за продавницата',
    deleteStore: 'Избриши продавницата',
  },
  admin: {
    title: 'Администрација',
    stores: 'Продавници',
    users: 'Корисници',
    messages: 'Пораки',
    products: 'Производи',
  },
  account: {
    title: 'Мојата сметка',
    data: 'Податоци',
    exportData: 'Извези JSON',
    deleteAccount: 'Избриши сметката',
  },
  errors: {
    notFound: 'Страницата не е најдена',
    somethingWrong: 'Нешто тргна наопаку',
  },
} as const

export type MkTranslations = typeof mk
