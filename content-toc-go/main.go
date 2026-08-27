// extract_toc — reads a Zone01Guides course HTML file, extracts its
// h1/h2/h3 outline, and (unless -dry-run) inserts id="@slug" into any of
// those headings that don't already have one — so every entry in the
// generated TOC has something stable to link to. See README.md.
//
// SAFETY: this never re-serializes the file through an HTML parser. It
// finds the EXACT byte position to splice ` id="@slug"` into, and only
// ever touches those exact positions — every other byte in the file,
// including whitespace and attribute order elsewhere, is left untouched.
package main

import (
	"flag"
	"fmt"
	"html"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// ── CLI ──────────────────────────────────────────────────────────────────

func main() {
	mode := flag.Int("mode", 3, "which heading levels to include: 0 = eyebrows only, 1 = h1 only, 2 = h1+h2, 3 = h1+h2+h3")
	dryRun := flag.Bool("dry-run", false, "preview everything without writing any changes to the HTML file")
	flag.Usage = printUsage
	flag.Parse()

	if flag.NArg() != 1 {
		printUsage()
		os.Exit(1)
	}
	if *mode < 0 || *mode > 3 {
		fatal("mode must be 0, 1, 2, or 3 (got %d)", *mode)
	}

	path := flag.Arg(0)
	source, err := os.ReadFile(path)
	if err != nil {
		fatal("%v", err)
	}

	run(path, string(source), *mode, *dryRun)
}

func printUsage() {
	fmt.Fprint(os.Stderr, `extract_toc — TOC outline + @slug id insertion for a course HTML file

Usage:
  extract_toc [flags] <course.html>

Flags:
  -mode int      0 = eyebrows only, 1 = h1 only, 2 = h1+h2, 3 = h1+h2+h3  (default 3)
  -dry-run       preview everything, write nothing

Examples:
  extract_toc 01-go-01.html                 # mode 3, writes ids + the .md
  extract_toc -mode=2 01-go-01.html
  extract_toc -mode=0 01-go-01.html         # section eyebrows only
  extract_toc -dry-run -mode=1 01-go-01.html
`)
}

func fatal(format string, args ...interface{}) {
	fmt.Fprintf(os.Stderr, "extract_toc: "+format+"\n", args...)
	os.Exit(1)
}

// inScope decides whether a heading counts for the given mode.
//   - mode 0: ONLY h1s that found a qualifying eyebrow — everything else
//     (h2/h3, and h1s that fell back to their own tag because no eyebrow
//     matched) is excluded entirely. Slides without a qualifying eyebrow
//     get NOTHING in this mode — no fallback, unlike modes 1-3.
//   - modes 1-3: the existing behavior — every heading at or below that
//     level, h1 included either via its eyebrow or (if no eyebrow
//     qualified) directly on itself.
func inScope(h heading, mode int) bool {
	if mode == 0 {
		return h.level == 1 && h.redirectedToEyebrow
	}
	return h.level <= mode
}

// ── data model ───────────────────────────────────────────────────────────

// heading is one h1/h2/h3 found inside a slide's template-literal HTML.
type heading struct {
	level               int    // 1, 2, or 3
	text                string // decoded, tag-stripped inner text
	id                  string // existing id, or "" if none yet
	slideIndex          int    // 0-based, same order as slides[] at runtime
	attrsStart          int    // absolute byte offset: right after "<hN" (or the eyebrow's "<div"), where a new id="" gets spliced in
	hadIDBefore         bool
	redirectedToEyebrow bool // set by applyEyebrowRedirect — only true for h1s that actually found a qualifying eyebrow; see mode 0
}

// ── slide-call scanning (mirrors the earlier Python approach: slides
// aren't literal HTML in the file, they're built at runtime from
// addContent(`...`) / addQuiz(`...`) / etc calls) ──────────────────────

// slideCall is one addContent()/addQuiz()/addFillBlank()/addMatching() call
// found in the file — its function name (needed to scope the eyebrow-slug
// feature to addContent only, see applyEyebrowRedirect) plus its
// template-literal's [start,end) byte range.
type slideCall struct {
	callName string
	start    int
	end      int
}

var slideCallRe = regexp.MustCompile(`(addContent|addQuiz|addFillBlank|addMatching)\s*\(\s*` + "`")

// slideCalls returns each call's function name and its template-literal
// INNER content's byte range, in file order (= slide index order),
// respecting backtick-escaping (\`) so an escaped backtick inside the
// content doesn't end the match early.
func slideCalls(source string) []slideCall {
	var calls []slideCall
	pos := 0
	for {
		loc := slideCallRe.FindStringSubmatchIndex(source[pos:])
		if loc == nil {
			break
		}
		name := source[pos+loc[2] : pos+loc[3]]
		start := pos + loc[1] // just after the opening backtick
		i := start
		for i < len(source) {
			if source[i] == '\\' && i+1 < len(source) {
				i += 2
				continue
			}
			if source[i] == '`' {
				break
			}
			i++
		}
		calls = append(calls, slideCall{callName: name, start: start, end: i})
		pos = i + 1
	}
	return calls
}

// ── heading scanning within one slide's byte range ──────────────────────

// Matches an opening h1/h2/h3 tag, capturing the level and its raw
// attribute string. Deliberately simple ([^>]*) rather than a full
// tokenizer — safe for this content because headings here never contain a
// literal '>' inside an attribute value (documented limitation, see README).
var headingOpenRe = regexp.MustCompile(`<h([123])((?:\s[^>]*)?)>`)
var idAttrRe = regexp.MustCompile(`\bid\s*=\s*(?:"([^"]*)"|'([^']*)')`)
var tagStripRe = regexp.MustCompile(`<[^>]*>`)

func scanHeadings(source string, calls []slideCall) []heading {
	var out []heading
	for slideIndex, call := range calls {
		slideText := source[call.start:call.end]
		for _, m := range headingOpenRe.FindAllStringSubmatchIndex(slideText, -1) {
			level, _ := strconv.Atoi(slideText[m[2]:m[3]])
			attrsStartLocal := m[2] // start of the level-digit; we splice right after "<hN"
			// attrsStartLocal currently points at the digit; the actual
			// splice point is right after it (after "<h" + digit).
			spliceLocal := m[3]
			attrsRaw := slideText[m[4]:m[5]]

			existingID := ""
			if idm := idAttrRe.FindStringSubmatch(attrsRaw); idm != nil {
				if idm[1] != "" {
					existingID = idm[1]
				} else {
					existingID = idm[2]
				}
			}

			// Find the matching closing tag to pull inner text out. Headings
			// don't nest here, so "next </hN>" is enough.
			closeTag := fmt.Sprintf("</h%d>", level)
			restStart := m[1] // end of the ">" of the opening tag
			closeIdx := strings.Index(slideText[restStart:], closeTag)
			innerRaw := ""
			if closeIdx >= 0 {
				innerRaw = slideText[restStart : restStart+closeIdx]
			}
			text := html.UnescapeString(tagStripRe.ReplaceAllString(innerRaw, ""))
			text = strings.TrimSpace(strings.Join(strings.Fields(text), " "))
			if text == "" {
				continue // empty/icon-only heading — nothing to link to
			}

			_ = attrsStartLocal
			out = append(out, heading{
				level:       level,
				text:        text,
				id:          existingID,
				slideIndex:  slideIndex,
				attrsStart:  call.start + spliceLocal, // absolute offset, right after "<hN"
				hadIDBefore: existingID != "",
			})
		}
	}
	return out
}

// Matches <div class="eyebrow" ...> specifically — capturing everything
// from right after "<div" (group 1), so its start position is exactly
// where a new id="" gets spliced in, same convention as headingOpenRe.
var divOpenRe = regexp.MustCompile(`<div((?:\s[^>]*)?)>`)
var eyebrowClassRe = regexp.MustCompile(`\bclass\s*=\s*"eyebrow"`)

// findEyebrowDiv finds the first <div ...> in slideText whose attributes
// contain class="eyebrow" ANYWHERE — not assuming it's the first attribute,
// specifically so this keeps matching on a second run after an id="..."
// has been inserted before class="eyebrow" in the tag.
func findEyebrowDiv(slideText string) (whole, attrs [2]int, found bool) {
	for _, m := range divOpenRe.FindAllStringSubmatchIndex(slideText, -1) {
		attrsRaw := slideText[m[2]:m[3]]
		if eyebrowClassRe.MatchString(attrsRaw) {
			return [2]int{m[0], m[1]}, [2]int{m[2], m[3]}, true
		}
	}
	return [2]int{}, [2]int{}, false
}

// applyEyebrowRedirect looks, for every h1-level heading belonging to an
// addContent() call (never addQuiz/addFillBlank/addMatching — those don't
// use this eyebrow+h1 pattern, they're built by buildInteractiveHeader()
// at runtime instead, not literal HTML in the source), for that slide's
// <div class="eyebrow">...Ενότητα...</div>. If one exists, the h1 heading
// entry's insertion target is REDIRECTED to that eyebrow div instead of
// the h1 tag itself — the h1's own text is still what's shown in the TOC
// (this only changes WHERE the id physically lives), and the slug text is
// still generated from that same h1 text later in assignSlugs().
//
// A slide with no matching eyebrow (no eyebrow at all, or one that exists
// but doesn't say "Ενότητα") is left completely alone — this is how
// glossary/vscodechallenge-style slides end up excluded, structurally,
// without needing an explicit denylist of slide "kinds" to maintain.
func applyEyebrowRedirect(source string, headings []heading, calls []slideCall) {
	for i := range headings {
		if headings[i].level != 1 {
			continue
		}
		call := calls[headings[i].slideIndex]
		if call.callName != "addContent" {
			continue
		}
		slideText := source[call.start:call.end]

		whole, attrs, found := findEyebrowDiv(slideText)
		if !found {
			continue // no eyebrow in this slide at all
		}

		ebCloseIdx := strings.Index(slideText[whole[1]:], "</div>")
		ebText := ""
		if ebCloseIdx >= 0 {
			ebText = slideText[whole[1] : whole[1]+ebCloseIdx]
		}
		if !strings.Contains(strings.ToLower(ebText), "ενότητα") {
			continue // has an eyebrow, but not a "Ενότητα N" one
		}

		// Sanity check: the eyebrow found must actually be the one right
		// before THIS h1 (should always be true given the established
		// authoring convention, but guard against the edge case anyway).
		if call.start+whole[0] >= headings[i].attrsStart {
			continue
		}

		attrsRaw := slideText[attrs[0]:attrs[1]]
		existingID := ""
		if idm := idAttrRe.FindStringSubmatch(attrsRaw); idm != nil {
			if idm[1] != "" {
				existingID = idm[1]
			} else {
				existingID = idm[2]
			}
		}

		headings[i].attrsStart = call.start + attrs[0]
		headings[i].id = existingID
		headings[i].hadIDBefore = existingID != ""
		headings[i].redirectedToEyebrow = true
	}
}

// ── slug generation ──────────────────────────────────────────────────────

var greekMap = map[rune]string{
	'α': "a", 'ά': "a", 'β': "v", 'γ': "g", 'δ': "d", 'ε': "e", 'έ': "e",
	'ζ': "z", 'η': "i", 'ή': "i", 'θ': "th", 'ι': "i", 'ί': "i", 'ϊ': "i", 'ΐ': "i",
	'κ': "k", 'λ': "l", 'μ': "m", 'ν': "n", 'ξ': "x", 'ο': "o", 'ό': "o",
	'π': "p", 'ρ': "r", 'σ': "s", 'ς': "s", 'τ': "t", 'υ': "y", 'ύ': "y", 'ϋ': "y", 'ΰ': "y",
	'φ': "f", 'χ': "ch", 'ψ': "ps", 'ω': "o", 'ώ': "o",
	'Α': "a", 'Ά': "a", 'Β': "v", 'Γ': "g", 'Δ': "d", 'Ε': "e", 'Έ': "e",
	'Ζ': "z", 'Η': "i", 'Ή': "i", 'Θ': "th", 'Ι': "i", 'Ί': "i",
	'Κ': "k", 'Λ': "l", 'Μ': "m", 'Ν': "n", 'Ξ': "x", 'Ο': "o", 'Ό': "o",
	'Π': "p", 'Ρ': "r", 'Σ': "s", 'Τ': "t", 'Υ': "y", 'Ύ': "y",
	'Φ': "f", 'Χ': "ch", 'Ψ': "ps", 'Ω': "o", 'Ώ': "o",
}

var nonSlugCharsRe = regexp.MustCompile(`[^a-z0-9]+`)

// slugify transliterates Greek to Latin, lowercases, and collapses
// everything else down to single hyphens. Not applied to text that already
// has an id — only ever used to invent a NEW one.
func slugify(text string) string {
	var b strings.Builder
	for _, r := range text {
		if latin, ok := greekMap[r]; ok {
			b.WriteString(latin)
		} else {
			b.WriteRune(r)
		}
	}
	s := strings.ToLower(b.String())
	s = nonSlugCharsRe.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if len(s) > 16 {
		s = strings.Trim(s[:16], "-")
	}
	if s == "" {
		s = "untitled"
	}
	return s
}

// assignSlugs generates a unique "@slug" for every heading that doesn't
// already have an id, mutating heading.id in place. Existing ids are
// registered too, so a generated slug can never collide with one you
// already wrote by hand.
func assignSlugs(headings []heading) {
	used := map[string]bool{}
	for _, h := range headings {
		if h.id != "" {
			used[h.id] = true
		}
	}
	for i := range headings {
		if headings[i].id != "" {
			continue
		}
		base := "@" + slugify(headings[i].text)
		candidate := base
		n := 2
		for used[candidate] {
			candidate = fmt.Sprintf("%s-%d", base, n)
			n++
		}
		used[candidate] = true
		headings[i].id = candidate
	}
}

// ── applying edits to the source ─────────────────────────────────────────

type insertion struct {
	pos  int
	text string
}

func applyInsertions(source string, headings []heading, mode int) string {
	var ins []insertion
	for _, h := range headings {
		if !inScope(h, mode) || h.hadIDBefore {
			continue
		}
		ins = append(ins, insertion{pos: h.attrsStart, text: ` id="` + h.id + `"`})
	}
	sort.Slice(ins, func(i, j int) bool { return ins[i].pos > ins[j].pos }) // back-to-front

	out := source
	for _, x := range ins {
		out = out[:x.pos] + x.text + out[x.pos:]
	}
	return out
}

// ── TOC markdown output ──────────────────────────────────────────────────

func buildMarkdown(fileName string, headings []heading, mode int, insertedCount, existingCount int) string {
	var lines []string
	for _, h := range headings {
		if !inScope(h, mode) {
			continue
		}
		safeText := strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;").Replace(truncate(h.text, 45))
		lines = append(lines, fmt.Sprintf(`<a href="#%s" data-slide="%d" class="toc-link toc-h%d">%s</a>`,
			h.id, h.slideIndex, h.level, safeText))
	}

	var b strings.Builder
	fmt.Fprintf(&b, "# TOC outline — %s (mode %d)\n\n", fileName, mode)
	fmt.Fprintf(&b, "%d headings shown, %d slugs inserted, %d already had one.\n\n", len(lines), insertedCount, existingCount)
	b.WriteString("Paste the block below directly into `<div id=\"toc-list\">` in this course's index.html, replacing whatever's currently in there.\n\n")
	b.WriteString("```html\n")
	b.WriteString(strings.Join(lines, "\n"))
	b.WriteString("\n```\n")
	return b.String()
}

// ── run ──────────────────────────────────────────────────────────────────

func run(path, source string, mode int, dryRun bool) {
	calls := slideCalls(source)
	if len(calls) == 0 {
		fatal("no addContent()/addQuiz()/addFillBlank()/addMatching() calls found in %s — wrong file?", path)
	}

	headings := scanHeadings(source, calls)
	applyEyebrowRedirect(source, headings, calls) // must run BEFORE assignSlugs — it doesn't touch .id itself except to reset hadIDBefore correctly for the new target
	assignSlugs(headings)

	insertedCount, existingCount := 0, 0
	for _, h := range headings {
		if !inScope(h, mode) {
			continue
		}
		if h.hadIDBefore {
			existingCount++
		} else {
			insertedCount++
		}
	}

	fmt.Printf("Scanned %d slide calls, found %d headings (h1:%d h2:%d h3:%d).\n",
		len(calls), len(headings), countLevel(headings, 1), countLevel(headings, 2), countLevel(headings, 3))
	fmt.Printf("Mode %d: %d headings in scope — %d already had an id, %d will get a new one.\n",
		mode, insertedCount+existingCount, existingCount, insertedCount)

	if insertedCount > 0 {
		fmt.Println("\nNew ids:")
		for _, h := range headings {
			if inScope(h, mode) && !h.hadIDBefore {
				fmt.Printf("  slide %2d  h%d  %-50s  id=%q\n", h.slideIndex, h.level, truncate(h.text, 50), h.id)
			}
		}
	}

	mdPath := strings.TrimSuffix(path, ".html") + "-toc.md"
	md := buildMarkdown(fileNameOnly(path), headings, mode, insertedCount, existingCount)
	if err := os.WriteFile(mdPath, []byte(md), 0644); err != nil {
		fatal("writing %s: %v", mdPath, err)
	}
	fmt.Printf("\nWrote %s\n", mdPath)

	if dryRun {
		fmt.Println("\n-dry-run: no changes written to the HTML file.")
		return
	}
	if insertedCount == 0 {
		fmt.Println("Nothing to insert — HTML file left untouched.")
		return
	}

	newSource := applyInsertions(source, headings, mode)
	if err := os.WriteFile(path, []byte(newSource), 0644); err != nil {
		fatal("writing %s: %v", path, err)
	}
	fmt.Printf("Inserted %d id attribute(s) into %s.\n", insertedCount, path)
}

func countLevel(headings []heading, level int) int {
	n := 0
	for _, h := range headings {
		if h.level == level {
			n++
		}
	}
	return n
}

func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n-1]) + "…"
}

func fileNameOnly(path string) string {
	parts := strings.Split(strings.ReplaceAll(path, "\\", "/"), "/")
	return parts[len(parts)-1]
}
