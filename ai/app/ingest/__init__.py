"""Knowledge indexing pipeline: load → chunk → embed → index.

Planned modules:
- loaders.py   read docs/*/README.md (audience = folder name) and policy tables from app-db
- chunking.py  split Markdown by heading, ~300-800 tokens, keep source/section/audience metadata
- embedding.py Gemini embeddings; skip chunks whose content hash is unchanged
- indexer.py   build a new versioned index (policy_v2…) and move the `policy` alias to it
"""
