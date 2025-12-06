# Design Document

## Overview

The Necronomicon of Knowledge is a multi-service application that transforms GitHub repositories into queryable knowledge bases using AST parsing, vector embeddings, and LLM-powered Q&A. The system consists of three main services: a Python FastAPI parser service, a Node.js/Express backend API, and a Next.js 14 frontend. The architecture emphasizes decentralization (IPFS), automation (Kiro hooks), and real-time updates (Socket.io).

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 14)                    │
│  - TypeScript, Tailwind CSS, Framer Motion                      │
│  - Spooky UI with animations, rune tracers, void maps           │
│  - Socket.io client for real-time updates                       │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTP/WebSocket
┌────────────────▼────────────────────────────────────────────────┐
│                   Backend API (Node.js/Express)                  │
│  - Repository orchestration                                      │
│  - MongoDB connection for metadata storage                       │
│  - Socket.io server for progress events                         │
│  - IPFS pinning via web3.storage                                │
│  - ZIP export generation                                         │
└─────┬──────────────────────────────────┬─────────────────────────┘
      │                                  │
      │ HTTP                             │ MongoDB
      │                                  │
┌─────▼──────────────────────┐    ┌─────▼──────────────────────┐
│  Parser Service (FastAPI)  │    │   MongoDB Atlas/Local      │
│  - Tree-sitter AST parsing │    │   - Parsed code metadata   │
│  - Python/JS/TS support    │    │   - FAISS index storage    │
│  - GitPython repo cloning  │    │   - Repository info        │
│  - Chunk extraction        │    │   - IPFS CIDs              │
└─────┬──────────────────────┘    └────────────────────────────┘
      │
      │ Embeddings
      │
┌─────▼──────────────────────┐
│   FAISS Vector Store       │
│   - HuggingFace embeddings │
│   - all-MiniLM-L6-v2 model │
│   - Similarity search      │
└────────────────────────────┘
```

### Service Communication Flow

1. **Ingestion Flow:**
   - User submits GitHub URL via Frontend
   - Backend validates URL and creates job ID
   - Backend calls Parser Service with repo URL
   - Parser Service clones repo, parses files, extracts chunks
   - Parser Service generates embeddings and creates FAISS index
   - Parser Service returns metadata to Backend
   - Backend stores metadata in MongoDB
   - Backend emits progress events via Socket.io

2. **Query Flow:**
   - User submits natural language query via Frontend
   - Backend forwards query to Parser Service
   - Parser Service generates query embedding
   - Parser Service searches FAISS index for top-k matches
   - Parser Service calls LLM (via MCP) with context
   - LLM generates answer with citations
   - Backend returns answer to Frontend
   - Frontend renders answer with clickable citations

3. **Auto-Update Flow:**
   - Kiro hook detects file save event
   - Hook triggers Backend re-ingestion endpoint
   - Backend calls Parser Service for incremental update
   - Parser Service re-parses modified files
   - FAISS index is updated with new embeddings
   - Socket.io notifies connected clients

## Components and Interfaces

### 1. Parser Service (Python FastAPI)

**File:** `python_service/main.py`

**Endpoints:**
- `GET /` - Health check, returns `{"status": "Grimoire Active"}`
- `POST /ingest` - Accepts `RepoRequest`, returns `{"job_id": str, "status": "processing"}`
- `POST /query` - Accepts `QueryRequest`, returns search results with citations

**Models:**
```python
class RepoRequest(BaseModel):
    url: str
    branch: str = "main"

class QueryRequest(BaseModel):
    query: str
    k: int = 3

class ParsedChunk(BaseModel):
    code: str
    ast_summary: str
    file_path: str
    line_start: int
    line_end: int
    language: str
```

**File:** `python_service/parser_core.py`

**Class:** `CodeNecromancer`
- `__init__()` - Initialize tree-sitter parsers for Python, JS, TS
- `clone_repo(url: str) -> str` - Clone GitHub repo to `/tmp/repos/{repo_name}`
- `parse_file(filepath: str) -> ParsedChunk` - Parse file and extract AST metadata
- `extract_functions(tree, source_code) -> List[dict]` - Extract function definitions
- `extract_classes(tree, source_code) -> List[dict]` - Extract class definitions
- `get_docstring(node) -> str` - Extract docstrings/JSDoc comments

**File:** `python_service/vector_brain.py`

**Functions:**
- `embed_chunks(chunks: List[str]) -> np.ndarray` - Generate embeddings using HuggingFace
- `create_index(chunks: List[str]) -> faiss.Index` - Create FAISS index
- `save_index(index: faiss.Index, path: str)` - Persist index to disk
- `load_index(path: str) -> faiss.Index` - Load index from disk
- `search(query: str, k: int) -> List[dict]` - Perform similarity search

### 2. Backend API (Node.js/Express)

**File:** `backend/server.js`

**Endpoints:**
- `POST /api/ingest` - Orchestrate repository ingestion
- `POST /api/query` - Handle user queries
- `POST /api/ipfs/pin` - Pin knowledge base to IPFS
- `GET /api/ipfs/:cid` - Retrieve knowledge base from IPFS
- `GET /api/export/:repoId` - Generate ZIP export
- `GET /api/status/:jobId` - Check ingestion job status

**Socket.io Events:**
- `ingest:progress` - Emit progress percentage
- `ingest:complete` - Emit completion notification
- `kb:updated` - Emit when knowledge base is updated

**MongoDB Collections:**
- `repositories` - Store repo metadata (url, branch, last_updated, cid)
- `parsed_chunks` - Store parsed code chunks with embeddings
- `jobs` - Store ingestion job status

### 3. Frontend (Next.js 14)

**File:** `src/app/page.tsx`

**Components:**
- `RepoInput` - GitHub URL input with validation
- `ProgressIndicator` - Real-time ingestion progress
- `QueryInterface` - Natural language query input
- `ResultsDisplay` - Render answers with citations
- `VoidMap` - Dependency visualization with fog effects
- `RuneTracer` - Animated function call path visualization

**API Routes:**
- `src/app/api/ingest/route.ts` - Proxy to Backend API
- `src/app/api/query/route.ts` - Proxy to Backend API

**Hooks:**
- `useSocket()` - Manage Socket.io connection and events
- `useRepo()` - Manage repository state
- `useQuery()` - Manage query state and results

## Data Models

### Repository Document (MongoDB)

```typescript
interface Repository {
  _id: ObjectId;
  url: string;
  branch: string;
  name: string;
  owner: string;
  last_updated: Date;
  file_count: number;
  languages: string[];
  ipfs_cid?: string;
  status: "processing" | "ready" | "error";
}
```

### Parsed Chunk Document (MongoDB)

```typescript
interface ParsedChunk {
  _id: ObjectId;
  repo_id: ObjectId;
  file_path: string;
  language: string;
  chunk_type: "function" | "class" | "module";
  name: string;
  code: string;
  ast_summary: string;
  docstring?: string;
  line_start: number;
  line_end: number;
  embedding: number[];
  dependencies: string[];
}
```

### Job Document (MongoDB)

```typescript
interface Job {
  _id: ObjectId;
  job_id: string;
  repo_id: ObjectId;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  created_at: Date;
  completed_at?: Date;
  error?: string;
}
```

### FAISS Index Structure

```python
# Stored as binary file: reponomicon_{repo_id}.index
# Metadata stored separately: reponomicon_{repo_id}_meta.json
{
  "chunk_ids": ["chunk_id_1", "chunk_id_2", ...],
  "dimension": 384,  # all-MiniLM-L6-v2 dimension
  "total_vectors": 1000
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to avoid redundancy:

- Properties 2.1 and 2.2 (Python/JS/TS parsing) can be combined into a single multi-language parsing property
- Properties 3.1, 3.2, 3.3 (storage, embedding, indexing) represent a pipeline that can be tested as a single round-trip property
- Properties 10.1, 10.2, 10.4 (Socket connection, progress events, completion) can be combined into a comprehensive real-time update property

### Core Properties

**Property 1: Repository cloning succeeds for valid URLs**
*For any* valid GitHub repository URL, the clone operation should succeed and create a directory structure containing the repository contents.
**Validates: Requirements 1.1**

**Property 2: Invalid repository URLs are rejected**
*For any* invalid or inaccessible GitHub URL (malformed, private, non-existent), the system should return an error message and prevent further processing.
**Validates: Requirements 1.4**

**Property 3: File identification finds all target language files**
*For any* cloned repository, the file identification process should find all files with extensions .py, .js, .ts, .tsx, .jsx and no other file types should be included in the processing list.
**Validates: Requirements 1.2**

**Property 4: Multi-language AST parsing extracts required metadata**
*For any* valid Python, JavaScript, or TypeScript file, the parser should extract function definitions, class definitions, docstrings/comments, parameters, and line locations into structured metadata.
**Validates: Requirements 2.1, 2.2**

**Property 5: Parsing errors don't halt processing**
*For any* repository containing files with syntax errors, the parser should log the error for those files and continue processing the remaining valid files.
**Validates: Requirements 2.4**

**Property 6: Parsed metadata is stored with required fields**
*For any* successfully parsed file, the stored metadata in MongoDB should include file_path, language, chunk_type, name, code, ast_summary, line_start, line_end, and timestamp.
**Validates: Requirements 2.3, 3.1**

**Property 7: Embedding generation and indexing round-trip**
*For any* code chunk stored in the knowledge base, generating an embedding and indexing it in FAISS should allow retrieval of similar chunks via similarity search.
**Validates: Requirements 3.2, 3.3**

**Property 8: Repository re-ingestion maintains consistency**
*For any* repository that is ingested twice, the second ingestion should update existing entries, remove obsolete data, and result in a knowledge base with no duplicate chunks for the same code location.
**Validates: Requirements 3.4**

**Property 9: Query embedding uses consistent model**
*For any* natural language query, the generated embedding should have the same dimensionality (384 for all-MiniLM-L6-v2) as the knowledge base embeddings.
**Validates: Requirements 4.1**

**Property 10: Similarity search returns correct number of results**
*For any* query with parameter k, the FAISS similarity search should return exactly k results (or fewer if the knowledge base contains fewer than k chunks).
**Validates: Requirements 4.2**

**Property 11: LLM responses include structured citations**
*For any* LLM-generated answer, the response should include citations with file_path, line_start, line_end, and function_name fields for each referenced code chunk.
**Validates: Requirements 4.4**

**Property 12: Citation links are rendered as clickable**
*For any* citation in the frontend, the rendered HTML should contain an anchor tag with an href attribute pointing to the code location.
**Validates: Requirements 4.5**

**Property 13: Knowledge base updates trigger Socket events**
*For any* update to the knowledge base (new ingestion, re-parsing), a Socket.io event should be emitted to all connected clients with the update type and affected repository.
**Validates: Requirements 5.3, 10.2**

**Property 14: Auto-regeneration updates embeddings**
*For any* file that is re-parsed due to a hook trigger, the knowledge base should contain updated embeddings that reflect the new file content.
**Validates: Requirements 5.2**

**Property 15: IPFS serialization round-trip preserves data**
*For any* knowledge base state, serializing to JSON, uploading to IPFS, retrieving by CID, and deserializing should produce a knowledge base with equivalent content (same chunks, embeddings, and metadata).
**Validates: Requirements 6.1, 6.2, 6.4**

**Property 16: IPFS CID is stored and retrievable**
*For any* successful IPFS pin operation, the returned CID should be stored in MongoDB and associated with the correct repository record.
**Validates: Requirements 6.3**

**Property 17: IPFS failures trigger retry logic**
*For any* IPFS pin operation that fails, the system should retry up to 3 times before returning an error to the user.
**Validates: Requirements 6.5**

**Property 18: ZIP export contains required structure**
*For any* knowledge base export, the generated ZIP file should contain a manifest.json file with repository metadata and a structured directory of parsed chunks organized by file path.
**Validates: Requirements 7.1, 7.2**

**Property 19: Export failures return diagnostic errors**
*For any* ZIP export operation that fails, the system should return an error message that includes diagnostic information about the failure cause.
**Validates: Requirements 7.5**

**Property 20: Real-time progress events are emitted**
*For any* repository ingestion process, Socket.io progress events should be emitted at regular intervals with increasing percentage values from 0 to 100.
**Validates: Requirements 1.5, 10.1, 10.2, 10.4**

**Property 21: Socket reconnection on connection loss**
*For any* Socket.io connection that is lost, the client should automatically attempt to reconnect within 5 seconds.
**Validates: Requirements 10.5**

## Error Handling

### Parser Service Errors

1. **Repository Clone Failures:**
   - Invalid URL format → Return 400 with error message
   - Private/inaccessible repo → Return 403 with authentication hint
   - Network timeout → Return 504 with retry suggestion
   - Disk space exhausted → Return 507 with cleanup recommendation

2. **AST Parsing Errors:**
   - Syntax errors → Log error, skip file, continue processing
   - Unsupported language → Log warning, skip file
   - File too large (>10MB) → Log warning, skip file
   - Tree-sitter crash → Log error, skip file, continue

3. **Embedding Generation Errors:**
   - Model loading failure → Return 500, suggest model download
   - Out of memory → Return 507, suggest batch size reduction
   - Invalid input encoding → Log error, skip chunk

### Backend API Errors

1. **MongoDB Connection Errors:**
   - Connection timeout → Retry 3 times with exponential backoff
   - Authentication failure → Return 500 with configuration hint
   - Write conflict → Retry with optimistic locking

2. **IPFS Errors:**
   - Upload timeout → Retry up to 3 times
   - Invalid CID → Return 400 with error message
   - Retrieval failure → Return 404 with suggestion to re-pin

3. **Socket.io Errors:**
   - Connection failure → Client auto-reconnect
   - Event emission failure → Log error, continue processing

### Frontend Errors

1. **Network Errors:**
   - API timeout → Display retry button
   - Connection lost → Display reconnection status
   - 500 errors → Display user-friendly error message

2. **Validation Errors:**
   - Invalid GitHub URL → Display inline validation error
   - Empty query → Disable submit button
   - Malformed response → Display fallback UI

## Testing Strategy

### Unit Testing

**Framework:** Jest for Node.js/TypeScript, pytest for Python

**Unit Test Coverage:**
- Parser Service: Test individual AST extraction functions with sample code files
- Vector Brain: Test embedding generation with known inputs
- Backend API: Test endpoint handlers with mocked dependencies
- Frontend Components: Test React components with React Testing Library

**Key Unit Tests:**
- `test_parse_python_function()` - Verify function extraction from Python code
- `test_parse_typescript_class()` - Verify class extraction from TypeScript
- `test_embed_chunks()` - Verify embedding dimensions and format
- `test_faiss_search()` - Verify search returns correct number of results
- `test_repo_validation()` - Verify GitHub URL validation logic
- `test_socket_events()` - Verify Socket.io event emission

### Property-Based Testing

**Framework:** Hypothesis for Python, fast-check for TypeScript/JavaScript

**Configuration:** Each property test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Tagging Convention:** Each property-based test must include a comment tag in this exact format:
```
// Feature: necronomicon-knowledge-system, Property X: [property description]
```

**Property Test Coverage:**
- Property 1: Generate random valid GitHub URLs and verify cloning succeeds
- Property 2: Generate random invalid URLs and verify rejection
- Property 3: Generate repositories with known file structures and verify file identification
- Property 4: Generate random Python/JS/TS code and verify AST extraction
- Property 5: Generate code with syntax errors and verify continued processing
- Property 7: Generate random code chunks, embed, index, and verify retrieval
- Property 8: Ingest same repository twice and verify no duplicates
- Property 9: Generate random queries and verify embedding dimensions
- Property 10: Generate queries with various k values and verify result counts
- Property 15: Generate random KB states and verify IPFS round-trip
- Property 17: Simulate IPFS failures and verify retry logic
- Property 18: Generate random KB states and verify ZIP structure
- Property 20: Monitor ingestion and verify progress event sequence

**Property Test Implementation Notes:**
- Use smart generators that constrain to valid input spaces (e.g., valid Python syntax for AST tests)
- Avoid mocking when possible to test real functionality
- Each correctness property from the design document must be implemented by exactly one property-based test
- Tests should focus on universal properties that hold across all inputs, not specific examples

### Integration Testing

**Scope:** Test interactions between services

**Key Integration Tests:**
- End-to-end ingestion flow: Frontend → Backend → Parser → MongoDB → FAISS
- Query flow: Frontend → Backend → Parser → FAISS → LLM → Frontend
- Hook trigger flow: File save → Hook → Backend → Parser → Socket event
- IPFS flow: Backend → web3.storage → retrieval → deserialization

**Tools:** Supertest for API testing, Playwright for E2E frontend testing

### Testing Workflow

1. **Implementation-First Development:**
   - Implement feature or fix first
   - Write corresponding tests after implementation
   - Run tests to verify correctness
   - Iterate on implementation if tests fail

2. **Test Execution Order:**
   - Run unit tests first (fastest feedback)
   - Run property-based tests (broader coverage)
   - Run integration tests (full system validation)

3. **Continuous Testing:**
   - Kiro hooks trigger test runs on file save
   - All tests must pass before considering a task complete
   - Property tests catch edge cases that unit tests might miss

## Deployment Architecture

### Frontend Deployment (Vercel)

- **Platform:** Vercel
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL` - Backend API URL
  - `NEXT_PUBLIC_SOCKET_URL` - Socket.io server URL

### Backend Deployment (Railway)

- **Platform:** Railway
- **Start Command:** `node server.js`
- **Environment Variables:**
  - `MONGODB_URI` - MongoDB connection string
  - `PARSER_SERVICE_URL` - Python FastAPI URL
  - `WEB3_STORAGE_TOKEN` - IPFS API token
  - `PORT` - Server port (default 3001)

### Parser Service Deployment (AWS Lambda)

- **Platform:** AWS Lambda + API Gateway
- **Runtime:** Python 3.11
- **Handler:** `main.handler`
- **Memory:** 2048 MB (for tree-sitter and embeddings)
- **Timeout:** 300 seconds (for large repos)
- **Environment Variables:**
  - `HUGGINGFACE_MODEL` - Embedding model name
  - `TMP_DIR` - Temporary directory for repo clones

### Database (MongoDB Atlas)

- **Tier:** M10 or higher (for production load)
- **Region:** Same as Backend for low latency
- **Backup:** Automated daily backups
- **Indexes:**
  - `repositories.url` - Unique index
  - `parsed_chunks.repo_id` - For efficient queries
  - `parsed_chunks.file_path` - For file lookups

## Kiro Integration

### Steering Documents

**Location:** `.kiro/steering/`

**Files:**
- `coding-standards.md` - TypeScript/Python style guidelines
- `architecture-rules.md` - Service boundaries and communication patterns
- `testing-requirements.md` - Test coverage and PBT requirements

### Agent Hooks

**Location:** `.kiro/hooks/`

**Hooks:**
1. **on-file-save.json** - Trigger re-parsing when code files are saved
   ```json
   {
     "trigger": "onFileSave",
     "filePattern": "**/*.{py,js,ts,tsx}",
     "action": "sendMessage",
     "message": "Re-parse the modified file and update the knowledge base"
   }
   ```

2. **on-test-run.json** - Run all tests after implementation changes
   ```json
   {
     "trigger": "onFileSave",
     "filePattern": "**/*.{py,js,ts}",
     "action": "executeCommand",
     "command": "npm test && cd python_service && pytest"
   }
   ```

### MCP Configuration

**Location:** `.kiro/settings/mcp.json`

**Configuration:**
```json
{
  "mcpServers": {
    "groq": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-groq"],
      "env": {
        "GROQ_API_KEY": "${GROQ_API_KEY}"
      }
    },
    "claude": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-claude"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
      }
    }
  }
}
```

## Performance Considerations

### Scalability Targets

- **Repository Size:** Support repos up to 10,000 files
- **Concurrent Users:** Handle 50+ simultaneous queries
- **Query Latency:** <2 seconds for 95% of queries
- **Ingestion Time:** <5 minutes for repos with 1,000 files

### Optimization Strategies

1. **Incremental Parsing:**
   - Only re-parse modified files on updates
   - Use git diff to identify changed files
   - Batch process files in groups of 100

2. **Embedding Caching:**
   - Cache embeddings for unchanged code chunks
   - Use content hash to detect changes
   - Invalidate cache on file modification

3. **FAISS Index Optimization:**
   - Use IVF (Inverted File) index for large datasets
   - Tune nprobe parameter for accuracy/speed tradeoff
   - Rebuild index periodically to maintain efficiency

4. **MongoDB Query Optimization:**
   - Create compound indexes for common queries
   - Use projection to limit returned fields
   - Implement pagination for large result sets

## Security Considerations

1. **Input Validation:**
   - Sanitize GitHub URLs to prevent injection
   - Validate file paths to prevent directory traversal
   - Limit repository size to prevent DoS

2. **API Authentication:**
   - Implement rate limiting on public endpoints
   - Use API keys for service-to-service communication
   - Validate IPFS CIDs before retrieval

3. **Data Privacy:**
   - Don't store sensitive data from private repos
   - Implement user authentication for multi-tenant deployment
   - Encrypt MongoDB connections with TLS

4. **Resource Limits:**
   - Limit concurrent ingestion jobs per user
   - Set maximum file size for parsing (10MB)
   - Implement timeout for long-running operations
