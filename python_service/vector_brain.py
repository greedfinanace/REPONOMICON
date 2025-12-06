from sentence_transformers import SentenceTransformer
import numpy as np
import pickle
import os
from typing import Dict, List, Optional
from pathlib import Path


class VectorBrain:
    STORAGE_DIR = Path("./brain_storage")
    MAX_CHUNK_SIZE = 1500  # Characters per chunk (LLM friendly)
    CHUNK_OVERLAP = 200   # Overlap between chunks for context

    def __init__(self):
        print("🧠 Loading Neural Pathways (SentenceTransformers)...")
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.repos: Dict[str, dict] = {}
        self.STORAGE_DIR.mkdir(exist_ok=True)
        self._load_all_repos()

    def _repo_key(self, repo_url: str) -> str:
        """Convert repo URL to safe filename."""
        return repo_url.replace("https://", "").replace("/", "_").replace(".", "_")

    def _chunk_code(self, content: str, file_path: str, language: str) -> List[dict]:
        """Split large files into LLM-friendly chunks with overlap."""
        if len(content) <= self.MAX_CHUNK_SIZE:
            return [{
                "content": content,
                "path": file_path,
                "language": language,
                "chunk_index": 0,
                "total_chunks": 1
            }]
        
        chunks = []
        start = 0
        chunk_index = 0
        
        while start < len(content):
            end = start + self.MAX_CHUNK_SIZE
            
            # Try to break at a newline for cleaner chunks
            if end < len(content):
                newline_pos = content.rfind('\n', start + self.MAX_CHUNK_SIZE - 200, end)
                if newline_pos > start:
                    end = newline_pos + 1
            
            chunk_content = content[start:end]
            chunks.append({
                "content": chunk_content,
                "path": file_path,
                "language": language,
                "chunk_index": chunk_index,
                "total_chunks": -1  # Will update after
            })
            
            start = end - self.CHUNK_OVERLAP
            chunk_index += 1
        
        # Update total_chunks
        for chunk in chunks:
            chunk["total_chunks"] = len(chunks)
        
        return chunks

    def embed_code(self, code_docs: List[dict], repo_url: str):
        """Embed code documents with chunking for a specific repository."""
        # Chunk all documents
        all_chunks = []
        for doc in code_docs:
            chunks = self._chunk_code(
                doc["content"], 
                doc["path"], 
                doc.get("language", "unknown")
            )
            all_chunks.extend(chunks)
        
        texts = [c["content"] for c in all_chunks]
        print(f"🔮 Embedding {len(texts)} chunks from {len(code_docs)} files for {repo_url}...")
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        
        self.repos[repo_url] = {
            "documents": all_chunks,
            "embeddings": embeddings
        }
        
        # Persist to disk
        self._save_repo(repo_url)
        return True

    def _save_repo(self, repo_url: str):
        """Save repository embeddings to disk."""
        key = self._repo_key(repo_url)
        filepath = self.STORAGE_DIR / f"{key}.pkl"
        
        data = {
            "repo_url": repo_url,
            "documents": self.repos[repo_url]["documents"],
            "embeddings": self.repos[repo_url]["embeddings"]
        }
        
        with open(filepath, "wb") as f:
            pickle.dump(data, f)
        print(f"💾 Saved {repo_url} to {filepath}")

    def _load_repo(self, filepath: Path) -> Optional[str]:
        """Load a repository from disk. Returns repo_url if successful."""
        try:
            with open(filepath, "rb") as f:
                data = pickle.load(f)
            
            repo_url = data["repo_url"]
            self.repos[repo_url] = {
                "documents": data["documents"],
                "embeddings": data["embeddings"]
            }
            print(f"📂 Loaded {repo_url} from disk")
            return repo_url
        except Exception as e:
            print(f"⚠️ Failed to load {filepath}: {e}")
            return None

    def _load_all_repos(self):
        """Load all persisted repositories on startup."""
        if not self.STORAGE_DIR.exists():
            return
        
        for filepath in self.STORAGE_DIR.glob("*.pkl"):
            self._load_repo(filepath)
        
        if self.repos:
            print(f"🧠 Restored {len(self.repos)} repositories from disk")

    def delete_repo(self, repo_url: str) -> bool:
        """Delete a repository from memory and disk."""
        if repo_url in self.repos:
            del self.repos[repo_url]
        
        key = self._repo_key(repo_url)
        filepath = self.STORAGE_DIR / f"{key}.pkl"
        if filepath.exists():
            filepath.unlink()
            print(f"🗑️ Deleted {repo_url}")
            return True
        return False

    def search(self, query: str, repo_url: Optional[str] = None, k: int = 4):
        """Search for similar code. If repo_url is provided, search only that repo."""
        if repo_url:
            if repo_url not in self.repos:
                return [{"content": f"Repository {repo_url} not found.", "source": "", "score": 0}]
            return self._search_repo(query, repo_url, k)
        else:
            return self._search_all(query, k)

    def _search_repo(self, query: str, repo_url: str, k: int):
        """Search within a specific repository."""
        repo_data = self.repos[repo_url]
        documents = repo_data["documents"]
        embeddings = repo_data["embeddings"]
        
        if len(documents) == 0:
            return [{"content": "No documents in this repository.", "source": "", "score": 0}]
        
        query_embedding = self.model.encode([query], convert_to_numpy=True)[0]
        
        similarities = np.dot(embeddings, query_embedding) / (
            np.linalg.norm(embeddings, axis=1) * np.linalg.norm(query_embedding)
        )
        
        actual_k = min(k, len(documents))
        top_indices = np.argsort(similarities)[-actual_k:][::-1]
        
        results = []
        for idx in top_indices:
            doc = documents[idx]
            results.append({
                "content": doc["content"],
                "source": doc["path"],
                "chunk": f"{doc['chunk_index']+1}/{doc['total_chunks']}",
                "score": float(similarities[idx])
            })
        
        return results

    def _search_all(self, query: str, k: int):
        """Search across all repositories."""
        if not self.repos:
            return [{"content": "The brain is empty. Summon a repo first.", "source": "", "score": 0}]
        
        query_embedding = self.model.encode([query], convert_to_numpy=True)[0]
        
        all_results = []
        for repo_url, repo_data in self.repos.items():
            documents = repo_data["documents"]
            embeddings = repo_data["embeddings"]
            
            similarities = np.dot(embeddings, query_embedding) / (
                np.linalg.norm(embeddings, axis=1) * np.linalg.norm(query_embedding)
            )
            
            for idx, sim in enumerate(similarities):
                doc = documents[idx]
                all_results.append({
                    "content": doc["content"],
                    "source": doc["path"],
                    "chunk": f"{doc['chunk_index']+1}/{doc['total_chunks']}",
                    "score": float(sim),
                    "repo": repo_url
                })
        
        all_results.sort(key=lambda x: x["score"], reverse=True)
        return all_results[:k]

    def list_repos(self):
        """List all ingested repositories."""
        return list(self.repos.keys())

    def get_stats(self):
        """Get statistics about the brain."""
        stats = {
            "total_repos": len(self.repos),
            "repos": {}
        }
        for repo_url, data in self.repos.items():
            stats["repos"][repo_url] = {
                "chunks": len(data["documents"]),
                "embedding_dim": data["embeddings"].shape[1] if len(data["embeddings"]) > 0 else 0
            }
        return stats
