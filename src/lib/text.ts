/**
 * Free-text fields come from a form, so an empty address is stored as null
 * rather than as an empty string that later reads as a value.
 */
export function optionalText(value: string | undefined | null): string | null {
  const trimmed = value?.trim()

  return trimmed ? trimmed : null
}
