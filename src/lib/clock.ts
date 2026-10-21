/**
 * Reading the clock is impure, so it lives behind a named function: callers
 * stay obvious about what they are doing, and React's purity lint has a single
 * place to look at.
 */
export function nowMs(): number {
  return Date.now()
}

/** True when a form came back faster than a person could have filled it in. */
export function submittedTooFast(startedAt: number, minimumMs: number): boolean {
  return nowMs() - startedAt < minimumMs
}
