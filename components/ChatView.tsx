'use client'

import { useEffect, useRef, useState } from 'react'
import { PromptInputBox } from '@/components/ui/ai-prompt-box'
import { useChatContext } from '@/lib/ChatContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/lib/types'
import ReactMarkdown from 'react-markdown'     // ← NEW
import remarkGfm from 'remark-gfm'

interface ChatViewProps {
    sessionId?: string
}

export default function ChatView({ sessionId }: ChatViewProps) {
    const { userName, userId, setSessions } = useChatContext()
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()

    // Load messages from Supabase when sessionId changes
    useEffect(() => {
        if (!sessionId) {
            setMessages([])
            return
        }

        const loadMessages = async () => {
            setLoadingMessages(true)
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })

            if (error) console.error('Error loading messages:', error)
            else setMessages(data || [])

            setLoadingMessages(false)
        }
        loadMessages()
    }, [sessionId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    const handleMessages = async (message: string) => {
        let currentSessionId = sessionId

        // If on home page (no session yet), create one first
        if (!currentSessionId) {
            const title = message.slice(0, 40) + (message.length > 40 ? '...' : '')
            const { data: newSession, error } = await supabase
                .from('chat_sessions')
                .insert({
                    user_id: userId,
                    title,
                    session_id: crypto.randomUUID(),
                })
                .select()
                .single()

            if (error || !newSession) {
                console.error('Error creating session:', error)
                return
            }

            currentSessionId = newSession.id
            setSessions(prev => [newSession, ...prev])
            router.push(`/chat/${currentSessionId}`)
        }

        // Save user message to DB
        const userMessage: Message = { role: 'user', content: message }
        const optimistic = [...messages, userMessage]
        setMessages(optimistic)
        setIsLoading(true)

        const { error: insertError } = await supabase
            .from('messages')
            .insert({
                session_id: currentSessionId,
                role: 'user',
                content: message,
            })

        if (insertError) {
            console.error('Error saving user message:', insertError)
            setIsLoading(false)
            return
        }

        // If this is the first message, update session title
        if (messages.length === 0) {
            const title = message.slice(0, 40) + (message.length > 40 ? '...' : '')
            await supabase
                .from('chat_sessions')
                .update({ title, updated_at: new Date().toISOString() })
                .eq('id', currentSessionId)

            setSessions(prev => prev.map(s =>
                s.id === currentSessionId ? { ...s, title } : s
            ))
        }

        // Send to your n8n/AI backend
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    sessionId: currentSessionId,
                }),
            })

            if (!res.ok || !res.body) {
                const errBody = await res.text().catch(() => '')
                throw new Error(`Stream failed (${res.status}): ${errBody || 'no body'}`)
            }

            /*const data = await res.json()
            const assistantMessage: Message = { role: 'assistant', content: data.reply }
            setMessages(prev => [...prev, assistantMessage])

            // Save AI reply to DB
            await supabase.from('messages').insert({
                session_id: currentSessionId,
                role: 'assistant',
                content: data.reply,
            })*/

            // Bump updated_at so this session sorts to top

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let fullReply = ''
            let assistantStarted = false

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                fullReply += decoder.decode(value, { stream: true })

                if (!assistantStarted) {
                    assistantStarted = true
                    setMessages(prev => [...prev, { role: 'assistant', content: fullReply }])
                } else {
                    setMessages(prev => {
                        const updated = [...prev]
                        updated[updated.length - 1] = { role: 'assistant', content: fullReply }
                        return updated
                    })
                }
            }

            await supabase
                .from('chat_sessions')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', currentSessionId)

        } catch (error) {
            /* console.error('Error:', error)
             const errMsg: Message = { role: 'assistant', content: 'Sorry, Something Went Wrong..' }
             setMessages(prev => [...prev, errMsg])
             await supabase.from('messages').insert({
                 session_id: currentSessionId,
                 role: 'assistant',
                 content: errMsg.content,
             })*/
            console.error('Error:', error)
            setMessages(prev => {
                const last = prev[prev.length - 1]
                if (last?.role === 'assistant') {
                    const updated = [...prev]
                    updated[updated.length - 1] = { role: 'assistant', content: 'Sorry, Something Went Wrong..' }
                    return updated
                }
                return [...prev, { role: 'assistant', content: 'Sorry, Something Went Wrong..' }]
            })
            } finally {
                setIsLoading(false)
            }
        }

        return (
            <>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', scrollbarWidth: 'none' }}>
                    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                        {!loadingMessages && messages.length === 0 && !isLoading && (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', paddingTop: '80px', gap: '12px',
                            }}>
                                <img
                                    src="https://api.dicebear.com/9.x/bottts/svg?seed=GolfAI"
                                    alt="AI"
                                    style={{ width: '64px', height: '64px' }}
                                />
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
                                    Hi {userName}! Ask Me About The Rules of Golf!
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {messages.map((msg, i) => (
                                <div key={msg.id || i} style={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    alignItems: 'flex-start', gap: '8px',
                                }}>
                                    {msg.role === 'assistant' && (
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                                            <img src="https://api.dicebear.com/9.x/bottts/svg?seed=GolfAI" alt="AI" style={{ width: '100%', height: '100%' }} />
                                        </div>
                                    )}
                                    <div style={{
                                        maxWidth: '75%', padding: '12px 16px',
                                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                        fontSize: '14px', lineHeight: '1.6', color: 'white',
                                        background: msg.role === 'user' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.35)',
                                        border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                                    }}>
                                        {msg.role === 'assistant' ? (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    h1: ({ children }) => (
                                                        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '12px 0 8px', color: 'white' }}>
                                                            {children}
                                                        </h1>
                                                    ),
                                                    h2: ({ children }) => (
                                                        <h2 style={{ fontSize: '17px', fontWeight: 600, margin: '10px 0 6px', color: 'white' }}>
                                                            {children}
                                                        </h2>
                                                    ),
                                                    h3: ({ children }) => (
                                                        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '8px 0 4px', color: 'white' }}>
                                                            {children}
                                                        </h3>
                                                    ),
                                                    p: ({ children }) => (
                                                        <p style={{ margin: '6px 0', lineHeight: 1.7 }}>{children}</p>
                                                    ),
                                                    ul: ({ children }) => (
                                                        <ul style={{ paddingLeft: '20px', margin: '6px 0' }}>{children}</ul>
                                                    ),
                                                    ol: ({ children }) => (
                                                        <ol style={{ paddingLeft: '20px', margin: '6px 0' }}>{children}</ol>
                                                    ),
                                                    li: ({ children }) => (
                                                        <li style={{ margin: '4px 0', lineHeight: 1.6 }}>{children}</li>
                                                    ),
                                                    strong: ({ children }) => (
                                                        <strong style={{ fontWeight: 700, color: '#ffb380' }}>{children}</strong>
                                                    ),
                                                    em: ({ children }) => (
                                                        <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.85)' }}>{children}</em>
                                                    ),
                                                    code: ({ children }) => (
                                                        <code style={{
                                                            background: 'rgba(0,0,0,0.4)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '13px',
                                                            fontFamily: 'monospace',
                                                            color: '#ff8c42',
                                                        }}>
                                                            {children}
                                                        </code>
                                                    ),
                                                    blockquote: ({ children }) => (
                                                        <blockquote style={{
                                                            borderLeft: '3px solid #f55702',
                                                            paddingLeft: '12px',
                                                            margin: '8px 0',
                                                            color: 'rgba(255,255,255,0.75)',
                                                            fontStyle: 'italic',
                                                        }}>
                                                            {children}
                                                        </blockquote>
                                                    ),
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #f55702, #ff8c42)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0,
                                        }}>
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden' }}>
                                        <img src="https://api.dicebear.com/9.x/bottts/svg?seed=GolfAI" alt="AI" style={{ width: '100%', height: '100%' }} />
                                    </div>
                                    <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'rgba(0,0,0,0.35)' }}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {[0, 150, 300].map(d => (
                                                <div key={d} style={{
                                                    width: '6px', height: '6px', borderRadius: '50%',
                                                    background: '#f55702', animation: 'bounce 1s infinite',
                                                    animationDelay: `${d}ms`,
                                                }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>

                <div style={{ flexShrink: 0, padding: '12px 16px 24px' }}>
                    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                        <PromptInputBox onSend={handleMessages} />
                    </div>
                </div>
            </>
        )
    }