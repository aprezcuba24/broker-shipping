type BookCoverProps = {
  title: string
  author?: string
  imageUrl?: string | null
  className?: string
}

export function BookCover({
  title,
  author,
  imageUrl,
  className = '',
}: BookCoverProps) {
  return (
    <div className={`${className}`.trim()}>
      {imageUrl ? (
        <img src={imageUrl} alt={`Portada de ${title}`} />
      ) : (
        <>
          <span className="t">{title}</span>
          {author ? <span className="a">{author}</span> : null}
        </>
      )}
    </div>
  )
}
