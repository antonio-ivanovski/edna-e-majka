# Една е Мајка

Local marketplace for homemade products from small producers in Macedonia.

**Live:** https://ednaemajka.antonio.mk

## Stack

| Layer     | Choice                                                                |
| --------- | --------------------------------------------------------------------- |
| Runtime   | Cloudflare Workers                                                    |
| Framework | TanStack Start (React 19, SSR)                                        |
| Database  | Cloudflare D1 via Drizzle ORM                                         |
| Storage   | Cloudflare R2 (product and store images, served from `/images/*`)     |
| Auth      | Better Auth — magic links over Cloudflare Email Service, Google OAuth |
| Styling   | Tailwind CSS 4, Radix primitives                                      |
| Tooling   | Vite, TypeScript (strict), ESLint, Prettier, Vitest, Playwright       |

## Language convention

Routes, code, identifiers, comments, statuses and validation messages are English.
Everything a visitor reads — UI chrome, catalogue content, category titles, emails — is Macedonian.

## Getting started

```bash
pnpm install
cp .dev.vars.example .dev.vars   # fill in the values you need
pnpm db:migrate:local            # create the local D1 schema
pnpm db:seed                     # optional demo catalogue
pnpm dev                         # http://localhost:3000
```

`pnpm dev` runs the Worker, D1 and R2 locally through the Cloudflare Vite plugin.
Local state lives in `.wrangler/state`. Outbound email is simulated locally.

## Scripts

| Script                              | Purpose                        |
| ----------------------------------- | ------------------------------ |
| `pnpm dev`                          | Local dev server with HMR      |
| `pnpm build`                        | Production build               |
| `pnpm preview`                      | Run the built Worker locally   |
| `pnpm deploy`                       | Build and deploy to Cloudflare |
| `pnpm typecheck` / `pnpm lint`      | Type and lint checks           |
| `pnpm format` / `pnpm format:check` | Prettier                       |
| `pnpm test` / `pnpm test:e2e`       | Vitest / Playwright            |
| `pnpm db:generate`                  | Generate a Drizzle migration   |
| `pnpm db:migrate:local` / `:remote` | Apply migrations               |
| `pnpm db:seed`                      | Seed the demo catalogue        |

## Architecture

Layered, bottom to top:

- `src/api/schemas/*` — Effect Schema. Single source of truth for server-function
  validators, route `validateSearch`, and react-hook-form resolvers (via
  `Schema.toStandardSchemaV1`).
- `src/server/services/*` — `Context.Service` + `Layer` implementations (Db, Env,
  Assets, Mailer, RateLimiter, Session). One `AppLayer` composes them; `ManagedRuntime`
  bridges to TanStack Start.
- `src/server/errors/*` — `Schema.TaggedError` domain errors.
- `src/server/*` — Effect programs (queries, writes) declaring requirements via
  services and errors via tagged errors; retried and timed out at the `Db` layer.
- `src/lib/queries/*` — TanStack Query key factories + `queryOptions`.
- `src/routes/*` — TanStack Router routes whose loaders call
  `queryClient.ensureQueryData(...)` and whose components read from the cache.

Effect stays server-side: no `effect` code ships to the browser. The client
transports are TanStack Start server functions and TanStack Router.

## Deployment

Deployed to Cloudflare Workers. Push to `main` deploys; pull requests run typecheck,
lint, unit tests and a build. Secrets are set with `wrangler secret put`.
