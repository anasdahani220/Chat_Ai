'use client'
import { useParams } from 'next/navigation'
import ChatView from '@/components/ChatView'

export default function ChatSessionPage() {
  const params = useParams()
  const id = params.id as string
  return <ChatView sessionId={id} />
}