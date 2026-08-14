import { ImageIcon, type LucideIcon } from 'lucide-react'

import { cn } from '../lib/utils'

const sizeClass = {
  sm: 'size-10',
  md: 'size-16',
  lg: 'size-32',
} as const

const iconSizeClass = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-10',
} as const

export type ThumbnailProps = {
  src?: string | null
  alt: string
  size?: keyof typeof sizeClass
  className?: string
  fallbackIcon?: LucideIcon
}

export function Thumbnail({
  src,
  alt,
  size = 'sm',
  className,
  fallbackIcon: FallbackIcon = ImageIcon,
}: ThumbnailProps) {
  const box = cn(
    'shrink-0 overflow-hidden rounded-md border border-surface-container-high bg-surface-container',
    sizeClass[size],
    className,
  )

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(box, 'object-cover')}
        loading="lazy"
      />
    )
  }

  return (
    <div className={cn(box, 'flex items-center justify-center')} aria-hidden>
      <FallbackIcon className={cn('text-muted-foreground', iconSizeClass[size])} />
      <span className="sr-only">{alt}</span>
    </div>
  )
}
