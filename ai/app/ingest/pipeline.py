"""load → fill rules → chunk → embed → index, then move the alias."""
import hashlib
import logging
import time
from datetime import datetime, timezone
from pathlib import Path

from app.config import get_settings
from app.es import get_es
from app.ingest.chunking import chunk_document
from app.ingest.embedding import get_embedder
from app.ingest.indexer import existing_vectors, new_index_name, switch_alias, write_index
from app.ingest.loaders import fetch_rules, fill_rules, load_policies

log = logging.getLogger(__name__)


def content_hash(model: str, text: str) -> str:
    return hashlib.sha256(f"{model}\n{text}".encode()).hexdigest()


def run_ingest() -> dict:
    started = time.perf_counter()
    settings = get_settings()
    es = get_es()
    embedder = get_embedder()

    docs = load_policies(Path(settings.docs_dir) / "policy")
    rules, rules_source = fetch_rules(settings.site_api_url)

    chunks = []
    for doc in docs:
        body = fill_rules(doc.body, rules, doc.path)
        chunks.extend((doc, chunk) for chunk in chunk_document(doc, body))

    # Unchanged chunks keep their vector; only new or edited text is embedded.
    hashes = {chunk.id: content_hash(embedder.model_name, chunk.embed_text) for _, chunk in chunks}
    previous = existing_vectors(es, settings.es_index, list(hashes))
    to_embed = [chunk for _, chunk in chunks if previous.get(chunk.id, ("", None))[0] != hashes[chunk.id]]
    fresh = dict(zip((chunk.id for chunk in to_embed), embedder.embed([chunk.embed_text for chunk in to_embed])))

    now = datetime.now(timezone.utc).isoformat()
    documents = [
        {
            "_id": chunk.id,
            "doc_id": doc.id,
            "title": chunk.title,
            "section": chunk.section,
            "heading": chunk.heading,
            "heading_path": chunk.heading_path,
            "text": chunk.text,
            "audience": doc.audience,
            "rules": doc.rules,
            "lang": doc.lang,
            "version": doc.version,
            "effective_date": doc.effective_date,
            "source_path": doc.path,
            "position": chunk.position,
            "content_hash": hashes[chunk.id],
            "embedding_model": embedder.model_name,
            "indexed_at": now,
            "embedding": fresh.get(chunk.id) or previous[chunk.id][1],
        }
        for doc, chunk in chunks
    ]

    index = new_index_name(settings.es_index, embedder.slug)
    write_index(es, settings.es_index, index, embedder.dims, documents)
    deleted = switch_alias(es, settings.es_index, index)

    stats = {
        "index": index,
        "alias": settings.es_index,
        "documents": len(docs),
        "chunks": len(documents),
        "embedded": len(to_embed),
        "reused": len(documents) - len(to_embed),
        "rules_source": rules_source,
        "deleted_indices": deleted,
        "seconds": round(time.perf_counter() - started, 1),
    }
    log.info("Ingest done: %s", stats)
    return stats
