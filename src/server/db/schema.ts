/**
 * Domain tables.
 *
 * Product and store ids are generated in application code (`crypto.randomUUID`).
 * Timestamps are stored as integer milliseconds so they sort correctly and match
 * the auth tables. Prices are whole Macedonian denars — never floats.
 */
import { sql } from 'drizzle-orm'
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { user } from './auth-schema'

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(now)
    .$onUpdate(() => new Date()),
}

export const store = sqliteTable(
  'store',
  {
    id: text('id').primaryKey(),
    /** Single owner per store; there are no co-managers. */
    ownerId: text('owner_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** The readable address of the shop; written once, when it is created. */
    slug: text('slug').unique(),
    description: text('description').notNull(),
    avatarKey: text('avatar_key'),
    coverKey: text('cover_key'),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    facebook: text('facebook'),
    instagram: text('instagram'),
    city: text('city'),
    hours: text('hours'),
    status: text('status', { enum: ['pending', 'active', 'suspended', 'archived'] })
      .notNull()
      .default('pending'),
    /** Why the automated check or an admin left the store in its current status. */
    statusNote: text('status_note'),
    reviewedBy: text('reviewed_by').references(() => user.id, { onDelete: 'set null' }),
    reviewedAt: integer('reviewed_at', { mode: 'timestamp_ms' }),
    ...timestamps,
  },
  (table) => [
    index('store_owner_id_idx').on(table.ownerId),
    index('store_status_idx').on(table.status),
  ],
)

export const product = sqliteTable(
  'product',
  {
    id: text('id').primaryKey(),
    storeId: text('store_id')
      .notNull()
      .references(() => store.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    /** The readable address of the listing; written once, when it is created. */
    slug: text('slug').unique(),
    description: text('description').notNull(),
    /**
     * Lowercased title plus transliterated variants, so a Latin query matches
     * Macedonian Cyrillic content and vice versa.
     */
    searchText: text('search_text').notNull(),
    status: text('status', { enum: ['published', 'archived'] })
      .notNull()
      .default('published'),
    availability: text('availability', { enum: ['in_stock', 'out_of_stock', 'on_order'] })
      .notNull()
      .default('in_stock'),
    /** Structured per-category attributes, stored as JSON. */
    attributes: text('attributes'),
    /** Pinned to the top of the home and the producer page. */
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
    archivedBy: text('archived_by').references(() => user.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (table) => [
    index('product_store_id_idx').on(table.storeId),
    index('product_status_idx').on(table.status),
  ],
)

export const productImage = sqliteTable(
  'product_image',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => product.id, { onDelete: 'cascade' }),
    r2Key: text('r2_key').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    alt: text('alt'),
    position: integer('position').notNull().default(0),
  },
  (table) => [index('product_image_product_id_idx').on(table.productId)],
)

export const productVariant = sqliteTable(
  'product_variant',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => product.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    /** Whole denars. Cheapest variant defines the price shown in listings. */
    price: integer('price').notNull(),
    position: integer('position').notNull().default(0),
  },
  (table) => [index('product_variant_product_id_idx').on(table.productId)],
)

export const productCategory = sqliteTable(
  'product_category',
  {
    productId: text('product_id')
      .notNull()
      .references(() => product.id, { onDelete: 'cascade' }),
    /** Slug from the category constants in `#/lib/categories`. */
    categorySlug: text('category_slug').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categorySlug] }),
    index('product_category_slug_idx').on(table.categorySlug),
  ],
)

export const contactMessage = sqliteTable(
  'contact_message',
  {
    id: text('id').primaryKey(),
    kind: text('kind', { enum: ['contact', 'cooperation', 'report'] }).notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    website: text('website'),
    message: text('message').notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    storeId: text('store_id'),
    productId: text('product_id'),
    /** Set when an admin marks the message read in the dashboard. */
    handledAt: integer('handled_at', { mode: 'timestamp_ms' }),
    ...timestamps,
  },
  (table) => [index('contact_message_created_at_idx').on(table.createdAt)],
)

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').notNull(),
  actorKind: text('actor_kind', { enum: ['admin', 'owner', 'system'] }).notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  details: text('details'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now),
})
