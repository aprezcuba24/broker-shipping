import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'

import { cn } from '../../lib/utils'
import { Label } from './label'

type FieldOrientation = 'vertical' | 'horizontal' | 'responsive'

export function FieldGroup({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-group"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  )
}

export function Field({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<'div'> & { orientation?: FieldOrientation }) {
  return (
    <div
      data-slot="field"
      data-orientation={orientation}
      className={cn(
        'flex gap-2',
        orientation === 'vertical' && 'flex-col',
        orientation === 'horizontal' && 'flex-row items-start',
        orientation === 'responsive' &&
          'flex-col sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
      {...props}
    />
  )
}

export function FieldContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-content"
      className={cn('flex min-w-0 flex-1 flex-col gap-2', className)}
      {...props}
    />
  )
}

export function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn('data-[invalid=true]:text-destructive', className)}
      {...props}
    />
  )
}

export function FieldDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

type FieldErrorLike = {
  message?: string
}

export function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<'div'> & {
  errors?: FieldErrorLike | (FieldErrorLike | undefined)[]
}) {
  const issues = Array.isArray(errors) ? errors : errors ? [errors] : []
  const messages = issues
    .map((issue) => issue?.message)
    .filter((message): message is string => Boolean(message))

  if (!children && messages.length === 0) return null

  return (
    <div
      data-slot="field-error"
      role="alert"
      className={cn('text-sm text-destructive', className)}
      {...props}
    >
      {children ? (
        children
      ) : (
        <ul className="list-none space-y-1">
          {messages.map((message, index) => (
            <li key={`${message}-${index}`}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function FieldSet({
  className,
  ...props
}: React.ComponentProps<'fieldset'>) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  )
}

export function FieldLegend({
  className,
  ...props
}: React.ComponentProps<'legend'>) {
  return (
    <legend
      data-slot="field-legend"
      className={cn('text-sm font-medium', className)}
      {...props}
    />
  )
}

export function FieldTitle({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-title"
      className={cn('text-sm font-medium', className)}
      {...props}
    />
  )
}

export function FieldSeparator({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-separator"
      className={cn(
        'relative my-2 text-center text-sm text-muted-foreground before:absolute before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-border',
        className,
      )}
      {...props}
    >
      <span className="relative bg-background px-2">{props.children}</span>
    </div>
  )
}

export function FieldControl(props: React.ComponentProps<typeof Slot>) {
  return <Slot data-slot="field-control" {...props} />
}
