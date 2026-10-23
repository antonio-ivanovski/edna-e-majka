import { Result } from 'effect'

/**
 * What a server function actually delivers.
 *
 * Handlers return Effect `Result`s, but `_tag` does not survive the trip to
 * the browser: it lives on the prototype, and the wire serializer only keeps
 * own properties. What arrives is `{ success }` or `{ failure }` without a
 * tag, so every check has to go through here to get a real `Result` back. A
 * value that still carries its tag (an in-process call) passes through.
 */
export function toResult<A, E>(wire: Result.Result<A, E>): Result.Result<A, E> {
  const record = wire as unknown as Record<string, unknown>

  if (record['_tag'] === 'Success' || record['_tag'] === 'Failure') {
    return wire
  }

  if ('failure' in record) {
    return Result.fail(record['failure'] as E)
  }

  return Result.succeed(record['success'] as A)
}
