"""Splits a policy document into retrievable chunks: one per H3 section (the files are written so
each H3 stands on its own), with the heading path kept for context and citations."""
import re
import unicodedata
from dataclasses import dataclass

from app.ingest.loaders import PolicyDoc

# Sections longer than this are split at blank lines; tables and lists stay whole.
MAX_WORDS = 400


@dataclass
class Chunk:
    id: str
    doc_id: str
    title: str
    section: str
    heading: str
    text: str
    position: int

    @property
    def heading_path(self) -> str:
        return " > ".join(part for part in (self.title, self.section, self.heading) if part)

    @property
    def embed_text(self) -> str:
        """What gets embedded: the headings say what the passage is about."""
        return f"{self.heading_path}\n\n{self.text}"


def slug(text: str) -> str:
    text = text.replace("đ", "d").replace("Đ", "D")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:60] or "intro"


def _blocks(text: str) -> list[str]:
    return [block.strip() for block in re.split(r"\n\s*\n", text) if block.strip()]


def _split_long(text: str) -> list[str]:
    if len(text.split()) <= MAX_WORDS:
        return [text]
    parts: list[str] = []
    current: list[str] = []
    for block in _blocks(text):
        if current and len(" ".join(current + [block]).split()) > MAX_WORDS:
            parts.append("\n\n".join(current))
            current = []
        current.append(block)
    if current:
        parts.append("\n\n".join(current))
    return parts


def chunk_document(doc: PolicyDoc, body: str) -> list[Chunk]:
    """`body` is the document text with rules already filled in."""
    title, section, heading = doc.title, "", ""
    sections: list[tuple[str, str, list[str]]] = []
    lines: list[str] = []
    in_fence = False

    def flush():
        if "".join(lines).strip():
            sections.append((section, heading, lines.copy()))
        lines.clear()

    for line in body.splitlines():
        if line.startswith("```"):
            in_fence = not in_fence
        if not in_fence and (match := re.match(r"^(#{1,3})\s+(.*)", line)):
            flush()
            level, text = len(match.group(1)), match.group(2).strip()
            if level == 1:
                title, section, heading = text, "", ""
            elif level == 2:
                section, heading = text, ""
            else:
                heading = text
            continue
        lines.append(line)
    flush()

    chunks: list[Chunk] = []
    seen: dict[str, int] = {}
    for section_name, heading_name, section_lines in sections:
        base = f"{doc.id}#{slug(section_name)}/{slug(heading_name)}"
        for part in _split_long("\n".join(section_lines).strip()):
            count = seen.get(base, 0)
            seen[base] = count + 1
            chunks.append(
                Chunk(
                    id=base if count == 0 else f"{base}-{count + 1}",
                    doc_id=doc.id,
                    title=title,
                    section=section_name,
                    heading=heading_name,
                    text=part,
                    position=len(chunks),
                )
            )
    return chunks
