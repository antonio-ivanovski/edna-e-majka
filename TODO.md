# TODO — Feature completeness (production-ready)

Scope: product/UX features only. Infra/ops (deploy, secrets, domains, monitoring) excluded.
App is a **classifieds/contact-based marketplace**: buyers contact producers directly; no cart/checkout/payments.
Language: Macedonian UI extracted into react-i18n `mk` file (see T3-09). Reviews/ratings, multi-region filtering, transactions, PWA, analytics dashboards deferred.

Legend: `[ ]` todo, `[x]` done. **Blockers** = dependencies on other items or prerequisites.

---

---

## Tier 0 — Foundation: API & app cleanup (do this first)

Scope: architecture, not product features. Do it **before any Tier 1–4 work**: most
of those items touch the same files, and building them on today's shape means
paying for this rewrite twice.

Goal: one typed contract layer, Effect everywhere on the server, one client cache.

- [x] **T0-01** Effect 4 foundation. Add `effect@4.0.5` (exact pin). Add the
      "Learning more about Effect" section to `AGENTS.md` and read
      `node_modules/effect/AGENTS.md` before writing any Effect code. Blockers: none.
- [x] **T0-02** Effect services and layers. `Db` (Drizzle over D1, kept as the
      query layer), `Env`, `Session`/`Viewer` (Better Auth), `Assets` (R2), `Mailer`
      (Cloudflare Email), `RateLimiter`, `AppConfig`. One `AppLayer` built with
      `Layer.mergeAll`; every service is a `Context.Service` + `Layer`. Blockers: T0-01.
- [x] **T0-03** Typed domain errors. `NotFound`, `NotAllowed`, `NotSignedIn`,
      `Invalid`, `RateLimited`, `Storage` as `Schema.TaggedError`. Replace
      `src/lib/action.ts` (`ActionResult`, `NOT_SIGNED_IN`, `NOT_ALLOWED`) with
      `Effect.Result` + tagged errors. Blockers: T0-01.
- [x] **T0-04** One schema source of truth. Port every zod schema to Effect
      Schema under `src/api/schemas/*`; expose them via `Schema.toStandardSchemaV1`
      so TanStack `.validator()`, route `validateSearch` and react-hook-form all
      accept the same definition. Drop `zod` from the app. Blockers: T0-01.
- [x] **T0-05** Typesafe client URL params. Every route's `validateSearch`
      becomes an Effect Schema → the router types `search` and `Link search={{...}}`
      is checked at compile time. Delete the hand-written parsers in
      `src/lib/search-params.ts` and `src/lib/admin-search.ts` along with their
      duplicated enums and `pageSchema`. Blockers: T0-04.
- [x] **T0-06** Effect everywhere on the server. Every query in
      `src/server/queries/*` and every write in `src/server/functions/*` returns an
      `Effect`: `Effect.fn`/`Effect.fnUntraced` for named operations, `Effect.gen`
      for orchestration, `Effect.tryPromise` around Drizzle/Better Auth/R2 (never
      `Effect.promise` — it swallows errors), `Effect.all` for parallelism,
      `Effect.retry` + `Schedule.exponential` for transient D1/R2 failures,
      `Effect.timeout` on external calls, `Effect.withSpan` for tracing into
      Cloudflare observability, `Effect.log*` instead of `console`, `Effect.Clock`
      instead of `src/lib/clock.ts`. Blockers: T0-02, T0-03.
- [x] **T0-07** One write path per concern. `functions/admin.ts` and
      `functions/manage.ts` currently duplicate five writes (store details,
      product + variants + categories, archive, delete product, delete store) and
      admin repeats the "row not found" check eight times. One parameterised Effect
      service per concern; the actor (`owner` vs `admin`) is an argument, not a
      copy. Also unify `claimProductSlug`/`claimStoreSlug`. Blockers: T0-06.
- [x] **T0-08** Typed server functions. Keep `createServerFn` as the app's
      transport; every one is typed from the Effect schemas and returns an
      `Effect.Result`-shaped value, so `notFound()`/`redirect()` and the
      `ActionResult` envelope both come from typed errors. Enable Start's CSRF
      middleware for mutations. Blockers: T0-04, T0-06.
- [x] **T0-09** Uploads become a typed server function. Replace the hand-rolled
      `POST`/`PATCH`/`DELETE` handlers in `src/routes/api/uploads.ts` (352 lines,
      no zod, manual `ActionResult` over HTTP) with a server function taking a
      `FormData` validator (TanStack supports `FormData` validators on POST).
      `src/lib/uploads.ts` calls it and gets a typed result; the REST route goes
      away. Blockers: T0-04, T0-06.
- [x] **T0-10** Remaining server routes typed. `/images/$`, `/robots.txt`,
      `/rss.xml`, `/sitemap.xml`, `/api/auth/$` keep their shape but build their
      payloads from typed Effect data (Effect Schema for sitemap/feed entries, the
      `Assets` service for R2). Blockers: T0-06.
- [x] **T0-11** TanStack Query as the single client cache. Install
      `@tanstack/react-query`; create the `QueryClient` in `src/router.tsx` and
      pass it through router `context`; `defaultPreloadStaleTime: 0` so Query owns
      freshness; `@tanstack/react-router-ssr-query` for SSR dehydrate/hydrate.
      Key factories + `queryOptions` per domain in `src/lib/queries/*`, with
      per-domain `staleTime` (catalogue ~60s, admin/manage 0). Prove the SSR
      hydration path on one route before rolling it out. Blockers: none.
- [x] **T0-12** Loaders prefetch, components read. Every route loader calls
      `queryClient.ensureQueryData(...)`; components use `useSuspenseQuery`;
      mutations use `useMutation` + `queryClient.invalidateQueries` instead of
      ad-hoc refetches. Blockers: T0-08, T0-11.
- [x] **T0-13** Delete what the refactor made redundant: `zod`,
      `src/lib/action.ts`, `src/lib/clock.ts`, `src/lib/search-params.ts`,
      `src/lib/admin-search.ts`, the duplicated slug claiming and the duplicated
      admin/owner writes from T0-07. Blockers: T0-04, T0-05, T0-06, T0-07, T0-09.
- [x] **T0-14** Tests. Vitest coverage for the Effect services (layers with
      test doubles), the tagged errors and the shared write paths; existing unit
      tests stay green; `typecheck`, `lint` and `build` pass. Blockers: T0-06.
- [x] **T0-15** Documentation. `README.md` + `AGENTS.md` describe the layering
      (`src/api` contracts → `src/server` Effect services → `src/lib/queries` →
      routes) so later Tier 1–4 work lands in the new shape. Blockers: T0-13.

### Tier 0 notes

- Effect stays server-side only: no `HttpApi`, no Effect in the browser bundle.
  `effect/http-api` is `@stability unstable` in 4.0.5 and is deliberately unused.
- `@tanstack/react-router-ssr-query` was chosen over manual dehydrate/hydrate
  because it hooks `router.options.dehydrate`, which Start already calls.
- T0-11 is the only item with real integration risk; if the SSR hydration path
  misbehaves in Start 1.169, fall back to seeding the Query cache from the
  loader's own data rather than dropping TanStack Query.

## Tier 1 — Core product gaps

- [x] **T1-01** Contact producer form on product/store page — structured enquiry that lands in the admin inbox (reuse `contactMessage`). Blockers: none.
- [x] **T1-02** Image alt text input in product form + use in `<img alt>`. Blockers: none.
- [x] **T1-03** Image reordering (drag) + "set as cover" in product form. Blockers: position update API.
- [x] **T1-04** Pretty URLs (slugs) for products and stores + internal link updates. Blockers: DB migration (slug columns), uniqueness handling.
- [x] **T1-05** Store city/region field (display only; location-based filtering deferred). Blockers: none.
- [x] **T1-06** Store hours / availability field + display. Blockers: none.
- [x] **T1-07** Store cover image (banner) separate from avatar. Blockers: upload handling (reuse avatar pattern).
- [x] **T1-08** "Similar products" + "more from this producer" on product page. Blockers: query additions.
- [x] **T1-09** Breadcrumbs on product/category/producer pages. Blockers: none.
- [x] **T1-10** Recently viewed (client) + "new arrivals" section on home. Blockers: none.
- [x] **T1-11** Paginate manage products + endless scroll on public catalogue. Blockers: paginated API for owner products.
- [x] **T1-12** Admin edit product details (title/description/price/categories/images). Blockers: admin form reuse.
- [x] **T1-13** Store deletion (owner request + admin) with propagation across all store assets (R2 objects, products, variants, images, categories). Blockers: cascade R2 cleanup.
- [x] **T1-14** Account profile edit (name, avatar) + account deletion (GDPR). Blockers: auth endpoints.
- [x] **T1-15** Email notifications (new enquiry to producer; moderation decision to owner; new shop application to admin). Blockers: email templates via `send_email`.
- [x] **T1-16** Search autocomplete / suggestions + recent searches. Blockers: search endpoint.
- [x] **T1-17** Advanced filters (price range, has-image, multi-category; region deferred). Blockers: T1-05 (region field) for region filter.
- [x] **T1-18** Structured product attributes per category (weight, origin, allergens, etc.) with category-specific schemas. Blockers: category constants restructure + DB migration.
- [x] **T1-19** Availability/stock status (in stock / out of stock / on order). Blockers: none.
- [x] **T1-20** Featured/pinned products (admin toggle + home/producer display). Blockers: admin UI + query.

## Tier 2 — Trust, safety, compliance (production blockers)

- [x] **T2-01** Legal pages: Terms of use, Privacy policy, Cookie policy (Macedonian). Blockers: none.
- [ ] **T2-02** Cookie consent banner + analytics gating. Blockers: T2-01.
- [ ] **T2-03** Report abuse on product/store → admin inbox. Blockers: reuse contactMessage (add `report` kind) or new table.
- [ ] **T2-04** Admin audit log (who/what/when for status changes, deletions, role changes). Blockers: new table + middleware hooks.
- [ ] **T2-05** Admin bulk actions (approve/suspend/archive multiple). Blockers: none.
- [ ] **T2-06** Admin user management (suspend/ban, role change, view sessions). Blockers: T2-04 (audit).
- [ ] **T2-07** Admin moderation notes (internal comments on stores/products). Blockers: new table.
- [ ] **T2-08** Data export — user data (GDPR) + store products CSV export/import. Blockers: T1-18 for attribute columns.
- [x] **T2-09** Content guidelines / producer onboarding guide page. Blockers: none.
- [x] **T2-10** 404 page with suggestions + richer empty states. Blockers: none.
- [ ] **T2-11** Accessibility audit (focus management, keyboard nav, aria-live, skip link, reduced motion). Blockers: none.
- [ ] **T2-12** Structured data (JSON-LD: Product, Organization, BreadcrumbList, LocalBusiness). Blockers: T1-04 (slugs) for canonical URLs.
- [x] **T2-13** Twitter card + richer OG meta (twitter:card, og:locale, per-product). Blockers: none.
- [ ] **T2-14** Canonical URLs + trailing-slash consistency. Blockers: none.
- [x] **T2-15** RSS/Atom feed of new products. Blockers: none.

## Tier 3 — Engagement & growth

- [ ] **T3-01** Favorites / wishlist (products + stores) with account sync. Blockers: new tables.
- [ ] **T3-02** Follow store + notify on new products. Blockers: T1-15 (notifications), T3-01.
- [x] **T3-03** Share buttons (copy link, Facebook, Viber, WhatsApp). Blockers: none.
- [ ] **T3-04** In-app notification center (web push deferred). Blockers: T1-15.
- [ ] **T3-06** Dark mode. Blockers: theme tokens + toggle.
- [ ] **T3-09** i18n extraction: move all Macedonian UI strings into react-i18n `mk` TS file (single source; future languages later). Blockers: install react-i18next + i18next; refactor components.

## Tier 4 — Nice-to-have / future

- [ ] **T4-01** In-app buyer↔producer messaging (threaded) instead of email-only. Blockers: new tables + polling.
- [ ] **T4-02** Orphaned R2 cleanup job. Blockers: T1-13 (deletion flows).
- [ ] **T4-03** Soft delete + restore for products/stores. Blockers: status enum additions.
- [ ] **T4-04** Image crop/rotate + upload progress in browser. Blockers: none (progress part of T1-03 UX).
- [ ] **T4-05** Moderator role separate from admin. Blockers: role enum + middleware.
- [ ] **T4-06** Multi-image alt + captions + video support. Blockers: T1-02 (alt), storage mime types.
- [ ] **T4-07** Version history of product edits. Blockers: new table.
- [ ] **T4-10** Print styles for product/store pages. Blockers: none.

## Testing (production gate)

- [ ] **TX-01** E2E (Playwright): home, product, search, manage, admin happy paths + auth. Blockers: none.
- [ ] **TX-02** Accessibility tests (axe) on key pages. Blockers: T2-11.
- [ ] **TX-03** Visual regression (optional). Blockers: TX-01 baseline.
- [ ] **TX-04** Load/perf smoke on search + catalogue. Blockers: none.

## Deferred / later stage (explicitly deferred or no)

- Multi-region/location filtering — deferred (mostly Macedonia). (T1-05 field stays display-only.)
- Spam/abuse detection beyond `[spam]` marker — deferred.
- Reviews & ratings — deferred.
- Product comparison — no.
- Price history / "last updated" — no.
- Newsletter subscription — no.
- PWA — no.
- Store analytics dashboard — no.
- Admin dashboard metrics — no.
- Top searches / popular categories — no.
- In-app notification center web push — deferred (in-app part kept in T3-04).
- Image crop/rotate (T4-04 part) — deferred; upload progress kept.
- Version history (T4-07) — later.
- Scheduled publishing — later (needs cron/worker).
- API / webhooks — later.
- Transactions (cart/checkout/payments), order/quote requests — out of scope (classifieds).
- Store co-managers — out of scope (single owner).

## Notes on overrides applied

- T1-11 includes endless scroll pagination.
- T1-13 requires propagation across all store assets (R2 + DB).
- T1-18 attributes must be structured and relevant per category/sub-category/product.
- T3-09: extract current Macedonian strings into react-i18n `mk` TS file in one step.
- T1-05: city field only; location filtering deferred.
- Reviews/ratings, multi-region filtering, transactions, PWA, analytics dashboards, newsletter, comparison, price history deferred/excluded per user answers.

## Suggested first sprint

T0-01, T0-02, T0-03, T0-04, T0-05, T0-06 — then T1-01, T1-02, T1-03, T1-05, T1-06, T1-09, T1-10, T2-01, T2-10, T2-11, T2-13, T2-14, T3-03, T3-06, T3-09, TX-01.
