import { readFile } from 'node:fs/promises'
import { extractText } from 'unpdf'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const FILES = [
  { file: 'docs/nova-store-faq.pdf', source: 'FAQ Nova Store', type: 'faq' },
]

const CHUNK = 1000, OVERLAP = 200

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

function chunkText(text) {
  const clean = text.replace(/\s+/g, ' ').trim()
  const out = []
  for (let i = 0; i < clean.length; i += CHUNK - OVERLAP) {
    const c = clean.slice(i, i + CHUNK)
    if (c.length > 50) out.push(c)
    if (i + CHUNK >= clean.length) break
  }
  return out
}

async function embed(inputs) {
  const r = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: inputs }),
  })
  if (!r.ok) throw new Error(await r.text())
  return (await r.json()).data.map(d => d.embedding)
}

for (const { file, source, type } of FILES) {
  const buf = await readFile(file)
  const { text: pages } = await extractText(new Uint8Array(buf), { mergePages: false })

  const rows = []
  pages.forEach((pageText, i) => {
    for (const content of chunkText(pageText)) {
      rows.push({ content, metadata: { source, type, page: i + 1 } })
    }
  })

  const vectors = await embed(rows.map(r => r.content))
  const { error } = await supabase
    .from('documents')
    .insert(rows.map((r, j) => ({ ...r, embedding: vectors[j] })))
  if (error) throw new Error(`${source}: ${error.message}`)

  console.log(`✅ ${source}: ${pages.length} pages, ${rows.length} chunks`)
}