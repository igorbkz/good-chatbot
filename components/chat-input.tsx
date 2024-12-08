import { useState } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={disabled ? "Aguarde a resposta..." : "Digite sua mensagem..."}
        disabled={disabled}
        className="flex-grow p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
      />
      <button
        type="submit"
        disabled={!input.trim() || disabled}
        className="bg-blue-500 text-white p-2 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out hover:bg-blue-600"
      >
        <Send size={20} />
      </button>
    </form>
  )
}

