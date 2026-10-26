import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function BookDescription({ markdown }: { markdown: string }) {
  return (
    <div className="book-copy max-w-2xl text-base leading-relaxed text-[color:var(--ink-secondary)]">
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
