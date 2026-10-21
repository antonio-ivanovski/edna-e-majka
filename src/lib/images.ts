/**
 * Images live in R2 behind the `/images/{key}` Worker route, which serves them
 * immutably. Only keys are ever stored, never URLs.
 */
export function imageUrl(key: string | null | undefined): string | undefined {
  return key ? `/images/${key}` : undefined
}
