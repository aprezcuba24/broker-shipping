---
name: backoffice-crud
description: >-
  Backoffice entity CRUD pages in apps/backoffice: useListParams + useCrudDialogs
  + useCrudController, DataTable, EntityFormDialog / EntityFormPage, filter bar
  (URL-synced), columns with row actions, router and nav registration. Use when
  adding or modifying admin list/create/edit/delete screens for API entities.
---

# Backoffice CRUD

**Canonical reference (full-page forms):** `apps/backoffice/src/pages/product/`

**Prerequisites:** The entity must exist in OpenAPI (`pnpm rpc:schema`) before generating client hooks. Regenerate hooks after OpenAPI changes.

```bash
pnpm rpc:schema          # export OpenAPI from FastAPI
pnpm --filter @broker/api codegen
```

Ensure new generated hooks are exported from `packages/api/src/index.ts`.

---

## Form mode (pick one)

Each entity uses **exactly one** form presentation:

| Mode | Shell | When |
|------|-------|------|
| Modal | `EntityFormDialog` + `useCrudDialogs` | Few fields; create/edit without leaving the list |
| Full page | `EntityFormPage` / `EntityEditFormPage` in `create-page.tsx` / `edit-page.tsx` | Many fields, or dedicated create/edit routes |

**Do not** mount both a modal and a full-page form for the same entity. Product is the canonical **full-page** example.

---

## Architecture

Three layers. Each is usable without the one above it:

```
Page (index.tsx)                    ← list + delete (and modal forms if that mode)
├── Orval hooks (useList / useDelete; useCreate/usePatch for modal mode)
├── useListParams (+ useCrudDialogs only in modal mode)
├── useCrudController               ← optional orchestrator (receives results, not factories)
└── UI composition
    ├── FilterBar / ProductFilters
    ├── DataTable + columns builders
    └── EntityFormDialog (modal) OR navigate to EntityFormPage (full page)
```

**No magic rules:**
- `useCrudController` / `useEntityFormMutation` never receive hook factories. The page invokes Orval hooks and passes results / `mutate` callbacks in.
- Default behaviours (invalidate list, close dialog when present, format errors, reset page) are overridable via callbacks.
- If the orchestrator does not fit, compose `useListParams` + `useCrudDialogs` + `useAsyncAction` / `useQueryCacheSync` directly.
- `dialogs` is optional on `useCrudController` — omit it for full-page CRUDs.

---

## File layout

```
pages/{entity}/
├── index.tsx        # List (+ modal forms if modal mode)
├── columns.tsx      # build{Entity}Columns({ onEdit, onDelete, isDeleting })
├── filters.tsx      # optional: URL-synced filter bar
├── form.tsx         # {Entity}Form + Zod schema (shared by dialog or page)
├── create-page.tsx  # full-page create (required for full-page mode)
└── edit-page.tsx    # full-page edit (required for full-page mode)
```

No context file. Columns receive handlers via a factory — explicit and traceable.

**Naming (follow product):**

| Artifact | Pattern | Example |
|----------|---------|---------|
| Folder | singular kebab | `product/` |
| Page export | `{Entity}Page` | `ProductPage` |
| Form values | `{Entity}FormValues` | `ProductFormValues` |
| Columns factory | `build{Entity}Columns` | `buildProductColumns` |
| Filters | `{Entity}Filters` | `ProductFilters` |
| Filter keys | `{entity}ListFilterKeys` | `productListFilterKeys` |

---

## Kit API (`@broker/ui`)

### Headless hooks

| Export | Role |
|--------|------|
| `useListParams` | URL-synced `page` / `page_size` / filters; exposes `queryParams` ready for Orval |
| `useCrudDialogs` | Create/edit dialog open state + `formKey` |
| `useAsyncAction` | Wraps async work with `isPending`, `error` (`formatApiError`), `clearError` |
| `useCrudController` | Normalises list data, wires mutations → invalidate → close dialog |
| `useQueryCacheSync` | After a mutation: optional `setQueryData` for detail + `invalidateQueries` for given keys |
| `useEntityFormMutation` | Full-page create/edit: mutate → cache sync → navigate (`useQueryCacheSync` + `useAsyncAction`) |
| `entityFormKey` | Remount key for edit forms (`id` + `updated_at`) so react-hook-form picks up fresh defaults |
| `useResetOnChange` | Low-level org/scope reset (also used inside the controller) |
| `useUrlSearchFilters` / `pickQueryParams` | Low-level URL filter primitives |

### Presentational pieces

| Export | Role |
|--------|------|
| `DataTable` | Configurable table + mobile cards + pagination |
| `textColumn` / `dateColumn` / `dateTimeColumn` / `createdAtColumn` / `updatedAtColumn` / `numberColumn` / `moneyColumn` / `booleanColumn` / `badgeColumn` / `linkColumn` / `actionsColumn` | Column builders (or write `ColumnDef` by hand) |
| `FilterBar` / `FilterForm` / `ClearFiltersButton` | Filter layouts |
| `DebouncedInput` / `EntitySelect` / `ListFilterBar` | Filter controls |
| `EntityFormDialog` | Modal form shell (`Form` prop) |
| `EntityFormPage` | Full-page form shell (same `Form` prop) |
| `EditRowButton` / `DeleteRowButton` / `BtnList` / `BtnConfirm` | Row actions |
| `PageWrapper` | Page title + toolbar |

---

## 1. Page — `index.tsx` (full-page mode — product)

List + delete on the list page. Create/edit navigate to dedicated routes.

```tsx
export function ProductPage() {
  const navigate = useNavigate()
  const { activeOrganization } = useActiveOrganization()
  const list = useListParams({ filterKeys: ['name'] as const, defaultPageSize: 20 })

  const query = useListProductsProductsProviderGet({
    page: list.queryParams.page,
    page_size: list.queryParams.page_size,
    name: list.queryParams.name || undefined,
  } as ListProductsProductsProviderGetParams)

  const deleteMutation = useDeleteProductProductsProviderProductIdDelete()

  const crud = useCrudController<ProductPublic, ProductFormValues, PageProductPublic, …>({
    list,
    query,
    queryKey: getListProductsProductsProviderGetQueryKey(),
    getItems: (data) => data?.items ?? [],
    getTotal: (data) => data?.total ?? 0,
    remove: {
      mutation: deleteMutation,
      toVariables: (item) => ({
        productId: item.id,
        params: {} as DeleteProductProductsProviderProductIdDeleteParams,
      }),
    },
    resetOn: [activeOrganization?.id],
  })

  const columns = useMemo(
    () =>
      buildProductColumns({
        onEdit: (row) => navigate(`/products/${row.id}`),
        onDelete: crud.remove.run,
        isDeleting: crud.remove.isPending,
      }),
    [crud.remove.isPending, crud.remove.run, navigate],
  )

  return (
    <PageWrapper
      title="Productos"
      icon={Package}
      buttons={[
        <Button key="create" size="sm" className="w-full sm:w-auto" asChild>
          <Link to="/products/new">
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Link>
        </Button>,
      ]}
    >
      <ProductFilters … />
      <DataTable
        columns={columns}
        data={crud.items}
        isLoading={crud.isLoading}
        pagination={{
          page: list.page,
          pageSize: list.pageSize,
          total: crud.total,
          onPageChange: list.setPage,
        }}
      />
    </PageWrapper>
  )
}
```

**Modal mode (alternative):** pass `dialogs` from `useCrudDialogs`, wire `create`/`update` on the controller, open dialogs from the create button and `onEdit`, and render `EntityFormDialog` — do **not** also add `form-page.tsx` routes for the same entity.

**Rules:**
- `toVariables` returning `null` skips the mutation.
- Patch/delete id param names come from OpenAPI (`productId`, `organizationId`, …) — match generated types exactly.
- Tenant-scoped routes: do **not** pass `organization_id` from the page. `OrganizationScopedApiProvider` injects it via `brokerFetch`. Cast empty/partial params (`{} as *Params` or `as List*Params`) when Orval marks `organization_id` required. Use `useActiveOrganization` only for `resetOn` when the list must refresh on org switch. Routes behind `RequireOrganization` always have an active org — no `query.enabled` guard.
- `resetOn: [activeOrganization?.id]` invalidates the list, resets page to 1, and clears URL filters. Does **not** run on initial mount.
- Bare-array list endpoints: omit `getItems` / `getTotal` (defaults handle arrays) and omit `total` in pagination for client-side paging, or pass `total: items.length`.

### `useCrudController` consumer fields

| Field | Use |
|-------|-----|
| `items`, `total`, `isLoading` | DataTable |
| `create.*` / `update.*` | Modal mode only (with `dialogs`) |
| `remove.run` / `isPending` / `error` | Delete confirm |

Override defaults with `onSuccess` / `onError` / `getItems` / `getTotal`. Omit `dialogs` for full-page CRUDs.

---

## 2. Form — `form.tsx`

One form component reused by `EntityFormDialog` (modal mode) or `EntityFormPage` (full-page mode) — never both for the same entity.

```tsx
export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(255, 'Máximo 255 caracteres'),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export function ProductForm({
  ref,
  defaultValues = productFormDefaultValues,
  onSubmit,
  isSubmitting = false,
  error = null,
}: EntityFormProps<ProductFormValues>) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  })
  useFormSubmitHandle(ref, form.handleSubmit, onSubmit)
  // Field / Controller / FieldError …
}
```

**Rules:**
- React 19: `ref` is a regular prop (no `forwardRef`).
- Use `formKey` on the dialog/page shell so react-hook-form resets when switching create ↔ edit.
- Spanish labels and validation messages; align with API constraints.
- Unique `id` / `htmlFor` per field (`{entity}-name`).
- Pass API `error` from the controller; clear it in `onOpenChange` when the modal closes.

---

## 3. Columns — `columns.tsx`

```tsx
export function buildProductColumns({
  onEdit,
  onDelete,
  isDeleting = false,
}: BuildProductColumnsOptions): ColumnDef<ProductPublic>[] {
  return [
    textColumn({ id: 'name', header: 'Nombre' }),
    createdAtColumn(),
    updatedAtColumn(),
    actionsColumn((row) => (
      <BtnList>
        <EditRowButton aria-label={`Editar ${row.name}`} onEdit={() => onEdit(row)} />
        <DeleteRowButton
          aria-label={`Eliminar ${row.name}`}
          title="Eliminar producto"
          itemLabel={row.name}
          onDelete={() => onDelete(row)}
          isLoading={isDeleting}
        />
      </BtnList>
    )),
  ]
}
```

- Prefer builders; raw `ColumnDef` objects are always fine.
- Omit `accessor` when it matches `id` — builders default `accessor` to `id`.
- Use `createdAtColumn()` / `updatedAtColumn()` for audit timestamps (`created_at` / `updated_at`) — defaults include Spanish headers and `hideOn: 'md'`. Override with options when needed (`createdAtColumn({ hideOn: 'sm' })`).
- `actionsColumn(cell, options?)` takes the cell renderer as the first argument; pass optional column options as the second (`actionsColumn(cell, { header: 'Acciones' })`).
- Column `id: 'actions'` is special-cased by `DataTable` (mobile card footer).
- Prefer `BtnList` + icon buttons over `@broker/ui` `RowActions` dropdown unless the row has many actions.

---

## 4. Filters — `filters.tsx`

```tsx
export function ProductFilters({ filters, setFilter, onClear, hasActiveFilters }: Props) {
  return (
    <FilterBar>
      <DebouncedInput
        value={filters.name}
        onDebouncedChange={(value) => setFilter('name', value)}
        placeholder="Buscar producto…"
      />
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
```

**Rules:**
- Filter query param names must match OpenAPI list params exactly.
- Empty values are stripped from the URL and omitted from the API request.
- Text search uses `DebouncedInput` (default 300ms).
- Own filter state in the page via `useListParams` — do not call `useUrlSearchFilters` again in `filters.tsx`.
- For expensive filters, use `FilterForm` (Apply / Clear) instead of instant `FilterBar`.

---

## 5. Full-page forms — `create-page.tsx` / `edit-page.tsx`

**Canonical for product.** Mount the same `ProductForm` inside `EntityFormPage` / `EntityEditFormPage`. Create/patch mutations live here (not on the list page). Use `useEntityFormMutation` for mutate → cache sync → redirect. The page still calls Orval hooks; the kit does not receive hook factories.

**Create** — invalidate list only (no detail cache write):

```tsx
const createMutation = useCreateProductProductsProviderPost()

const create = useEntityFormMutation({
  mutate: (values: ProductFormValues) =>
    createMutation.mutateAsync({
      data: values,
      params: {} as CreateProductProductsProviderPostParams,
    }),
  invalidateKeys: [getListProductsProductsProviderGetQueryKey()],
  redirectTo: '/products',
})

return (
  <EntityFormPage
    title="Nuevo producto"
    Form={ProductForm}
    defaultValues={productFormDefaultValues}
    formKey="create"
    onSubmit={create.run}
    isSubmitting={create.isPending}
    error={create.error}
    backTo="/products"
  />
)
```

**Edit** — write detail cache, invalidate list + detail, remount form with `entityFormKey`:

```tsx
const detailParams = {} as GetProductProductsProviderProductIdGetParams
const detailQueryKey = getGetProductProductsProviderProductIdGetQueryKey(
  productId,
  detailParams,
)

const productQuery = useGetProductProductsProviderProductIdGet(
  productId,
  detailParams,
  { query: { enabled: Boolean(productId) } },
)
const patchMutation = usePatchProductProductsProviderProductIdPatch()

const update = useEntityFormMutation({
  mutate: (values: ProductFormValues) =>
    patchMutation.mutateAsync({
      productId,
      data: values,
      params: {} as PatchProductProductsProviderProductIdPatchParams,
    }),
  detailQueryKey,
  invalidateKeys: [
    getListProductsProductsProviderGetQueryKey(),
    detailQueryKey,
  ],
  redirectTo: '/products',
})

return (
  <EntityEditFormPage
    isLoading={productQuery.isLoading}
    isError={productQuery.isError}
    data={productQuery.data}
    loadingTitle="Editar producto"
    notFoundTitle="Producto no encontrado"
    notFoundMessage="No se pudo cargar el producto solicitado."
    backTo="/products"
    title="Editar producto"
    description={(product) => `Edita «${product.name}».`}
    Form={ProductForm}
    defaultValues={(product) => ({ name: product.name })}
    formKey={(product) => entityFormKey(product)}
    onSubmit={update.run}
    isSubmitting={update.isPending}
    error={update.error}
  />
)
```

Compose `useQueryCacheSync` + `useAsyncAction` yourself when you need a different success flow (e.g. stay on the page).

Routes (product): `/products/new`, `/products/:productId`. List create button and row edit navigate to these routes.

---

## 6. Router and navigation

**Router** — `apps/backoffice/src/router.tsx` (inside the authenticated + org-scoped layout):

```tsx
<Route path="products" element={<ProductPage />} />
<Route path="products/new" element={<ProductCreatePage />} />
<Route path="products/:productId" element={<ProductEditPage />} />
```

**Sidebar** — `apps/backoffice/src/config/navigation.ts`:

```tsx
{ to: '/products', label: 'Productos', icon: Package },
```

Tenant query reset lives in each page via `resetOn` / `useResetOnChange` — not in the router.

---

## Checklist

- [ ] Backend CRUD exists; OpenAPI regenerated; hooks exported from `@broker/api`
- [ ] Folder `pages/{entity}/` with `index`, `columns`, `form` (add `filters`; add `form-page` for full-page mode)
- [ ] **One form mode only:** modal (`EntityFormDialog`) XOR full page (`EntityFormPage`) — not both
- [ ] Page calls Orval hooks explicitly; `useCrudController` receives results, not factories
- [ ] `{Entity}FormValues` inferred from Zod; `toVariables` match generated mutation types
- [ ] Modal mode: create uses `dialogs.create.formKey`; edit uses `item.id` as `formKey`
- [ ] Full-page mode: list create/edit navigate to routes; mutations live in `create-page` / `edit-page`
- [ ] Full-page create/edit use `useEntityFormMutation` (not hand-rolled `useAsyncAction` + `invalidateQueries`)
- [ ] Full-page edit: pass `detailQueryKey` + `formKey={entityFormKey}` so re-edit shows fresh data
- [ ] Row actions: `BtnList` + `EditRowButton` + `DeleteRowButton`
- [ ] `aria-label` on icon-only edit/delete triggers
- [ ] Server-paginated lists pass `pagination.total` from the API envelope
- [ ] Filtered lists: `useListParams({ filterKeys })`; text filters use `DebouncedInput`
- [ ] Tenant-scoped lists: `resetOn: [activeOrganization?.id]`
- [ ] Route in `router.tsx` and nav item in `navigation.ts`
- [ ] Spanish UI strings; validation aligned with API model

### Mobile-first conventions (inherited from `@broker/ui`)

- `DataTable` adds `.broker-data-table` — denser rows, surface tokens (CSS in `packages/ui/src/styles.css`).
- `ButtonModal` / `ConfirmDialog` add `.broker-dialog` — top-anchored on mobile, centered on desktop.
- Do **not** edit shadcn primitives in `packages/ui/src/components/ui/`; style via scoped CSS and wrappers.

---

## Anti-patterns

- **Do not** mount both `EntityFormDialog` and `EntityFormPage` for the same entity — pick one form mode.
- **Do not** hide Orval hooks inside a generic factory passed to `useCrudController` — keep them in the page.
- **Do not** add boolean `isEdit` props to a monolithic form — one `Form`, different `defaultValues` / `onSubmit` at the call site.
- **Do not** skip `formKey` — without it, react-hook-form keeps stale values when reopening modals or after a detail refetch.
- **Do not** invalidate only the list query after a full-page PATCH — leave the detail query stale and the next edit shows old data; use `useEntityFormMutation` with `detailQueryKey` (and `entityFormKey`).
- **Do not** put list/pagination/mutation orchestration in ad-hoc `useState` when the kit already covers it.
- **Do not** use `@broker/ui` `RowActions` dropdown in new CRUD pages unless the row has many actions.
- **Do not** invalidate tenant queries globally from `router.tsx` or `ActiveOrganizationProvider`.
- **Do not** call `useUrlSearchFilters` in both the page and `filters.tsx` — the page owns URL state via `useListParams`.
- **Do not** use plain `Input` with `onChange` for text list filters — use `DebouncedInput`.
- **Do not** store filter state in local `useState` when the URL should be shareable — sync via `useListParams`.
