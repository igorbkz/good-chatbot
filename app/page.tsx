'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from '@/components/chat-message'
import { ChatInput } from '@/components/chat-input'
import { TypingIndicator } from '@/components/typing-indicator'
import { ClearChatButton } from '@/components/clear-chat-button'
import { Sidebar } from '@/components/sidebar'

type MessageRole = 'user' | 'assistant' | 'system'
type Message = {
  role: MessageRole
  content: string
}

const MAX_HISTORY_LENGTH = 12
const MAX_MESSAGE_LENGTH = 500
const SYSTEM_PROMPT = `Você é um assistente de IA especializado em fornecer respostas claras, objetivas e consistentes.
Mantenha sempre o contexto da conversa e evite contradições.
Responda sempre em português brasileiro de forma concisa e direta.`

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentResponse, setCurrentResponse] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversationHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentResponse])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const validateMessage = (message: string): boolean => {
    if (isTyping) {
      setError('Aguarde a resposta anterior ser concluída')
      return false
    }
    if (!message.trim()) {
      setError('A mensagem não pode estar vazia')
      return false
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      setError(`A mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres`)
      return false
    }
    return true
  }

  const handleSendMessage = async (message: string) => {
    setError(null)
    if (!validateMessage(message)) return

    const newUserMessage: Message = { 
      role: 'user',
      content: message 
    }
    
    setMessages(prevMessages => [...prevMessages, newUserMessage])
    setIsTyping(true)
    setCurrentResponse('')
    
    try {
      const finalResponse = await streamResponse(message, messages)
      
      const newAssistantMessage: Message = { 
        role: 'assistant',
        content: finalResponse 
      }
      
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, newAssistantMessage].slice(-MAX_HISTORY_LENGTH)
        saveConversationHistory(updatedMessages)
        return updatedMessages
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'
      setError(errorMessage)
      const errorResponse: Message = { 
        role: 'assistant',
        content: `Desculpe, ocorreu um erro: ${errorMessage}. Por favor, tente novamente.`
      }
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, errorResponse]
        saveConversationHistory(updatedMessages)
        return updatedMessages
      })
    } finally {
      setIsTyping(false)
      setCurrentResponse('')
    }
  }

  const streamResponse = async (message: string, history: Message[]): Promise<string> => {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('Configurações da API não encontradas')
    }

    const { HfInference } = await import('@huggingface/inference')
    const client = new HfInference(process.env.HUGGINGFACE_API_KEY)

    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(msg => {
        if (msg.role === 'user') {
          return { role: 'user', content: `[INST] ${msg.content} [/INST]` }
        }
        return msg
      }),
      { role: 'user', content: `[INST] ${message} [/INST]` }
    ]

    let fullResponse = ''
    try {
      const stream = await client.chatCompletionStream({
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        messages: formattedMessages,
        max_tokens: 500,
        temperature: 0.3,
        top_p: 0.9,
        repetition_penalty: 1.1,
        do_sample: true
      })

      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices.length > 0) {
          const newContent = chunk.choices[0].delta.content
          if (newContent) {
            fullResponse += newContent
            setCurrentResponse(fullResponse)
          }
        }
      }

      return fullResponse.trim()
    } catch (error) {
      console.error('Erro na chamada da API:', error)
      throw new Error('Erro ao processar resposta da API')
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setError(null)
    localStorage.removeItem('conversationHistory')
  }

  const loadConversationHistory = () => {
    try {
      const storedHistory = localStorage.getItem('conversationHistory')
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory)
        if (Array.isArray(parsedHistory)) {
          setMessages(parsedHistory)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      localStorage.removeItem('conversationHistory')
    }
  }

  const saveConversationHistory = (history: Message[]) => {
    try {
      localStorage.setItem('conversationHistory', JSON.stringify(history))
    } catch (error) {
      console.error('Erro ao salvar histórico:', error)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-grow">
        <header className="bg-white border-b border-gray-200 p-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>
        <div className="flex-grow overflow-auto p-4 space-y-4" id="messages">
          {messages
            .filter((message): message is Message & { role: 'user' | 'assistant' } => 
              message.role === 'user' || message.role === 'assistant'
            )
            .map((message, index) => (
              <ChatMessage key={index} role={message.role} content={message.content} />
            ))}
          {isTyping && (
            <div className="message bg-gray-100 text-gray-900 self-start p-4 rounded-lg max-w-[80%]">
              <div className="prose prose-sm">
                {currentResponse || <TypingIndicator />}
              </div>
            </div>
          )}
          {error && (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-gray-200 p-4">
          <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
          <div className="mt-2 flex justify-center">
            <ClearChatButton onClearChat={handleClearChat} />
          </div>
        </div>
      </div>
    </div>
  )
}

