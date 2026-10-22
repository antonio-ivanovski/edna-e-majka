import type { CategorySlug } from './categories'

export type AttributeType = 'text' | 'number' | 'select'

export type AttributeDef = {
  key: string
  label: string
  type: AttributeType
  unit?: string
  options?: readonly string[]
}

export type ProductAttributes = Record<string, string | number>

export const CATEGORY_ATTRIBUTES: Record<CategorySlug, readonly AttributeDef[]> = {
  honey: [
    { key: 'origin', label: 'Потекло', type: 'text' },
    { key: 'weight', label: 'Тежина', type: 'number', unit: 'г' },
    { key: 'harvestYear', label: 'Година на берба', type: 'number' },
  ],
  'bee-products': [
    { key: 'origin', label: 'Потекло', type: 'text' },
    { key: 'weight', label: 'Тежина', type: 'number', unit: 'г' },
  ],
  'jams-jelly': [
    { key: 'fruit', label: 'Овошје', type: 'text' },
    { key: 'weight', label: 'Тежина', type: 'number', unit: 'г' },
    { key: 'sugar', label: 'Шеќер', type: 'select', options: ['со шеќер', 'без шеќер'] },
  ],
  spreads: [
    { key: 'ingredients', label: 'Состав', type: 'text' },
    { key: 'weight', label: 'Тежина', type: 'number', unit: 'г' },
  ],
  pasta: [
    { key: 'flour', label: 'Брашно', type: 'text' },
    { key: 'weight', label: 'Тежина', type: 'number', unit: 'г' },
  ],
  mushrooms: [
    { key: 'species', label: 'Вид', type: 'text' },
    { key: 'weight', label: 'Тежина', type: 'number', unit: 'г' },
    { key: 'form', label: 'Облик', type: 'select', options: ['свеж', 'сушен'] },
  ],
  'forest-products': [
    { key: 'origin', label: 'Потекло', type: 'text' },
    { key: 'weight', label: 'Тежина', type: 'number', unit: 'г' },
  ],
  fruits: [
    { key: 'variety', label: 'Сорта', type: 'text' },
    { key: 'weight', label: 'Тежина', type: 'number', unit: 'кг' },
  ],
}

/** The attributes defined for any of the selected categories. */
export function attributesForCategories(slugs: readonly string[]): AttributeDef[] {
  const seen = new Set<string>()
  const result: AttributeDef[] = []

  for (const slug of slugs) {
    const defs = CATEGORY_ATTRIBUTES[slug as CategorySlug]

    if (!defs) {
      continue
    }

    for (const def of defs) {
      if (seen.has(def.key)) {
        continue
      }

      seen.add(def.key)
      result.push(def)
    }
  }

  return result
}

export function parseAttributes(raw: string | null | undefined): ProductAttributes {
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as unknown

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {}
    }

    return parsed as ProductAttributes
  } catch {
    return {}
  }
}

export function serializeAttributes(values: Record<string, string | number | undefined>): string {
  const cleaned: ProductAttributes = {}

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === '' || value === null) {
      continue
    }

    cleaned[key] = value
  }

  return JSON.stringify(cleaned)
}
