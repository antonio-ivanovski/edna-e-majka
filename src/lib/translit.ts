/**
 * Macedonian Cyrillic and Latin transliteration, used so a visitor can search
 * in whichever script they type: `med` finds «мед» and «мед» finds a listing
 * spelled in Latin.
 *
 * Both directions are needed. Producing a listing's `search_text` writes the
 * original plus its Latin form; expanding a query rewrites the query into
 * Cyrillic as well, so either side can be the one that was transliterated.
 */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  ѓ: 'gj',
  е: 'e',
  ж: 'zh',
  з: 'z',
  ѕ: 'dz',
  и: 'i',
  ј: 'j',
  к: 'k',
  л: 'l',
  љ: 'lj',
  м: 'm',
  н: 'n',
  њ: 'nj',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  ќ: 'kj',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  џ: 'dj',
  ш: 'sh',
}

/**
 * Longest first, so `lj` wins over `l`, `dž` over `d`, and `dzh` over `dz`.
 * Latin diacritics map to the Cyrillic letter they actually spell: `ž` is `ж`,
 * not the folded `z`.
 */
const LATIN_TO_CYRILLIC: readonly [string, string][] = [
  ['dž', 'џ'],
  ['dzh', 'џ'],
  ['zh', 'ж'],
  ['ch', 'ч'],
  ['sh', 'ш'],
  ['dj', 'џ'],
  ['lj', 'љ'],
  ['nj', 'њ'],
  ['gj', 'ѓ'],
  ['kj', 'ќ'],
  ['dz', 'ѕ'],
  ['ž', 'ж'],
  ['č', 'ч'],
  ['š', 'ш'],
  ['ć', 'ќ'],
  ['đ', 'џ'],
  ['a', 'а'],
  ['b', 'б'],
  ['c', 'ц'],
  ['d', 'д'],
  ['e', 'е'],
  ['f', 'ф'],
  ['g', 'г'],
  ['h', 'х'],
  ['i', 'и'],
  ['j', 'ј'],
  ['k', 'к'],
  ['l', 'л'],
  ['m', 'м'],
  ['n', 'н'],
  ['o', 'о'],
  ['p', 'п'],
  ['r', 'р'],
  ['s', 'с'],
  ['t', 'т'],
  ['u', 'у'],
  ['v', 'в'],
  ['z', 'з'],
]

/** Cyrillic letters that no Latin form folds onto; they keep a plain partner. */
const CYRILLIC_FOLD: Record<string, string> = { ѓ: 'г', ќ: 'к', ѕ: 'з' }

export function toLatin(input: string): string {
  let output = ''

  for (const character of input.toLowerCase()) {
    output += CYRILLIC_TO_LATIN[character] ?? character
  }

  return output
}

export function toCyrillic(input: string): string {
  const lower = input.toLowerCase()
  let output = ''
  let index = 0

  while (index < lower.length) {
    const match = LATIN_TO_CYRILLIC.find(([latin]) => lower.startsWith(latin, index))

    if (match) {
      output += match[1]
      index += match[0].length
      continue
    }

    output += lower[index]
    index += 1
  }

  return output
}

/**
 * Latin accents are stripped through Unicode decomposition; the Cyrillic
 * letters carrying a diacritic are precomposed, so they are mapped by hand.
 */
export function foldDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[ѓќѕ]/g, (character) => CYRILLIC_FOLD[character] ?? character)
}

export function normalizeSearchTerm(input: string): string {
  return input.toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * What gets stored per product. Every variant the two scripts can meet in is
 * kept, so a single `LIKE` on either side of the pair is enough.
 */
export function buildSearchText(...parts: readonly string[]): string {
  const original = normalizeSearchTerm(parts.join(' '))
  const latin = toLatin(original)

  return [...new Set([original, latin, foldDiacritics(latin), foldDiacritics(original)])].join(' ')
}

/** Every spelling of a query worth trying against `search_text`. */
export function buildSearchVariants(query: string): readonly string[] {
  const term = normalizeSearchTerm(query)

  return [...new Set([term, toCyrillic(term), foldDiacritics(term)])].filter(
    (variant) => variant.length > 0,
  )
}

/**
 * Where the query first shows up in a title, trying every script variant so
 * `med` still highlights «Мед». Returns the [start, end] slice in the
 * original title, or null when no variant appears (e.g. the row matched via
 * its description instead).
 */
export function findHighlightIndices(title: string, query: string): [number, number] | null {
  const lowered = title.toLowerCase()

  for (const variant of buildSearchVariants(query)) {
    if (!variant) {
      continue
    }

    const at = lowered.indexOf(variant.toLowerCase())

    if (at >= 0) {
      return [at, at + variant.length]
    }
  }

  return null
}
