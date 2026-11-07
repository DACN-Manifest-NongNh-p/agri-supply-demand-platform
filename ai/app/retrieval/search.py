"""Hybrid search over the policy index: BM25 (exact words) and kNN (meaning), merged with
reciprocal rank fusion, limited to documents the user's role may see."""
from app.config import get_settings
from app.es import get_es
from app.ingest.embedding import get_embedder

# Standard RRF constant: a hit's score is the sum of 1 / (RRF_K + rank) over the lists it appears in.
RRF_K = 60
SOURCE_FIELDS = ["doc_id", "title", "section", "heading", "heading_path", "text", "audience", "source_path"]


def _role_filter(role: str | None) -> list[dict]:
    # Admins see every document; everyone else only what lists their role (or public).
    if role == "admin":
        return []
    return [{"terms": {"audience": ["public", role] if role else ["public"]}}]


def search(query: str, role: str | None = None, k: int = 5) -> list[dict]:
    es = get_es()
    index = get_settings().es_index
    filters = _role_filter(role)
    pool = max(k * 4, 20)

    bm25 = es.search(
        index=index,
        size=pool,
        source=SOURCE_FIELDS,
        query={
            "bool": {
                "must": {"multi_match": {"query": query, "fields": ["text", "heading^2", "heading_path", "title"]}},
                "filter": filters,
            }
        },
    )["hits"]["hits"]

    knn = es.search(
        index=index,
        size=pool,
        source=SOURCE_FIELDS,
        knn={
            "field": "embedding",
            "query_vector": get_embedder().embed_query(query),
            "k": pool,
            "num_candidates": pool * 5,
            "filter": filters,
        },
    )["hits"]["hits"]

    fused: dict[str, dict] = {}
    for name, hits in (("bm25", bm25), ("knn", knn)):
        for rank, hit in enumerate(hits, start=1):
            entry = fused.setdefault(hit["_id"], {"id": hit["_id"], **hit["_source"], "score": 0.0})
            entry["score"] += 1 / (RRF_K + rank)
            entry[f"{name}_rank"] = rank

    results = sorted(fused.values(), key=lambda entry: entry["score"], reverse=True)[:k]
    for entry in results:
        entry["score"] = round(entry["score"], 5)
    return results
