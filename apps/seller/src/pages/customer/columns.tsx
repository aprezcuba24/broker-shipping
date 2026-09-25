import type { CustomerPublic } from '@broker/api'
import {
  actionsColumn,
  BtnLink,
  BtnList,
  textColumn,
  type ColumnDef,
} from '@broker/ui'
import { Eye } from 'lucide-react'

export function buildCustomerColumns(): ColumnDef<CustomerPublic>[] {
  return [
    textColumn<CustomerPublic>({ id: 'name', header: 'Nombre' }),
    textColumn<CustomerPublic>({ id: 'ci', header: 'CI' }),
    textColumn<CustomerPublic>({ id: 'phone', header: 'Teléfono' }),
    actionsColumn<CustomerPublic>((row) => (
      <BtnList>
        <BtnLink
          to={`/customers/${row.id}`}
          variant="ghost"
          size="sm"
          icon={Eye}
          aria-label={`Ver ${row.name}`}
        >
          Ver
        </BtnLink>
      </BtnList>
    )),
  ]
}
