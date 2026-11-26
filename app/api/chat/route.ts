/*
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json()

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Missing message or sessionId' },
        { status: 400 }
      )
    }

    // Verify the user is logged in
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the session to get n8n's session_id AND verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('session_id, user_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Send to n8n with the session_id (n8n's memory key)
    const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sessionId: session.session_id, // ← n8n's memory key, not the DB primary id
      }),
    })

    if (!n8nResponse.ok) {
      throw new Error(`n8n returned ${n8nResponse.status}`)
    }

    const data = await n8nResponse.json()

    // n8n might return { output } or { reply } or { response } — adapt to what yours returns
    const reply = data.output || data.reply || data.response || 'No response from AI'

    return NextResponse.json({ reply })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

*/

import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json()

    if (!message || !sessionId) {
      return new Response('Missing message or sessionId', { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    // 1. Embed the user's question
    const embedResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: message,
      }),
    })
    if (!embedResponse.ok) {
      const errText = await embedResponse.text()
      throw new Error(`OpenAI embeddings failed (${embedResponse.status}): ${errText}`)
    }
    const embedData = await embedResponse.json()
    const embedding = embedData.data?.[0]?.embedding
    if (!embedding) throw new Error('No embedding returned from OpenAI')

    // 2a. Semantic retrieval
    const { data: semanticDocs, error: rpcError } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: 5,
      filter: {},
    })
    if (rpcError) throw new Error(`match_documents RPC failed: ${rpcError.message}`)

    // 2b. Recherche par mot-clé : si le client cite une référence produit (ex. NV-201),
    // on récupère directement les passages correspondants, car les embeddings
    // distinguent mal deux références qui ne diffèrent que par les chiffres.
    const ruleMatches = Array.from(message.matchAll(/\bNV-(\d+)\b/gi)) as RegExpMatchArray[]
    const ruleNumbers = [...new Set(ruleMatches.map(m => m[1]))]
    let keywordDocs: { content: string }[] = []
    if (ruleNumbers.length > 0) {
      const orFilter = ruleNumbers.map(n => `content.ilike.%NV-${n}%`).join(',')
      const { data: kw } = await supabase
        .from('documents')
        .select('content')
        .or(orFilter)
        .limit(8)
      keywordDocs = kw || []
    }

    // Merge and dedupe by content
    const seen = new Set<string>()
    const allDocs = [...keywordDocs, ...(semanticDocs || [])].filter((d: any) => {
      if (seen.has(d.content)) return false
      seen.add(d.content)
      return true
    })
    const context = allDocs.map((d: any) => d.content).join('\n\n---\n\n')

    // 3. Load the most recent 10 messages, then put them back in chronological order
    const { data: recent } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10)
    const history = (recent || []).slice().reverse()

    // Make sure the current question is the last message the model sees, even if
    // the client hasn't persisted it yet or it fell outside the window.
    const last = history[history.length - 1]
    if (!last || last.role !== 'user' || last.content !== message) {
      history.push({ role: 'user', content: message, created_at: new Date().toISOString() })
    }

    // 4. Stream the response
    const result = streamText({
      model: openai('gpt-4o-mini'),
            system: `Tu es l'assistant du service client de Nova Store, une boutique en ligne marocaine. Réponds UNIQUEMENT à partir du contexte fourni, de manière polie, claire et courte. Si l'information n'est pas dans le contexte, réponds : « Je n'ai pas cette information. Contactez notre service client sur WhatsApp du lundi au samedi, de 9h à 19h. » N'invente jamais de prix, de délai ou de produit. Ne demande jamais de données bancaires. Réponds dans la langue du client. Utilise des listes et du **gras** pour les informations importantes (prix, délais).

            Contexte (base de connaissances Nova Store) :
${context || '(aucun contexte pertinent trouvé)'}`,
      messages: history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      onFinish: async ({ text }) => {
        await supabase.from('messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: text,
        })
        await supabase
          .from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', sessionId)
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(`Chat error: ${msg}`, { status: 500 })
  }
}

