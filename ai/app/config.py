"""Settings from environment variables (compose.yml in Docker, ai/.env on the host)."""
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    es_url: str = "http://localhost:9200"
    # Alias the app searches; each rebuild writes a new versioned index and moves the alias.
    es_index: str = "policy"
    # Secret: set it in ai/.env (git-ignored), never here.
    gemini_api_key: str = ""
    # 2.5 models are closed to new projects; the full 3.x flash models were overloaded when tested.
    gemini_model: str = "gemini-3.5-flash-lite"
    # Repository docs folder; policies are read from its policy/ subfolder.
    docs_dir: str = "../docs"
    # Spring API, for the live operating rules (GET /api/public/site).
    site_api_url: str = "http://localhost:8082"
    # Any sentence-transformers model; changing it requires a full re-index.
    embedding_model: str = "BAAI/bge-m3"
    # Index the policies when the service starts: "always" (unchanged chunks are reused, so it is
    # quick after the first time), "missing" (only if there is no index yet) or "off".
    auto_ingest: Literal["always", "missing", "off"] = "off"


@lru_cache
def get_settings() -> Settings:
    return Settings()
