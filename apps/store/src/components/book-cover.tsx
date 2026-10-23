type BookCoverProps = {
  title: string
  imageUrl?: string | null
  className?: string
}

export function BookCover({ title, imageUrl, className = '' }: BookCoverProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={title}
        className={`aspect-[2/3] w-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`book-cover flex aspect-[2/3] w-full flex-col justify-between p-4 text-[color:var(--paper)] ${className}`}
      aria-hidden
    >
      <div className="h-px w-10 bg-[color:var(--gilt)]" />
      <p className="font-display text-sm font-semibold leading-snug sm:text-base">
        {title}
      </p>
      <div className="h-px w-16 bg-[color:var(--gilt)]/70" />
    </div>
  )
}
