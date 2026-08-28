# extract_toc

Reads one course HTML file, extracts its heading outline, and inserts
`id="@slug"` into whatever needs one — so every entry has something stable
to link to. Also writes a ready-to-paste TOC snippet as a `.md` file next
to it.

## Why

Slides in these course files aren't literal HTML — they're built at runtime
from `addContent(`...`)` / `addQuiz(`...`)` / etc. calls. This tool reads
the raw source, finds those calls in order (that order = the slide index
order the site uses at runtime), and scans each one's content for headings.

## Build

No external dependencies — standard library only.

```
go build -o extract_toc .
```

That produces a single `extract_toc` binary. Copy it anywhere convenient.

## Usage

```
extract_toc [flags] <course.html>
```

| Flag         | Meaning                                                        |
|--------------|------------------------------------------------------------------|
| `-mode int`  | `0` = section eyebrows only, `1` = h1 only, `2` = h1+h2, `3` = h1+h2+h3 (default `3`) |
| `-dry-run`   | Preview everything, write nothing (not even the `.md` — wait, see note below) |

### Examples

```
extract_toc 01-go-01.html                 # mode 3, writes ids + the .md
extract_toc -mode=2 01-go-01.html         # h1+h2 only
extract_toc -mode=0 01-go-01.html         # section eyebrows only — see below
extract_toc -dry-run -mode=1 01-go-01.html   # preview only, no writes
```

> Note: `-dry-run` still writes the `.md` file (so you have something to
> read), it just skips writing back to the HTML. If you want a completely
> read-only preview, copy the HTML file somewhere temporary first and run
> the tool on the copy.

## Modes, in detail

**Modes 1/2/3** include every h1 (and h2, and h3, depending on the number)
found anywhere in the file. For **h1 specifically**, the tool looks for
that slide's `<div class="eyebrow">...Ενότητα...</div>` — the "Section N /
M — Topic" label every regular content slide starts with — and puts the id
**there** instead of on the h1 itself (the h1's own text is still what
shows up in the TOC; only *where the id physically lives* changes). This
only ever applies to `addContent()` slides — never `addQuiz()` /
`addFillBlank()` / `addMatching()`, since those don't use this eyebrow+h1
pattern at all (their headers are built by `buildInteractiveHeader()` at
runtime, not written as literal HTML). A slide with no eyebrow at all (the
opening title slide), or one whose eyebrow doesn't say "Ενότητα" (e.g. a
closing "Cheatsheet"/glossary-style slide) is left alone by the
eyebrow-redirect — its h1 still gets a slug, just directly on itself, as a
fallback. This is how glossary/vscodechallenge-style slides end up
excluded from the eyebrow treatment specifically, without the tool needing
an explicit list of slide "kinds" to maintain.

**Mode 0** is different, on purpose: it includes **only** h1s that
actually found a qualifying eyebrow. There's no fallback here — a slide
with no eyebrow (or a non-"Ενότητα" one) gets **nothing** in mode 0, not
even on its own h1. Use this when you want a clean, minimal TOC of just
the numbered sections, skipping the title slide, cheatsheets, and anything
else that isn't a proper "Ενότητα N" section. h2/h3 are never included in
mode 0 regardless of anything else.

## What it does, in order

1. Finds every `addContent(`, `addQuiz(`, `addFillBlank(`, `addMatching(`
   call and its template-literal content, in file order — and, for
   `addContent()` calls specifically, whether it has a qualifying
   `Ενότητα`-eyebrow (see **Modes**, above).
2. Within each call, finds every `h1`/`h2`/`h3` and its text (tags
   stripped, HTML entities decoded).
3. For headings within your chosen `-mode`, generates a slug from the
   heading text — **only** for whichever element doesn't already have an
   `id` (the eyebrow, for a redirected h1; the heading tag itself,
   otherwise). Greek is transliterated to Latin letters; the slug is
   capped at 16 characters. If two headings would get the same slug (this
   happens — e.g. a heading repeated across several slides), a `-2`,
   `-3`, ... suffix is added to keep every id unique within the file.
4. Inserts `id="@that-slug"` at that exact spot — see **Safety**, below.
5. Writes `<file>-toc.md` next to the HTML file: a short summary plus a
   fenced ` ```html ` block of ready-to-paste `<a>` tags — one per heading
   in scope, each `href="#@its-slug"` and
   `class="toc-link toc-hX"` (X = 1/2/3) — matching the CSS already in
   `static/style.css`. Link text is the heading's own text, capped at 45
   characters (with a `…` where it's cut). Paste the block into
   `<div id="toc-list">` in the course's `index.html`.

## Safety

This never re-serializes the file through an HTML parser (which would risk
silently changing quote styles, attribute order, whitespace, self-closing
tags, etc. elsewhere in the file). It only ever computes the exact byte
position right after the opening tag's name (`<h1`/`<h2`/`<h3`, or `<div`
for an eyebrow) for whichever element needs a new id, and splices
`id="@slug"` in at that exact spot — nothing else in the file is touched.

You can verify this yourself on any file: take a version before and after
running the tool, and strip every `` id="@..." `` the tool could have
added — what's left is byte-for-byte identical to the original.

```sh
# example verification
python3 -c "
import re
before = open('original.html', encoding='utf-8').read()
after  = open('modified.html', encoding='utf-8').read()
stripped = re.sub(r' id=\"@[^\"]*\"', '', after)
print('identical:', stripped == before)
"
```

## Re-running

Safe and idempotent. Anything that already has an id (whether the tool
gave it one earlier, or you wrote it by hand) is never touched again —
re-running after editing content only fills in ids for anything *new*
that doesn't have one yet. The eyebrow-matching itself is order-independent
(it doesn't matter whether `id="..."` or `class="eyebrow"` comes first in
the tag), specifically so this keeps working correctly on a second run,
after the first run's own insertion.

## Known limitations

- Heading and div tags are matched with a simple pattern, not a full HTML
  parser — this is safe for real content because their attributes here
  never contain a literal `>` character. If one ever did (e.g.
  `<h2 title="a > b">`), the match for that specific tag could be wrong.
  Not a concern for how these files are actually written.
- The eyebrow-redirect assumes the standard authoring convention — a
  `<div class="eyebrow">Ενότητα N / M — ...</div>` immediately before that
  slide's `<h1>`. A slide that puts something else between them, or
  doesn't follow this shape at all, just won't qualify for the redirect
  (falls back to h1-direct in modes 1-3, gets nothing in mode 0) — same
  as a slide with no eyebrow at all.
