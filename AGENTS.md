# Learning more about Effect

This repository uses the Effect Typescript library.

Before writing any Effect code, first read `node_modules/effect/AGENTS.md`
**completely**, and follow the links in the file when required.

If you need to learn more about particular Effect apis and concepts that the
guide doesn't cover, search through the source code in `node_modules/effect/src`.

# Architecture (post-refactor)

Layered, from bottom to top:

- `src/api/schemas/*` — Effect Schema definitions. Single source of truth for
  every boundary: server-function validators, route `validateSearch`, react-hook-form
  resolvers, and query param typing. Exposed through `Schema.toStandardSchemaV1`.
- `src/server/services/*` — `Context.Service` + `Layer` implementations (Db,
  Env, Assets, Mailer, RateLimiter, Session). One `AppLayer` composes them all.
- `src/server/errors/*` — `Schema.TaggedError` domain errors.
- `src/server/*` — Effect programs (queries, writes, moderation) that declare
  their requirements via `Context.Service` and their errors via tagged errors.
- `src/lib/queries/*` — TanStack Query key factories + `queryOptions`.
- `src/routes/*` — TanStack Router routes whose loaders call
  `queryClient.ensureQueryData(...)` and whose components use `useSuspenseQuery`.

Effect stays server-side. The client transports are TanStack Start server
functions and TanStack Router; no `effect` code ships to the browser.
