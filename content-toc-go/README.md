# extract_toc

Reads one course HTML file, extracts its h1/h2/h3 outline, and inserts
`id="@slug"` into any of those headings that don't already have one — so
every heading has something stable to link to. Also writes a ready-to-paste
TOC snippet as a `.md` file next to it.

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
| `-mode int`  | `1` = h1 only, `2` = h1+h2, `3` = h1+h2+h3 (default `3`)         |
| `-dry-run`   | Preview everything, write nothing (not even the `.md` — wait, see note below) |

### Examples

```
extract_toc 01-go-01.html                 # mode 3, writes ids + the .md
extract_toc -mode=2 01-go-01.html         # h1+h2 only
extract_toc -dry-run -mode=1 01-go-01.html   # preview only, no writes
```

> Note: `-dry-run` still writes the `.md` file (so you have something to
> read), it just skips writing back to the HTML. If you want a completely
> read-only preview, copy the HTML file somewhere temporary first and run
> the tool on the copy.

## What it does, in order

1. Finds every `addContent(`, `addQuiz(`, `addFillBlank(`, `addMatching(`
   call and its template-literal content, in file order.
2. Within each one, finds every `h1`/`h2`/`h3` and its text (tags stripped,
   HTML entities decoded).
3. For headings within your chosen `-mode`, generates a URL-safe slug from
   the heading text (Greek is transliterated to Latin letters) — **only**
   for headings that don't already have an `id`. If two headings would get
   the same slug (this happens — e.g. a heading repeated across several
   slides), a `-2`, `-3`, ... suffix is added to keep every id unique
   within the file.
4. Inserts `id="@that-slug"` into each of those heading tags, directly in
   the HTML file — see **Safety**, below.
5. Writes `<file>-toc.md` next to the HTML file: a short summary plus a
   fenced ` ```html ` block of ready-to-paste `<a>` tags — one per heading
   in scope, each `href="#@its-slug"`, `data-slide="N"`, and
   `class="toc-link toc-hX"` (X = 1/2/3) — matching the CSS already in
   `static/style.css`. Paste that block into `<div id="toc-list">` in the
   course's `index.html`.

## Safety

This never re-serializes the file through an HTML parser (which would risk
silently changing quote styles, attribute order, whitespace, self-closing
tags, etc. elsewhere in the file). It only ever computes the exact byte
position right after `<h1`/`<h2`/`<h3` for a heading that needs a new id,
and splices `id="@slug"` in at that exact spot — nothing else in the file
is touched.

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

Safe and idempotent. A heading that already has an id (whether the tool
gave it one earlier, or you wrote it by hand) is never touched again —
re-running after editing content only fills in ids for anything *new*
that doesn't have one yet.

## Known limitation

Heading tags are matched with a simple pattern, not a full HTML parser —
this is safe for real content because a heading's attributes here never
contain a literal `>` character. If one ever did (e.g.
`<h2 title="a > b">`), the match for that specific tag could be wrong.
Not a concern for how these files are actually written.
