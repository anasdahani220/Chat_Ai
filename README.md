# Nova Store Assistant

Assistant IA de service client pour une boutique e-commerce marocaine, basé sur le RAG (Retrieval-Augmented Generation). Il répond aux questions des clients (livraison, paiement, retours, produits) uniquement à partir de la base de connaissances de la boutique.

## Fonctionnalités
- Authentification (inscription / connexion) avec Supabase
- Recherche sémantique (embeddings OpenAI + pgvector) et recherche par référence produit (ex. NV-201)
- Réponses en streaming avec gpt-4o-mini
- Historique des conversations et mémoire du contexte
- Saisie vocale (transcription Whisper)

## Technologies
Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase (PostgreSQL + pgvector), OpenAI API, Vercel AI SDK.

## Installation
```bash
npm install
```
Créer `.env.local` :
```
OPENAI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SECRET_KEY=...
```

## Ingestion de la base de connaissances
Placer les PDF dans `docs/`, puis :
```bash
node scripts/ingest.mjs
```

## Lancement
```bash
npm run dev
```
Ouvrir http://localhost:3000
