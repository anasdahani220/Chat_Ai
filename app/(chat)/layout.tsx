'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import SideBar from '@/components/sideBar'
import { ChatProvider, useChatContext } from '@/lib/ChatContext'
import { ChatSession } from '@/lib/types'

function LayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { sessions, userName, userEmail, handleLogOut, handleNewChat, handleDeleteSession } = useChatContext()

  // Extract active session ID from URL: /chat/abc-123 → abc-123
  const activeSessionId = pathname.startsWith('/chat/') ? pathname.split('/chat/')[1] : ''

  const handleLoadSession = (session: ChatSession) => {
    router.push(`/chat/${session.id}`)  // ← navigate instead of setState
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: 'radial-gradient(125% 125% at 50% 101%, rgba(245,87,2,1) 10%, rgba(12,12,18,1) 60%)',
    }}>
      <div style={{
        flexShrink: 0,
        width: sidebarOpen ? '260px' : '0px',
        overflow: 'hidden',
        transition: 'width 0.3s ease-in-out',
      }}>
        <SideBar
          sessions={sessions}
          activeSessionId={activeSessionId}
          userName={userName}
          userEmail={userEmail}
          onNewChat={handleNewChat}
          onLoadSession={handleLoadSession}
          onDeleteSession={handleDeleteSession}
          onLogout={handleLogOut}
        />
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
      }}>
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              fontSize: '14px', padding: '6px', borderRadius: '8px',
            }}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <h1 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 500, margin: 0 }}>
            AI Assistant
          </h1>
        </div>
        {children}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <LayoutInner>{children}</LayoutInner>
    </ChatProvider>
  )
}