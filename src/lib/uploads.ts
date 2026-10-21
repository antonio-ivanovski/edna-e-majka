/**
 * Photos are shrunk in the browser before they are uploaded: a phone camera
 * picture is several megabytes and nothing on the site displays wider than
 * about 1400 pixels. Server-side checks still run on everything that arrives.
 */
import type { ActionResult } from './action'

export type UploadedImage = {
  id: string
  key: string
  alt: string | null
  width: number
  height: number
}

const MAX_EDGE = 1400
const JPEG_QUALITY = 0.85

const NETWORK_FAILURE: ActionResult<never> = {
  ok: false,
  message: 'Не успеавме да ја испратиме сликата. Проверете ја врската и обидете се повторно.',
}

async function shrink(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    bitmap.close()
    throw new Error('Canvas is not available in this browser.')
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  )

  if (!blob) {
    throw new Error('The browser could not encode the image.')
  }

  return { blob, width, height }
}

async function send<Value>(url: string, init: RequestInit): Promise<ActionResult<Value>> {
  try {
    const response = await fetch(url, init)

    return (await response.json()) as ActionResult<Value>
  } catch {
    return NETWORK_FAILURE
  }
}

export async function uploadProductImage(
  productId: string,
  file: File,
  alt?: string,
): Promise<ActionResult<UploadedImage>> {
  const { blob, width, height } = await shrink(file)
  const form = new FormData()

  form.set('productId', productId)
  form.set('width', String(width))
  form.set('height', String(height))
  if (alt && alt.trim()) {
    form.set('alt', alt.trim())
  }
  form.set('file', blob, 'photo.jpg')

  return send<UploadedImage>('/api/uploads', { method: 'POST', body: form })
}

export async function uploadStoreAvatar(
  storeId: string,
  file: File,
): Promise<ActionResult<{ key: string }>> {
  const { blob } = await shrink(file)
  const form = new FormData()

  form.set('storeId', storeId)
  form.set('file', blob, 'avatar.jpg')

  return send<{ key: string }>('/api/uploads', { method: 'POST', body: form })
}

/** The banner behind the shop header. */
export async function uploadStoreCover(
  storeId: string,
  file: File,
): Promise<ActionResult<{ key: string }>> {
  const { blob } = await shrink(file)
  const form = new FormData()

  form.set('storeId', storeId)
  form.set('cover', '1')
  form.set('file', blob, 'cover.jpg')

  return send<{ key: string }>('/api/uploads', { method: 'POST', body: form })
}

export function deleteProductImage(imageId: string): Promise<ActionResult> {
  return send(`/api/uploads?imageId=${encodeURIComponent(imageId)}`, { method: 'DELETE' })
}

/**
 * Saves the order of the product's images. The first image is the one the
 * catalogue card shows.
 */
export function reorderProductImages(
  productId: string,
  imageIds: readonly string[],
): Promise<ActionResult> {
  return send('/api/uploads', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, imageIds }),
  })
}

export function deleteStoreAvatar(storeId: string): Promise<ActionResult> {
  return send(`/api/uploads?storeId=${encodeURIComponent(storeId)}`, { method: 'DELETE' })
}

export function deleteStoreCover(storeId: string): Promise<ActionResult> {
  return send(`/api/uploads?storeId=${encodeURIComponent(storeId)}&cover=1`, { method: 'DELETE' })
}
