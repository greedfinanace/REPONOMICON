# Requirements Document

## Introduction

The Necronomicon of Knowledge is a decentralized, self-updating documentation generator designed for the Kiroween 2025 hackathon. The system ingests GitHub repositories, performs AST-based code analysis across multiple languages (Python, JavaScript, TypeScript), builds a RAG (Retrieval-Augmented Generation) knowledge base, provides LLM-driven Q&A with cited code snippets, automatically regenerates documentation via Kiro agent hooks, and pins documentation to IPFS for decentralized eternal storage. The system features a spooky, eldritch-themed UI with animations and real-time updates.

## Glossary

- **System**: The Necronomicon of Knowledge application
- **User**: A developer or team member interacting with the system
- **Repository**: A GitHub code repository to be analyzed
- **AST**: Abstract Syntax Tree, a tree representation of source code structure
- **RAG**: Retrieval-Augmented Generation, a technique combining vector search with LLM generation
- **Knowledge Base**: The MongoDB database storing parsed code information and embeddings
- **IPFS**: InterPlanetary File System, a decentralized storage protocol
- **CID**: Content Identifier, a unique hash for IPFS-stored content
- **Hook**: A Kiro agent automation triggered by specific events
- **Embedding**: A vector representation of text for semantic search
- **Citation**: A reference to specific code location (file, line number, function name)
- **Backend Service**: The Node.js/Express API server
- **Parser Service**: The Python FastAPI service handling AST parsing
- **Frontend**: The Next.js 14 web application
- **LLM Agent**: The language model (Groq/Claude) answering queries via MCP

## Requirements

### Requirement 1

**User Story:** As a user, I want to ingest a GitHub repository by providing its URL, so that the system can analyze and document the codebase.

#### Acceptance Criteria

1. WHEN a user submits a valid GitHub repository URL THEN the System SHALL clone the repository to temporary storage
2. WHEN the repository is cloned THEN the System SHALL identify all Python, JavaScript, and TypeScript files for processing
3. WHEN file identification completes THEN the System SHALL trigger the Parser Service to begin AST analysis
4. WHEN the repository URL is invalid or inaccessible THEN the System SHALL return an error message and prevent further processing
5. WHEN ingestion begins THEN the System SHALL emit real-time progress updates via Socket.io to the Frontend

### Requirement 2

**User Story:** As a user, I want the system to parse code using AST analysis, so that I can query structured information about functions, classes, and dependencies.

#### Acceptance Criteria

1. WHEN the Parser Service receives Python files THEN the System SHALL use tree-sitter to extract function definitions, class definitions, docstrings, parameters, return types, and line locations
2. WHEN the Parser Service receives JavaScript or TypeScript files THEN the System SHALL use tree-sitter to extract function declarations, class declarations, JSDoc comments, imports, exports, and line locations
3. WHEN AST parsing completes for a file THEN the System SHALL store extracted metadata in the Knowledge Base with file path, language, and timestamp
4. WHEN parsing encounters a syntax error THEN the System SHALL log the error and continue processing remaining files
5. WHEN the repository contains more than 10,000 files THEN the System SHALL use incremental parsing to process files in batches

### Requirement 3

**User Story:** As a user, I want parsed code to be stored in a searchable knowledge base, so that I can query information across the entire codebase.

#### Acceptance Criteria

1. WHEN AST metadata is extracted THEN the System SHALL store function signatures, docstrings, and locations in MongoDB collections
2. WHEN code chunks are stored THEN the System SHALL generate embeddings using FAISS and associate them with the source metadata
3. WHEN storing embeddings THEN the System SHALL index them for efficient similarity search
4. WHEN a repository is re-ingested THEN the System SHALL update existing entries and remove obsolete data
5. WHEN the Knowledge Base exceeds 100,000 entries THEN the System SHALL maintain query performance under 2 seconds for 95% of requests

### Requirement 4

**User Story:** As a user, I want to ask natural language questions about the codebase, so that I can understand functionality without reading all the code.

#### Acceptance Criteria

1. WHEN a user submits a natural language query THEN the System SHALL generate an embedding for the query using the same model as the Knowledge Base
2. WHEN the query embedding is generated THEN the System SHALL perform similarity search in FAISS to retrieve the top 5 most relevant code chunks
3. WHEN relevant chunks are retrieved THEN the LLM Agent SHALL generate a natural language answer incorporating the code context
4. WHEN the LLM Agent generates an answer THEN the System SHALL include citations with file paths, line numbers, and function names
5. WHEN citations are provided THEN the Frontend SHALL render them as clickable links to the specific code locations

### Requirement 5

**User Story:** As a user, I want documentation to automatically regenerate when code changes, so that the knowledge base stays synchronized with the repository.

#### Acceptance Criteria

1. WHEN a Kiro agent hook detects a code file save event THEN the System SHALL trigger re-parsing of the modified file
2. WHEN re-parsing completes THEN the System SHALL update the Knowledge Base with new metadata and embeddings
3. WHEN the Knowledge Base is updated THEN the System SHALL emit a Socket.io event to notify connected Frontend clients
4. WHEN a user commits changes to the repository THEN the Hook SHALL trigger a full re-ingestion if more than 10 files are modified
5. WHEN auto-regeneration fails THEN the System SHALL log the error and notify the user via the Frontend

### Requirement 6

**User Story:** As a user, I want to pin documentation to IPFS, so that it is permanently accessible in a decentralized manner.

#### Acceptance Criteria

1. WHEN a user requests IPFS pinning THEN the System SHALL serialize the Knowledge Base into a JSON structure
2. WHEN the JSON structure is created THEN the System SHALL upload it to web3.storage and receive a CID
3. WHEN the CID is received THEN the System SHALL store the CID in MongoDB and display it to the user
4. WHEN a user provides a CID THEN the System SHALL retrieve and deserialize the Knowledge Base from IPFS
5. WHEN IPFS pinning fails THEN the System SHALL retry up to 3 times before returning an error

### Requirement 7

**User Story:** As a user, I want to export the knowledge base as a ZIP file, so that I can archive or share documentation offline.

#### Acceptance Criteria

1. WHEN a user requests a ZIP export THEN the System SHALL generate a structured directory containing all parsed metadata
2. WHEN generating the export THEN the System SHALL include a manifest file with repository information and timestamp
3. WHEN the ZIP file is created THEN the System SHALL provide a download link to the user
4. WHEN the export exceeds 100MB THEN the System SHALL compress the data and warn the user about file size
5. WHEN export generation fails THEN the System SHALL return an error message with diagnostic information

### Requirement 8

**User Story:** As a user, I want a spooky, eldritch-themed UI with animations, so that the application is visually engaging and fits the hackathon theme.

#### Acceptance Criteria

1. WHEN the Frontend loads THEN the System SHALL display animated runes that trace function call paths
2. WHEN displaying repository structure THEN the System SHALL render a "void map" visualization showing dependencies with fog effects
3. WHEN the user scrolls THEN the System SHALL apply parallax animations to background elements
4. WHEN query results are displayed THEN the System SHALL animate the appearance of code citations with fade-in effects
5. WHEN the application is idle THEN the System SHALL display subtle ambient animations without impacting performance

### Requirement 9

**User Story:** As a developer, I want the system to integrate with Kiro IDE features, so that I can demonstrate expert Kiro mastery for the hackathon judges.

#### Acceptance Criteria

1. WHEN the project is initialized THEN the System SHALL include visible .kiro directory with steering documents, hooks, and MCP configuration
2. WHEN code is generated THEN the System SHALL follow steering rules defined in .kiro/steering/ markdown files
3. WHEN file save events occur THEN the Kiro Hooks SHALL trigger appropriate automation workflows
4. WHEN LLM queries are made THEN the System SHALL use Claude or Groq via MCP (Model Context Protocol) configuration
5. WHEN the repository is public THEN the .kiro directory SHALL be visible and not excluded by .gitignore

### Requirement 10

**User Story:** As a user, I want real-time updates during repository processing, so that I can monitor progress and know when the system is ready.

#### Acceptance Criteria

1. WHEN repository ingestion begins THEN the System SHALL establish a Socket.io connection with the Frontend
2. WHEN processing milestones are reached THEN the Backend Service SHALL emit progress events with percentage completion
3. WHEN the Frontend receives progress events THEN the System SHALL update a visual progress indicator
4. WHEN processing completes THEN the System SHALL emit a completion event and enable query functionality
5. WHEN the Socket.io connection is lost THEN the System SHALL attempt to reconnect automatically

### Requirement 11

**User Story:** As a system administrator, I want the application to be deployed on scalable infrastructure, so that it can handle multiple concurrent users during the hackathon demo.

#### Acceptance Criteria

1. WHEN the Frontend is deployed THEN the System SHALL host it on Vercel with automatic HTTPS
2. WHEN the Backend Service is deployed THEN the System SHALL host it on Railway with environment variable configuration
3. WHEN the Parser Service is deployed THEN the System SHALL host it on AWS Lambda with API Gateway integration
4. WHEN deployment completes THEN the System SHALL provide public URLs for all services
5. WHEN services scale THEN the System SHALL maintain functionality under load from at least 50 concurrent users

### Requirement 12

**User Story:** As a hackathon judge, I want to see a comprehensive README and demo video, so that I can evaluate the project's completeness and innovation.

#### Acceptance Criteria

1. WHEN the repository is viewed THEN the System SHALL include a README with architecture diagrams, setup instructions, and feature descriptions
2. WHEN the demo video is created THEN the System SHALL demonstrate ingestion, querying, hook automation, and IPFS pinning in under 3 minutes
3. WHEN the repository is inspected THEN the System SHALL have an MIT license visible in the About section
4. WHEN the .kiro directory is examined THEN the System SHALL contain steering documents, hooks, and MCP configuration
5. WHEN the write-up is reviewed THEN the System SHALL detail usage of Kiro vibe coding, specs, agent hooks, steering, and MCP
