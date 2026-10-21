/**
 * Mutations answer with a value when the failure is something the person can
 * act on — they are not signed in, the shop is not theirs, a field is wrong.
 * Thrown errors stay for the failures that are genuinely exceptional, so the
 * route error boundary keeps meaning something.
 */
export type Failure = { ok: false; message: string }

export type ActionResult<Value = null> = { ok: true; data: Value } | Failure

export const NOT_SIGNED_IN: Failure = {
  ok: false,
  message: 'Најавете се за да продолжите.',
}

export const NOT_ALLOWED: Failure = {
  ok: false,
  message: 'Немате дозвола за оваа акција.',
}

export function failure(message: string): Failure {
  return { ok: false, message }
}
