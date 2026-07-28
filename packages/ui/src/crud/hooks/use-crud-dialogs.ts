import { useCallback, useState } from 'react'

export type CreateDialogState = {
  isOpen: boolean
  open: () => void
  close: () => void
  setOpen: (open: boolean) => void
  formKey: number
}

export type EditDialogState<TItem> = {
  isOpen: boolean
  item: TItem | null
  open: (item: TItem) => void
  close: () => void
  setOpen: (open: boolean) => void
  formKey: string | number | null
}

export type CrudDialogs<TItem> = {
  create: CreateDialogState
  edit: EditDialogState<TItem>
}

export function useCrudDialogs<TItem extends { id?: string | number | null }>(): CrudDialogs<TItem> {
  const [createOpen, setCreateOpen] = useState(false)
  const [createFormKey, setCreateFormKey] = useState(0)
  const [editItem, setEditItem] = useState<TItem | null>(null)

  const openCreate = useCallback(() => {
    setCreateFormKey((key) => key + 1)
    setCreateOpen(true)
  }, [])

  const closeCreate = useCallback(() => {
    setCreateOpen(false)
  }, [])

  const setCreateOpenControlled = useCallback((open: boolean) => {
    if (open) {
      setCreateFormKey((key) => key + 1)
    }
    setCreateOpen(open)
  }, [])

  const openEdit = useCallback((item: TItem) => {
    setEditItem(item)
  }, [])

  const closeEdit = useCallback(() => {
    setEditItem(null)
  }, [])

  const setEditOpen = useCallback((open: boolean) => {
    if (!open) {
      setEditItem(null)
    }
  }, [])

  return {
    create: {
      isOpen: createOpen,
      open: openCreate,
      close: closeCreate,
      setOpen: setCreateOpenControlled,
      formKey: createFormKey,
    },
    edit: {
      isOpen: editItem !== null,
      item: editItem,
      open: openEdit,
      close: closeEdit,
      setOpen: setEditOpen,
      formKey: editItem?.id ?? null,
    },
  }
}
