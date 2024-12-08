'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from '@/components/chat-message'
import { ChatInput } from '@/components/chat-input'
import { TypingIndicator } from '@/components/typing-indicator'
import { ClearChatButton } from '@/components/clear-chat-button'
import { Sidebar } from '@/components/sidebar'

type MessageRole = 'user' | 'assistant'
type Message = {
  role: MessageRole
  content: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversationHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (message: string) => {
    const newUserMessage: Message = { 
      role: 'user' as const, 
      content: message 
    }
    const updatedMessages = [...messages, newUserMessage]
    setMessages(updatedMessages)
    setIsTyping(true)
    
    try {
      const response = await queryAPI(message, updatedMessages)
      setIsTyping(false)
      const newAssistantMessage: Message = { 
        role: 'assistant' as const, 
        content: response 
      }
      setMessages(messages => [...messages, newAssistantMessage])
      saveConversationHistory([...updatedMessages, newAssistantMessage])
    } catch (error: unknown) {
      console.error('API request failed:', error)
      setIsTyping(false)
      const errorMessage: Message = { 
        role: 'assistant' as const, 
        content: 'Sorry, an error occurred while processing your request.' 
      }
      setMessages(messages => [...messages, errorMessage])
      saveConversationHistory([...updatedMessages, errorMessage])
    }
  }

  const handleClearChat = () => {
    setMessages([])
    localStorage.removeItem('conversationHistory')
  }

  const loadConversationHistory = () => {
    const storedHistory = localStorage.getItem('conversationHistory')
    if (storedHistory) {
      setMessages(JSON.parse(storedHistory))
    }
  }

  const saveConversationHistory = (history: Message[]) => {
    localStorage.setItem('conversationHistory', JSON.stringify(history))
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
          {messages.map((message, index) => (
            <ChatMessage key={index} role={message.role} content={message.content} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-gray-200 p-4">
          <ChatInput onSendMessage={handleSendMessage} />
          <div className="mt-2 flex justify-center">
            <ClearChatButton onClearChat={handleClearChat} />
          </div>
        </div>
      </div>
    </div>
  )
}

async function queryAPI(message: string, history: Message[]) {
  const API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1'
  const API_KEY = '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'

  const systemPrompt = "Você é um assistente de IA único criado pelo Igor. Responda em português com criatividade, indo além de respostas comuns. Traga insights, clareza e uma abordagem diferenciada que surpreenda e engaje o usuário."
  
  const conversationHistory = `[INST] ${systemPrompt} [/INST] ` + history.map(msg => 
    `${msg.role === 'user' ? '[INST]' : '[/INST]'} ${msg.content}`
  ).join(' ') + ` [INST] ${message} [/INST]`

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: `<s>${conversationHistory}`,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.2,
        return_full_text: false
      }
    })
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data[0].generated_text.trim()
}

