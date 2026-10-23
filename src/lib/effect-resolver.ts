/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, SchemaIssue } from 'effect'
import type { FieldValues, Resolver } from 'react-hook-form'

const formatStandard = SchemaIssue.makeFormatterStandardSchemaV1()

/**
 * Validates a form with an Effect schema.
 *
 * The issue tree nests: a bad pack points at `variants`, which points at the
 * row, which points at the price. The walk below follows those pointers down
 * to the leaf, so the error lands on the field the user actually filled —
 * and as a nested object, the way react-hook-form reads it. Every message is
 * the same Macedonian fallback: the schema's own messages are English, and
 * the site speaks Macedonian.
 *
 * `errors: "all"` collects every failure instead of stopping at the first,
 * so one submit can light up all the fields that need fixing.
 */
export function effectResolver<S extends Schema.Top>(schema: S): Resolver<any> {
  return async (values) => {
    try {
      const decoded = Schema.decodeUnknownSync(schema as any, { errors: 'all' })(values)
      return { values: decoded as FieldValues, errors: {} }
    } catch (err: any) {
      const errors: Record<string, any> = {}
      const issue = err?.issue ?? err?.error?.issue

      if (issue) {
        try {
          const result = formatStandard(issue)

          for (const item of result.issues) {
            const segments = (item.path ?? []).map((segment) =>
              typeof segment === 'number' || (typeof segment === 'string' && /^\d+$/.test(segment))
                ? Number(segment)
                : segment,
            )
            setNested(errors, segments as Array<string | number>, {
              type: 'validation',
              message: 'Невалидна вредност.',
            })
          }
        } catch {
          // The formatter never fails on real issues; a fallback follows.
        }
      }

      if (Object.keys(errors).length === 0) {
        errors.root = {
          type: 'validation',
          message: String(err?.message ?? 'Невалидна вредност.'),
        }
      }
      return { values: {}, errors }
    }
  }
}

function setNested(
  target: Record<string, any>,
  segments: Array<string | number>,
  error: { type: string; message: string },
): void {
  if (segments.length === 0) {
    return
  }

  let node: Record<string, any> = target

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index] as string | number
    const last = index === segments.length - 1

    if (last) {
      if (node[segment] === undefined) {
        node[segment] = error
      }
      return
    }

    const next = segments[index + 1]
    const wantArray = typeof next === 'number'

    if (node[segment] === undefined) {
      node[segment] = wantArray ? [] : {}
    }

    node = node[segment] as Record<string, any>
  }
}
