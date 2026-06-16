import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Verify user is logged in
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set in env')
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured on the server' },
        { status: 500 }
      )
    }

    // Get audio file from incoming request
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file' }, { status: 400 })
    }
    console.log('Received audio:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    })

    // Forward to OpenAI Whisper — pass an explicit filename so Whisper sees a valid extension
    const whisperFormData = new FormData()
    whisperFormData.append('file', audioFile, audioFile.name || 'recording.webm')
    whisperFormData.append('model', 'whisper-1')
    whisperFormData.append('language', 'en')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: whisperFormData,
    })

    if (!whisperRes.ok) {
      const errorText = await whisperRes.text()
      console.error('Whisper failed:', whisperRes.status, errorText)
      return NextResponse.json(
        { error: `Whisper ${whisperRes.status}: ${errorText}` },
        { status: whisperRes.status }
      )
    }

    const data = await whisperRes.json()
    return NextResponse.json({ text: data.text })

  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}