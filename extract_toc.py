#!/usr/bin/env python3
"""
extract_toc.py — pulls the h1/h2/h3 structure out of a course HTML file and
writes a ready-to-paste TOC snippet as a .md file next to it.

WHY THIS EXISTS: the sidebar's #toc-list is static HTML, not built by
scanning the page live — you generate it once with this script, review/edit
the .md by hand if you want, then paste the fenced ```html block straight
into <div id="toc-list"> ... </div> in the course's index.html.

USAGE:
    python3 extract_toc.py 01-go-01.html
    → writes 01-go-01-toc.md next to it

WHAT IT DOES:
  - Finds every addContent(`...`) / addQuiz(`...`) / addFillBlank(`...`) /
    addMatching(`...`) call in the file, in the order they appear — that
    order IS the slide index order the live site builds slides[] in, since
    slides here aren't literal HTML in the file, they're built at runtime
    from these calls.
  - Within each call's template-literal content, finds every h1/h2/h3, in
    document order.
  - Builds one <a> per heading:
      <a href="#some-id" data-slide="N" class="toc-link toc-hX">Text</a>
    - href is only added if the heading already has its own id — those
      ids are what static/script.js's routing will jump+scroll to
      directly. Headings with no id still show up and are still
      clickable — they just land on the top of the slide (data-slide)
      instead of scrolling to that exact spot within it.
    - class="toc-hX" (X = 1/2/3) is what style.css's existing
      .toc-h1/.toc-h2/.toc-h3 rules use for indentation — already built,
      nothing to add there.
  - Headings with NO id are flagged in the console summary (not an
    error — just a heads-up, in case you want to add one for precise
    linking later).

WHAT IT DOESN'T DO: touch the HTML file itself, guess at ids, or reorder
anything — it's a one-way extraction. Re-run it after editing content and
re-paste if you want the sidebar to reflect the change.
"""

import sys
import re
from pathlib import Path

try:
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("Missing dependency. Install it with:\n    pip install beautifulsoup4 --break-system-packages")


SLIDE_CALL_NAMES = ("addContent", "addQuiz", "addFillBlank", "addMatching")


def slugify_fallback(text: str) -> str:
    """
    Not used to WRITE ids into the source file — only to show a suggested
    id in the console summary for headings that don't have one yet, so
    you don't have to think one up by hand if you decide to add it.
    """
    s = text.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s, flags=re.UNICODE)
    s = re.sub(r"[\s_]+", "-", s)
    return s[:60].strip("-") or "untitled"


def find_template_literal_calls(source: str, call_names):
    """
    Slides in this course template aren't literal HTML in the file — each
    one is built at runtime from an addContent(`...html...`)-style call
    with a JS template-literal argument. This walks the raw source text
    (not a full JS parser — that'd be overkill here) looking for each
    call name, then finds its opening backtick and manually scans forward
    to the matching CLOSING backtick, respecting escaped backticks (\\`)
    so an escaped one inside the content doesn't end the match early.

    Yields the template-literal's inner text, in the same order the calls
    appear in the file — which is also the order slides[] gets built in
    at runtime, so this order IS the slide index order.
    """
    pattern = re.compile(r"(?:" + "|".join(call_names) + r")\s*\(\s*`")
    pos = 0
    while True:
        m = pattern.search(source, pos)
        if not m:
            break
        start = m.end()  # just after the opening backtick
        i = start
        while i < len(source):
            if source[i] == "\\" and i + 1 < len(source):
                i += 2  # skip an escaped character entirely (e.g. \` or \\)
                continue
            if source[i] == "`":
                break
            i += 1
        yield source[start:i]
        pos = i + 1


def extract(html_path: Path):
    source = html_path.read_text(encoding="utf-8")
    slide_htmls = list(find_template_literal_calls(source, SLIDE_CALL_NAMES))

    if not slide_htmls:
        sys.exit(
            f"No addContent()/addQuiz()/addFillBlank()/addMatching() calls found in {html_path} — wrong file, "
            "or slides are built some other way this script doesn't know about yet."
        )

    entries = []       # (level, text, id_or_None, slide_index)
    missing_id_count = 0

    for slide_index, slide_html in enumerate(slide_htmls):
        fragment = BeautifulSoup(slide_html, "html.parser")
        for tag in fragment.find_all(["h1", "h2", "h3"]):
            level = int(tag.name[1])
            text = tag.get_text(strip=True)
            if not text:
                continue  # empty heading, e.g. an icon-only h — nothing to link to
            heading_id = tag.get("id")
            if not heading_id:
                missing_id_count += 1
            entries.append((level, text, heading_id, slide_index))

    return entries, len(slide_htmls), missing_id_count


def build_html_block(entries) -> str:
    lines = []
    for level, text, heading_id, slide_index in entries:
        href_attr = f'href="#{heading_id}" ' if heading_id else ""
        # Escape only what actually needs it inside an attribute/text context.
        safe_text = (
            text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        )
        lines.append(
            f'<a {href_attr}data-slide="{slide_index}" class="toc-link toc-h{level}">{safe_text}</a>'
        )
    return "\n".join(lines)


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: python3 extract_toc.py <course.html>")

    html_path = Path(sys.argv[1])
    if not html_path.exists():
        sys.exit(f"File not found: {html_path}")

    entries, slide_count, missing_id_count = extract(html_path)

    out_path = html_path.with_name(html_path.stem + "-toc.md")
    html_block = build_html_block(entries)

    md_content = (
        f"# TOC outline — {html_path.name}\n\n"
        f"{slide_count} slides scanned, {len(entries)} headings found "
        f"({missing_id_count} without an id).\n\n"
        "Paste the block below directly into `<div id=\"toc-list\">` in this "
        "course's index.html, replacing whatever's currently in there.\n\n"
        "```html\n"
        f"{html_block}\n"
        "```\n"
    )
    out_path.write_text(md_content, encoding="utf-8")

    # Console summary
    print(f"Scanned {slide_count} addContent()/addQuiz()/etc calls, found {len(entries)} headings.")
    level_counts = {1: 0, 2: 0, 3: 0}
    for level, *_ in entries:
        level_counts[level] += 1
    print(f"  h1: {level_counts[1]}   h2: {level_counts[2]}   h3: {level_counts[3]}")
    if missing_id_count:
        print(f"\n{missing_id_count} heading(s) have no id — still included, but only jump to the top of their slide, not the exact spot:")
        for level, text, heading_id, slide_index in entries:
            if not heading_id:
                suggestion = slugify_fallback(text)
                print(f"    slide {slide_index}: \"{text}\"  (suggested id: {suggestion})")
    print(f"\nWrote {out_path}")


if __name__ == "__main__":
    main()
