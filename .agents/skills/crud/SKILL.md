---
name: backoffice-crud
description: >-
  Backoffice entity CRUD pages in apps/backoffice: context + useCRUD, DataTable,
  DialogForm, columns with row actions, router and nav registration. Use when
  adding or modifying admin list/create/edit/delete screens for API entities.
---

# Backoffice CRUD

**Canonical reference:** `apps/backoffice/src/pages/organization/`

**Prerequisites:** API module with list/create/patch/delete routes. See [broker-api-development](../broker-api-development/SKILL.md). Regenerate client hooks after OpenAPI changes.

```bash
pnpm rpc:schema          # export OpenAPI from FastAPI
pnpm --filter @broker/api codegen
```

Ensure new generated hooks are exported from `packages/api/src/index.ts`.

---

## Architecture

Compound components with lifted state:

```
Page (index.tsx)
└── {Entity}Provider          ← useCRUD + React context
    └── {Entity}Table         ← PageWrapper + DataTable + create DialogForm
        └── columns           ← row data + RowActions (edit DialogForm, BtnConfirm delete)
            └── DialogForm    ← react-hook-form + ButtonModal
```

- **State/actions** live in `{entity}-context.tsx` via `useCRUD` from `@broker/ui`.
- **UI** reads context with `use{Entities}()` — no prop drilling for mutations.
- **Forms** are modal dialogs (`DialogForm`), not separate routes.

---

## File layout

Create one folder per entity under `apps/backoffice/src/pages/{entity}/`:

```
pages/{entity}/
├── index.tsx                 # Page: Provider + Table
├── {entity}-context.tsx      # FormValues, Provider, hook
├── table.tsx                 # PageWrapper, create button, DataTable
├── columns.tsx               # ColumnDef[] + RowActions
└── DialogForm.tsx            # Shared create/edit modal form
```

**Naming (follow organization):**

| Artifact | Pattern | Example |
|----------|---------|---------|
| Folder | singular kebab | `organization/` |
| Page export | `{Entity}Page` | `OrganizationPage` |
| Context file | `{entities}-context.tsx` | `organizations-context.tsx` |
| Provider / hook | `{Entities}Provider`, `use{Entities}` | `OrganizationsProvider`, `useOrganizations` |
| Form values type | `{Entity}FormValues` | `OrganizationFormValues` |
| Table export | `{Entity}Table` | `OrganizationTable` |

---

## 1. Context — `{entities}-context.tsx`

Wire Orval hooks into `useCRUD`. Map form values to mutation variables.

```tsx
import {
  getList{Entities}{Route}GetQueryKey,
  useCreate{Entity}{Route}Post,
  useDelete{Entity}{Route}{IdParam}Delete,
  useList{Entities}{Route}Get,
  usePatch{Entity}{Route}{IdParam}Patch,
  type {Entity},
} from '@broker/api'
import { useCRUD, type CrudContextValue } from '@broker/ui'
import { createContext, useContext, type ReactNode } from 'react'

export type {Entity}FormValues = {
  name: string
  // …one field per editable form input
}

export type {Entities}ContextValue = CrudContextValue<
  {Entity},
  {Entity}FormValues
>

const {Entities}Context = createContext<{Entities}ContextValue | null>(null)

export function {Entities}Provider({ children }: { children: ReactNode }) {
  const value = useCRUD<
    {Entity},
    {Entity}FormValues,
    TCreateVariables,   // infer from useCreate hook
    TPatchVariables,
    TDeleteVariables
  >({
    useList: useList{Entities}{Route}Get,
    getListQueryKey: getList{Entities}{Route}GetQueryKey,
    useCreate: useCreate{Entity}{Route}Post,
    usePatch: usePatch{Entity}{Route}{IdParam}Patch,
    useDelete: useDelete{Entity}{Route}{IdParam}Delete,
    toCreateVariables: (values) => ({ data: { name: values.name } }),
    toPatchVariables: (item, values) =>
      item.id ? { {idParam}: item.id, data: { name: values.name } } : null,
    toDeleteVariables: (item) =>
      item.id ? { {idParam}: item.id } : null,
  })
  return <{Entities}Context value={value}>{children}</{Entities}Context>
}

export function use{Entities}(): {Entities}ContextValue {
  const context = useContext({Entities}Context)
  if (!context) {
    throw new Error('use{Entities} must be used within {Entities}Provider')
  }
  return context
}
```

**Rules:**
- `toPatchVariables` / `toDeleteVariables` return `null` when `item.id` is missing — mutation is skipped.
- Match variable shapes exactly to generated hook types (check `packages/api/src/generated/`).
- Do not duplicate list invalidation or error formatting — `useCRUD` handles that via `formatApiError` and `getListQueryKey()`.

**Org-scoped entities:** routes require `X-Organization-Id`. The API client adds it from `configureApi({ getOrganizationId })` — no extra header logic in the page. Ensure the active org is set in auth before hitting tenant endpoints.

---

## 2. Dialog form — `DialogForm.tsx`

Single modal form reused for create (toolbar) and edit (row action).

```tsx
import {
  ButtonModal,
  Input,
  Label,
  useFormSubmitHandle,
  type FormModalHandle,
  type FormModalProps,
} from '@broker/ui'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import type { {Entity}FormValues } from './{entities}-context'

export type DialogFormProps = Omit<
  FormModalProps<{Entity}FormValues>,
  'Form'
>

export function DialogForm({
  onSubmit,
  defaultValues = { name: '' },
  isSubmitting = false,
  error = null,
  formKey,
  open,
  onOpenChange,
  ...buttonProps
}: DialogFormProps) {
  const formRef = useRef<FormModalHandle>(null)
  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<{Entity}FormValues>({ defaultValues })

  useEffect(() => {
    reset(defaultValues)
  }, [formKey, defaultValues, reset])

  useFormSubmitHandle(formRef, handleSubmit, onSubmit)

  const handleAccept = async () => {
    await formRef.current?.submit()
  }

  return (
    <ButtonModal
      onAccept={handleAccept}
      isLoading={isSubmitting}
      open={open}
      onOpenChange={onOpenChange}
      {...buttonProps}
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {/* fields with register() + errors */}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </ButtonModal>
  )
}
```

**Rules:**
- Use `formKey` to reset form when switching create ↔ edit or reopening create after success (`createFormKey` from context for create; `item.id` for edit).
- Client validation mirrors API constraints (required, maxLength, etc.).
- UI copy in Spanish (labels, validation messages, modal titles).
- Set unique `id` / `htmlFor` per field (`{entity}-name`).
- Pass `error={formError}` from context for API errors; call `clearFormError()` / `resetCreateForm()` in `onOpenChange` when modal closes.

---

## 3. Columns — `columns.tsx`

```tsx
import type { {Entity} } from '@broker/api'
import { BtnConfirm, BtnList, type ColumnDef } from '@broker/ui'
import { Pencil, Trash2 } from 'lucide-react'
import { DialogForm } from './DialogForm'
import { use{Entities} } from './{entities}-context'

function RowActions({ item }: { item: {Entity} }) {
  const { submitEdit, clearFormError, isSubmitting, formError, deleteItem, isDeleting } =
    use{Entities}()

  return (
    <BtnList>
      <DialogForm
        icon={Pencil}
        label=""
        variant="ghost"
        size="icon"
        aria-label={`Editar ${item.name}`}
        title="Editar …"
        acceptLabel="Guardar"
        defaultValues={{ name: item.name }}
        formKey={item.id}
        onSubmit={(values) => submitEdit(item, values)}
        isSubmitting={isSubmitting}
        error={formError}
        onOpenChange={(open) => { if (!open) clearFormError() }}
      />
      <BtnConfirm
        variant="ghost"
        size="icon"
        aria-label={`Eliminar ${item.name}`}
        title="Eliminar …"
        description={`¿Seguro que deseas eliminar «${item.name}»? …`}
        confirmLabel="Eliminar"
        confirmVariant="destructive"
        onConfirm={() => deleteItem(item)}
        isLoading={isDeleting}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </BtnConfirm>
    </BtnList>
  )
}

export const columns: ColumnDef<{Entity}>[] = [
  { id: 'name', header: 'Nombre', accessor: 'name' },
  { id: 'created_at', header: 'Creado', accessor: 'created_at', type: 'datetime' },
  { id: 'actions', header: '', align: 'right', cell: (row) => <RowActions item={row} /> },
]
```

Use `accessor` + optional `type` (`text`, `date`, `datetime`, `number`, `boolean`) for default cell rendering. Use `cell` for custom content or actions.

---

## 4. Table — `table.tsx`

```tsx
import { DataTable, PageWrapper } from '@broker/ui'
import { Icon, Plus } from 'lucide-react'
import { DialogForm } from './DialogForm'
import { columns } from './columns'
import { use{Entities} } from './{entities}-context'

export function {Entity}Table() {
  const {
    formError, createFormKey, isCreating, submitCreate, resetCreateForm,
    items, isLoading, page, setPage,
  } = use{Entities}()

  return (
    <PageWrapper
      title="…"
      description="…"
      icon={Icon}
      buttons={[
        <DialogForm
          key="create"
          label="Nueva …"
          icon={Plus}
          title="Nueva …"
          acceptLabel="Crear"
          defaultValues={{ name: '' }}
          formKey={String(createFormKey)}
          onSubmit={submitCreate}
          isSubmitting={isCreating}
          error={formError}
          onOpenChange={(open) => { if (!open) resetCreateForm() }}
        />,
      ]}
    >
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        getRowId={(row) => row.id!}
        pagination={{ page, onPageChange: setPage }}
        emptyMessage="No hay … registrados"
      />
    </PageWrapper>
  )
}
```

---

## 5. Page — `index.tsx`

```tsx
import { {Entities}Provider } from './{entities}-context'
import { {Entity}Table } from './table'

export function {Entity}Page() {
  return (
    <{Entities}Provider>
      <{Entity}Table />
    </{Entities}Provider>
  )
}
```

---

## 6. Router and navigation

**Router** — `apps/backoffice/src/router.tsx`:

```tsx
import { {Entity}Page } from './pages/{entity}'
// …
<Route path="/{entities}" element={<{Entity}Page />} />
```

**Sidebar** — `apps/backoffice/src/config/navigation.ts`:

```tsx
{ to: '/{entities}', label: '…', icon: SomeIcon },
```

Pick a `lucide-react` icon consistent with the entity. Route path uses plural kebab (`/organizations`).

---

## useCRUD context API

Consumers get this from `use{Entities}()`:

| Field | Use |
|-------|-----|
| `items`, `isLoading` | DataTable data |
| `page`, `setPage` | Pagination |
| `submitCreate`, `isCreating`, `createFormKey`, `resetCreateForm` | Create modal |
| `submitEdit`, `isSubmitting`, `formError`, `clearFormError` | Edit modal |
| `deleteItem`, `isDeleting` | Delete confirm |

---

## Checklist

- [ ] Backend CRUD exists; OpenAPI regenerated; hooks exported from `@broker/api`
- [ ] Folder `pages/{entity}/` with 5 files (index, context, table, columns, DialogForm)
- [ ] `{Entity}FormValues` matches form fields; mappers match generated mutation types
- [ ] Create uses `createFormKey` + `resetCreateForm`; edit uses `item.id` as `formKey`
- [ ] Row actions have `aria-label`; delete uses `BtnConfirm` with destructive variant
- [ ] Route in `router.tsx` and nav item in `navigation.ts`
- [ ] Spanish UI strings; field validation aligned with API model

---

## Anti-patterns

- **Do not** call Orval mutation hooks directly in table/columns — always go through context + `useCRUD`.
- **Do not** add boolean `isEdit` props to a monolithic form — one `DialogForm`, different `defaultValues` / `onSubmit` at call site.
- **Do not** skip `formKey` — without it, react-hook-form keeps stale values when reopening modals.
- **Do not** put CRUD state in `useState` at page level when `useCRUD` already covers the workflow.
