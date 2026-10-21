/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema } from 'effect'
import type { FieldValues, Resolver } from 'react-hook-form'

export function effectResolver<S extends Schema.Top>(schema: S): Resolver<any> {
  return async (values) => {
    try {
      const decoded = Schema.decodeUnknownSync(schema as any)(values)
      return { values: decoded as FieldValues, errors: {} }
    } catch (err: any) {
      const errors: Record<string, { type: string; message: string }> = {}
      const issue = err?.issue ?? err?.error?.issue
      const collect = (node: any) => {
        if (!node) return
        if (Array.isArray(node.issues)) {
          for (const c of node.issues) collect(c)
          return
        }
        const path = Array.isArray(node.path)
          ? node.path.map((p: any) => (typeof p === 'object' && p !== null && 'key' in p ? p.key : p))
          : []
        const key = path.length ? path.join('.') : ''
        if (key && !errors[key]) {
          errors[key] = { type: 'validation', message: String(node.message ?? 'Невалидна вредност.') }
        }
      }
      collect(issue)
      if (Object.keys(errors).length === 0) {
        errors.root = { type: 'validation', message: String(err?.message ?? 'Невалидна вредност.') }
      }
      return { values: {}, errors }
    }
  }
}
