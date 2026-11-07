"""Local embedding model (BAAI/bge-m3 by default), loaded once and kept for queries too.

Index and queries must use the same model: vectors from different models live in different spaces.
The index name carries the model (policy_bgem3_…), so switching models means a full rebuild.
"""
import logging
import re
import threading
from functools import lru_cache

from app.config import get_settings

log = logging.getLogger(__name__)


class Embedder:
    def __init__(self, model_name: str):
        self.model_name = model_name
        self._model = None
        self._lock = threading.Lock()

    @property
    def model(self):
        # Loaded on first use: ~2 GB download the first time, a few seconds from cache after that.
        with self._lock:
            if self._model is None:
                from sentence_transformers import SentenceTransformer

                log.info("Loading embedding model %s", self.model_name)
                self._model = SentenceTransformer(self.model_name, device="cpu")
        return self._model

    @property
    def dims(self) -> int:
        return self.model.get_sentence_embedding_dimension()

    @property
    def slug(self) -> str:
        """BAAI/bge-m3 → bgem3, for index names."""
        return re.sub(r"[^a-z0-9]", "", self.model_name.split("/")[-1].lower())

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        # Normalized, so cosine similarity and dot product agree.
        vectors = self.model.encode(texts, batch_size=16, normalize_embeddings=True, show_progress_bar=False)
        return vectors.tolist()

    def embed_query(self, text: str) -> list[float]:
        # bge-m3 needs no query/passage prefix (unlike the e5 models).
        return self.embed([text])[0]


@lru_cache
def get_embedder() -> Embedder:
    return Embedder(get_settings().embedding_model)
