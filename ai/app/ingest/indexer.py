"""Writes chunks to a new versioned index, then moves the alias to it in one step, so searches never
see a half-built index. The previous index is kept for rollback; older ones are deleted."""
from datetime import datetime, timezone

from elasticsearch import Elasticsearch, NotFoundError
from elasticsearch.helpers import bulk


def index_settings(dims: int) -> dict:
    return {
        "settings": {
            "number_of_shards": 1,
            # Single node: replicas could never be assigned and the index would stay yellow.
            "number_of_replicas": 0,
            "analysis": {
                "analyzer": {
                    # ICU folding drops accents and case, so "đơn hàng" also matches "don hang".
                    "vi_folded": {"type": "custom", "tokenizer": "icu_tokenizer", "filter": ["icu_folding"]},
                }
            },
        },
        "mappings": {
            "dynamic": "strict",
            "properties": {
                "doc_id": {"type": "keyword"},
                "title": {"type": "text", "analyzer": "vi_folded", "fields": {"raw": {"type": "keyword"}}},
                "section": {"type": "keyword"},
                "heading": {"type": "text", "analyzer": "vi_folded"},
                "heading_path": {"type": "text", "analyzer": "vi_folded"},
                "text": {"type": "text", "analyzer": "vi_folded"},
                "audience": {"type": "keyword"},
                "rules": {"type": "keyword"},
                "lang": {"type": "keyword"},
                "version": {"type": "keyword"},
                "effective_date": {"type": "date"},
                "source_path": {"type": "keyword"},
                "position": {"type": "integer"},
                "content_hash": {"type": "keyword"},
                "embedding_model": {"type": "keyword"},
                "indexed_at": {"type": "date"},
                "embedding": {"type": "dense_vector", "dims": dims, "index": True, "similarity": "cosine"},
            },
        },
    }


def new_index_name(alias: str, model_slug: str) -> str:
    return f"{alias}_{model_slug}_{datetime.now(timezone.utc):%Y%m%d%H%M%S}"


def existing_vectors(es: Elasticsearch, alias: str, ids: list[str]) -> dict[str, tuple[str, list[float]]]:
    """content_hash and vector of chunks already in the live index, to skip re-embedding them."""
    if not ids or not es.indices.exists_alias(name=alias):
        return {}
    found = es.mget(index=alias, ids=ids, source=["content_hash", "embedding"])
    return {
        doc["_id"]: (doc["_source"]["content_hash"], doc["_source"]["embedding"])
        for doc in found["docs"]
        if doc.get("found")
    }


def write_index(es: Elasticsearch, alias: str, index: str, dims: int, documents: list[dict]) -> None:
    es.indices.create(index=index, **index_settings(dims))
    try:
        actions = ({"_index": index, "_id": doc.pop("_id"), "_source": doc} for doc in documents)
        bulk(es, actions, refresh="wait_for")
    except Exception:
        es.indices.delete(index=index, ignore_unavailable=True)
        raise


def switch_alias(es: Elasticsearch, alias: str, index: str) -> list[str]:
    """Points the alias at `index` atomically; returns the indices that were deleted."""
    try:
        current = list(es.indices.get_alias(name=alias).keys())
    except NotFoundError:
        current = []
    actions = [{"remove": {"index": old, "alias": alias}} for old in current]
    actions.append({"add": {"index": index, "alias": alias}})
    es.indices.update_aliases(actions=actions)

    # Keep the newest previous index for rollback, delete the rest.
    versions = sorted(name for name in es.indices.get(index=f"{alias}_*").keys() if name != index)
    stale = versions[:-1]
    for name in stale:
        es.indices.delete(index=name, ignore_unavailable=True)
    return stale
