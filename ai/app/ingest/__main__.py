"""Rebuild the index from the command line: `python -m app.ingest`."""
import json
import logging

from app.ingest.pipeline import run_ingest

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
print(json.dumps(run_ingest(), indent=2, ensure_ascii=False))
