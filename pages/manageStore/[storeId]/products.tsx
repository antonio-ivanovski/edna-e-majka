import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import {
  Button,
  Dropdown,
  Form,
  Header,
  Icon,
  Image,
  Input,
  Label,
  Loader,
  Message,
  Modal,
  Statistic
} from 'semantic-ui-react'
import { useFirebaseApp } from '../../../lib/firebase-context'
import firebase from 'firebase'
import 'firebase/firestore'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { categories, products } from '../../../lib'
import { v4 as uuid } from 'uuid'
import { useAuth } from '../../../lib/firebase-auth-context'
import Resizer from 'react-image-file-resizer'
import { useFilePicker } from '../../../components/utils'

const ManageStoreProducts = () => {
  const { user } = useAuth()
  if (user === null) return <Message error content="Не сте најавен" />

  const firebaseApp = useFirebaseApp()
  const { storeId } = useRouter().query
  if (typeof storeId !== 'string') throw new Error(`Invalid storeId type ${typeof storeId}.`)
  const [storeProducts, setStoreProducts] = useState<products.Product[] | 'loading'>('loading')
  useEffect(() => {
    if (user) {
      if (user.stores.includes(storeId)) {
        return products.liveProductsForStore(storeId, setStoreProducts, firebaseApp)
      } else {
        alert('Немате пристап кон продавницата кон која се обидувате да присапите.')
      }
    }
  }, [user])

  if (storeProducts === 'loading') return <Loader active>Се вчитуваат производите</Loader>

  const items = storeProducts.map((product) => (
    <div
      key={product.id}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'start',
        borderBottom: '1px solid grey',
        padding: 10
      }}
    >
      <Image size="medium" spaced src={product.images[0]} />
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Header as="h2" content={product.title} subheader={product.description.slice(0, 200) + '...'} />
        {product.variants.map((v) => (
          <Statistic key={v.title} size="mini" color="red" label={v.title} value={v.price + ' МКД'} />
        ))}
        <Button.Group style={{ alignSelf: 'end' }}>
          <Button
            icon="delete"
            labelPosition="right"
            content="Избриши"
            negative
            onClick={() => {
              const confirmed = confirm(`Дали сте сигурни дека сакате да избришите продуктот "${product.title}"?`)
              if (confirmed) {
                firebaseApp
                  .storage()
                  .ref(`storesAssets/${product.store}/${product.id}`)
                  .listAll()
                  .then(({ items }) => items.forEach(async (f) => f.delete()))
                firebaseApp.firestore().collection('products').doc(product.id).delete()
              }
            }}
          />
          <Modal
            closeIcon
            closeOnDimmerClick={false}
            closeOnEscape={false}
            trigger={
              <Button icon labelPosition="right" primary onClick={() => {}}>
                <Icon name="edit" />
                Измени
              </Button>
            }
          >
            <Modal.Header>Измени производ</Modal.Header>
            <Modal.Content>
              <ProductForm storeId={storeId} product={product} />
            </Modal.Content>
          </Modal>
        </Button.Group>
      </div>
    </div>
  ))

  return (
    <div>
      <Modal
        closeIcon
        closeOnDimmerClick={false}
        closeOnEscape={false}
        trigger={<Button icon="shop" labelPosition="left" content="Креирај нов производ" color="green" fluid />}
      >
        <Modal.Header>Креирај производ</Modal.Header>
        <Modal.Content>
          <ProductForm storeId={storeId} />
        </Modal.Content>
      </Modal>
      {items}
    </div>
  )
}

type ProductFormData = {
  title: string
  description: string
  images: (File | string)[]
  variants: { title: string; price: string }[]
  categories: string[]
}

const ProductForm = (props: { storeId: string; product?: products.Product }) => {
  const [allCategories, setAllCategories] = useState<categories.Category[] | 'loading'>('loading')
  const [submitStatus, setSubmitStatus] = useState<'loading' | 'success' | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const firebaseApp = useFirebaseApp()

  useEffect(() => {
    categories.getAll(firebaseApp).then(setAllCategories)
  }, [])

  const { control, errors, handleSubmit, reset, watch } = useForm<ProductFormData>({
    reValidateMode: 'onChange',
    defaultValues: {
      title: props.product?.title ?? '',
      description: props.product?.description ?? '',
      images: props.product?.images ?? [],
      variants: props.product?.variants.map((v) => ({ title: v.title, price: v.price.toString() })) ?? [
        { title: '', price: '' }
      ],
      categories: props.product?.categories?.map((c) => c.id) ?? []
    }
  })

  const { fields, append, remove } = useFieldArray<products.ProductVariant>({
    control,
    name: 'variants'
  })

  const triggerFilePicker = useFilePicker({ accept: '.png, .jpg, .jpeg', multiple: true })

  if (allCategories === 'loading') {
    return <Loader active content="Се вчитува..." />
  }
  if (submitStatus === 'success') {
    return <Message success header={`Успешно ${props.product ? 'изменување' : 'креирање'} на производот.`} />
  }

  const onSubmit = async (data: ProductFormData) => {
    setSubmitStatus('loading')
    const firestore = firebaseApp.firestore()
    const storage = firebaseApp.storage()

    const productRef = firestore.collection('products').doc(props.product?.id)

    try {
      const productImages: string[] = []
      for (const image of data.images) {
        if (typeof image === 'string') {
          productImages.push(image)
        } else {
          const compressedImage = await new Promise<Blob>((resolve) =>
            Resizer.imageFileResizer(image, 1200, 1200, 'JPEG', 95, 0, (blob) => resolve(blob as Blob), 'blob')
          )

          const uploadTask = await storage
            .ref(`storesAssets/${props.storeId}/${productRef.id}/${uuid()}`)
            .put(compressedImage)
          const downloadUrl = await uploadTask.ref.getDownloadURL()
          productImages.push(downloadUrl)
        }
      }

      if (props.product) {
        await productRef.update({
          title: data.title,
          description: data.description,
          variants: [...data.variants],
          categories: data.categories.map((id) => allCategories.find((c) => c.id === id)),
          images: productImages
        })
      } else {
        await productRef.set({
          created: firebase.firestore.FieldValue.serverTimestamp(),
          store: props.storeId,
          title: data.title,
          description: data.description,
          variants: [...data.variants],
          categories: data.categories.map((id) => allCategories.find((c) => c.id === id)),
          images: productImages
        })
      }

      reset()
      setSubmitStatus('success')
    } catch (e) {
      setSubmitStatus(null)
      setError(e)
    }
  }

  const variantForms = fields.map((item, index) => (
    <Form.Group key={item.id}>
      <Controller
        name={`variants[${index}].title`}
        control={control}
        defaultValue={item.title ?? ''}
        rules={{ required: 'Ве молиме внесете наслов за варијантата од производот.' }}
        render={({ onChange, value }) => (
          <Form.Input
            error={errors.variants?.[index]?.title?.message}
            value={value}
            onChange={onChange}
            label="Наслов"
            placeholder="Наслов за варијантата"
            width={10}
          />
        )}
      />
      <Controller
        name={`variants[${index}].price`}
        control={control}
        defaultValue={item.price ?? ''}
        rules={{
          validate: (value) => (Number.isNaN(Number.parseFloat(value)) ? 'Внесете валидна цена' : true)
        }}
        render={({ onChange, value }) => (
          <Form.Field width={6} error={!!errors.variants?.[index]?.price}>
            <label>Цена</label>
            <Input
              value={value}
              onChange={onChange}
              placeholder="Цена за варијантата"
              labelPosition="right"
              label={{ basic: true, content: 'МКД' }}
            />
          </Form.Field>
        )}
      />
      <Button disabled={fields.length === 1} icon="delete" color="red" onClick={() => remove(index)} />
    </Form.Group>
  ))

  return (
    <Form loading={submitStatus === 'loading'} error={!!error} onSubmit={handleSubmit(onSubmit)}>
      <Message
        error
        header={`Грешка при ${props.product ? 'измена' : 'креирање'} на производ. Обидете се повторно`}
        content={error?.message}
      />
      <Controller
        name="title"
        control={control}
        rules={{ required: 'Ве молиме внесете наслов за производот.' }}
        render={({ onChange, value }) => (
          <Form.Input
            error={errors.title?.message}
            value={value}
            onChange={onChange}
            label="Наслов"
            placeholder="Наслов на производот"
          />
        )}
      />
      <Controller
        name="description"
        control={control}
        rules={{ required: 'Ве молиме внесете краток за производот.' }}
        render={({ onChange, value }) => (
          <Form.TextArea
            error={errors.description?.message}
            value={value}
            onChange={onChange}
            label="Краток опис"
            placeholder="Опис за производот"
            rows={13}
            style={{ whiteSpace: 'pre-wrap' }}
          />
        )}
      />
      <Controller
        name="images"
        control={control}
        rules={{ validate: (value: any[]) => value.length > 0 }}
        render={({ value, onChange }: { value: ProductFormData['images']; onChange: any }) => (
          <Form.Field error={errors.images != null}>
            <label>Слики од производот</label>
            {value.length === 0 ? (
              <p>Нема прикачени слики</p>
            ) : (
              <Image.Group size="small">
                {value.map((image, index) => (
                  <Image
                    key={index}
                    bordered
                    spaced
                    src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                    label={{
                      as: 'a',
                      corner: 'right',
                      icon: 'trash',
                      color: 'red',
                      onClick: () => onChange([...value.slice(0, index), ...value.slice(index + 1, value.length)])
                    }}
                  />
                ))}
              </Image.Group>
            )}
            <Button
              onClick={(e) => {
                e.preventDefault()
                if (value.length < 4) {
                  triggerFilePicker((files) => onChange([...value, ...files].slice(0, 4)))
                } else {
                  alert('Дозволено е прикачување најмногу 4 слики по производ.')
                }
              }}
              content="Прикачи слики"
              color="green"
              icon="image"
              labelPosition="left"
              size="mini"
            />
          </Form.Field>
        )}
      />

      <Controller
        name="categories"
        control={control}
        rules={{ validate: (v: string[]) => v.length > 0 || 'Ве молиме слекетирајте категорија за продуктот' }}
        render={({ onChange, value }) => (
          <Form.Field error={!!errors.categories}>
            <Dropdown
              placeholder="Категории"
              fluid
              multiple
              selection
              options={allCategories.map((c) => ({ key: c.id, text: c.title, value: c.id }))}
              onChange={(_, data) => onChange(data.value)}
              value={value}
            />
            {errors.categories && (
              <Label pointing prompt>
                {(errors.categories as any).message}
              </Label>
            )}
          </Form.Field>
        )}
      />

      <Header content="Варијанти" />
      {variantForms}
      <Button
        onClick={(e) => {
          e.preventDefault()
          append({ title: '', price: undefined })
        }}
        content="Креирај нова варијанта"
        color="green"
        icon="add"
        labelPosition="left"
        size="mini"
      />
      <Button fluid primary style={{ marginTop: 10 }} content="Потврди" />
    </Form>
  )
}

export default ManageStoreProducts
