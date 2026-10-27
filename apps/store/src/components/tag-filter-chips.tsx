import type { StorefrontTagPublic } from '@broker/api'

type TagFilterChipsProps = {
  tags: StorefrontTagPublic[]
  value: string
  onChange: (tagId: string) => void
}

export function TagFilterChips({ tags, value, onChange }: TagFilterChipsProps) {
  return (
    <div className="store-chips" role="group" aria-label="Filtros">
      <button
        type="button"
        className="store-chip"
        aria-pressed={!value}
        onClick={() => onChange('')}
      >
        Todos
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          className="store-chip"
          aria-pressed={value === tag.id}
          onClick={() => onChange(tag.id)}
        >
          {tag.name}
        </button>
      ))}
    </div>
  )
}
