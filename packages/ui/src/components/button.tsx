import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
} from './ui/button'
import { cn } from '../lib/utils'

type ExtraSize = 'icon-sm' | 'icon-xs'
type ButtonSize = NonNullable<ButtonPrimitiveProps['size']> | ExtraSize

const sizeOverride: Record<ExtraSize, string> = {
  'icon-sm': 'h-9 w-9 sm:h-8 sm:w-8 [&_svg]:size-4',
  'icon-xs': 'h-8 w-8 sm:h-7 sm:w-7 [&_svg]:size-3.5',
}

export type ButtonProps = Omit<ButtonPrimitiveProps, 'size'> & {
  label?: string
  icon?: LucideIcon
  size?: ButtonSize
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ label, icon: Icon, children, size, className, ...props }, ref) => {
    const isExtra = size === 'icon-sm' || size === 'icon-xs'
    const primitiveSize = isExtra ? 'icon' : size
    const mergedClassName = cn(
      isExtra && sizeOverride[size as ExtraSize],
      className,
    )

    if (label !== undefined) {
      return (
        <ButtonPrimitive
          ref={ref}
          size={primitiveSize}
          className={mergedClassName}
          {...props}
        >
          {Icon ? <Icon aria-hidden /> : null}
          {label}
        </ButtonPrimitive>
      )
    }

    return (
      <ButtonPrimitive
        ref={ref}
        size={primitiveSize}
        className={mergedClassName}
        {...props}
      >
        {children}
      </ButtonPrimitive>
    )
  },
)
Button.displayName = 'Button'
