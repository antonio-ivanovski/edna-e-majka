import { env } from 'cloudflare:workers'
import { eq } from 'drizzle-orm'

import { getDb } from './db/client'
import { product, productCategory, productImage, productVariant } from './db/schema'

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
