import { marked } from 'marked'
import { useEffect, useRef } from 'react'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messageRef.current) {
      const codeBlocks = messageRef.current.querySelectorAll('pre code')
      if (codeBlocks.length > 0) {
        import('highlight.js').then((hljs) => {
          codeBlocks.forEach((block) => {
            hljs.default.highlightElement(block as HTMLElement)
          })
        })
      }
    }
  }, [content])

  const formattedContent = marked(content)

  return (
    <div 
      ref={messageRef}
      className={`message p-4 rounded-lg max-w-[80%] ${
        role === 'user' 
          ? 'bg-blue-100 text-blue-900 self-end' 
          : 'bg-gray-100 text-gray-900 self-start'
      }`}
    >
      <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: formattedContent }} />
    </div>
  )
}

