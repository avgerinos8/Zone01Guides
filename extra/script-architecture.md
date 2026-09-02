# script.js — architecture reference

One file, shared by every course deck. A course's own HTML just calls a
sequence of `add*()` functions ending in `initSlideDeck({...})` — this file
is the whole engine underneath that.

## 1. How a deck is built

Four authoring functions, each pushing exactly **one** entry onto a single
`slides[]` array — regardless of whether the argument is one item or an
array of several:

```js
addContent(html, opts)              // one slide, raw HTML
addQuiz(qOrArray, opts)             // one slide, 1+ MC questions stacked on it
addFillBlank(itemOrArray, opts)     // one slide, 1+ fill-in-the-blank items
addMatching(setsOrPairs, opts)      // one slide, 1-3 matching sets
```

This matters for indexing: `addQuiz([q1, q2, q3])` is **one** slide with
three questions on it, not three slides. The slide's runtime index is just
its position in `slides[]` — i.e. the order these calls appear in the file,
full stop. (An earlier, buggy version of the TOC-building tool assumed only
`addContent()` — which takes a backtick string — counted as a slide-call,
silently skipping `addQuiz`/`addFillBlank`/`addMatching`, which take plain
JS array/object literals instead. Long since fixed, but worth knowing why
slide-index bugs specifically clustered around interactive slides before.)

`initSlideDeck(config)` is the entry point a course's own script calls
once, at the very end. It:

1. Loops over `slides[]` **once**, synchronously, building a real `.slide`
   div for **every** slide up front — nothing is lazy. All of them exist in
   the DOM from the start; only the active one is visible (`display:none`
   on the rest, toggled via the `.active` class).
2. Wires up the nav bar, dots, sidebar, keyboard shortcuts, search index.
3. Resolves the starting slide: resume-from-localStorage, or a URL
   hash-based deep-link if one's present (see §3).
4. Marks `window.__pageInitialized = true` once this whole pass finishes
   without throwing — the inline failsafe script in `<head>` checks this
   flag to tell "the deck never finished building" (show the recovery
   screen) apart from "something minor broke after a working page loaded"
   (leave it alone, see §7).

Building everything up front (rather than lazily per-slide) is why several
other things work the way they do: `document.getElementById('@some-slug')`
finding a heading on a slide you've never visited, `.spoiler-lock`'s
ResizeObserver re-firing once its slide actually becomes visible, etc.

## 2. Navigation — one function, one history model

`goTo(i)` is deliberately dumb: switch which `.slide` has `.active`, reset
scroll position, update the dots/counter/progress bar. That's it — no
history, no URL, nothing else.

`navigateTo(slideIndex, elId, fromHistory)` is the **one** entry point
everything else calls — Next/Back buttons, dots, A/D keys, arrow keys, TOC
link clicks, search result clicks, all of them:

```js
navigateTo(current + 1, null)          // plain slide change
navigateTo(slideIndex, "@some-slug")   // jump to a specific element within a slide
```

It calls `goTo()`, optionally smooth-scrolls to and briefly highlights a
target element within that slide, then pushes **one** `history.pushState`
entry recording both `{slideIndex, elId}` — unless `fromHistory` is true
(set only when this call is itself replaying a Back/Forward action, so it
doesn't push a new entry on top of the one being replayed).

A single `popstate` listener handles Back/Forward, for every kind of move:

```js
window.addEventListener("popstate", (e) => {
  if (e.state && typeof e.state.slideIndex === "number") {
    navigateTo(e.state.slideIndex, e.state.elId, true);
  }
});
```

Because *everything* goes through `navigateTo`, Back/Forward step through
the real, mixed sequence of whatever you actually did — three Next
presses, a TOC click, a search click, more Next presses — in that exact
order. There's no separate "history" concept for links versus plain
navigation.

The very first slide (resume-from-storage or cold-load hash) gets its
history entry seeded explicitly via `history.replaceState(...)`, so Back
has real state to read even when pressed all the way back to the start —
otherwise that first entry would be `state: null` and need its own special
case.

## 3. Deep-linking (`#@slug` URLs)

Every slide's content can have `id="@some-slug"` on headings (see the
separate `extract_toc` tool + `slugs-toc-spec.json` for how those get
assigned — not something this file does). `resolveHash("#@slug")` turns
that into `{elId, slideIndex}` by walking up to the containing `.slide`
and reading its `data-index`.

Cold page loads are the one tricky part: a browser tries to auto-scroll to
a `#hash` target **before** any of this file's JS has run — but the target
element doesn't exist yet (it's built by step 1 above), so that native
attempt is guaranteed to fail, and unreliably retries later against a
still-hidden `display:none` element, producing an inconsistent
scrolled-somewhere-wrong glitch. The fix lives partly outside this file: an
inline `<script>` at the very top of `<head>` captures
`window.__initialHash` and strips the hash from the URL immediately, before
the browser's native handling can even attempt anything. This file's
`handleInitialHashNavigation()` reads that captured value (not
`location.hash`, which has been cleared on purpose) once slides actually
exist, navigates there, and restores the hash in the address bar
afterward for bookmarking.

A defensive scroll-drift watcher runs for the first ~2.5s after load,
correcting any stray horizontal scroll instantly if it happens anyway
(some browsers' native fragment-handling can still misbehave despite the
above) — paused while `smoothScrollTop()`'s own animation is actively
running, so the two don't fight each other.

## 4. Search

Built once, at `initTocSidebar()` time (after slides exist — this bit it a
real bug once, from running too early): every `.slide` is walked with

```js
"p, h1, h2, h3, li, td, .lede, pre code, blockquote"
```

Each matched element becomes one `{el, text, textLower}` entry in
`searchIndex[]`. Deliberately indexed at this "content leaf" level rather
than raw text nodes — a `<p>` containing `<strong>bold</strong> text` is
**one** entry with the fully merged text, not three fragments a query
could fall between the cracks of.

Typing in `#toc-search` is debounced (200ms) and requires 3+ characters
before anything runs (below that, the box just shows the normal browse
list). A match is a plain substring check (`textLower.includes(query)`),
case-insensitive, no fuzzy matching. No cap on result count.

Each result renders as a snippet — up to 4 words of context on each side
of the match, the match itself wrapped in `<strong>`, ellipses only where
text was actually cut — built via `buildSnippet()`, which finds which
word(s) the match falls inside by tracking word boundaries, not just
slicing characters. Built with real DOM nodes (`createTextNode`/
`createElement`), not an HTML string, so there's no injection concern from
either the query or the matched content.

Clicking a result: if the target element doesn't already have an `id`
(most paragraphs/list items don't — only headings usually do), one gets
generated once (`@search-hit-N`) and reused on subsequent clicks; either
way, `navigateTo(slideIndex, elId)` handles the rest — same scroll,
highlight, and history behavior as clicking a real TOC link.

## 5. Sidebar TOC

`#toc-list` holds a static list of `<a href="#@slug" class="toc-link
toc-hN">Text</a>` entries, generated externally (`extract_toc`, a separate
Go tool) plus manual curation — **not** built by this file. This file only
provides the *behavior*:

- Click-delegation on `#toc-list` intercepts clicks on `.toc-link[href^='#']`,
  resolves the hash, calls `navigateTo`. (Needed because navigation is now
  pushState-driven, not relying on the browser's own native anchor-click
  history push.)
- No entry is ever visually marked "active"/"current" — deliberately
  removed after earlier attempts caused more confusion than help (a
  `data-slide` attribute that went stale every time the course file was
  edited, then wrong entries lighting up after a click). Don't reintroduce
  it.
- `.toc-section` divider labels (non-clickable, plain
  `<div class="toc-section">LABEL</div>`) are hand-placed among the links
  for visual grouping — also not generated by this file.
- Mobile (≤920px): sidebar is a full-screen overlay, closes automatically
  after any link/search click. Desktop: a docked side panel that pushes
  the rest of the page narrower via `--toc-offset` (no dimming backdrop),
  and stays open after a click so you can follow several links in a row.

## 6. Interactive exercises

All three (`renderQuestion`/quiz, `renderFillBlank`, `renderMatching`)
share the same shape: a `storeKey` string identifies that specific
question/item/set for persistence, `savedAnswers[storeKey]` holds whatever
was recorded, and a `Score: N%` badge (`createScoreBadge`/
`refreshScoreBadge`) shows next to a per-slide "Reset this quiz" control.

- **Quiz**: `savedAnswers[storeKey]` is the selected option's index.
  Bounds-checked against the current `q.options.length` before restoring —
  doesn't currently crash if content was edited and the index is now out
  of range, but the check guards against a future change that might.
- **FillBlank**: keyed by blank `id` (a string, from `__id__` markers in
  the code), not a numeric index — inherently safe if blanks are
  added/removed/renamed later. Optional `item.lang` (defaults to `"go"`)
  turns on syntax coloring for the static code text via
  `window.Zone01Highlight(lang, text)`; the blank `<input>` elements are
  built separately and never touched by that.
- **Matching**: `savedAnswers[storeKey]` is an **array of indices** into
  that set's `pairs[]`. This is the one place that genuinely could crash —
  if a pair got removed after a learner had already matched a
  now-out-of-range index, `pairs[staleIndex].term` would throw. Filtered
  now: `(savedAnswers[storeKey] || []).filter(i => i >= 0 && i < pairs.length)`
  silently drops anything stale instead.

Scoring: 100 correct / 0 wrong / 50 for fillblank-answered-with-a-hint-used
(regardless of final correctness) / matching = % of pairs solved. The
aggregate deck-wide score writes into whatever element has
`id="final-score"`.

## 7. Persistence and failsafes

localStorage keys, all under a prefix derived from the page's own path
(`getStoragePrefix()` — so different courses on the same site never
collide): `current_slide`, `answers`, `scores`, `notified_100`, `version`.

`checkCourseVersion()` wipes everything if the course author bumps a
version string in `initSlideDeck({version: "..."})` — a deliberate,
manual reset mechanism, separate from and in addition to the automatic
matching-index safety filter above.

Two independent safety nets, deliberately layered:

1. **Targeted** (§6 above): the matching-index filter prevents the specific,
   anticipated crash from ever happening.
2. **General backstop**: a self-contained inline `<script>` in `<head>`
   (not this file — it has to survive even if *this file* is what's
   broken) registers a global `error` listener. If an uncaught error
   happens **before** `window.__pageInitialized` gets set (i.e. the deck's
   one synchronous build pass aborted partway through, leaving a blank
   page), it replaces the page with a plain "Internal Error" + "Reset
   Progress" screen — grayscale, no dependency on this file's CSS classes
   or functions, since those might be exactly what's broken. Errors
   *after* that flag is set are left alone — the page already rendered
   successfully and is visibly working, so nuking it over something minor
   afterward (a click handler throwing, say) would do more harm than good.

## 8. Visual/misc systems worth knowing about

- **Dots track**: windowed and scrollable (`setDotsScroll`/`centerDotsOn`),
  not a flat row of N dots — clamps at either end of the sequence rather
  than trying to impossibly center a dot near the boundary. Diamond-grouped
  dots (many slides) show a floating "N/M" position badge
  (`updateGroupBadge`), positioned via a `getBoundingClientRect()` snapshot
  — both this and the dots' own centering have to be explicitly re-run
  after the sidebar opens/closes (not just on slide change), since that
  changes `#nav-bar`'s available width and staleness isn't automatic.
- **Spoiler drag-reveal**: `decorateSpoilers()` — genuine horizontal drag
  past ~40% width required, not a click. Falls back from the live CSS
  diagonal-stripe gradient to a pre-baked SVG tile
  (`getStripeTileUrl()`) when `!hasGpuAcceleration()` **or** `isLinux()` —
  the gradient has a known compositing/seam issue on Linux even with a
  real GPU, not just under software rendering.
- **Keyboard shortcuts**: A/D (slide nav), W/S (scroll current slide
  up/down), Q (toggle sidebar), arrow keys (slide nav). Bound via `e.code`
  (physical key position), not `e.key` (the character produced) —
  layout-independent, so these work the same on a Greek keyboard layout as
  an English one. All guarded against firing while focus is in an
  `<input>`/`<textarea>`/contenteditable element.
