`# Implementation Plan

## Phase 1: Project Setup and Infrastructure

- [x] 1. Initialize project structure and dependencies





  - Create root directory structure: `python_service/`, `backend/`, `frontend/`
  - Initialize Python FastAPI project with `requirements.txt` (fastapi, uvicorn, tree-sitter, GitPython, langchain, faiss-cpu, sentence-transformers)
  - Initialize Node.js backend with `package.json` (express, socket.io, mongodb, web3.storage, archiver)
  - Initialize Next.js 14 frontend with TypeScript, Tailwind CSS, Framer Motion
  - Configure environment variables for all services
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 2. Set up Kiro integration files











  - Create `.kiro/steering/coding-standards.md` with TypeScript/Python style guidelines
  - Create `.kiro/steering/architecture-rules.md` with service boundaries
  - Create `.kiro/steering/testing-requirements.md` with PBT requirements
  - Create `.kiro/hooks/on-file-save.json` for auto-regeneration
  - Create `.kiro/settings/mcp.json` with Groq/Claude configuration
  - Ensure `.kiro` directory is not in `.gitignore`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

## Phase 2: Parser Service (Python FastAPI) - Ra's Domain

- [x] 3. Implement FastAPI server skeleton





  - Create `python_service/main.py` with FastAPI app initialization
  - Enable CORS middleware (allow all origins for development)
  - Define Pydantic models: `RepoRequest`, `QueryRequest`, `ParsedChunk`
  - Implement `GET /` health check endpoint returning `{"status": "Grimoire Active"}`
  - Implement `POST /ingest` endpoint (mock response for now)
  - Implement `POST /query` endpoint (mock response for now)
  - Add `if __name__ == "__main__"` block to run via uvicorn on port 8000
  - _Requirements: 1.1, 1.3_

- [x] 4. Implement AST parsing core (CodeNecromancer class)




  - Create `python_service/parser_core.py`
  - Implement `CodeNecromancer.__init__()` to setup tree-sitter parsers for Python, JS, TS
  - Add tree-sitter language library building if not present
  - Implement `clone_repo(url: str) -> str` to clone GitHub repos to `/tmp/repos/{repo_name}`
  - Implement `parse_file(filepath: str) -> ParsedChunk` to parse files and extract AST metadata
  - Implement `extract_functions(tree, source_code)` to extract function definitions with line numbers
  - Implement `extract_classes(tree, source_code)` to extract class definitions
  - Implement `get_docstring(node)` to extract docstrings/JSDoc comments
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4.1 Write property test for multi-language AST parsing


  - **Feature: necronomicon-knowledge-system, Property 4: Multi-language AST parsing extracts required metadata**
  - Generate random valid Python/JS/TS code samples
  - Verify extracted metadata contains function names, class names, docstrings, line locations
  - **Validates: Requirements 2.1, 2.2**

- [x] 4.2 Write property test for parsing error handling


  - **Feature: necronomicon-knowledge-system, Property 5: Parsing errors don't halt processing**
  - Generate repositories with some files containing syntax errors
  - Verify parser logs errors and continues processing valid files
  - **Validates: Requirements 2.4**

- [x] 5. Implement vector brain (embeddings and FAISS)



  - Create `python_service/vector_brain.py`
  - Import HuggingFaceEmbeddings with model `all-MiniLM-L6-v2`
  - Implement `embed_chunks(chunks: List[str]) -> np.ndarray` to generate embeddings
  - Implement `create_index(chunks: List[str]) -> faiss.Index` to create FAISS index
  - Implement `save_index(index: faiss.Index, path: str)` to persist index to disk
  - Implement `load_index(path: str) -> faiss.Index` to load index from disk
  - Implement `search(query: str, k: int) -> List[dict]` to perform similarity search
  - _Requirements: 3.2, 3.3, 4.1, 4.2_

- [x] 5.1 Write property test for embedding generation


  - **Feature: necronomicon-knowledge-system, Property 9: Query embedding uses consistent model**
  - Generate random text chunks
  - Verify all embeddings have dimension 384 (all-MiniLM-L6-v2)
  - **Validates: Requirements 4.1**

- [x] 5.2 Write property test for FAISS search result count

  - **Feature: necronomicon-knowledge-system, Property 10: Similarity search returns correct number of results**
  - Generate random queries with various k values
  - Verify search returns exactly k results (or fewer if KB is smaller)
  - **Validates: Requirements 4.2**

- [x] 5.3 Write property test for embedding round-trip

  - **Feature: necronomicon-knowledge-system, Property 7: Embedding generation and indexing round-trip**
  - Generate random code chunks, embed, index, and search
  - Verify similar chunks can be retrieved via similarity search
  - **Validates: Requirements 3.2, 3.3**

- [x] 6. Wire up ingestion endpoint with real logic


  - Update `POST /ingest` in `main.py` to call `CodeNecromancer.clone_repo()`
  - Identify all Python/JS/TS files in cloned repo
  - Parse each file using `parse_file()` and collect chunks
  - Generate embeddings for all chunks using `embed_chunks()`
  - Create and save FAISS index
  - Return job status with parsed file count
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.2, 3.3_

- [x] 6.1 Write property test for file identification

  - **Feature: necronomicon-knowledge-system, Property 3: File identification finds all target language files**
  - Generate repositories with known file structures
  - Verify all .py, .js, .ts, .tsx, .jsx files are identified
  - **Validates: Requirements 1.2**

- [x] 7. Implement query endpoint with LLM integration



  - Update `POST /query` in `main.py` to accept query text
  - Generate query embedding using same model
  - Search FAISS index for top k similar chunks
  - Format chunks as context for LLM prompt
  - Call LLM via MCP (Groq or Claude) with context
  - Parse LLM response and extract citations
  - Return answer with structured citations (file_path, line_start, line_end, function_name)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7.1 Write property test for LLM citation structure

  - **Feature: necronomicon-knowledge-system, Property 11: LLM responses include structured citations**
  - Generate random queries and mock LLM responses
  - Verify all citations contain required fields: file_path, line_start, line_end, function_name
  - **Validates: Requirements 4.4**

## Phase 3: Backend API (Node.js/Express) - Ra's Domain

- [x] 8. Implement Express server with MongoDB connection


  - Create `backend/server.js` with Express app
  - Setup MongoDB connection using mongoose
  - Define MongoDB schemas: `Repository`, `ParsedChunk`, `Job`
  - Initialize Socket.io server
  - Enable CORS for frontend origin
  - _Requirements: 3.1, 10.1_

- [x] 9. Implement repository ingestion orchestration


  - Create `POST /api/ingest` endpoint
  - Validate GitHub URL format
  - Create job record in MongoDB with status "processing"
  - Forward request to Python Parser Service `/ingest`
  - Store parsed chunks in MongoDB `parsed_chunks` collection
  - Update repository record with metadata (file_count, languages)
  - Emit Socket.io progress events during processing
  - Update job status to "completed" or "failed"
  - _Requirements: 1.1, 1.4, 1.5, 3.1, 10.2_

- [x] 9.1 Write property test for repository URL validation

  - **Feature: necronomicon-knowledge-system, Property 2: Invalid repository URLs are rejected**
  - Generate random invalid URLs (malformed, private, non-existent)
  - Verify system returns error and prevents processing
  - **Validates: Requirements 1.4**

- [x] 9.2 Write property test for parsed metadata storage

  - **Feature: necronomicon-knowledge-system, Property 6: Parsed metadata is stored with required fields**
  - Generate random parsed chunks
  - Store in MongoDB and retrieve
  - Verify all required fields are present: file_path, language, chunk_type, name, code, ast_summary, line_start, line_end, timestamp
  - **Validates: Requirements 2.3, 3.1**

- [x] 10. Implement query endpoint



  - Create `POST /api/query` endpoint
  - Accept query text and repository ID
  - Forward query to Python Parser Service `/query`
  - Return LLM answer with citations to frontend
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 11. Implement IPFS pinning functionality


  - Create `POST /api/ipfs/pin` endpoint
  - Serialize knowledge base (all parsed chunks for a repo) to JSON
  - Upload JSON to web3.storage using API token
  - Receive and store CID in MongoDB repository record
  - Implement retry logic (up to 3 attempts) on failure
  - Return CID to frontend
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 11.1 Write property test for IPFS round-trip

  - **Feature: necronomicon-knowledge-system, Property 15: IPFS serialization round-trip preserves data**
  - Generate random knowledge base states
  - Serialize → upload → retrieve → deserialize
  - Verify resulting KB has equivalent content
  - **Validates: Requirements 6.1, 6.2, 6.4**

- [x] 11.2 Write property test for IPFS CID storage

  - **Feature: necronomicon-knowledge-system, Property 16: IPFS CID is stored and retrievable**
  - Generate random CIDs from successful pins
  - Verify CID is stored in MongoDB and associated with correct repository
  - **Validates: Requirements 6.3**

- [x] 11.3 Write property test for IPFS retry logic

  - **Feature: necronomicon-knowledge-system, Property 17: IPFS failures trigger retry logic**
  - Simulate IPFS pin failures
  - Verify system retries up to 3 times before returning error
  - **Validates: Requirements 6.5**

- [x] 12. Implement IPFS retrieval functionality

  - Create `GET /api/ipfs/:cid` endpoint
  - Fetch JSON from IPFS using provided CID
  - Deserialize JSON to knowledge base structure
  - Return knowledge base data to frontend
  - _Requirements: 6.4_

- [x] 13. Implement ZIP export functionality


  - Create `GET /api/export/:repoId` endpoint
  - Query MongoDB for all parsed chunks for the repository
  - Generate structured directory with chunks organized by file path
  - Create manifest.json with repository metadata and timestamp
  - Use archiver to create ZIP file
  - Return download link to frontend
  - Handle large exports (>100MB) with compression and warning
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 13.1 Write property test for ZIP export structure

  - **Feature: necronomicon-knowledge-system, Property 18: ZIP export contains required structure**
  - Generate random knowledge base states
  - Export to ZIP and verify contents
  - Verify manifest.json exists with required fields
  - **Validates: Requirements 7.1, 7.2**

- [x] 13.2 Write property test for export error handling

  - **Feature: necronomicon-knowledge-system, Property 19: Export failures return diagnostic errors**
  - Simulate export failures
  - Verify error messages include diagnostic information
  - **Validates: Requirements 7.5**

- [x] 14. Implement Socket.io real-time updates

  - Setup Socket.io event handlers for client connections
  - Emit `ingest:progress` events with percentage during ingestion
  - Emit `ingest:complete` event when ingestion finishes
  - Emit `kb:updated` event when knowledge base is updated (re-parsing)
  - Handle client disconnections and reconnections
  - _Requirements: 1.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 14.1 Write property test for real-time progress events

  - **Feature: necronomicon-knowledge-system, Property 20: Real-time progress events are emitted**
  - Monitor ingestion process
  - Verify Socket.io events are emitted with increasing percentages from 0 to 100
  - **Validates: Requirements 1.5, 10.1, 10.2, 10.4**

## Phase 4: Frontend (Next.js 14) - Nihas's Domain

- [x] 15. Setup Next.js project with spooky theme

  - Initialize Next.js 14 with TypeScript and App Router
  - Configure Tailwind CSS with custom dark theme colors (deep purples, blacks, eerie greens)
  - Install Framer Motion for animations
  - Install Socket.io client
  - Create base layout with spooky background and ambient effects
  - _Requirements: 8.1, 8.3, 8.5_

- [x] 16. Create repository input component

  - Create `components/RepoInput.tsx`
  - Implement GitHub URL input field with validation
  - Add submit button with loading state
  - Display validation errors inline
  - Call `/api/ingest` route on submit
  - _Requirements: 1.1, 1.4_

- [x] 17. Create API route for ingestion

  - Create `src/app/api/ingest/route.ts`
  - Validate GitHub URL format
  - Forward request to Backend API `POST /api/ingest`
  - Handle errors if Backend is down
  - Return job ID and status to frontend
  - _Requirements: 1.1, 1.4_

- [x] 18. Create progress indicator component

  - Create `components/ProgressIndicator.tsx`
  - Connect to Socket.io server using `useSocket()` hook
  - Listen for `ingest:progress` events
  - Display animated progress bar with percentage
  - Show completion message on `ingest:complete` event
  - Add spooky animations (pulsing runes, fog effects)
  - _Requirements: 1.5, 10.2, 10.3, 10.4_

- [x] 18.1 Write unit test for progress indicator rendering

  - Mock Socket.io events
  - Verify progress bar updates correctly
  - Verify completion message displays

- [x] 19. Create query interface component

  - Create `components/QueryInterface.tsx`
  - Implement natural language query input field
  - Add submit button with loading state
  - Disable input until ingestion is complete
  - Call `/api/query` route on submit
  - _Requirements: 4.1_

- [x] 20. Create API route for queries


  - Create `src/app/api/query/route.ts`
  - Accept query text from frontend
  - Forward to Backend API `POST /api/query`
  - Return LLM answer with citations
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 21. Create results display component


  - Create `components/ResultsDisplay.tsx`
  - Display LLM-generated answer text
  - Render citations as clickable links with file path, line numbers, function name
  - Animate appearance of results with fade-in effects
  - Add spooky styling (glowing text, shadow effects)
  - _Requirements: 4.4, 4.5, 8.4_

- [x] 21.1 Write property test for citation link rendering

  - **Feature: necronomicon-knowledge-system, Property 12: Citation links are rendered as clickable**
  - Generate random citations
  - Render component and verify anchor tags with href attributes
  - **Validates: Requirements 4.5**

- [x] 22. Create void map visualization component

  - Create `components/VoidMap.tsx`
  - Fetch repository structure and dependencies from Backend
  - Render dependency graph using D3.js or similar
  - Add fog effects and parallax animations
  - Make nodes clickable to view code details
  - _Requirements: 8.2_

- [x] 23. Create rune tracer animation component

  - Create `components/RuneTracer.tsx`
  - Animate runes that trace function call paths
  - Use Framer Motion for smooth animations
  - Display on page load and during query processing
  - _Requirements: 8.1_

- [x] 24. Implement Socket.io reconnection logic

  - Create `hooks/useSocket.ts`
  - Establish Socket.io connection on component mount
  - Implement auto-reconnect on connection loss (within 5 seconds)
  - Display connection status to user
  - _Requirements: 10.5_

- [x] 24.1 Write property test for Socket reconnection

  - **Feature: necronomicon-knowledge-system, Property 21: Socket reconnection on connection loss**
  - Simulate connection loss
  - Verify client attempts reconnection within 5 seconds
  - **Validates: Requirements 10.5**

- [x] 25. Add IPFS pinning UI

  - Create button to trigger IPFS pinning
  - Call Backend API `POST /api/ipfs/pin`
  - Display returned CID to user with copy button
  - Show loading state during pinning
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 26. Add ZIP export UI

  - Create button to trigger ZIP export
  - Call Backend API `GET /api/export/:repoId`
  - Provide download link when export is ready
  - Show file size warning if >100MB
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

## Phase 5: Kiro Automation and Hooks - Ra's Domain

- [x] 27. Implement auto-regeneration hook

  - Create Kiro hook that triggers on file save events for .py, .js, .ts files
  - Hook should call Backend API endpoint for incremental re-parsing
  - Backend should identify modified file and call Parser Service
  - Parser Service should re-parse file and update embeddings
  - Emit Socket.io `kb:updated` event to notify frontend
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 27.1 Write property test for KB update after re-parsing

  - **Feature: necronomicon-knowledge-system, Property 14: Auto-regeneration updates embeddings**
  - Simulate file modification and re-parsing
  - Verify knowledge base contains updated embeddings reflecting new content
  - **Validates: Requirements 5.2**

- [x] 27.2 Write property test for Socket events on KB update

  - **Feature: necronomicon-knowledge-system, Property 13: Knowledge base updates trigger Socket events**
  - Trigger KB update (new ingestion or re-parsing)
  - Verify Socket.io event is emitted to all connected clients
  - **Validates: Requirements 5.3, 10.2**

- [x] 28. Implement re-ingestion endpoint for hooks

  - Create `POST /api/reingest` endpoint in Backend
  - Accept file path or trigger full re-ingestion if >10 files modified
  - Call Parser Service for incremental or full parsing
  - Update MongoDB with new data
  - Emit Socket.io events
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 29. Test hook automation end-to-end

  - Modify a code file in a tracked repository
  - Verify hook triggers re-parsing
  - Verify knowledge base is updated
  - Verify frontend receives Socket.io notification
  - Query updated code and verify new content is returned
  - _Requirements: 5.1, 5.2, 5.3, 9.3_

## Phase 6: Integration and Testing

- [x] 30. Checkpoint - Ensure all tests pass


  - Run all unit tests: `npm test` and `pytest`
  - Run all property-based tests
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise

- [x] 31. End-to-end integration testing

  - Test full ingestion flow: Submit GitHub URL → Parse → Store → Query
  - Test query flow: Submit query → Search → LLM → Citations
  - Test IPFS flow: Pin → Retrieve by CID
  - Test ZIP export flow: Export → Download
  - Test hook flow: File save → Re-parse → Socket update
  - _Requirements: All_

- [x] 31.1 Write integration tests for critical flows

  - Ingestion flow test
  - Query flow test
  - IPFS round-trip test
  - Hook trigger test

- [x] 32. Implement repository re-ingestion consistency

  - Test ingesting same repository twice
  - Verify no duplicate chunks in MongoDB
  - Verify obsolete data is removed
  - _Requirements: 3.4_

- [x] 32.1 Write property test for re-ingestion consistency

  - **Feature: necronomicon-knowledge-system, Property 8: Repository re-ingestion maintains consistency**
  - Ingest same repository twice
  - Verify no duplicates and obsolete data is removed
  - **Validates: Requirements 3.4**

## Phase 7: Deployment - Ra's Domain

- [x] 33. Deploy Frontend to Vercel

  - Connect GitHub repository to Vercel
  - Configure environment variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`
  - Deploy and verify public URL works
  - Test HTTPS and automatic deployments on push
  - _Requirements: 11.1_

- [x] 34. Deploy Backend to Railway

  - Connect GitHub repository to Railway
  - Configure environment variables: `MONGODB_URI`, `PARSER_SERVICE_URL`, `WEB3_STORAGE_TOKEN`, `PORT`
  - Deploy and verify public URL works
  - Test MongoDB connection and Socket.io
  - _Requirements: 11.2_

- [x] 35. Deploy Parser Service to AWS Lambda

  - Package Python service with dependencies
  - Create Lambda function with Python 3.11 runtime
  - Configure API Gateway for HTTP endpoints
  - Set memory to 2048 MB and timeout to 300 seconds
  - Configure environment variables: `HUGGINGFACE_MODEL`, `TMP_DIR`
  - Test endpoints via API Gateway URL
  - _Requirements: 11.3_

- [x] 36. Setup MongoDB Atlas

  - Create MongoDB Atlas cluster (M10 tier)
  - Configure network access and database user
  - Create indexes: `repositories.url`, `parsed_chunks.repo_id`, `parsed_chunks.file_path`
  - Enable automated backups
  - Update Backend environment variable with connection string
  - _Requirements: 3.1_

- [x] 37. End-to-end deployment testing

  - Test full flow on deployed services
  - Verify all services communicate correctly
  - Test with multiple concurrent users
  - Monitor performance and error logs
  - _Requirements: 11.4, 11.5_

## Phase 8: Documentation and Demo - Shazeen's Domain

- [x] 38. Write comprehensive README


  - Add project overview and hackathon context
  - Include architecture diagram (use Mermaid or image)
  - Write setup instructions for local development
  - Document environment variables for all services
  - Add usage examples (ingest, query, IPFS, export)
  - Include troubleshooting section
  - Add team member credits (Ra, Nihas, Shazeen)
  - _Requirements: 12.1_

- [x] 39. Create Kiro write-up document

  - Document usage of Kiro vibe coding
  - Explain spec-driven development process
  - Detail agent hooks implementation and benefits
  - Describe steering documents and their impact
  - Explain MCP configuration for LLM integration
  - Include screenshots of .kiro directory structure
  - _Requirements: 12.5_

- [x] 40. Verify hackathon requirements


  - Ensure repository is public
  - Verify MIT license is in About section
  - Verify .kiro directory is visible (not in .gitignore)
  - Check README has all required sections
  - Verify all services are deployed and accessible
  - _Requirements: 12.3, 12.4, 9.5_

- [x] 41. Record demo video
  - Script demo flow: Intro → Ingest repo → Query → Show citations → Trigger hook → IPFS pin
  - Record screen capture with narration
  - Keep video under 3 minutes
  - Edit and add spooky background music
  - Upload to YouTube or Vimeo
  - Add video link to README
  - _Requirements: 12.2_

- [x] 42. Prepare Devpost submission
  - Write project description (214 char Discord tagline)
  - Upload demo video
  - Add GitHub repository link
  - Select categories: Frankenstein (required), Costume (optional)
  - List technologies used
  - Add team member information
  - Submit before December 5 deadline
  - _Requirements: 12.1, 12.2_

## Phase 9: Final Polish

- [x] 43. Final checkpoint - Ensure all tests pass
  - Run complete test suite
  - Fix any remaining issues
  - Verify all property-based tests pass with 100+ iterations
  - Ensure all tests pass, ask the user if questions arise

- [x] 44. Performance optimization
  - Profile slow endpoints and optimize
  - Verify query latency <2 seconds for 95% of requests
  - Test with large repositories (1000+ files)
  - Optimize FAISS index parameters if needed
  - _Requirements: 3.5_

- [x] 45. UI polish and animations
  - Fine-tune spooky animations and effects
  - Ensure animations don't impact performance
  - Test responsive design on mobile
  - Add loading states for all async operations
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 46. Security and error handling review
  - Review input validation for all endpoints
  - Test error handling for edge cases
  - Verify rate limiting is in place
  - Check for any exposed secrets or API keys
  - _Requirements: 1.4, 2.4, 5.5, 6.5, 7.5_

- [x] 47. Final deployment verification
  - Test complete flow on production URLs
  - Verify all environment variables are set correctly
  - Test with 10+ concurrent users
  - Monitor logs for errors
  - Prepare for demo day
  - _Requirements: 11.4, 11.5_
