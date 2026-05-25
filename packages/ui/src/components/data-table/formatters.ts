import type { ReactNode } from 'react'

import { ColumnType } from './types'

const DATE_FIELD_NAMES = new Set(['created_at', 'updated_at', 'deleted_at'])

const dateFormatter = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const numberFormatter = new Intl.NumberFormat('es')

function isDateFieldName(fieldName: string): boolean {
  return DATE_FIELD_NAMES.has(fieldName) || fieldName.endsWith('_at')
}

function isIsoDateString(value: string): boolean {
  return !Number.isNaN(Date.parse(value))
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value === 'string' && isIsoDateString(value)) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

export function inferColumnType(
  fieldName: string,
  value: unknown,
  explicitType?: ColumnType
): ColumnType {
  if (explicitType) {
    return explicitType
  }

  if (typeof value === 'boolean') {
    return ColumnType.Boolean
  }

  if (typeof value === 'number') {
    return ColumnType.Number
  }

  if (isDateFieldName(fieldName)) {
    return ColumnType.DateTime
  }

  if (toDate(value) !== null) {
    return ColumnType.DateTime
  }

  return ColumnType.Text
}

export function formatCellValue(value: unknown, type: ColumnType): ReactNode {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  switch (type) {
    case ColumnType.Date:
    case ColumnType.DateTime: {
      const date = toDate(value)
      if (!date) {
        return String(value)
      }
      const formatter = type === ColumnType.Date ? dateFormatter : dateTimeFormatter
      return formatter.format(date)
    }
    case ColumnType.Number:
      return numberFormatter.format(Number(value))
    case ColumnType.Boolean:
      return value ? 'Sí' : 'No'
    case ColumnType.Text:
    default:
      return String(value)
  }
}
