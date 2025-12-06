# Architecture Rules

## Service Boundaries

### Frontend (Next.js)
- Handles UI rendering and user interactions
- Manages client-side state (localStorage)
- Proxies requests to Python service via API routes
- MUST NOT directly access Python service from client

### Python Service (FastAPI)
- Handles repository cloning and parsing
- Manages embeddings and vector search
- Persists data to disk (pickle files)
- MUST NOT handle UI or user sessions

## Communication

- Frontend → Python: HTTP via Next.js API routes
- Python → LLM: HTTP via OpenRouter API
- All requests use JSON format

## Data Storage

- Chat history: localStorage (browser)
- Embeddings: pickle files (Python disk)
- No external database required

## Error Handling

- Frontend: Display user-friendly messages
- API routes: Return structured error responses
- Python: Log errors, return HTTP status codes
