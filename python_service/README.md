# Parser Service - Python FastAPI

AST parsing and embedding generation service for the Necronomicon Knowledge System.

## Features

- Multi-language AST parsing (Python, JavaScript, TypeScript) using tree-sitter
- Code embedding generation with sentence-transformers
- FAISS vector indexing for semantic search
- Repository cloning and analysis
- FastAPI REST endpoints

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Service

```bash
python main.py
```

The service will start on `http://localhost:8000`

### 3. Verify Installation

```bash
# Check health endpoint
curl http://localhost:8000/

# Should return: {"status": "Grimoire Active"}
```

## API Endpoints

### GET /
Health check endpoint
```bash
curl http://localhost:8000/
```

### POST /ingest
Ingest a GitHub repository
```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/user/repo", "branch": "main"}'
```

### POST /query
Query the knowledge base
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How does authentication work?", "k": 5}'
```

## Testing

### Run Unit Tests
```bash
python test_parser.py
python test_vector_brain.py
python test_clone.py
```

### Run Property-Based Tests
```bash
pytest tests/test_ast_parsing_properties.py
pytest tests/test_error_handling_properties.py
```

### Run All Tests
```bash
pytest
```

## Dependencies

- **FastAPI 0.109.0** - Web framework
- **Uvicorn 0.27.0** - ASGI server
- **tree-sitter 0.20.4** - AST parsing
- **tree-sitter-languages 1.10.2** - Language grammars
- **sentence-transformers 2.3.1** - Embeddings (all-MiniLM-L6-v2)
- **faiss-cpu 1.7.4** - Vector similarity search
- **GitPython 3.1.41** - Repository cloning
- **langchain 0.1.5** - LLM integration framework
- **hypothesis 6.92.0** - Property-based testing
- **pytest 7.4.3** - Testing framework

## Architecture

```
main.py              - FastAPI server with endpoints
parser_core.py       - CodeNecromancer AST parser
vector_brain.py      - VectorBrain embeddings & FAISS
tests/               - Property-based tests
test_*.py            - Unit tests
```

## Troubleshooting

### Import Errors
If you get import errors, ensure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Tree-sitter Issues
Tree-sitter languages are automatically loaded. If you encounter issues:
```bash
pip install --upgrade tree-sitter tree-sitter-languages
```

### Memory Issues
For large repositories, increase available memory or process files in batches.

## Development

### Adding New Language Support
1. Add language to `tree-sitter-languages` import in `parser_core.py`
2. Update `language_map` in `parse_file()` method
3. Add extraction logic for language-specific constructs

### Modifying Embedding Model
Change the model in `vector_brain.py`:
```python
VectorBrain(model_name="your-model-name")
```

## License

MIT License - See LICENSE file for details
