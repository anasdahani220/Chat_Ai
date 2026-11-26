'use client'

import { useState } from 'react'
import { ChatSession } from '@/lib/types'

interface SidebarProps {
  sessions: ChatSession[]
  activeSessionId: string
  userName: string
  userEmail: string
  onNewChat: () => void
  onLoadSession: (session: ChatSession) => void
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void
  onLogout: () => void
}

export default function Sidebar({
  sessions,
  activeSessionId,
  userName,
  userEmail,
  onNewChat,
  onLoadSession,
  onDeleteSession,
  onLogout,
}: SidebarProps) {
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  const groupedSessions = sessions.reduce((groups: Record<string, ChatSession[]>, session) => {
    const date = new Date(session.created_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(session)
    return groups
  }, {})

  return (
    <div
      style={{
        width: '260px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(10,10,15,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <img
            src="https://api.dicebear.com/9.x/bottts/svg?seed=GolfAI"
            alt="AI"
            style={{ width: '100%', height: '100%' }}
            onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://robohash.org/GolfAI?set=set3'; }}
          />
        </div>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '14px', letterSpacing: '0.5px' }}>
          Nova Store Assistant
        </span>
      </div>

      <div style={{ padding: '12px', flexShrink: 0 }}>
        <button
          onClick={onNewChat}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '12px',
            background: 'rgba(245,87,2,0.15)',
            border: '1px solid rgba(245,87,2,0.3)',
            color: '#ff8c42',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,87,2,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,87,2,0.15)')}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
          New Chat
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 12px',
        scrollbarWidth: 'none',
      }}>
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {sessions.length === 0 ? (
          <p style={{
            color: 'rgba(255,255,255,0.2)',
            fontSize: '12px',
            textAlign: 'center',
            marginTop: '32px',
            padding: '0 16px',
          }}>
            No conversations yet. Start a new chat!
          </p>
        ) : (
          Object.entries(groupedSessions).map(([date, dateSessions]) => (
            <div key={date} style={{ marginBottom: '16px' }}>
              <p style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '11px',
                padding: '0 8px',
                marginBottom: '4px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}>
                {date}
              </p>

              {dateSessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => onLoadSession(session)}
                  className="group"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '2px',
                    background: activeSessionId === session.id
                      ? 'rgba(245,87,2,0.15)'
                      : 'transparent',
                    border: activeSessionId === session.id
                      ? '1px solid rgba(245,87,2,0.2)'
                      : '1px solid transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (activeSessionId !== session.id)
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }}
                  onMouseLeave={e => {
                    if (activeSessionId !== session.id)
                      e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>💬</span>
                    <span style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {session.title}
                    </span>
                  </div>

                  <button
                    onClick={e => onDeleteSession(session.id, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      flexShrink: 0,
                      marginLeft: '4px',
                      opacity: 0,
                      transition: 'opacity 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.color = '#f87171'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.opacity = '0'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
                    }}
                    onFocus={e => (e.currentTarget.style.opacity = '1')}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '12px',
        flexShrink: 0,
        position: 'relative',
      }}>
        <button
          onClick={() => setShowAccountMenu(prev => !prev)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            borderRadius: '12px',
            background: showAccountMenu ? 'rgba(255,255,255,0.08)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => {
            if (!showAccountMenu)
              e.currentTarget.style.background = 'transparent'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f55702, #ff8c42)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
            <p style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '12px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: 0,
            }}>
              {userName}
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: '11px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: 0,
            }}>
              {userEmail}
            </p>
          </div>

          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
            {showAccountMenu ? '▼' : '▲'}
          </span>
        </button>

        {showAccountMenu && (
          <div style={{
            position: 'absolute',
            bottom: '72px',
            left: '12px',
            right: '12px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'rgba(20,20,28,0.98)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
            zIndex: 50,
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 500, margin: 0 }}>
                {userName}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>
                {userEmail}
              </p>
            </div>
            <button
              onClick={onLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                color: '#f87171',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span>→</span> Logout
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
