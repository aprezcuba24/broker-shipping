import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function BookDescription({ markdown }: { markdown: string }) {
  return (
    <div
      className="book-copy"
      style={{
        maxWidth: '42rem',
        fontSize: '1rem',
        lineHeight: 1.55,
        color: 'var(--muted)',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
