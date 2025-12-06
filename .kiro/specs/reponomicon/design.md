# Design Document

## Overview

Reponomicon is a consolidated Next.js 14 application that analyzes GitHub repositories using the GitHub API and provides LLM-powered explanations via OpenRouter.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 14 Application                    │
│              TypeScript + Tailwind + Framer Motion          │
│              Spooky eldritch theme UI                       │
├─────────────────────────────────────────────────────────────┤
│  /app/page.tsx          - Main chat interface               │
│  /app/api/reponomicon/  - API routes for repo analysis      │
│  /src/components/       - Eldritch UI components            │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
         OpenRouter API (DeepSeek LLM)
         GitHub API (Repository fetching)
```

## Components

### Frontend (Next.js)
- `app/page.tsx` - Main page with chat interface
- `app/api/reponomicon/route.ts` - API route for single repo analysis
- `app/api/reponomicon/compare/route.ts` - API route for repo comparison
- `src/components/eldritch/` - Spooky themed UI components
  - `FogLayout.tsx` - Animated fog background
  - `RuneInput.tsx` - Mystical input field
  - `ChatGrimoire.tsx` - Message display with markdown
  - `GhostLoader.tsx` - Animated ghost with cursor-tracking eyes

## Data Flow

1. User enters GitHub URL
2. Frontend calls `/api/reponomicon`
3. API route fetches repository contents via GitHub API
4. API route analyzes code and checks for malicious patterns
5. API route sends context to OpenRouter LLM
6. LLM generates beginner-friendly explanation
7. Frontend displays response with markdown rendering

## Storage

- **localStorage**: Chat history, sessions (browser)
- **No database required**: Stateless design

## Correctness Properties

### Property 1: Valid GitHub URLs are accepted
For any valid GitHub URL, the system should successfully clone and parse the repository.

### Property 2: Invalid URLs are rejected
For any invalid or inaccessible URL, the system should return a clear error message.

### Property 3: Embeddings are consistent
For any code chunk, the generated embedding should have dimension 384 (all-MiniLM-L6-v2).

### Property 4: Search returns relevant results
For any query, the FAISS search should return the k most similar code chunks.

### Property 5: Sessions persist across reloads
For any saved session, reloading the page should restore the conversation.
