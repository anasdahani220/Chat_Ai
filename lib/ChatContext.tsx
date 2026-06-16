'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChatSession } from '@/lib/types'

interface ChatContextType {
  sessions: ChatSession[]
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>
  userName: string
  userEmail: string
  userId: string
  loading: boolean
  handleLogOut: () => Promise<void>
  handleNewChat: () => Promise<void>
  handleDeleteSession: (id: string, e: React.MouseEvent) => Promise<void>
  refreshSessions: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  // Load user + their sessions
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)
      setUserEmail(user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      setUserName(profile?.full_name || user.email || 'User')

      // Fetch sessions for this user
      const { data: sessionData, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) console.error('Error fetching sessions:', error)
      else setSessions(sessionData || [])

      setLoading(false)
    }
    init()
  }, [])

  const refreshSessions = async () => {
    if (!userId) return
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    setSessions(data || [])
  }

  const handleLogOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleNewChat = async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: 'New Chat',
        session_id: crypto.randomUUID(), // for n8n memory
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating session:', error)
      return
    }

    setSessions(prev => [data, ...prev])
    router.push(`/chat/${data.id}`)
  }

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting session:', error)
      return
    }

    setSessions(prev => prev.filter(s => s.id !== id))
    router.push('/')
  }

  return (
    <ChatContext.Provider value={{
      sessions, setSessions, userName, userEmail, userId, loading,
      handleLogOut, handleNewChat, handleDeleteSession, refreshSessions,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChatContext = () => {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatContext must be used inside ChatProvider')
  return ctx
}