import { env } from 'cloudflare:workers'
import { eq, inArray } from 'drizzle-orm'

import { getDb } from './db/client'
import {
  product,
  productCategory,
  productImage,
  productVariant,
  contactMessage,
  store,
} from './db/schema'

/**
 * Removes a product and everything that belonged to it.
 *
 * The photos go from R2 first, then the child rows explicitly, then the
 * product. The table cascade would already take the rows, but relying on it
 * would leave the bucket and the database out of step when the delete is
 * interrupted halfway.
 *
 * Ownership is the caller's business: an owner reaches this through a product
 * their shop holds, an admin through the dashboard.
 */
export async function deleteProductCascade(productId: string): Promise<void> {
  const db = getDb()

  const images = await db
    .select({ r2Key: productImage.r2Key })
    .from(productImage)
    .where(eq(productImage.productId, productId))

  if (images.length > 0) {
    await env.BUCKET.delete(images.map((image) => image.r2Key))
  }

  await db.delete(productImage).where(eq(productImage.productId, productId))
  await db.delete(productVariant).where(eq(productVariant.productId, productId))
  await db.delete(productCategory).where(eq(productCategory.productId, productId))
  await db.delete(product).where(eq(product.id, productId))
}

/**
 * Removes a shop and everything that belonged to it: the listings, their
 * photos, the packagings, the categories, the logo and the cover.
 *
 * The files go from R2 first, so the bucket and the database never disagree
 * about what still exists.
 */
export async function deleteStoreCascade(storeId: string): Promise<void> {
  const db = getDb()

  const ownStore = await db
    .select({ avatarKey: store.avatarKey, coverKey: store.coverKey })
    .from(store)
    .where(eq(store.id, storeId))
    .limit(1)

  const rows = await db.select({ id: product.id }).from(product).where(eq(product.storeId, storeId))
  const productIds = rows.map((row) => row.id)

  if (productIds.length > 0) {
    const images = await db
      .select({ r2Key: productImage.r2Key })
      .from(productImage)
      .where(inArray(productImage.productId, productIds))

    if (images.length > 0) {
      await env.BUCKET.delete(images.map((image) => image.r2Key))
    }

    await db.delete(productImage).where(inArray(productImage.productId, productIds))
    await db.delete(productVariant).where(inArray(productVariant.productId, productIds))
    await db.delete(productCategory).where(inArray(productCategory.productId, productIds))
    await db.delete(product).where(inArray(product.id, productIds))
  }

  const keys = [ownStore[0]?.avatarKey, ownStore[0]?.coverKey].filter(
    (key): key is string => typeof key === 'string' && key.length > 0,
  )

  if (keys.length > 0) {
    await env.BUCKET.delete(keys)
  }

  // The enquiries stay in the inbox, but they no longer point at a shop that
  // is not there any more.
  await db.update(contactMessage).set({ storeId: null }).where(eq(contactMessage.storeId, storeId))

  await db.delete(store).where(eq(store.id, storeId))
}
