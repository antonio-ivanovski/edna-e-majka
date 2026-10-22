import type { Result } from 'effect'
import type { DomainError } from '#/server/errors'

import {
  deleteProductImage as deleteProductImageFn,
  deleteStoreAvatar as deleteStoreAvatarFn,
  deleteStoreCover as deleteStoreCoverFn,
  deleteUserAvatar as deleteUserAvatarFn,
  reorderProductImages as reorderProductImagesFn,
  uploadProductImage as uploadProductImageFn,
  uploadStoreAvatar as uploadStoreAvatarFn,
  uploadStoreCover as uploadStoreCoverFn,
  uploadUserAvatar as uploadUserAvatarFn,
} from '#/server/functions/uploads'

export type UploadedImage = {
  id: string
  key: string
  alt: string | null
  width: number
  height: number
}

const MAX_EDGE = 1400
const JPEG_QUALITY = 0.85

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

export async function uploadProductImage(
  productId: string,
  file: File,
  alt?: string,
): Promise<Result.Result<UploadedImage, DomainError>> {
  const { blob, width, height } = await shrink(file)
  const form = new FormData()
  form.set('productId', productId)
  form.set('width', String(width))
  form.set('height', String(height))
  if (alt && alt.trim()) form.set('alt', alt.trim())
  form.set('file', blob, 'photo.jpg')
  return uploadProductImageFn({ data: form })
}

export async function uploadStoreAvatar(
  storeId: string,
  file: File,
): Promise<Result.Result<{ key: string }, DomainError>> {
  const { blob } = await shrink(file)
  const form = new FormData()
  form.set('storeId', storeId)
  form.set('file', blob, 'avatar.jpg')
  return uploadStoreAvatarFn({ data: form })
}

export async function uploadStoreCover(
  storeId: string,
  file: File,
): Promise<Result.Result<{ key: string }, DomainError>> {
  const { blob } = await shrink(file)
  const form = new FormData()
  form.set('storeId', storeId)
  form.set('cover', '1')
  form.set('file', blob, 'cover.jpg')
  return uploadStoreCoverFn({ data: form })
}

export function deleteProductImage(imageId: string): Promise<Result.Result<null, DomainError>> {
  return deleteProductImageFn({ data: { imageId } })
}

export function reorderProductImages(
  productId: string,
  imageIds: readonly string[],
): Promise<Result.Result<null, DomainError>> {
  return reorderProductImagesFn({ data: { productId, imageIds: [...imageIds] } })
}

export function deleteStoreAvatar(storeId: string): Promise<Result.Result<null, DomainError>> {
  return deleteStoreAvatarFn({ data: { storeId } })
}

export async function uploadUserAvatar(
  file: File,
): Promise<Result.Result<{ key: string }, DomainError>> {
  const { blob } = await shrink(file)
  const form = new FormData()
  form.set('userAvatar', '1')
  form.set('file', blob, 'avatar.jpg')
  return uploadUserAvatarFn({ data: form })
}

export function deleteUserAvatar(): Promise<Result.Result<null, DomainError>> {
  return deleteUserAvatarFn()
}

export function deleteStoreCover(storeId: string): Promise<Result.Result<null, DomainError>> {
  return deleteStoreCoverFn({ data: { storeId } })
}
