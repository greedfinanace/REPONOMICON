from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from typing import Optional
import time
import os
from collections import defaultdict
from parser_core import CodeNecromancer
from vector_brain import VectorBrain

app = FastAPI(title="Necronomicon Parser Service", version="1.1.0")

# Initialize the dark arts
necromancer = CodeNecromancer()
brain = VectorBrain()

# Rate limiting config
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))  # requests per window
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # seconds
API_KEY = os.getenv("NECRONOMICON_API_KEY", None)  # Optional API key

# Rate limit storage
rate_limit_store: dict = defaultdict(list)

# API Key header
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def get_client_ip(request: Request) -> str:
    """Get client IP for rate limiting."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(request: Request):
    """Rate limiting middleware."""
    client_ip = get_client_ip(request)
    now = time.time()
    
    # Clean old entries
    rate_limit_store[client_ip] = [
        t for t in rate_limit_store[client_ip] 
        if now - t < RATE_LIMIT_WINDOW
    ]
    
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=429, 
            detail=f"Rate limit exceeded. Max {RATE_LIMIT_REQUESTS} requests per {RATE_LIMIT_WINDOW}s"
        )
    
    rate_limit_store[client_ip].append(now)


def verify_api_key(api_key: Optional[str] = Depends(api_key_header)):
    """Verify API key if configured."""
    if API_KEY and api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


class IngestRequest(BaseModel):
    url: str


class QueryRequest(BaseModel):
    query: str
    repo_url: Optional[str] = None
    k: int = 4


class DeleteRequest(BaseModel):
    repo_url: str


@app.get("/health")
def health_check():
    """Health check endpoint (no auth required)."""
    return {"status": "alive", "message": "The Necronomicon awaits..."}


@app.get("/repos")
def list_repos(
    request: Request,
    _: None = Depends(check_rate_limit),
    __: None = Depends(verify_api_key)
):
    """List all ingested repositories."""
    return {"repos": brain.list_repos()}


@app.get("/stats")
def get_stats(
    request: Request,
    _: None = Depends(check_rate_limit),
    __: None = Depends(verify_api_key)
):
    """Get brain statistics."""
    return brain.get_stats()


@app.post("/ingest")
def ingest_repo(
    request: Request,
    body: IngestRequest,
    _: None = Depends(check_rate_limit),
    __: None = Depends(verify_api_key)
):
    """Clone and parse a GitHub repository."""
    try:
        repo_path = necromancer.clone_repo(body.url)
        documents = necromancer.parse_repo(repo_path)
        
        if not documents:
            raise HTTPException(status_code=400, detail="No parseable files found in repository")
        
        brain.embed_code(documents, body.url)
        
        return {
            "status": "success",
            "message": f"Ingested {len(documents)} files",
            "repo_url": body.url,
            "files": [d["file"] for d in documents]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query")
def query_knowledge(
    request: Request,
    body: QueryRequest,
    _: None = Depends(check_rate_limit),
    __: None = Depends(verify_api_key)
):
    """Query the embedded knowledge base."""
    try:
        results = brain.search(body.query, repo_url=body.repo_url, k=body.k)
        return {
            "status": "success",
            "repo_url": body.repo_url,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/repo")
def delete_repo(
    request: Request,
    body: DeleteRequest,
    _: None = Depends(check_rate_limit),
    __: None = Depends(verify_api_key)
):
    """Delete a repository from the brain."""
    if brain.delete_repo(body.repo_url):
        return {"status": "success", "message": f"Deleted {body.repo_url}"}
    else:
        raise HTTPException(status_code=404, detail="Repository not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
