# Requirements Document

## Introduction

Reponomicon is a GitHub repository analyzer that uses RAG (Retrieval-Augmented Generation) to provide intelligent code explanations. It clones repositories, parses code using AST analysis, creates embeddings for semantic search, and uses LLMs to answer questions about codebases in simple, beginner-friendly language.

## Glossary

- **System**: The Reponomicon application
- **User**: A developer wanting to understand a GitHub repository
- **Repository**: A GitHub code repository to be analyzed
- **RAG**: Retrieval-Augmented Generation - combining vector search with LLM generation
- **AST**: Abstract Syntax Tree - structured representation of code
- **Embedding**: Vector representation of text for semantic search

## Requirements

### Requirement 1: Repository Analysis

**User Story:** As a user, I want to enter a GitHub URL and get an intelligent analysis of the codebase.

#### Acceptance Criteria

1. WHEN a user submits a valid GitHub URL THEN the System SHALL clone and parse the repository
2. WHEN parsing completes THEN the System SHALL create embeddings for semantic search
3. WHEN the user asks a question THEN the System SHALL search for relevant code and generate an answer
4. WHEN generating answers THEN the System SHALL explain code in simple, beginner-friendly language

### Requirement 2: Compare Repositories

**User Story:** As a user, I want to compare two repositories side-by-side.

#### Acceptance Criteria

1. WHEN compare mode is enabled THEN the System SHALL accept two repository URLs
2. WHEN both repos are ingested THEN the System SHALL generate a comparison analysis
3. WHEN comparing THEN the System SHALL highlight key differences in purpose, tech stack, and complexity

### Requirement 3: Chat History

**User Story:** As a user, I want my research sessions saved so I can return to them later.

#### Acceptance Criteria

1. WHEN a session is created THEN the System SHALL save it to localStorage
2. WHEN the user returns THEN the System SHALL display previous sessions in a history panel
3. WHEN a session is selected THEN the System SHALL restore the conversation

### Requirement 4: Export & Share

**User Story:** As a user, I want to export my research and share it with others.

#### Acceptance Criteria

1. WHEN export is clicked THEN the System SHALL generate a downloadable text file
2. WHEN share is clicked THEN the System SHALL copy a shareable link to clipboard
3. WHEN downloading source THEN the System SHALL provide a link to the GitHub ZIP archive
