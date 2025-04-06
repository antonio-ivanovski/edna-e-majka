import { useForm, Controller } from 'react-hook-form'
import { Button, Form, Message } from 'semantic-ui-react'
import { useFirebaseApp } from '../../lib/firebase-context'
import { validateEmail } from '../../lib/util'
import firebase from 'firebase'
import 'firebase/firestore'
import 'firebase/storage'
import { useAuth } from '../../lib/firebase-auth-context'
import { useState } from 'react'
import { stores } from '../../lib'
import Resizer from 'react-image-file-resizer'

const CreateStoreForm = (props: { onSuccess: () => void; store?: stores.Store }) => {
  const [submitStatus, setSubmitStatus] = useState<'loading' | 'success' | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const firebaseApp = useFirebaseApp()

  const { register, control, errors, handleSubmit, reset } = useForm({
    reValidateMode: 'onChange',
    defaultValues: {
      name: props.store?.name ?? '',
      description: props.store?.description ?? '',
      avatar: new DataTransfer().files,
      email: props.store?.contact.email ?? '',
      phone: props.store?.contact.phone ?? '',
      facebook: props.store?.contact.facebook ?? '',
      instagram: props.store?.contact.instagram ?? ''
    }
  })

  const onSubmit = async (data: any) => {
    setSubmitStatus('loading')
    const firestore = firebaseApp.firestore()
    const storage = firebaseApp.storage()

    const storeRef = firestore.collection('stores').doc(props.store?.id)

    try {
      const avatarFile = data.avatar[0] as File
      let avatar = props.store?.avatar
      if (avatarFile) {
        const compressedAvatar = await new Promise<Blob>((resolve) =>
          Resizer.imageFileResizer(avatarFile, 300, 300, 'PNG', 100, 0, (blob) => resolve(blob as Blob), 'blob')
        )
        const uploadTask = await storage.ref(`storesAssets/${storeRef.id}/avatar`).put(compressedAvatar)
        avatar = await uploadTask.ref.getDownloadURL()
      }

      const uploadData = Object.assign(
        {
          name: data.name,
          description: data.description,
          avatar: avatar,
          contact: {
            email: data.email.length > 0 ? data.email : null,
            phone: data.phone.length > 0 ? data.phone : null,
            facebook: data.facebook.length > 0 ? data.facebook : null,
            instagram: data.instagram.length > 0 ? data.instagram : null
          }
        },
        props.store == null
          ? { created: firebase.firestore.FieldValue.serverTimestamp() }
          : { modified: firebase.firestore.FieldValue.serverTimestamp() }
      )

      if (props.store == null) {
        await storeRef.set(uploadData)
        await firestore
          .collection('users')
          .doc(user!.id)
          .set(
            {
              stores: firebase.firestore.FieldValue.arrayUnion(storeRef.id)
            },
            { merge: true }
          )
      } else {
        await storeRef.update(uploadData)
      }

      reset()
      setSubmitStatus('success')
      props.onSuccess()
    } catch (e) {
      setSubmitStatus(null)
      console.error(e)
      setError(e)
    }
  }

  return (
    <Form
      loading={submitStatus === 'loading'}
      success={submitStatus === 'success'}
      error={!!error}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Message error header="Грешка при креирање на продавница. Обидете се повторно" content={error?.message} />
      <Message
        success
        header="Успешно креирање на продавница."
        content="Можете да продолжете кон додавање на производи за истата"
      />
      <Controller
        name="name"
        control={control}
        rules={{ required: 'Ве молиме внесете име на продавницата.' }}
        render={({ onChange, value }) => (
          <Form.Input
            error={errors.name?.message}
            value={value}
            onChange={onChange}
            label="Име"
            placeholder="Име на продавницата"
          />
        )}
      />
      <Controller
        name="email"
        type="email"
        control={control}
        rules={{
          validate: (data: string) =>
            data.length === 0
              ? undefined
              : validateEmail(data) || 'Ве молиме внесете валидна е-маил адреса. Пример prodavnica@gmail.com'
        }}
        render={({ onChange, value }) => (
          <Form.Input
            type="email"
            error={errors.email?.message}
            value={value}
            onChange={onChange}
            label="Контаткт е-маил адреса за продавницата"
            placeholder="prodavnica@gmail.com"
          />
        )}
      />
      <Controller
        name="phone"
        control={control}
        defaultValue=""
        render={({ onChange, value }) => (
          <Form.Input
            type="tel"
            value={value}
            onChange={onChange}
            label="Телефонски број за продавницата"
            placeholder="+389 72 123 456"
          />
        )}
      />
      <Controller
        name="facebook"
        control={control}
        defaultValue=""
        render={({ onChange, value }) => (
          <Form.Input
            value={value}
            onChange={onChange}
            label="Facebook профил на продавницата"
            placeholder="https://www.facebook.com/ednaemajka.mk"
          />
        )}
      />
      <Controller
        name="instagram"
        control={control}
        defaultValue=""
        render={({ onChange, value }) => (
          <Form.Input
            value={value}
            onChange={onChange}
            label="Instagram профил на продавницата"
            placeholder="https://www.instagram.com/ednaemajka.mk/"
          />
        )}
      />
      <Form.Field error={errors.avatar?.message != null}>
        <label>Малечка слика за продавницата</label>
        <input type="file" name="avatar" accept=".png, .jpg, .jpeg" ref={register({ required: !props.store })} />
      </Form.Field>
      <Controller
        name="description"
        control={control}
        defaultValue=""
        render={({ onChange, value }) => (
          <Form.TextArea value={value} onChange={onChange} rows={13} label="Краток опис за продавницата" />
        )}
      />
      <Button fluid primary>
        Потврди
      </Button>
    </Form>
  )
}

export default CreateStoreForm
