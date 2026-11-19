"""Shared Elasticsearch client."""
from functools import lru_cache

from elasticsearch import Elasticsearch

from app.config import get_settings


@lru_cache
def get_es() -> Elasticsearch:
    return Elasticsearch(get_settings().es_url, request_timeout=10)
