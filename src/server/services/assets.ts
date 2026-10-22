import { Context, Effect, Layer } from 'effect'

import { env } from 'cloudflare:workers'

import { StorageError } from '../errors'

export interface AssetsService {
  readonly put: (
    key: string,
    body: ReadableStream | ArrayBuffer | Blob,
    httpMetadata?: { contentType?: string; cacheControl?: string },
  ) => Effect.Effect<void, StorageError>
  readonly get: (key: string) => Effect.Effect<R2ObjectBody | null, StorageError>
  readonly delete: (key: string) => Effect.Effect<void, StorageError>
}

export class Assets extends Context.Service<Assets, AssetsService>()('edna-e-majka/server/Assets') {
  static readonly layer = Layer.sync(Assets, () => {
    const bucket = env.BUCKET

    const put: AssetsService['put'] = (key, body, httpMetadata) =>
      Effect.tryPromise({
        try: () => bucket.put(key, body, httpMetadata ? { httpMetadata } : undefined),
        catch: (cause) =>
          new StorageError({ message: 'Не успеавме да ја зачуваме сликата.', cause }),
      }).pipe(Effect.asVoid)

    const get: AssetsService['get'] = (key) =>
      Effect.tryPromise({
        try: () => bucket.get(key),
        catch: (cause) =>
          new StorageError({ message: 'Не успеавме да ја прочитаме сликата.', cause }),
      })

    const del: AssetsService['delete'] = (key) =>
      Effect.tryPromise({
        try: () => bucket.delete(key),
        catch: (cause) =>
          new StorageError({ message: 'Не успеавме да ја избришеме сликата.', cause }),
      }).pipe(Effect.asVoid)

    return Assets.of({ put, get, delete: del })
  })
}
