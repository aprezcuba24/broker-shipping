import { useImperativeHandle } from 'react'
import type { FieldValues, UseFormHandleSubmit } from 'react-hook-form'

import type { FormModalHandle } from '../components/form-modal'

export function useFormSubmitHandle<T extends FieldValues>(
  ref: React.Ref<FormModalHandle> | undefined,
  handleSubmit: UseFormHandleSubmit<T>,
  onValid: (values: T) => void | Promise<void>,
) {
  useImperativeHandle(ref, () => ({
    submit: () =>
      handleSubmit(onValid, () => {
        throw new Error('validation')
      })(),
  }))
}
