"""Reads the policy Markdown files and fills in the live operating rules."""
import logging
import re
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from pathlib import Path

import httpx
import yaml

log = logging.getLogger(__name__)

REQUIRED = ("id", "title", "audience")
RULE_PATTERN = re.compile(r"\{\{rule:(\w+)\}\}")

# Same defaults as PlatformRule in the Spring API; used when the API cannot be reached.
DEFAULT_RULES: dict[str, Decimal] = {
    "autoMatchMinScore": Decimal(75),
    "lockMinutes": Decimal(15),
    "depositPercent": Decimal(50),
    "signOffKg": Decimal(3000),
    "holdHours": Decimal(24),
    "holdWarningHours": Decimal(6),
    "dueSoonDays": Decimal(3),
    "sellSoonDays": Decimal(3),
    "coldChainMin": Decimal(2),
    "coldChainMax": Decimal(8),
}


@dataclass
class PolicyDoc:
    id: str
    title: str
    audience: list[str]
    body: str
    path: str
    lang: str = "vi"
    version: str = ""
    effective_date: str | None = None
    rules: list[str] = field(default_factory=list)


def fetch_rules(site_api_url: str) -> tuple[dict[str, Decimal], str]:
    """Current rule values from the API (admin overrides included), else the defaults."""
    try:
        response = httpx.get(f"{site_api_url.rstrip('/')}/api/public/site", timeout=5)
        response.raise_for_status()
        live = {item["key"]: Decimal(str(item["value"])) for item in response.json()["rules"]}
        return {**DEFAULT_RULES, **live}, "api"
    except (httpx.HTTPError, KeyError, ValueError) as error:
        log.warning("Rules API unavailable (%s); using defaults", error)
        return dict(DEFAULT_RULES), "defaults"


def format_number(value: Decimal) -> str:
    """15.00 → "15", 2.5 → "2,5" (Vietnamese decimal comma)."""
    if value == value.to_integral_value():
        return str(int(value))
    return format(value.normalize(), "f").replace(".", ",")


def fill_rules(text: str, rules: dict[str, Decimal], source: str) -> str:
    def replace(match: re.Match) -> str:
        key = match.group(1)
        if key not in rules:
            raise ValueError(f"{source}: unknown rule {{{{rule:{key}}}}}")
        return format_number(rules[key])

    return RULE_PATTERN.sub(replace, text)


def parse(path: Path) -> PolicyDoc:
    text = path.read_text(encoding="utf-8")
    match = re.match(r"---\n(.*?)\n---\n", text, re.S)
    if not match:
        raise ValueError(f"{path.name}: missing front matter")
    meta = yaml.safe_load(match.group(1)) or {}
    missing = [key for key in REQUIRED if not meta.get(key)]
    if missing:
        raise ValueError(f"{path.name}: front matter lacks {', '.join(missing)}")

    body = text[match.end():]
    used = set(RULE_PATTERN.findall(body))
    declared = set(meta.get("rules") or [])
    if used - declared:
        # The list drives re-indexing when an admin changes a rule, so it must be complete.
        raise ValueError(f"{path.name}: rules used but not declared: {', '.join(sorted(used - declared))}")

    effective = meta.get("effective_date")
    return PolicyDoc(
        id=str(meta["id"]),
        title=str(meta["title"]),
        audience=[str(role) for role in meta["audience"]],
        body=body,
        path=path.name,
        lang=str(meta.get("lang", "vi")),
        version=str(meta.get("version", "")),
        effective_date=effective.isoformat() if isinstance(effective, date) else effective,
        rules=sorted(declared),
    )


def load_policies(policy_dir: Path) -> list[PolicyDoc]:
    """Every .md in the folder except README.md and anything under a `_` folder (e.g. _original/)."""
    paths = sorted(
        path
        for path in policy_dir.rglob("*.md")
        if path.name != "README.md" and not any(part.startswith("_") for part in path.relative_to(policy_dir).parts)
    )
    docs = [parse(path) for path in paths]
    ids = [doc.id for doc in docs]
    duplicates = {doc_id for doc_id in ids if ids.count(doc_id) > 1}
    if duplicates:
        raise ValueError(f"duplicate document ids: {', '.join(sorted(duplicates))}")
    return docs
