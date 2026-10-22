import { Effect } from 'effect'

import { Db } from './services/db'
import { auditLog } from './db/schema'

/** Records one entry in the admin audit log. Best-effort: never throws. */
export const recordAudit = Effect.fn('recordAudit')(function* (input: {
  readonly actorId: string
  readonly actorKind: 'admin' | 'owner' | 'system'
  readonly action: string
  readonly targetType: string
  readonly targetId: string
  readonly details?: string
}) {
  const db = yield* Db

  yield* db
    .run((d) =>
      d.insert(auditLog).values({
        id: crypto.randomUUID(),
        actorId: input.actorId,
        actorKind: input.actorKind,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        details: input.details ?? null,
      }),
    )
    .pipe(Effect.orElseSucceed(() => undefined))
})
