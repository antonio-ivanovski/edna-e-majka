import { useRef } from 'react'

type FilePickerConfig = {
  accept: string
  multiple: boolean
}
type FilePickerCallback = (selectedFile: File[]) => void
export const useFilePicker = (config: FilePickerConfig) => {
  const clientCallbackRef = useRef<FilePickerCallback | null>(null)
  const fileInputElement = useRef(
    createInputElement(config.accept, config.multiple, (files) => {
      clientCallbackRef.current?.(files)
      clientCallbackRef.current = null
    })
  )
  return (callback: FilePickerCallback) => {
    clientCallbackRef.current = callback
    fileInputElement.current.dispatchEvent(new MouseEvent('click'))
  }
}

const createInputElement = (accept: string, multiple: boolean, callback: FilePickerCallback) => {
  const inputElement = document.createElement('input')
  // Set its type to file
  inputElement.type = 'file'
  // Set accept to the file types you want the user to select.
  // Include both the file extension and the mime type
  inputElement.accept = accept
  // Accept multiple files
  inputElement.multiple = multiple
  // set onchange event to call callback when user has selected file
  inputElement.addEventListener('change', () => {
    if (inputElement.files != null) {
      const files: File[] = []
      for (let i = 0; i < inputElement.files.length; i++) {
        files.push(inputElement.files[i])
      }
      callback(files)
    }
  })
  return inputElement
}
