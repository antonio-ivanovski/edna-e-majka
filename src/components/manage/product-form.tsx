import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { Plus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Field, Input, Select, Textarea } from '#/components/ui/field'
import { Message } from '#/components/ui/message'
import { CATEGORIES, type CategorySlug } from '#/lib/categories'
import type { ActionResult } from '#/lib/action'
import { imageUrl } from '#/lib/images'
import { productFormValuesSchema, type ProductForm, type ProductFormValues } from '#/lib/schemas'
import { deleteProductImage, reorderProductImages, uploadProductImage } from '#/lib/uploads'
import { saveProduct, updateProductImageAlt } from '#/server/functions/manage'
import type { OwnerProductDetail, OwnerProductImage } from '#/server/queries/manage'

/** A photo picked before the product exists, and its local preview. */
type PendingImage = { file: File; url: string }

/**
 * The whole product: text, categories, the packagings with their prices, and
 * the photos.
 *
 * A new product has no id until it is saved, so photos picked on the create
 * form wait in memory and are uploaded straight after the insert; on the edit
 * form they go up as soon as they are chosen.
 */
export function ProductForm({
  storeId,
  product,
  save = saveProduct,
}: {
  storeId: string
  product?: OwnerProductDetail
  save?: (args: { data: ProductForm }) => Promise<ActionResult<{ productId: string }>>
}) {
  const router = useRouter()
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)

  const [serverError, setServerError] = useState('')
  const [imageError, setImageError] = useState('')
  const [busyImages, setBusyImages] = useState(false)
  const [images, setImages] = useState<OwnerProductImage[]>(product?.images ?? [])
  const [pending, setPending] = useState<PendingImage[]>([])

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormValuesSchema),
    defaultValues: {
      title: product?.title ?? '',
      description: product?.description ?? '',
      // Written by us, validated on the way in, so the slugs are categories.
      categories: (product?.categories ?? []) as CategorySlug[],
      availability: product?.availability ?? 'in_stock',
      variants: product?.variants.length
        ? product.variants.map((variant) => ({
            title: variant.title,
            price: String(variant.price),
          }))
        : [{ title: '', price: '' }],
    },
  })

  const variants = useFieldArray({ control, name: 'variants' })

  const addImages = async (files: FileList | null) => {
    const picked = Array.from(files ?? [])

    if (picked.length === 0) {
      return
    }

    setImageError('')

    if (!product) {
      setPending((current) => [
        ...current,
        ...picked.map((file) => ({ file, url: URL.createObjectURL(file) })),
      ])
      return
    }

    setBusyImages(true)

    for (const file of picked) {
      const result = await uploadProductImage(product.id, file)

      if (!result.ok) {
        setImageError(result.message)
        break
      }

      setImages((current) => [...current, result.data])
    }

    setBusyImages(false)
    await router.invalidate()

    if (input.current) {
      input.current.value = ''
    }
  }

  const removeImage = async (imageId: string) => {
    setBusyImages(true)
    setImageError('')

    const result = await deleteProductImage(imageId)

    if (!result.ok) {
      setImageError(result.message)
    } else {
      setImages((current) => current.filter((image) => image.id !== imageId))
      await router.invalidate()
    }

    setBusyImages(false)
  }

  /**
   * Moves an image inside the list and saves the new order. The first image is
   * the one the catalogue card shows, so "set as cover" is a move to the front.
   */
  const persistOrder = async (next: OwnerProductImage[]) => {
    setImages(next)

    if (!product) {
      return
    }

    const result = await reorderProductImages(
      product.id,
      next.map((image) => image.id),
    )

    if (!result.ok) {
      setImageError(result.message)
      await router.invalidate()
    }
  }

  const moveImage = (index: number, offset: number) => {
    const target = index + offset

    if (target < 0 || target >= images.length) {
      return
    }

    const next = [...images]
    const [moved] = next.splice(index, 1)

    if (!moved) {
      return
    }

    next.splice(target, 0, moved)

    void persistOrder(next)
  }

  const setAsCover = (index: number) => {
    if (index === 0) {
      return
    }

    const next = [...images]
    const [moved] = next.splice(index, 1)

    if (!moved) {
      return
    }

    next.unshift(moved)

    void persistOrder(next)
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError('')

    const result = await save({
      data: {
        ...(product ? { productId: product.id } : {}),
        storeId,
        title: values.title,
        description: values.description,
        categories: values.categories,
        availability: values.availability,
        variants: values.variants.map((variant) => ({
          title: variant.title,
          price: Number(variant.price),
        })),
      },
    })

    if (!result.ok) {
      setServerError(result.message)
      return
    }

    for (const item of pending) {
      const uploaded = await uploadProductImage(result.data.productId, item.file)

      URL.revokeObjectURL(item.url)

      if (!uploaded.ok) {
        toast.error(uploaded.message)
        break
      }
    }

    setPending([])
    await router.invalidate()
    toast.success('Производот е зачуван.')

    if (!product) {
      await navigate({
        to: '/manage/$storeId/products/$productId',
        params: { storeId, productId: result.data.productId },
      })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <Field label="Наслов" htmlFor="product-title" error={errors.title?.message}>
        <Input id="product-title" aria-invalid={Boolean(errors.title)} {...register('title')} />
      </Field>

      <Field label="Опис" htmlFor="product-description" error={errors.description?.message}>
        <Textarea
          id="product-description"
          rows={8}
          aria-invalid={Boolean(errors.description)}
          {...register('description')}
        />
      </Field>

      <Field label="Категории" error={errors.categories?.message}>
        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
          {CATEGORIES.map((category) => (
            <label key={category.slug} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                value={category.slug}
                className="size-4 accent-accent-strong"
                {...register('categories')}
              />
              {category.title}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Достапност" htmlFor="product-availability" error={errors.availability?.message}>
        <Select
          id="product-availability"
          aria-invalid={Boolean(errors.availability)}
          {...register('availability')}
        >
          <option value="in_stock">На залиха</option>
          <option value="on_order">По нарачка</option>
          <option value="out_of_stock">Нема на залиха</option>
        </Select>
      </Field>

      <fieldset className="mb-6">
        <legend className="mb-2 block text-sm font-bold text-black/[0.87]">Пакувања и цени</legend>

        <div className="flex flex-col gap-3">
          {variants.fields.map((field, index) => (
            <div key={field.id} className="flex flex-wrap items-start gap-3">
              <Field
                htmlFor={`variant-title-${index}`}
                error={errors.variants?.[index]?.title?.message}
                className="mb-0 min-w-[10rem] flex-1"
              >
                <Input
                  id={`variant-title-${index}`}
                  placeholder="500 г"
                  aria-invalid={Boolean(errors.variants?.[index]?.title)}
                  {...register(`variants.${index}.title`)}
                />
              </Field>

              <Field
                htmlFor={`variant-price-${index}`}
                error={errors.variants?.[index]?.price?.message}
                className="mb-0 w-40"
              >
                <Input
                  id={`variant-price-${index}`}
                  inputMode="numeric"
                  suffix="МКД"
                  aria-invalid={Boolean(errors.variants?.[index]?.price)}
                  {...register(`variants.${index}.price`)}
                />
              </Field>

              <Button
                type="button"
                variant="ghost"
                className="mt-0.5"
                aria-label={`Отстрани пакување ${index + 1}`}
                disabled={variants.fields.length === 1}
                onClick={() => variants.remove(index)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        {errors.variants?.message ? (
          <p className="mt-2 text-sm text-danger">{errors.variants.message}</p>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => variants.append({ title: '', price: '' })}
        >
          <Plus className="size-4" />
          Додај пакување
        </Button>
      </fieldset>

      <Field label="Слики" error={imageError || undefined}>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(event) => void addImages(event.target.files)}
        />

        <div className="flex flex-wrap gap-3">
          {images.map((image, index) => (
            <div key={image.id} className="flex flex-col gap-1">
              <div className="relative">
                <img
                  src={imageUrl(image.key)}
                  alt={image.alt ?? ''}
                  width={120}
                  height={90}
                  className="h-[90px] w-[120px] rounded-[0.2857rem] border border-line object-cover"
                />
                {index === 0 ? (
                  <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    Главна
                  </span>
                ) : null}
                <button
                  type="button"
                  aria-label="Отстрани слика"
                  className="absolute -top-2 -right-2 flex size-6 cursor-pointer items-center justify-center rounded-full bg-danger text-white hover:bg-[#c92121]"
                  disabled={busyImages}
                  onClick={() => void removeImage(image.id)}
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <input
                type="text"
                defaultValue={image.alt ?? ''}
                placeholder="Alt текст"
                aria-label="Alt текст за сликата"
                className="h-7 w-[120px] rounded border border-line px-1 text-xs"
                onBlur={async (event) => {
                  const value = event.target.value
                  const result = await updateProductImageAlt({
                    data: { imageId: image.id, alt: value },
                  })
                  if (result.ok) {
                    setImages((current) =>
                      current.map((entry) =>
                        entry.id === image.id ? { ...entry, alt: value.trim() || null } : entry,
                      ),
                    )
                  }
                }}
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Премести нагоре"
                  disabled={busyImages || index === 0}
                  onClick={() => moveImage(index, -1)}
                  className="cursor-pointer rounded border border-line px-1.5 py-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Премести надолу"
                  disabled={busyImages || index === images.length - 1}
                  onClick={() => moveImage(index, 1)}
                  className="cursor-pointer rounded border border-line px-1.5 py-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={busyImages || index === 0}
                  onClick={() => setAsCover(index)}
                  className="cursor-pointer rounded border border-line px-1.5 py-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Главна
                </button>
              </div>
            </div>
          ))}

          {pending.map((item) => (
            <div key={item.url} className="relative">
              <img
                src={item.url}
                alt=""
                width={120}
                height={90}
                className="h-[90px] w-[120px] rounded-[0.2857rem] border border-line object-cover opacity-70"
              />
              <button
                type="button"
                aria-label="Отстрани слика"
                className="absolute -top-2 -right-2 flex size-6 cursor-pointer items-center justify-center rounded-full bg-danger text-white hover:bg-[#c92121]"
                onClick={() => {
                  URL.revokeObjectURL(item.url)
                  setPending((current) => current.filter((entry) => entry.url !== item.url))
                }}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="h-[90px] w-[120px] flex-col gap-1 text-xs"
            disabled={busyImages}
            onClick={() => input.current?.click()}
          >
            <Plus className="size-4" />
            {busyImages ? 'Прикачуваме…' : 'Додај слика'}
          </Button>
        </div>

        <p className="mt-2 text-sm text-black/45">
          Сликите се смалуваат во вашиот прелистувач пред да се испратат. Првата слика е онаа што се
          гледа на картичката.
        </p>
      </Field>

      {serverError ? (
        <Message variant="error" className="mb-5">
          <p>{serverError}</p>
        </Message>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="positive" size="lg" disabled={isSubmitting || busyImages}>
          {isSubmitting ? 'Зачувуваме…' : 'Зачувај производ'}
        </Button>
        <Button type="button" variant="default" onClick={() => router.history.back()}>
          Откажи
        </Button>
      </div>
    </form>
  )
}
