import { useImperativeHandle } from 'react'
import type { FieldValues, UseFormHandleSubmit } from 'react-hook-form'

import type { EntityFormHandle } from '../crud/components/entity-form-dialog'

/** @deprecated Prefer EntityFormHandle from the CRUD kit. */
export type FormModalHandle = EntityFormHandle

export function useFormSubmitHandle<T extends FieldValues>(
  ref: React.Ref<EntityFormHandle> | undefined,
  handleSubmit: UseFormHandleSubmit<T>,
  onValid: (values: T) => unknown | Promise<unknown>,
) {
  useImperativeHandle(ref, () => ({
    submit: () =>
      handleSubmit(
        async (values) => {
          await onValid(values)
        },
        () => {
          throw new Error('validation')
        },
      )(),
  }))
}
