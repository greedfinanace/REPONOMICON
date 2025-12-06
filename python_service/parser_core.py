import os
import shutil
import git
import tree_sitter_languages


class CodeNecromancer:
    def __init__(self):
        # tree-sitter-languages handles parser creation internally
        self.supported_languages = ["python", "javascript", "typescript"]

    def get_parser(self, language: str):
        """Get a parser for the specified language."""
        return tree_sitter_languages.get_parser(language)

    def clone_repo(self, url: str):
        import uuid
        repo_name = url.split("/")[-1].replace(".git", "")
        unique_id = str(uuid.uuid4())[:8]
        
        # Windows compatibility with unique folder to avoid locks
        if os.name == 'nt':
            base = os.environ.get('TEMP', 'C:\\temp')
            path = os.path.join(base, 'reponomicon', f"{repo_name}_{unique_id}")
        else:
            path = f"/tmp/reponomicon/{repo_name}_{unique_id}"
        
        # Clean previous summonings (best effort)
        if os.path.exists(path):
            try:
                shutil.rmtree(path)
            except Exception:
                pass  # Windows file locks, ignore
        
        print(f"💀 Cloning {url} into {path}...")
        git.Repo.clone_from(url, path)
        return path

    def parse_repo(self, repo_path: str):
        documents = []
        for root, _, files in os.walk(repo_path):
            for file in files:
                if file.endswith((".py", ".js", ".ts", ".tsx")):
                    full_path = os.path.join(root, file)
                    try:
                        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                            code = f.read()
                        
                        # Basic extraction for RAG
                        documents.append({
                            "file": file,
                            "path": full_path,
                            "content": code,
                            "language": file.split(".")[-1]
                        })
                    except Exception as e:
                        print(f"⚠️ Skipping {file}: {e}")
                        continue
        return documents
