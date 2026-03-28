#!/usr/bin/env python3
"""One-off scraper for DND 2024 spells from wikidot.

This script:
- fetches the spell index from http://dnd2024.wikidot.com/spell:all
- discovers each spell slug from links matching /spell:<slug>
- fetches each detail page and extracts core spell fields
- writes JSON-LD aligned with .github/shacl/spells.ttl required properties
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from dataclasses import dataclass
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

SPELL_INDEX_URL = "http://dnd2024.wikidot.com/spell:all"
SPELL_DETAIL_URL_TEMPLATE = "http://dnd2024.wikidot.com/spell:{slug}"
USER_AGENT = "SA-Rdf-Frontend one-off spell scraper/1.0"


class TextExtractor(HTMLParser):
    """Collects link targets and block-aware text from HTML."""

    _BLOCK_TAGS = {
        "p",
        "div",
        "li",
        "ul",
        "ol",
        "table",
        "tr",
        "td",
        "th",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "section",
        "article",
        "br",
    }

    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []
        self.parts: list[str] = []
        self._suppress_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_map = dict(attrs)
        if tag in {"script", "style", "noscript"}:
            self._suppress_depth += 1
            return

        if tag == "a":
            href = attrs_map.get("href")
            if href:
                self.links.append(href)

        if tag in self._BLOCK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript"} and self._suppress_depth > 0:
            self._suppress_depth -= 1
            return

        if tag in self._BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self._suppress_depth > 0:
            return
        if data:
            self.parts.append(data)

    def text(self) -> str:
        return "".join(self.parts)


@dataclass
class SpellDetail:
    slug: str
    label: str
    casting_time: str
    description: str
    duration: str
    range_value: str
    ritual: bool
    target: str
    effect: str
    damage: str | None = None
    damage_type: str | None = None
    level_scaling: str | None = None
    spell_level: int | str | None = None


def fetch_html(url: str, timeout_seconds: float) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=timeout_seconds) as response:  # nosec B310
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(value)).strip()


def extract_page_content(html: str) -> str:
    match = re.search(
        r'<div[^>]+id=["\']page-content["\'][^>]*>(.*?)</div>',
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return match.group(1) if match else html


def extract_spell_slugs(index_html: str) -> list[str]:
    parser = TextExtractor()
    parser.feed(index_html)

    slugs: set[str] = set()
    for href in parser.links:
        absolute = urljoin(SPELL_INDEX_URL, href)
        match = re.search(r"/spell:([a-z0-9\-']+)$", absolute, flags=re.IGNORECASE)
        if not match:
            match = re.search(r"spell:([a-z0-9\-']+)$", absolute, flags=re.IGNORECASE)
        if not match:
            continue

        slug = match.group(1).strip().lower()
        if slug and slug != "all":
            slugs.add(slug)

    return sorted(slugs)


def to_lines_from_html(html: str) -> list[str]:
    parser = TextExtractor()
    parser.feed(html)
    lines = [normalize_whitespace(line) for line in parser.text().splitlines()]
    return [line for line in lines if line]


def slug_to_spell_id(slug: str) -> str:
    tokenized = re.split(r"[^a-zA-Z0-9]", slug)
    compact = "".join(token.capitalize() for token in tokenized if token)
    return f"spell:{compact or 'Unknown'}"


def slug_to_label(slug: str) -> str:
    words = [w for w in re.split(r"[-_]+", slug) if w]
    if not words:
        return "Unknown Spell"
    return " ".join(word.capitalize() for word in words)


def extract_label(html: str, lines: list[str], slug: str) -> str:
    h1_match = re.search(r"<h1[^>]*>(.*?)</h1>", html, flags=re.IGNORECASE | re.DOTALL)
    if h1_match:
        plain = re.sub(r"<[^>]+>", "", h1_match.group(1))
        label = normalize_whitespace(plain)
        if label and "d&d" not in label.lower():
            return label

    title_match = re.search(r"<title[^>]*>(.*?)</title>", html, flags=re.IGNORECASE | re.DOTALL)
    if title_match:
        plain_title = normalize_whitespace(re.sub(r"<[^>]+>", "", title_match.group(1)))
        if plain_title:
            cleaned = re.split(r"\s*[-|]\s*", plain_title)[0].strip()
            if cleaned and "d&d" not in cleaned.lower() and "wikidot" not in cleaned.lower():
                return cleaned

    slug_label = slug_to_label(slug)
    if slug_label:
        return slug_label

    if lines:
        return lines[0]
    return "Unknown Spell"


def scan_labeled_field(lines: Iterable[str], labels: tuple[str, ...]) -> str:
    for line in lines:
        for label in labels:
            pattern = rf"^{label}\s*:?\s*(.+)$"
            match = re.match(pattern, line, flags=re.IGNORECASE)
            if match:
                value = normalize_whitespace(match.group(1))
                if value:
                    return value

            # Handles cases like: "Casting Time 1 action"
            pattern_no_colon = rf"^{label}\s+(.+)$"
            match_no_colon = re.match(pattern_no_colon, line, flags=re.IGNORECASE)
            if match_no_colon:
                value = normalize_whitespace(match_no_colon.group(1))
                if value:
                    return value
    return ""


def extract_description(lines: list[str]) -> str:
    labels = (
        "casting time",
        "range",
        "duration",
        "target",
        "components",
        "level",
        "school",
        "classes",
        "attack/save",
        "damage/effect",
    )

    collected: list[str] = []
    for line in lines:
        lower = line.lower()
        if any(lower.startswith(label) for label in labels):
            continue
        if lower in {"spell", "spells", "d&d 2024 spells", "wikidot.com"}:
            continue
        if len(line) < 3:
            continue
        collected.append(line)

    text = " ".join(collected)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_spell_level(lines: list[str], description: str) -> int | str | None:
    combined = " ".join(lines) + " " + description
    cantrip_match = re.search(r"\bcantrip\b", combined, flags=re.IGNORECASE)
    if cantrip_match:
        return 0

    level_match = re.search(r"\b(\d{1,2})(?:st|nd|rd|th)?\s*[- ]?level\b", combined, flags=re.IGNORECASE)
    if level_match:
        try:
            return int(level_match.group(1))
        except ValueError:
            return level_match.group(1)

    level_label = scan_labeled_field(lines, ("level",))
    if level_label:
        int_match = re.search(r"\d+", level_label)
        if int_match:
            return int(int_match.group(0))
        return level_label

    return None


def extract_damage_fields(description: str) -> tuple[str | None, str | None]:
    damage_match = re.search(
        r"\b(\d+d\d+(?:\s*[+\-]\s*\d+)?)\s+([a-zA-Z]+)\s+damage\b",
        description,
        flags=re.IGNORECASE,
    )
    if not damage_match:
        return None, None
    return normalize_whitespace(damage_match.group(1)), normalize_whitespace(damage_match.group(2).lower())


def extract_level_scaling(description: str) -> str | None:
    sentence_match = re.search(
        r"(At Higher Levels\.?[^.]*\.)",
        description,
        flags=re.IGNORECASE,
    )
    if sentence_match:
        return normalize_whitespace(sentence_match.group(1))

    per_level_match = re.search(r"\bper\s+(?:spell\s+)?level\b", description, flags=re.IGNORECASE)
    if per_level_match:
        return "per spell level"

    return None


def parse_spell_detail(slug: str, html: str) -> SpellDetail:
    page_html = extract_page_content(html)
    lines = to_lines_from_html(page_html)

    label = extract_label(html, lines, slug)

    casting_time = scan_labeled_field(lines, ("casting time", "cast time")) or "Unknown"
    duration = scan_labeled_field(lines, ("duration",)) or "Unknown"
    range_value = scan_labeled_field(lines, ("range",)) or "Unknown"
    target = scan_labeled_field(lines, ("target",))
    if not target:
        target = "Self" if range_value.lower() == "self" else "Unknown"

    description = extract_description(lines)
    if not description:
        description = "No description parsed from source page."

    ritual_field = scan_labeled_field(lines, ("ritual",))
    ritual = False
    if ritual_field:
        ritual = ritual_field.lower() in {"true", "yes", "y", "ritual"}
    elif "ritual" in casting_time.lower() or re.search(r"\britual\b", " ".join(lines), flags=re.IGNORECASE):
        ritual = True

    damage, damage_type = extract_damage_fields(description)
    level_scaling = extract_level_scaling(description)
    spell_level = extract_spell_level(lines, description)

    return SpellDetail(
        slug=slug,
        label=label,
        casting_time=casting_time,
        description=description,
        duration=duration,
        range_value=range_value,
        ritual=ritual,
        target=target,
        effect="",
        damage=damage,
        damage_type=damage_type,
        level_scaling=level_scaling,
        spell_level=spell_level,
    )


def should_skip_as_non_spell(detail: SpellDetail) -> bool:
    description_lower = detail.description.lower()
    metadata_missing = (
        detail.casting_time == "Unknown"
        and detail.duration == "Unknown"
        and detail.range_value == "Unknown"
    )
    taxonomy_signals = [
        "spell lists",
        "cantrip 1st level 2nd level",
        "name spell lists",
    ]
    has_taxonomy_signal = any(signal in description_lower for signal in taxonomy_signals)
    return metadata_missing and has_taxonomy_signal


def spell_detail_to_entry(detail: SpellDetail) -> dict[str, object]:
    entry: dict[str, object] = {
        "@id": slug_to_spell_id(detail.slug),
        "@type": "spell:Spell",
        "rdfs:label": detail.label,
        "spell:castingtime": detail.casting_time,
        "spell:description": detail.description,
        "spell:duration": detail.duration,
        "spell:range": detail.range_value,
        "spell:ritual": detail.ritual,
        "spell:target": detail.target,
        "sa:effect": detail.effect,
    }

    if detail.damage:
        entry["sa:damage"] = detail.damage
    if detail.damage_type:
        entry["sa:damageType"] = detail.damage_type
    if detail.level_scaling:
        entry["sa:levelScaling"] = detail.level_scaling
    if detail.spell_level is not None:
        entry["sa:spellLevel"] = detail.spell_level

    return entry


def build_output(entries: list[dict[str, object]]) -> dict[str, object]:
    return {
        "@context": {
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
            "spell": "https://stellararcana.org/spell#",
            "sa": "https://stellararcana.org/",
        },
        "@graph": [
            {
                "@id": "sa:spellList",
                "@type": "sa:Spells",
                "rdfs:label": "Spells",
                "sa:items": entries,
            }
        ],
    }


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape DND 2024 spells from wikidot and emit SHACL-aligned JSON-LD."
    )
    parser.add_argument(
        "--output",
        default="public/data/spells.scraped.json",
        help="Output path for JSON-LD spells payload (default: public/data/spells.scraped.json).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional max number of spells to scrape for smoke testing.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.2,
        help="Delay between detail-page requests in seconds (default: 0.2).",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=20.0,
        help="HTTP timeout in seconds for each request (default: 20).",
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)

    try:
        index_html = fetch_html(SPELL_INDEX_URL, timeout_seconds=args.timeout)
    except (HTTPError, URLError, TimeoutError) as exc:
        print(f"Failed to fetch spell index: {exc}", file=sys.stderr)
        return 1

    slugs = extract_spell_slugs(index_html)
    if args.limit is not None:
        slugs = slugs[: max(0, args.limit)]

    if not slugs:
        print("No spell slugs discovered from spell index.", file=sys.stderr)
        return 1

    print(f"Discovered {len(slugs)} spell pages.")

    entries: list[dict[str, object]] = []
    failures: list[str] = []

    for idx, slug in enumerate(slugs, start=1):
        detail_url = SPELL_DETAIL_URL_TEMPLATE.format(slug=slug)
        try:
            detail_html = fetch_html(detail_url, timeout_seconds=args.timeout)
            detail = parse_spell_detail(slug, detail_html)
            if should_skip_as_non_spell(detail):
                print(f"[{idx}/{len(slugs)}] skipped non-spell page {slug}")
                continue

            entry = spell_detail_to_entry(detail)
            entries.append(entry)
            print(f"[{idx}/{len(slugs)}] scraped {slug}")
        except (HTTPError, URLError, TimeoutError) as exc:
            failures.append(f"{slug}: {exc}")
            print(f"[{idx}/{len(slugs)}] failed {slug}: {exc}", file=sys.stderr)

        if args.delay > 0:
            time.sleep(args.delay)

    payload = build_output(entries)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")

    print(f"Wrote {len(entries)} spells to {output_path.as_posix()}.")
    if failures:
        print(f"{len(failures)} spell pages failed.", file=sys.stderr)
        for failure in failures:
            print(f" - {failure}", file=sys.stderr)

    # A partial scrape still produces useful output; return success if at least one spell was captured.
    return 0 if entries else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
