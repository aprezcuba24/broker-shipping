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
└── {Entities}Provider        ← useCRUD + React context
    └── {Entity}Table         ← PageWrapper + DataTable + create DialogForm
        └── columns           ← ColumnDef[] + BtnList (edit DialogForm, BtnConfirm delete)
            └── DialogForm    ← react-hook-form + ButtonModal
```

- **State/actions** live in `{entities}-context.tsx` via `useCRUD` from `@broker/ui`.
- **UI** reads context with `use{Entities}()` — no prop drilling for mutations.
- **Forms** are modal dialogs (`DialogForm`), not separate routes.
- **Create** uses `DialogForm` with a visible trigger (toolbar). **Edit/delete** in each row use `DialogForm` / `BtnConfirm` with icon triggers inside `BtnList`.

---

## File layout

Create one folder per entity under `apps/backoffice/src/pages/{entity}/`:

```
pages/{entity}/
├── index.tsx                 # Page: Provider + Table
├── {entities}-context.tsx    # FormValues, Provider, hook
├── table.tsx                 # PageWrapper, create button, DataTable
├── columns.tsx               # ColumnDef[] + per-row actions
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
| Row actions component | local name (e.g. `RowActions`) | `RowActions` in `columns.tsx` — not `@broker/ui` `RowActions` |

---

## 1. Context — `{entities}-context.tsx`

Wire Orval hooks into `useCRUD`. Map form values to mutation variables. Use **explicit** generic types copied from the generated hook variable shapes (see `packages/api/src/generated/`).
Define validation schema with Zod in the same context file and export `FormValues` from `z.infer`.

```tsx
import {
  getListOrganizationsOrganizationsGetQueryKey,
  useCreateOrganizationOrganizationsPost,
  useDeleteOrganizationOrganizationsOrganizationIdDelete,
  useListOrganizationsOrganizationsGet,
  usePatchOrganizationOrganizationsOrganizationIdPatch,
  type Organization,
} from '@broker/api'
import { useCRUD, type CrudContextValue } from '@broker/ui'
import { createContext, useContext, type ReactNode } from 'react'
import { z } from 'zod'

export const organizationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
})

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>

export type OrganizationsContextValue = CrudContextValue<
  Organization,
  OrganizationFormValues
>

const OrganizationsContext = createContext<OrganizationsContextValue | null>(null)

export function OrganizationsProvider({ children }: { children: ReactNode }) {
  const value = useCRUD<
    Organization,
    OrganizationFormValues,
    { data: { name: string } },
    { organizationId: string; data: { name: string } },
    { organizationId: string }
  >({
    useList: useListOrganizationsOrganizationsGet,
    getListQueryKey: getListOrganizationsOrganizationsGetQueryKey,
    useCreate: useCreateOrganizationOrganizationsPost,
    usePatch: usePatchOrganizationOrganizationsOrganizationIdPatch,
    useDelete: useDeleteOrganizationOrganizationsOrganizationIdDelete,
    toCreateVariables: (values) => ({ data: { name: values.name } }),
    toPatchVariables: (org, values) =>
      org.id ? { organizationId: org.id, data: { name: values.name } } : null,
    toDeleteVariables: (org) =>
      org.id ? { organizationId: org.id } : null,
  })
  return <OrganizationsContext value={value}>{children}</OrganizationsContext>
}

export function useOrganizations(): OrganizationsContextValue {
  const context = useContext(OrganizationsContext)
  if (!context) {
    throw new Error('useOrganizations must be used within OrganizationsProvider')
  }
  return context
}
```

**Rules:**
- `toPatchVariables` / `toDeleteVariables` return `null` when `item.id` is missing — mutation is skipped.
- Patch/delete id param name comes from OpenAPI (e.g. `organizationId`, `categoryId`) — match generated types exactly.
- Do not duplicate list invalidation or error formatting — `useCRUD` handles that via `formatApiError` and `getListQueryKey()`.
- Keep Zod schema messages in Spanish and aligned with API constraints.

**Org-scoped entities:** routes require `X-Organization-Id`. The API client adds it from `configureApi({ getOrganizationId })` — no extra header logic in the page. Ensure the active org is set in auth before hitting tenant endpoints.

### Org-scoped create pattern (reusable)

When entities must be tied to the active organization (e.g. categories), inject `organization_id` from context in `submitCreate`.

Canonical reference: `apps/backoffice/src/pages/category/categories-context.tsx`.

```tsx
import { useActiveOrganization } from '@/contexts/active-organization-context'
// ...
export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  organization_id: z.string().nullish(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { submitCreate, ...value } = useCRUD<
    Category,
    CategoryFormValues,
    { data: Category },
    { categoryId: string; data: { name: string } },
    { categoryId: string }
  >({
    // ...
    toCreateVariables: (values) => ({
      data: {
        ...values,
        organization_id: values.organization_id ?? '',
      } as Category,
    }),
  })

  const { activeOrganization } = useActiveOrganization()

  const create = (values: CategoryFormValues) =>
    submitCreate({ ...values, organization_id: activeOrganization?.id })

  return (
    <CategoriesContext value={{ ...value, submitCreate: create }}>
      {children}
    </CategoriesContext>
  )
}
```

**Rules for tenant-scoped create:**
- Keep `organization_id` optional/nullish in `FormValues` if the field is not edited in the modal.
- Inject active org id only in provider-level `submitCreate` wrapper, not in UI components.
- Keep dialog form clean (`name` only, etc.); no hidden input for org id.
- Ensure active organization is selected before create flows.

---

## 2. Dialog form — `DialogForm.tsx`

Single modal form reused for create (toolbar button) and edit (row icon button). Omit `Form` from `FormModalProps` and implement the form inline (organization does not use `FormModal` wrapper).

```tsx
import {
  ButtonModal,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  useFormSubmitHandle,
  type FormModalHandle,
  type FormModalProps,
} from '@broker/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  {entity}FormSchema,
  type {Entity}FormValues,
} from './{entities}-context'

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

  const form = useForm<{Entity}FormValues>({
    resolver: zodResolver({entity}FormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [formKey, defaultValues, form])

  useFormSubmitHandle(formRef, form.handleSubmit, onSubmit)

  const handleAccept = async () => {
    await formRef.current?.submit()
  }

  return (
    <ButtonModal
      onAccept={handleAccept}
      isLoading={isSubmitting}
      open={open}
      onOpenChange={onOpenChange}
      hideTrigger={open !== undefined}
      {...buttonProps}
    >
      <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="{entity}-name">Nombre</FieldLabel>
                <Input
                  {...field}
                  id="{entity}-name"
                  maxLength={255}
                  autoFocus
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </ButtonModal>
  )
}
```

**Rules:**
- Use `formKey` to reset form when switching create ↔ edit or reopening create after success (`createFormKey` from context for create; `item.id` for edit).
- Client validation uses `zodResolver` + context schema.
- UI copy in Spanish (labels, validation messages, modal titles).
- Set unique `id` / `htmlFor` per field (`{entity}-name`).
- Pass `error={formError}` from context for API errors; call `clearFormError()` / `resetCreateForm()` in `onOpenChange` when modal closes.
- For field-level errors, use `FieldError` inside `Controller`; do not render manual `<p>` error blocks.
- Add `data-invalid={fieldState.invalid}` to `Field` and `aria-invalid={fieldState.invalid}` to controls.
- **Create / edit (default):** pass trigger props (`label`, `icon`, `variant`, `size`, …) — no `open` prop; `ButtonModal` renders the trigger.
- **Controlled modal (optional):** pass `open` + `onOpenChange`; `hideTrigger={open !== undefined}` hides the trigger (same as `FormModal` in `@broker/ui`).

---

## 3. Columns — `columns.tsx`

Per-row actions: `BtnList` wrapping an edit `DialogForm` (icon trigger) and `BtnConfirm` (icon trigger + built-in confirm dialog). No local `useState` for modal open — triggers open modals via `@broker/ui`.

```tsx
import type { {Entity} } from '@broker/api'
import { BtnConfirm, BtnList, type ColumnDef } from '@broker/ui'
import { Pencil, Trash2 } from 'lucide-react'
import { DialogForm } from './DialogForm'
import { use{Entities} } from './{entities}-context'

function RowActions({ item }: { item: {Entity} }) {
  const {
    submitEdit,
    clearFormError,
    isSubmitting,
    formError,
    deleteItem,
    isDeleting,
  } = use{Entities}()

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
        onOpenChange={(open) => {
          if (!open) clearFormError()
        }}
      />
      <BtnConfirm
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Eliminar ${item.name}`}
        title="Eliminar …"
        description={`¿Seguro que deseas eliminar «${item.name}»? Esta acción no se puede deshacer.`}
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
  { id: 'created_at', header: 'Creado', accessor: 'created_at' },
  { id: 'updated_at', header: 'Actualizado', accessor: 'updated_at' },
  {
    id: 'actions',
    header: '',
    align: 'right',
    cell: (row) => <RowActions item={row} />,
  },
]
```

- Use `accessor` for default cell rendering; add `type: 'datetime'` when the API returns ISO timestamps.
- Include timestamp columns present on the API model (`created_at`, `updated_at`, …).
- Optional: `hideOn: 'sm' | 'md' | 'lg'` on non-essential columns for narrower viewports (`DataTable` supports it; organization omits it today).
- Do not confuse the local `RowActions` cell component with `RowActions` from `@broker/ui` (dropdown menu) — the canonical pattern uses `BtnList` + icon buttons.

---

## 4. Table — `table.tsx`

```tsx
import { DataTable, PageWrapper } from '@broker/ui'
import { Building2, Plus } from 'lucide-react'
import { DialogForm } from './DialogForm'
import { columns } from './columns'
import { use{Entities} } from './{entities}-context'

export function {Entity}Table() {
  const {
    formError,
    createFormKey,
    isCreating,
    submitCreate,
    resetCreateForm,
    items,
    isLoading,
    page,
    setPage,
  } = use{Entities}()

  return (
    <PageWrapper
      title="Organizaciones"
      description="Gestiona las organizaciones a las que tienes acceso."
      icon={Building2}
      buttons={[
        <DialogForm
          key="create"
          label="Nueva organización"
          icon={Plus}
          size="sm"
          className="w-full sm:w-auto"
          title="Nueva organización"
          acceptLabel="Crear"
          defaultValues={{ name: '' }}
          formKey={String(createFormKey)}
          onSubmit={submitCreate}
          isSubmitting={isCreating}
          error={formError}
          onOpenChange={(open) => {
            if (!open) resetCreateForm()
          }}
        />,
      ]}
    >
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        getRowId={(row) => row.id!}
        pagination={{ page, onPageChange: setPage }}
        emptyMessage="No hay organizaciones registradas"
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

Router imports the page from the folder entry: `import { OrganizationPage } from './pages/organization'` (resolves to `index.tsx`).

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
| `deleteItem`, `isDeleting` | Delete confirm (`BtnConfirm`) |

---

## Checklist

- [ ] Backend CRUD exists; OpenAPI regenerated; hooks exported from `@broker/api`
- [ ] Folder `pages/{entity}/` with 5 files (index, `{entities}-context`, table, columns, DialogForm)
- [ ] `{Entity}FormValues` is inferred from Zod schema; `useCRUD` generics and mappers match generated mutation types
- [ ] Create uses `createFormKey` + `resetCreateForm`; edit uses `item.id` as `formKey`
- [ ] Row actions: `BtnList` + edit `DialogForm` (icon) + `BtnConfirm` (icon); `clearFormError` on edit close
- [ ] `aria-label` on icon-only edit/delete triggers
- [ ] Create button uses `size="sm"` and `className="w-full sm:w-auto"`
- [ ] Route in `router.tsx` and nav item in `navigation.ts`
- [ ] Spanish UI strings; field validation aligned with API model
- [ ] Tenant-scoped entities inject `organization_id` from active organization in provider `submitCreate` wrapper

### Mobile-first conventions (inherited from `@broker/ui`)

- `DataTable` adds `.broker-data-table` — denser rows, surface tokens (CSS in `packages/ui/src/styles.css`).
- `ButtonModal` / `ConfirmDialog` (via `BtnConfirm`) add `.broker-dialog` — top-anchored on mobile, centered on desktop.
- Do **not** edit shadcn primitives in `packages/ui/src/components/ui/`; style via scoped CSS and wrappers.

---

## Anti-patterns

- **Do not** call Orval mutation hooks directly in table/columns — always go through context + `useCRUD`.
- **Do not** add boolean `isEdit` props to a monolithic form — one `DialogForm`, different `defaultValues` / `onSubmit` at call site.
- **Do not** skip `formKey` — without it, react-hook-form keeps stale values when reopening modals.
- **Do not** put CRUD list/pagination/mutation state in page-level `useState` when `useCRUD` already covers the workflow.
- **Do not** use `@broker/ui` `RowActions` dropdown in new CRUD pages unless explicitly migrating away from the `BtnList` + icon pattern used in organization.
- **Do not** duplicate inline `register` validation rules when schema already exists in context.
- **Do not** pass `organization_id` from table/dialog components for tenant-scoped entities; resolve it in provider with active org context.
