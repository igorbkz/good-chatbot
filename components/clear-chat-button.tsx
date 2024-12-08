interface ClearChatButtonProps {
  onClearChat: () => void
}

export function ClearChatButton({ onClearChat }: ClearChatButtonProps) {
  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      onClearChat()
    }
  }

  return (
    <button
      onClick={handleClearChat}
      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
    >
      Clear
    </button>
  )
}

