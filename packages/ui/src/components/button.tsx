import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
} from './ui/button'

export type ButtonProps = ButtonPrimitiveProps & {
  label?: string
  icon?: LucideIcon
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ label, icon: Icon, children, ...props }, ref) => {
    if (label !== undefined) {
      return (
        <ButtonPrimitive ref={ref} {...props}>
          {Icon ? <Icon aria-hidden /> : null}
          {label}
        </ButtonPrimitive>
      )
    }

    return (
      <ButtonPrimitive ref={ref} {...props}>
        {children}
      </ButtonPrimitive>
    )
  }
)
Button.displayName = 'Button'
