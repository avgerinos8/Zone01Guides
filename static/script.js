/* ══════════════════════════════════════════════════════════════════════════
   script.js — reusable slide-deck engine for the Zone01 template.
   Pairs with index.html + style.css.

   DO NOT put course content in this file. This file only defines the
   building blocks (addContent, addQuiz, addFillBlank, addMatching) and the
   rendering/navigation engine. All actual lesson content lives in the
   inline <script> at the bottom of index.html, which calls these functions
   and finishes with initSlideDeck({ version: "..." }).
   ══════════════════════════════════════════════════════════════════════════ */

// ── slide data store ────────────────────────────────────────────────────── ⊃
const slides = [];

/**
 * Adds a plain content slide to the slide deck data array.
 * Accepts raw HTML and optional background configuration options.
 * @param {string} html - Raw HTML for the slide body.
 * @param {Object} [opts] - Background and overlay options.
 */
function addContent(html, opts) {
  slides.push({ type: "content", html, opts: opts || {} });
}

/**
 * Adds one or more multiple-choice questions on a single slide.
 * Accepts either a single question object or an array of question objects.
 * @param {Object|Object[]} qOrArray - Question object or array of questions.
 * @param {Object} [opts] - Optional { bg, overlayAlpha } background options.
 */
function addQuiz(qOrArray, opts) {
  const questions = Array.isArray(qOrArray) ? qOrArray : [qOrArray];
  slides.push({ type: "quiz", data: questions, opts: opts || {} });
}

/**
 * Adds one or more fill-in-the-blank code exercises on a single slide.
 * Accepts code templates containing __id__ markers and answers.
 * @param {Object|Object[]} itemOrArray - Single item or array of items.
 * @param {Object} [opts] - Optional slide header label and note paragraph.
 */
function addFillBlank(itemOrArray, opts) {
  const items = Array.isArray(itemOrArray) ? itemOrArray : [itemOrArray];
  slides.push({ type: "fillblank", data: items, opts: opts || {} });
}

/**
 * Adds a matching-pairs exercise slide. Accepts either a single flat array
 * of {term,def} pairs (one set), or an array of such arrays (2-3 sets
 * stacked on the same slide, each scored and reset independently).
 * @param {Array} setsOrPairs - [{term,def}, ...] or [[{term,def},...], ...].
 * @param {Object} [opts] - Optional label and instructional note options.
 */
function addMatching(setsOrPairs, opts) {
  const sets = Array.isArray(setsOrPairs[0]) ? setsOrPairs : [setsOrPairs];
  slides.push({ type: "matching", data: sets, opts: opts || {} });
}

// ── deterministic shuffle ────────────────────────────────────────────────── ⊃
/**
 * Shuffles an array deterministically using a Linear Congruential Generator.
 * Guarantees consistent ordering across reloads for a given seed.
 * @param {Array} arr - The target array to shuffle.
 * @param {number} seed - The numeric seed used to randomize the order.
 * @returns {Array} A new shuffled copy of the input array.
 */
function shuffleSeed(arr, seed) {
  const a = arr.slice();
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── code blocks and syntax helper ───────────────────────────────────────── ⊃
/**
 * Applies an optional per-slide background image + overlay (shared by
 * content and quiz slides). No-op if opts.bg is not set.
 * @param {HTMLElement} el
 * @param {Object} [opts] - { bg: "path.jpg", overlayAlpha: 0..1 }.
 */
/**
 * Updates the single shared #slide-bg-layer to match the given slide's
 * background opts (or hides it entirely if the slide has no "bg"). Called
 * from goTo() on every navigation — NOT per-slide at render time — since
 * the layer lives outside #deck and is reused across all slides.
 * @param {Object} [opts] - { bg, overlayAlpha, backgroundSize, backgroundRepeat, backgroundPosition }
 */
function updateBackgroundLayer(opts) {
  const layer = document.getElementById("slide-bg-layer");
  if (!layer) return;
  if (!opts || !opts.bg) {
    layer.classList.remove("active");
    return;
  }
  layer.classList.add("active");
  layer.style.setProperty("--slide-bg-image", `url('${opts.bg}')`);
  layer.style.setProperty("--slide-bg-overlay-alpha", opts.overlayAlpha !== undefined ? opts.overlayAlpha : 0.5);
  layer.style.setProperty("--slide-bg-size", opts.backgroundSize || "auto");
  layer.style.setProperty("--slide-bg-repeat", opts.backgroundRepeat || "no-repeat");
  layer.style.setProperty("--slide-bg-position", opts.backgroundPosition || "top left");
}

/**
 * Scans container for code blocks and wraps them with an interactive copy button.
 * Prevents duplicate wrappers by checking existing structure.
 * @param {HTMLElement} container - Container element to decorate.
 */
function decorateCodeBlocks(container) {
  container.querySelectorAll("pre").forEach(preEl => {
    if (preEl.parentElement.classList.contains("code-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "code-wrap";
    preEl.parentNode.insertBefore(wrap, preEl);
    wrap.appendChild(preEl);

    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.addEventListener("click", () => {
      const text = preEl.querySelector("code")?.textContent ?? preEl.textContent;
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = "Copy"; }, 1500);
      });
    });
    wrap.appendChild(btn);
  });
}

/**
 * Best-effort check for real GPU/hardware-accelerated rendering, via the
 * standard WEBGL_debug_renderer_info technique: create a throwaway WebGL
 * context and read back the actual renderer string. Software fallback
 * renderers (SwiftShader, llvmpipe/Mesa, "Microsoft Basic Render Driver",
 * ...) identify themselves in that string — anything else is treated as a
 * real GPU. No WebGL context at all is treated the same as "no GPU".
 * Cached after the first call — this doesn't change during a page's life.
 * @returns {boolean}
 */
let cachedHasGpu = null;
function hasGpuAcceleration() {
  if (cachedHasGpu !== null) return cachedHasGpu;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      cachedHasGpu = false;
      return false;
    }
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).toLowerCase();
    const softwareSignatures = ["swiftshader", "llvmpipe", "software", "microsoft basic render", "mesa"];
    cachedHasGpu = !softwareSignatures.some((sig) => renderer.includes(sig));
  } catch (e) {
    cachedHasGpu = false; // any failure — assume no reliable GPU, prefer the safe fallback
  }
  return cachedHasGpu;
}

/**
 * True on desktop Linux specifically — checked separately from
 * hasGpuAcceleration() because the gradient-seam issue this whole fallback
 * exists for shows up there even WITH a real, hardware-accelerated GPU
 * (renderer string reports a genuine card, softwareSignatures above
 * wouldn't catch it) — something about how Linux's compositor/driver stack
 * handles the live CSS repeating-linear-gradient specifically. Excludes
 * Android on purpose: its user agent also contains "Linux" (same kernel),
 * but it's a distinct platform this issue hasn't been observed on — this
 * means "desktop Linux", not "anything Linux-kernel-based". Cached for the
 * same reason as cachedHasGpu — this doesn't change during a page's life.
 * @returns {boolean}
 */
let cachedIsLinux = null;
function isLinux() {
  if (cachedIsLinux !== null) return cachedIsLinux;
  const ua = navigator.userAgent || "";
  cachedIsLinux = ua.includes("Linux") && !ua.includes("Android");
  return cachedIsLinux;
}

/**
 * Builds (once, cached) a small SVG data-URI tile with the diagonal stripe
 * pattern already "baked in" as three explicit diagonal lines — the robust
 * fallback for when hasGpuAcceleration() is false. See decorateSpoilers()
 * for how this is applied only in that case; when a real GPU is detected,
 * style.css's own repeating-linear-gradient(45deg, ...) is used instead
 * (untouched, left as the prettier default — see the .spoiler-lock rule).
 *
 * NOT a patternTransform:rotate(45) on a square tile of stacked rects,
 * which looked fine as a single isolated tile but did NOT seamlessly
 * repeat once actually tiled via background-repeat (verified by rendering
 * both approaches head-to-head): rotating a square tile's content produces
 * a "brick"/chevron artifact at every tile boundary once repeated at scale.
 *
 * The fix: draw the diagonal directly, as a line with stroke-width, in a
 * PLAIN axis-aligned tile — no rotation at all. One line through the tile,
 * plus two more copies shifted by exactly HALF the tile size, perpendicular
 * to the line's own direction (not a full tile-size shift — that also
 * produces a "checkerboard" artifact instead) so the corners a single
 * diagonal line would otherwise miss are covered too.
 *
 * Reads --tone-2-rgb / --tone-1-rgb from the page at call time (not
 * hardcoded hex) so it still follows the live theme; cached after the first
 * call since every lock shares the same two colors.
 * @returns {string} a `url("data:image/svg+xml,...")` value.
 */
let cachedStripeTileUrl = null;
function getStripeTileUrl() {
  if (cachedStripeTileUrl) return cachedStripeTileUrl;

  const root = getComputedStyle(document.documentElement);
  const tone2 = root.getPropertyValue("--tone-2-rgb").trim() || "35, 6, 14";
  const tone1 = root.getPropertyValue("--tone-1-rgb").trim() || "18, 4, 1";

  const T = 40; // tile size (px) — also the stripe repeat period
  const W = 20; // stroke width (px) — the band's own visual thickness
  const H = T / 2; // perpendicular shift for the two corner-covering copies — HALF the tile, not a full T

  // Main line runs top-left -> bottom-right ("\"); the two extra copies are
  // genuine parallel translates of it — verified by checking the SAME shift
  // vector applies to both of a copy's endpoints, not just picked to "look"
  // shifted (an earlier attempt got this subtly wrong and broke tiling).
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${T}' height='${T}'>
    <rect width='${T}' height='${T}' fill='rgba(${tone2}, 1)'/>
    <line x1='0' y1='0' x2='${T}' y2='${T}' stroke='rgba(${tone1}, 0.92)' stroke-width='${W}'/>
    <line x1='${H}' y1='${-H}' x2='${T + H}' y2='${T - H}' stroke='rgba(${tone1}, 0.92)' stroke-width='${W}'/>
    <line x1='${-H}' y1='${H}' x2='${T - H}' y2='${T + H}' stroke='rgba(${tone1}, 0.92)' stroke-width='${W}'/>
  </svg>`;

  cachedStripeTileUrl = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  return cachedStripeTileUrl;
}

/**
 * Wires up drag-to-reveal "spoiler" blocks. Markup pattern (write this by
 * hand inside addContent()'s HTML):
 *   <div class="spoiler">
 *     <div class="spoiler-lock"><span>Drag to reveal →</span></div>
 *     <pre><code>...</code></pre>
 *   </div>
 * Requires an actual horizontal DRAG past ~40% of the lock's width to
 * reveal — a simple click/tap does nothing, on purpose.
 *
 * Every way a drag can end (pointerup, pointercancel, pointerleave, touchend)
 * runs through the SAME finishDrag() — past the 40% threshold it reveals,
 * short of it it springs back past 0 with an overshoot/shake proportional
 * to how far it had traveled. Earlier this file gave pointerleave its own
 * separate always-snap-back handler, which broke reveals near the far edge:
 * dragging close to 100% naturally moves the pointer outside the lock's own
 * bounds, so pointerleave fired (and forced a snap-back) BEFORE pointerup
 * had a chance to register the reveal. Sharing one function that checks the
 * threshold first fixes that, and also makes the shake happen on every
 * short release, not only ones that exit the lock's bounds.
 *
 * Also classifies each lock as "thin" (.spoiler-lock.thin, toggled by
 * updateThinClass()) so style.css can center a one-line-tall label instead
 * of top-aligning it. This uses a ResizeObserver rather than a one-off
 * measurement + window "resize" listener: the course template pre-renders
 * EVERY slide's HTML upfront (see the note in _viz-common.js), so at the
 * moment decorateSpoilers() first runs for a given slide, that slide is
 * very likely not the active/visible one yet — offsetHeight would read 0
 * and wrongly classify it "thin" forever, since a plain resize listener
 * never re-fires just from switching slides. ResizeObserver fires again the
 * moment the element actually gets a real box (e.g. once its slide becomes
 * active), which a one-off offsetHeight check can't do.
 * @param {HTMLElement} container
 */
function decorateSpoilers(container) {
  container.querySelectorAll(".spoiler-lock").forEach(lock => {
    if (lock.dataset.wired) return;
    lock.dataset.wired = "1";

    // Only override anything when there's no real GPU to composite the live
    // CSS gradient correctly, OR when on desktop Linux — see isLinux()'s own
    // comment for why that's checked separately from hasGpuAcceleration()
    // (the seam issue shows up there even with a genuine GPU). Everywhere
    // else, leave EVERYTHING — including background-position — completely
    // untouched: this is the same repeating-linear-gradient(45deg, ...)
    // that was never robust to a non-zero position in the first place
    // (that's the original tiling-seam bug from earlier in this feature).
    // The random-origin cosmetic only applies where it's actually safe: on
    // the SVG tile, which handles any offset cleanly (verified separately).
    if (!hasGpuAcceleration() || isLinux()) {
      lock.style.backgroundImage = getStripeTileUrl();
      lock.style.backgroundPosition =
        `${Math.floor(Math.random() * 200)}px ${Math.floor(Math.random() * 200)}px`;
    }

    let dragging = false;
    let startX = 0;
    let width = 0;

    function pointX(e) {
      if (e.touches && e.touches.length) return e.touches[0].clientX;
      if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX; // touchend: e.touches is already empty by then
      return e.clientX;
    }

    // A lock under this height can't fit the default top-aligned label
    // without the text looking cramped against its top edge — below the
    // threshold, style.css centers it instead (see .spoiler-lock.thin).
    const THIN_HEIGHT_PX = 64;

    function updateThinClass() {
      lock.classList.toggle("thin", lock.offsetHeight < THIN_HEIGHT_PX);
    }
    updateThinClass();
    if (window.ResizeObserver) {
      new ResizeObserver(updateThinClass).observe(lock);
    } else {
      window.addEventListener("resize", updateThinClass); // very old browsers only
    }

    function onDown(e) {
      dragging = true;
      startX = pointX(e);
      width = lock.offsetWidth;
      lock.classList.remove("snapping-back");
      lock.style.transition = "none";
      lock.classList.add("dragging");
    }

    function onMove(e) {
      if (!dragging) return;
      const dx = Math.max(0, pointX(e) - startX);
      lock.style.transform = `translateX(${dx}px)`;
    }

    /**
     * Runs on the FIRST of pointerup/pointercancel/pointerleave/touchend to
     * fire for the current drag — whichever event triggers it, whether it
     * REVEALS only depends on how far the drag got (dx), not on which event
     * ended it. The shake's INTENSITY does still depend on that, though:
     * releasing while still inside the lock's bounds is subtle, leaving the
     * bounds mid-drag keeps the original, stronger "slam".
     * @param {Event} e
     * @param {boolean} exitedBounds - true only for pointerleave (the pointer
     *   left the lock's own box while still mid-drag); false for a release
     *   that happened with the pointer still over the lock.
     */
    function finishDrag(e, exitedBounds) {
      if (!dragging) return;
      dragging = false;
      lock.classList.remove("dragging");

      const dx = Math.max(0, pointX(e) - startX);

      if (dx > width * 0.5) {
        lock.style.transition = "transform .25s ease, opacity .25s ease";
        lock.style.transform = `translateX(${width}px)`;
        lock.style.opacity = "0";
        lock.classList.add("revealed");
        setTimeout(() => { lock.style.display = "none"; }, 250);
        return;
      }

      // Short of the threshold — spring back past 0 with a shake, scaled to
      // how far along the drag had gotten. A drag that barely started gets
      // a small nudge; one that nearly reached the reveal threshold gets a
      // much harder "slam" back. Intensity itself depends on exitedBounds:
      // released in place (subtle) vs. dragged out past the lock's edge
      // (the original, stronger feel).
      const progress = width > 0 ? Math.min(1, dx / width) : 0;
      const overshoot = exitedBounds
        ? -(8 + progress * 92)  // left the bounds — original intensity
        : -(2 + progress * 12); // released inside — subtle, half intensity

      lock.style.setProperty("--sb-start", dx + "px");
      lock.style.setProperty("--sb-overshoot", overshoot + "px");
      lock.style.transition = "none";
      lock.style.transform = `translateX(${dx}px)`; // animation's 0% picks up from here

      // Force a reflow before re-adding the class so the animation
      // restarts cleanly even if triggered again before the previous
      // snap-back finished.
      lock.classList.remove("snapping-back");
      void lock.offsetWidth;
      lock.classList.add("snapping-back");
    }

    lock.addEventListener("animationend", (e) => {
      if (e.animationName !== "spoiler-snapback") return;
      lock.classList.remove("snapping-back");
      lock.style.transform = "translateX(0px)";
    });

    lock.addEventListener("pointerdown", onDown);
    lock.addEventListener("pointermove", onMove);
    lock.addEventListener("pointerup", (e) => finishDrag(e, false));
    lock.addEventListener("pointercancel", (e) => finishDrag(e, false));
    lock.addEventListener("pointerleave", (e) => finishDrag(e, true));
    // touch fallback for browsers without full Pointer Events support
    lock.addEventListener("touchstart", onDown, { passive: true });
    lock.addEventListener("touchmove", onMove, { passive: true });
    lock.addEventListener("touchend", (e) => finishDrag(e, false));
  });
}

// ── storage keys and state persistence ──────────────────────────────────── ⊃
let savedAnswers = {};
let savedScores = {}; // storeKey -> 0 | 50 | 100, see computeTotalScore()
let current = 0;
let activeCourseVersion = "1.0.0";

/**
 * Generates a unique storage key prefix based on the current page URL path.
 * Keeps local storage progress isolated between different lessons/HTML pages.
 * @returns {string} Unique storage key prefix.
 */
function getStoragePrefix() {
  return "quiz_deck_" + window.location.pathname.replace(/[^a-zA-Z0-9]/g, "_") + "_";
}

/**
 * Validates stored course version against current active HTML version.
 * Resets local storage progress for this specific course if version changes.
 * @param {string} courseVersion - Current release version defined by HTML page.
 */
function checkCourseVersion(courseVersion) {
  activeCourseVersion = courseVersion;
  const prefix = getStoragePrefix();
  const versionKey = prefix + "version";
  const savedVersion = localStorage.getItem(versionKey);

  if (savedVersion !== courseVersion) {
    localStorage.removeItem(prefix + "current_slide");
    localStorage.removeItem(prefix + "answers");
    localStorage.removeItem(prefix + "scores");
    localStorage.removeItem(prefix + "notified_100"); // allow re-notification on the new version
    localStorage.setItem(versionKey, courseVersion);
  }

  current = parseInt(localStorage.getItem(prefix + "current_slide")) || 0;
  savedAnswers = JSON.parse(localStorage.getItem(prefix + "answers")) || {};
  savedScores = JSON.parse(localStorage.getItem(prefix + "scores")) || {};
}

/**
 * Persists user answer state to local storage using unique page prefix.
 */
function persistAnswers() {
  const prefix = getStoragePrefix();
  localStorage.setItem(prefix + "answers", JSON.stringify(savedAnswers));
}

/**
 * Persists score state (0/50/100 per storeKey) to local storage.
 */
function persistScores() {
  localStorage.setItem(getStoragePrefix() + "scores", JSON.stringify(savedScores));
}

/**
 * Persists current slide index to local storage using unique page prefix.
 * @param {number} slideIndex - Active slide index.
 */
function persistCurrentSlide(slideIndex) {
  const prefix = getStoragePrefix();
  localStorage.setItem(prefix + "current_slide", slideIndex);
}

// ── scoring: 0 (wrong) / 50 (hint used) / 100 (correct) per storeKey ────── ⊃
/**
 * @param {number} pct
 * @returns {"good"|"mid"|"bad"} CSS tier class matching existing --correct/--accent/--wrong tokens.
 */
function scoreTier(pct) {
  if (pct >= 70) return "good";
  if (pct >= 40) return "mid";
  return "bad";
}

/**
 * Builds a small "Score: N%" pill and appends it to a header row.
 * @param {HTMLElement} headerEl
 * @returns {HTMLElement} the badge element, update via refreshScoreBadge().
 */
function createScoreBadge(headerEl) {
  const badge = document.createElement("span");
  badge.className = "score-badge";
  badge.textContent = "Score: —";
  headerEl.appendChild(badge);
  return badge;
}

/**
 * Recomputes a slide's own score (average over its storeKeys) and updates the badge.
 * @param {HTMLElement} badge
 * @param {string[]} storeKeys - every storeKey that belongs to this slide.
 */
function refreshScoreBadge(badge, storeKeys) {
  const relevant = storeKeys.filter(k => savedScores[k] !== undefined);
  badge.classList.remove("good", "mid", "bad");
  if (relevant.length === 0) {
    badge.textContent = "Score: —";
    return;
  }
  const avg = Math.round(relevant.reduce((sum, k) => sum + savedScores[k], 0) / relevant.length);
  badge.textContent = "Score: " + avg + "%";
  badge.classList.add(scoreTier(avg));
}

/**
 * @returns {{percent:number, answered:number, total:number}} always returns
 *   a value (percent is 0 when nothing is answered yet) — the 3 message
 *   states below are what distinguish "not started" from "0%".
 */
function computeTotalScore() {
  const vals = Object.values(savedScores);
  let total = 0;
  slides.forEach(s => {
    if (s.type === "quiz") total += s.data.length;
    else if (s.type === "fillblank") total += s.data.length;
    else if (s.type === "matching") total += s.data.length; // one per set
  });
  const percent = vals.length === 0 ? 0 : Math.round(vals.reduce((a, b) => a + b, 0) / total);
  return { percent, answered: vals.length, total };
}

/**
 * Fills the #final-score placeholder (if present in the HTML) with the
 * course's aggregate result. Reads only already-computed savedScores — never
 * re-grades anything. Three states: not started / in progress / complete.
 * Called on init and whenever any test/exercise anywhere gets (re)scored.
 */
function updateTotalScoreDisplay() {
  const el = document.getElementById("final-score");
  const { percent, answered, total } = computeTotalScore();
  if (el) {
    if (answered === 0) {
      el.textContent = "Κάνε το μάθημα και εδώ θα γράφεται η τελική σου βαθμολογία!";
    } else if (answered < total) {
      el.textContent = "Αποτέλεσμα μέχρι στιγμής (Score %): " + percent + "%";
    } else {
      el.textContent = "Συγχαρητήρια! Ολοκλήρωσες το μάθημα με τελικό αποτέλεσμα (Score %): " + percent + "%";
    }
  }
  maybeNotifyCompletion(percent, answered, total);
}

// ── completion notification (opt-in, no-backend email via Apps Script) ──── ⊃
/**
 * When the course is configured with a notifyUrl (via initSlideDeck's opts)
 * and the deck reaches 100% for the FIRST time on this browser, sends a
 * one-shot POST with the score + a per-slide breakdown to that URL — meant
 * to point at a Google Apps Script Web App that logs it to a Sheet and
 * emails the course author. No-op entirely if notifyUrl was never set.
 * Guards against re-sending on every reload via a dedicated localStorage
 * flag (separate from savedScores, so clearing progress doesn't silently
 * re-trigger a duplicate email either — see performHardReset()).
 * @param {number} percent
 * @param {number} answered
 * @param {number} total
 */
function maybeNotifyCompletion(percent, answered, total) {
  if (!notifyUrl) return;
  if (answered === 0 || answered < total || percent < 100) return;

  const prefix = getStoragePrefix();
  const notifiedKey = prefix + "notified_100";
  if (localStorage.getItem(notifiedKey)) return; // already sent for this course+browser
  localStorage.setItem(notifiedKey, "1");

  const breakdown = [];
  slides.forEach((s, idx) => {
    if (s.type === "quiz" || s.type === "fillblank" || s.type === "matching") {
      const label = (s.opts && s.opts.label) || (s.type === "quiz" ? "Quiz Checkpoint" : s.type === "fillblank" ? "Fill in the Blank" : "Matching Pairs");
      const keyPrefix = idx + (s.type === "quiz" ? "_" : s.type === "fillblank" ? "_fb_" : "_match_");
      s.data.forEach((_, subIdx) => {
        const key = keyPrefix + subIdx;
        if (key in savedScores) {
          breakdown.push({ label: "Slide " + (idx + 1) + " — " + label, score: savedScores[key] });
        }
      });
    }
  });

  fetch(notifyUrl, {
    method: "POST",
    mode: "no-cors", // Apps Script Web Apps don't return CORS headers; fire-and-forget
    headers: { "Content-Type": "text/plain" }, // text/plain avoids a CORS preflight
    body: JSON.stringify({
      course: document.title || window.location.pathname,
      score: percent,
      studentName: (window.STUDENT_NAME || ""), // optional, see index.html comment
      details: { breakdown }
    })
  }).catch(() => {
    // Best-effort only — a failed notification should never break the
    // student's experience of the course. Un-set the flag so it retries
    // next time they revisit this page after reaching 100%.
    localStorage.removeItem(notifiedKey);
  });
}

// ── multiple-choice question renderer ───────────────────────────────────── ⊃
/**
 * Renders a single multiple-choice question inside a quiz box container.
 * Handles answer click events, correctness feedback, and state persistence.
 * @param {HTMLElement} box - Container element to append question to.
 * @param {Object} q - Question data object.
 * @param {string} storeKey - Unique key for local storage persistence.
 * @param {Function} [onScored] - Called after this question's score is (re)written.
 */
function renderQuestion(box, q, storeKey, onScored) {
  const order = q._order;

  const qDiv = document.createElement("div");
  qDiv.className = "quiz-q";
  qDiv.textContent = q.q;
  box.appendChild(qDiv);

  // Optional code block after the question text (opt-in via q.code, with
  // an optional q.lang for automatic syntax coloring — same language ids
  // as the fill-blank item.lang / lang-* highlighter classes, e.g. "go").
  // Whitespace/newlines in q.code behave exactly like inside a <pre>: no
  // HTML is parsed, so authors can freely write < > & without escaping.
  // Omitting q.code changes nothing — every existing question without it
  // renders exactly as before.
  if (q.code) {
    const pre = document.createElement("pre");
    pre.className = "quiz-code-block";
    const codeEl = document.createElement("code");
    if (q.lang && window.Zone01Highlight) {
      codeEl.classList.add("lang-" + q.lang);
      codeEl.innerHTML = window.Zone01Highlight(q.lang, q.code);
      codeEl.dataset.highlighted = "1"; // pre-highlighted, skip the MutationObserver re-pass
    } else {
      codeEl.textContent = q.code;
    }
    pre.appendChild(codeEl);
    box.appendChild(pre);
  }

  const optsDiv = document.createElement("div");
  optsDiv.className = "quiz-options";

  const explainDiv = document.createElement("div");
  explainDiv.className = "quiz-explain";

  // Optional multi-correct support (opt-in via q.alsoCorrect): an array of
  // EXTRA 0-based option indices that also count as correct, alongside the
  // required q.correct. The UI stays single-click (learner picks exactly
  // one option, as always) — this only widens which single pick counts as
  // right. Every existing question without q.alsoCorrect behaves exactly
  // as before: isCorrect(i) reduces to the original `i === q.correct`.
  function isCorrect(i) {
    return i === q.correct || (Array.isArray(q.alsoCorrect) && q.alsoCorrect.includes(i));
  }

  function handleSelection(selectedIndex, clickedBtn) {
    const allBtns = optsDiv.querySelectorAll(".quiz-opt");
    allBtns.forEach(b => b.classList.add("disabled"));

    if (isCorrect(selectedIndex)) {
      if (clickedBtn) clickedBtn.classList.add("correct");
      explainDiv.innerHTML = "<strong>CORRECT!</strong><br>" + q.explain;
    } else {
      if (clickedBtn) clickedBtn.classList.add("wrong");
      explainDiv.innerHTML = "<strong>WRONG.</strong><br>" + q.explain;
    }

    allBtns.forEach((b, i2) => {
      if (isCorrect(order[i2])) b.classList.add("correct");
      if (!clickedBtn && order[i2] === selectedIndex && !isCorrect(selectedIndex)) {
        b.classList.add("wrong");
      }
    });

    allBtns.forEach(b => {
      const badge = b.querySelector(".quiz-badge");
      if (!badge) return;
      if (b.classList.contains("correct")) badge.textContent = "CORRECT";
      else if (b.classList.contains("wrong")) badge.textContent = "WRONG";
    });

    explainDiv.classList.add("show");

    savedScores[storeKey] = isCorrect(selectedIndex) ? 100 : 0;
    persistScores();
    if (onScored) onScored();
  }

  order.forEach(origIndex => {
    const btn = document.createElement("button");
    btn.className = "quiz-opt";
    const label = document.createElement("span");
    label.textContent = q.options[origIndex];
    const badge = document.createElement("span");
    badge.className = "quiz-badge";
    btn.appendChild(label);
    btn.appendChild(badge);

    btn.addEventListener("click", () => {
      savedAnswers[storeKey] = origIndex;
      persistAnswers();
      handleSelection(origIndex, btn);
    });

    optsDiv.appendChild(btn);
  });

  box.appendChild(optsDiv);
  box.appendChild(explainDiv);

  // Bounds-checked: a saved index from before the author edited q.options
  // (removed/reordered choices) could now be out of range. isCorrect()
  // itself is a plain numeric comparison so this doesn't currently crash
  // either way, but skipping an out-of-range restore here is harmless and
  // guards against any future change that indexes q.options[selectedIndex]
  // directly.
  if (savedAnswers[storeKey] !== undefined && savedAnswers[storeKey] < q.options.length) {
    handleSelection(savedAnswers[storeKey], null);
  }
}

// ── fill-in-the-blank renderer ──────────────────────────────────────────── ⊃
/**
 * Renders a fill-in-the-blank code exercise with interactive inputs.
 * Restores input values and validation state from local storage.
 * @param {HTMLElement} wrap - Container element to append exercise to.
 * @param {Object} item - Exercise data item.
 * @param {string} storeKey - Unique key for local storage persistence.
 */
/**
 * Renders one fill-in-the-blank exercise, including its "Reveal hint" button
 * and score (100 correct / 50 if any hint was revealed / 0 wrong).
 * @param {HTMLElement} wrap
 * @param {Object} item - { code, blanks: [{id, answer}], explain }.
 * @param {string} storeKey
 * @param {Function} [onScored] - Called after this item's score is (re)written.
 */
function renderFillBlank(wrap, item, storeKey, onScored) {
  const box = document.createElement("div");
  box.className = "fb-item";

  const pre = document.createElement("pre");
  const codeEl = document.createElement("code");

  const savedData = savedAnswers[storeKey] || { inputs: {}, checked: false, revealed: [] };
  const revealedIds = new Set(savedData.revealed || []);

  /** Grows/shrinks a fill-blank input to fit its content, ~4ch minimum. */
  function autosizeInput(inp) {
    inp.style.width = Math.max(4, inp.value.length + 2) + "ch";
  }

  // Syntax coloring: defaults to "go" when item.lang isn't set (this is a
  // Go course — most fill-blank code is Go), overridable per-item via
  // item.lang: "js" | "html" | "css" | "go". Only the static text segments
  // between blanks are colored, via highlighter.js's exported
  // window.Zone01Highlight(lang, text) — the blank <input> elements
  // themselves are never touched by this, unlike putting a class="lang-*"
  // directly on <code> (which would wipe them out, since the highlighter
  // normally rewrites a code element's whole innerHTML from its
  // textContent).
  const lang = item.lang || "go";
  if (window.Zone01Highlight) {
    codeEl.classList.add("lang-" + lang, "fb-code-colored");
    // Pre-mark as highlighted so highlighter.js's MutationObserver (which
    // would otherwise see this class-"lang-*" <code> get inserted and try
    // to rewrite its whole innerHTML from textContent) skips it entirely —
    // that rewrite would wipe out the live <input> blanks built below.
    codeEl.dataset.highlighted = "1";
  }

  const parts = item.code.split(/__([a-zA-Z0-9]+)__/g);
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (window.Zone01Highlight) {
        const span = document.createElement("span");
        span.innerHTML = window.Zone01Highlight(lang, parts[i]);
        codeEl.appendChild(span);
      } else {
        codeEl.appendChild(document.createTextNode(parts[i]));
      }
    } else {
      const blankId = parts[i];
      const wrap = document.createElement("span");
      wrap.className = "fb-blank-wrap";
      const inp = document.createElement("input");
      inp.type = "text";
      inp.className = "fb-blank";
      inp.dataset.blankId = blankId;
      inp.autocomplete = "off";
      inp.spellcheck = false;
      if (savedData.inputs && savedData.inputs[blankId] !== undefined) {
        inp.value = savedData.inputs[blankId];
      }
      autosizeInput(inp);
      inp.addEventListener("input", () => {
        autosizeInput(inp);
        if (!savedAnswers[storeKey]) {
          savedAnswers[storeKey] = { inputs: {}, checked: false, revealed: [] };
        }
        savedAnswers[storeKey].inputs[blankId] = inp.value;
        persistAnswers();
      });
      wrap.appendChild(inp);
      codeEl.appendChild(wrap);
    }
  }
  pre.appendChild(codeEl);
  box.appendChild(pre);

  // "Reveal hint": shows ONE not-yet-revealed answer as plain text, for a
  // currently-empty blank — never says which blank it belongs to. Repeated
  // clicks reveal more, one at a time, until every blank has been revealed.
  // Disabled entirely when the exercise has only 1 blank (nothing to guess
  // which slot a reveal would go in, so hinting would just be the answer).
  // Button is appended BEFORE the hints container so its position never
  // shifts as more hints accumulate below it — lets you click repeatedly
  // without the button moving out from under the cursor.
  const totalBlanks = item.blanks.length;
  const hintBtn = document.createElement("button");
  hintBtn.className = "fb-hint-btn";
  hintBtn.type = "button";

  const hintsDiv = document.createElement("div");
  hintsDiv.className = "fb-hints";

  if (totalBlanks <= 1) {
    hintBtn.textContent = "[Time to Guess]";
    hintBtn.disabled = true;
    box.appendChild(hintBtn);
    box.appendChild(hintsDiv);
  } else {
    box.appendChild(hintBtn);
    box.appendChild(hintsDiv);

    function renderHints() {
      hintsDiv.innerHTML = "";
      revealedIds.forEach(id => {
        const answer = item.blanks.find(b => b.id === id)?.answer ?? "";
        const line = document.createElement("div");
        line.className = "fb-hint-line";
        line.textContent = answer;
        hintsDiv.appendChild(line);
      });
      if (revealedIds.size >= totalBlanks) {
        hintBtn.textContent = "Everything Shown";
        hintBtn.disabled = true;
      } else {
        hintBtn.textContent = "Reveal hint (" + revealedIds.size + "/" + totalBlanks + ")";
      }
    }

    hintBtn.addEventListener("click", () => {
      const emptyIds = Array.from(box.querySelectorAll(".fb-blank"))
        .filter(inp => inp.value.trim() === "")
        .map(inp => inp.dataset.blankId)
        .filter(id => !revealedIds.has(id));
      if (emptyIds.length === 0) return;
      revealedIds.add(emptyIds[Math.floor(Math.random() * emptyIds.length)]);
      if (!savedAnswers[storeKey]) {
        savedAnswers[storeKey] = { inputs: {}, checked: false, revealed: [] };
      }
      savedAnswers[storeKey].revealed = Array.from(revealedIds);
      persistAnswers();
      renderHints();
    });

    renderHints();
  }

  const actions = document.createElement("div");
  actions.className = "fb-actions";
  const checkBtn = document.createElement("button");
  checkBtn.className = "fb-check-btn";
  checkBtn.type = "button";
  checkBtn.textContent = "Check";
  const resultSpan = document.createElement("span");
  resultSpan.className = "fb-result";
  actions.appendChild(checkBtn);
  actions.appendChild(resultSpan);
  box.appendChild(actions);

  const explainDiv = document.createElement("div");
  explainDiv.className = "quiz-explain";
  explainDiv.innerHTML = item.explain;
  box.appendChild(explainDiv);

  function evaluateBlanks() {
    const inputs = box.querySelectorAll(".fb-blank");
    let allCorrect = true;
    inputs.forEach(inp => {
      const expected = item.blanks.find(b => b.id === inp.dataset.blankId)?.answer ?? "";
      const ok = inp.value.trim().toLowerCase() === expected.trim().toLowerCase();
      inp.classList.remove("correct", "wrong");
      inp.classList.add(ok ? "correct" : "wrong");
      inp.disabled = true;

      const wrap = inp.parentElement;
      wrap.classList.remove("wrong");
      const oldCorrection = wrap.querySelector(".fb-correction");
      if (oldCorrection) oldCorrection.remove();
      if (!ok) {
        wrap.classList.add("wrong");
        const correction = document.createElement("span");
        correction.className = "fb-correction";
        correction.textContent = expected;
        wrap.appendChild(correction);
      }

      if (!ok) allCorrect = false;
    });
    const usedHint = revealedIds.size > 0;
    resultSpan.textContent = allCorrect
      ? (usedHint ? "CORRECT! (with hint — 50%)" : "CORRECT!")
      : "There are mistakes — check the highlighted fields.";
    resultSpan.className = "fb-result " + (allCorrect && !usedHint ? "ok" : "bad");
    explainDiv.classList.add("show");
    checkBtn.disabled = true;
    hintBtn.disabled = true;

    savedScores[storeKey] = usedHint ? 50 : (allCorrect ? 100 : 0);
    persistScores();
    if (onScored) onScored();
  }

  checkBtn.addEventListener("click", () => {
    if (!savedAnswers[storeKey]) {
      savedAnswers[storeKey] = { inputs: {}, checked: false, revealed: [] };
    }
    box.querySelectorAll(".fb-blank").forEach(inp => {
      savedAnswers[storeKey].inputs[inp.dataset.blankId] = inp.value;
    });
    savedAnswers[storeKey].checked = true;
    persistAnswers();
    evaluateBlanks();
  });

  if (savedData.checked) {
    evaluateBlanks();
  }

  wrap.appendChild(box);
}

// ── matching-pairs renderer ─────────────────────────────────────────────── ⊃
/**
 * Renders a matching-pairs exercise separating solved pairs from active options.
 * Displays matched pairs side-by-side with a visual connecting line.
 * Score = percentage of pairs matched so far (100 once all are solved).
 * @param {HTMLElement} wrap - Container element to append exercise to.
 * @param {Array} pairs - Array of term-definition matching objects.
 * @param {number} seed - Seed used for shuffling options deterministically.
 * @param {string} storeKey - Unique key for local storage persistence.
 * @param {Function} [onScored] - Called after this slide's score is (re)written.
 */
/**
 * Renders ONE matching-pairs set (a slide may stack 2-3 of these — see the
 * "matching" branch in renderSlide). Displays matched pairs side-by-side
 * with a visual connecting line, separated from the still-active options.
 * Score = percentage of pairs matched so far (100 once all are solved).
 * @param {HTMLElement} wrap - Container element to append exercise to.
 * @param {Array} pairs - Array of term-definition matching objects.
 * @param {number} seed - Seed used for shuffling options deterministically.
 * @param {string} storeKey - Unique key for local storage persistence.
 * @param {Function} [onScored] - Called after this set's score is (re)written.
 * @param {string} [setLabel] - Optional small heading above this set (used when multiple sets share a slide).
 */
function renderMatching(wrap, pairs, seed, storeKey, onScored, setLabel, allowHTML) {
  const container = document.createElement("div");
  container.className = "matching-container";

  if (setLabel) {
    const heading = document.createElement("div");
    heading.className = "matching-set-label";
    heading.textContent = setLabel;
    container.appendChild(heading);
  }

  const matchedArea = document.createElement("div");
  matchedArea.className = "matched-area";
  matchedArea.style.display = "flex";
  matchedArea.style.flexDirection = "column";
  matchedArea.style.gap = "10px";
  matchedArea.style.marginBottom = "20px";

  const grid = document.createElement("div");
  grid.className = "matching-wrap";
  const leftCol = document.createElement("div");
  leftCol.className = "match-col";
  const rightCol = document.createElement("div");
  rightCol.className = "match-col";

  const leftOrder = shuffleSeed(pairs.map((_, i) => i), seed);
  const rightOrder = shuffleSeed(pairs.map((_, i) => i), seed + 101);

  // Filters out any saved index that no longer has a matching entry in
  // pairs[] — e.g. the course author removed one matching pair after a
  // learner had already matched it. Without this, that stale index would
  // reach createMatchedRow() below, which does pairs[pairIndex].term —
  // undefined.term throws, and since all slides build in one synchronous
  // pass in initSlideDeck(), that uncaught exception would abort
  // everything after it, leaving a blank page (see the inline fallback
  // script in <head> for the general backstop; this is the specific fix
  // for this specific, anticipated cause).
  const matchedPairs = new Set(
    (savedAnswers[storeKey] || []).filter(i => i >= 0 && i < pairs.length)
  );
  if (matchedPairs.size > 0) {
    savedScores[storeKey] = Math.round((matchedPairs.size / pairs.length) * 100);
  }
  let selected = null;

  function createMatchedRow(pairIndex) {
    const row = document.createElement("div");
    row.className = "matched-row";
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.justifyContent = "space-between";
    row.style.gap = "12px";

    const termBox = document.createElement("button");
    termBox.className = "match-btn matched";
    termBox.style.flex = "1";
    termBox.style.margin = "0";
    // v2, opt-in via opts.allowHTML on addMatching(): default (falsy) keeps
    // the original textContent path, unchanged for existing lessons.
    if (allowHTML) termBox.innerHTML = pairs[pairIndex].term; else termBox.textContent = pairs[pairIndex].term;

    const line = document.createElement("div");
    line.style.flex = "0 0 60px";
    line.style.height = "2px";
    line.style.backgroundColor = "var(--accent, #4caf50)";
    line.style.display = "flex";
    line.style.alignItems = "center";
    line.style.justifyContent = "center";

    const badge = document.createElement("span");
    badge.textContent = "✓";
    badge.style.fontSize = "11px";
    badge.style.fontWeight = "bold";
    badge.style.padding = "2px 6px";
    badge.style.borderRadius = "10px";
    badge.style.backgroundColor = "var(--accent, #4caf50)";
    badge.style.color = "#fff";
    line.appendChild(badge);

    const defBox = document.createElement("button");
    defBox.className = "match-btn matched";
    defBox.style.flex = "1";
    defBox.style.margin = "0";
    if (allowHTML) defBox.innerHTML = pairs[pairIndex].def; else defBox.textContent = pairs[pairIndex].def;

    row.appendChild(termBox);
    row.appendChild(line);
    row.appendChild(defBox);
    return row;
  }

  matchedPairs.forEach(pairIndex => {
    matchedArea.appendChild(createMatchedRow(pairIndex));
  });

  function onPick(btn, side, pairIndex) {
    if (!selected) {
      selected = { side, btn, pairIndex };
      btn.classList.add("selected");
      return;
    }
    if (selected.side === side) {
      selected.btn.classList.remove("selected");
      selected = { side, btn, pairIndex };
      btn.classList.add("selected");
      return;
    }
    if (selected.pairIndex === pairIndex) {
      selected.btn.remove();
      btn.remove();

      matchedArea.appendChild(createMatchedRow(pairIndex));

      matchedPairs.add(pairIndex);
      savedAnswers[storeKey] = Array.from(matchedPairs);
      persistAnswers();

      savedScores[storeKey] = Math.round((matchedPairs.size / pairs.length) * 100);
      persistScores();
      if (onScored) onScored();
    } else {
      const a = selected.btn, b = btn;
      a.classList.add("flash-wrong");
      b.classList.add("flash-wrong");
      setTimeout(() => {
        a.classList.remove("selected", "flash-wrong");
        b.classList.remove("flash-wrong");
      }, 450);
    }
    selected = null;
  }

  leftOrder.forEach(pairIndex => {
    if (matchedPairs.has(pairIndex)) return;
    const btn = document.createElement("button");
    btn.className = "match-btn";
    if (allowHTML) btn.innerHTML = pairs[pairIndex].term; else btn.textContent = pairs[pairIndex].term;
    btn.addEventListener("click", () => onPick(btn, "L", pairIndex));
    leftCol.appendChild(btn);
  });

  rightOrder.forEach(pairIndex => {
    if (matchedPairs.has(pairIndex)) return;
    const btn = document.createElement("button");
    btn.className = "match-btn";
    if (allowHTML) btn.innerHTML = pairs[pairIndex].def; else btn.textContent = pairs[pairIndex].def;
    btn.addEventListener("click", () => onPick(btn, "R", pairIndex));
    rightCol.appendChild(btn);
  });

  grid.appendChild(leftCol);
  grid.appendChild(rightCol);
  container.appendChild(matchedArea);
  container.appendChild(grid);
  wrap.appendChild(container);
}

// ── header row shared by interactive slides ────────────────────────────── ⊃
/**
 * Constructs the header row with eyebrow text and reset button for slides.
 * @param {HTMLElement} el - Slide element to append header to.
 * @param {string} defaultLabel - Default text for header eyebrow.
 * @param {Object} [opts] - Optional configuration options.
 * @returns {HTMLButtonElement} Created reset button element.
 */
/**
 * @param {HTMLElement} el
 * @param {string} defaultLabel
 * @param {Object} [opts]
 * @returns {{resetBtn: HTMLButtonElement, scoreBadge: HTMLElement}}
 */
function buildInteractiveHeader(el, defaultLabel, opts) {
  const header = document.createElement("div");
  header.className = "quiz-head-row";
  const eyebrow = document.createElement("div");
  eyebrow.className = "eyebrow";
  eyebrow.style.marginBottom = "0";
  eyebrow.textContent = (opts && opts.label) || defaultLabel;

  const rightGroup = document.createElement("div");
  rightGroup.className = "quiz-head-right";
  const scoreBadge = createScoreBadge(rightGroup);
  const resetQuizBtn = document.createElement("button");
  resetQuizBtn.className = "reset-quiz-btn";
  resetQuizBtn.type = "button";
  resetQuizBtn.textContent = "↺ Reset this quiz";
  rightGroup.appendChild(resetQuizBtn);

  header.appendChild(eyebrow);
  header.appendChild(rightGroup);
  el.appendChild(header);

  if (opts && opts.note) {
    const note = document.createElement("p");
    note.className = "lede";
    note.style.marginBottom = "20px";
    note.innerHTML = "<em>" + opts.note + "</em>";
    el.appendChild(note);
  }

  return { resetBtn: resetQuizBtn, scoreBadge };
}

// ── slide renderer and type dispatcher ─────────────────────────────────── ⊃
/**
 * Dispatches rendering logic based on slide type (content, quiz, fillblank, matching).
 * @param {HTMLElement} el - Target slide element container.
 * @param {Object} slide - Slide data payload.
 * @param {number} idx - Index position of slide in deck.
 */
function renderSlide(el, contentEl, slide, idx) {
  if (slide.type === "content") {
    contentEl.innerHTML = slide.html;
    decorateCodeBlocks(contentEl);
    decorateSpoilers(contentEl);
    return;
  }

  if (slide.type === "quiz") {
    contentEl.innerHTML = "";
    const { resetBtn: resetQuizBtn, scoreBadge } = buildInteractiveHeader(contentEl, "Quiz Checkpoint", slide.opts);
    const storeKeys = slide.data.map((_, qIdx) => idx + "_" + qIdx);
    const refresh = () => { refreshScoreBadge(scoreBadge, storeKeys); updateTotalScoreDisplay(); };

    function renderAllQuestions() {
      contentEl.querySelectorAll(".quiz-box").forEach(n => n.remove());
      slide.data.forEach((q, qIdx) => {
        const box = document.createElement("div");
        box.className = "quiz-box";
        box.style.marginBottom = "18px";
        renderQuestion(box, q, idx + "_" + qIdx, refresh);
        contentEl.appendChild(box);
      });
      refresh();
    }

    resetQuizBtn.addEventListener("click", () => {
      slide.data.forEach((q, qIdx) => {
        delete savedAnswers[idx + "_" + qIdx];
        delete savedScores[idx + "_" + qIdx];
        q._order = shuffleSeed(q.options.map((_, i2) => i2), Date.now() % 100000 + qIdx);
      });
      persistAnswers();
      persistScores();
      renderAllQuestions();
    });

    renderAllQuestions();
    return;
  }

  if (slide.type === "fillblank") {
    contentEl.innerHTML = "";
    const { resetBtn: resetQuizBtn, scoreBadge } = buildInteractiveHeader(contentEl, "Fill in the Blank", slide.opts);
    const storeKeys = slide.data.map((_, itemIdx) => idx + "_fb_" + itemIdx);
    const refresh = () => { refreshScoreBadge(scoreBadge, storeKeys); updateTotalScoreDisplay(); };

    function renderAllItems() {
      contentEl.querySelectorAll(".fb-item").forEach(n => n.remove());
      slide.data.forEach((item, itemIdx) => {
        renderFillBlank(contentEl, item, idx + "_fb_" + itemIdx, refresh);
      });
      refresh();
    }

    resetQuizBtn.addEventListener("click", () => {
      slide.data.forEach((_, itemIdx) => {
        delete savedAnswers[idx + "_fb_" + itemIdx];
        delete savedScores[idx + "_fb_" + itemIdx];
      });
      persistAnswers();
      persistScores();
      renderAllItems();
    });

    renderAllItems();
    return;
  }

  if (slide.type === "matching") {
    contentEl.innerHTML = "";
    const { resetBtn: resetQuizBtn, scoreBadge } = buildInteractiveHeader(contentEl, "Matching Pairs", slide.opts);
    const sets = slide.data; // array of pair-arrays, 1 or more sets per slide
    const storeKeys = sets.map((_, setIdx) => idx + "_match_" + setIdx);
    const refresh = () => { refreshScoreBadge(scoreBadge, storeKeys); updateTotalScoreDisplay(); };

    let seeds = sets.map((_, setIdx) => idx * 17 + 3 + setIdx * 53);

    function renderAllSets() {
      contentEl.querySelectorAll(".matching-container").forEach(n => n.remove());
      sets.forEach((pairs, setIdx) => {
        const label = sets.length > 1 ? `Set ${setIdx + 1} / ${sets.length}` : null;
        renderMatching(contentEl, pairs, seeds[setIdx], idx + "_match_" + setIdx, refresh, label, slide.opts && slide.opts.allowHTML);
      });
      refresh();
    }

    resetQuizBtn.addEventListener("click", () => {
      seeds = sets.map((_, setIdx) => Date.now() % 100000 + setIdx);
      storeKeys.forEach(k => { delete savedAnswers[k]; delete savedScores[k]; });
      persistAnswers();
      persistScores();
      renderAllSets();
    });

    renderAllSets();
  }
}

/**
 * Reads a short (eyebrow, title) preview pair for a dot's tooltip out of
 * an already-rendered slide's DOM. Works uniformly across slide types:
 * content slides use their real .eyebrow/h1 (or .kicker-line for the
 * title-slide layout); quiz/fillblank/matching slides get their header
 * built dynamically by buildInteractiveHeader(), so this reads that
 * generated .eyebrow label and falls back to a short type-specific title
 * since those slides have no real <h1>.
 * @param {HTMLElement} contentEl - The rendered .slide-content element.
 * @param {string} type - slide.type ("content" | "quiz" | "fillblank" | "matching").
 * @returns {{eyebrow: string, title: string}}
 */
/**
 * Builds the tooltip content for one dot. Returns either a two-line
 * {eyebrow, title} pair (content slides only, excluding VSCode Challenge)
 * or a single short {label} (first/last slide, and every interactive
 * slide type — quiz/fillblank/matching/VSCode Challenge — since those
 * don't have a real heading worth showing two lines for).
 * @param {HTMLElement} contentEl - The rendered .slide-content element.
 * @param {string} type - slide.type ("content" | "quiz" | "fillblank" | "matching").
 * @param {number} idx - This slide's index in the deck.
 * @param {number} total - Total slide count in the deck.
 * @param {boolean} isFinalQuiz - True for the LAST quiz-type slide in the deck.
 * @returns {{eyebrow?: string, title?: string, label?: string}}
 */
/**
 * Builds the tooltip content for one dot, plus a CSS class hint used to
 * style "special" dots (interactive types + VSCode Challenge + Glossary)
 * at 50% opacity — see wiring in initSlideDeck() and the .dot-dim rule in
 * style.css. Returns either a two-line {eyebrow, title} pair (plain
 * content slides only) or a single short {label} (first/last slide, and
 * every interactive/special slide type).
 * @param {HTMLElement} contentEl - The rendered .slide-content element.
 * @param {string} type - slide.type ("content" | "quiz" | "fillblank" | "matching").
 * @param {number} idx - This slide's index in the deck.
 * @param {number} total - Total slide count in the deck.
 * @param {boolean} isFinalQuiz - True for the LAST quiz-type slide in the deck.
 * @returns {{eyebrow?: string, title?: string, label?: string, dim?: boolean}}
 */
function getDotPreviewText(contentEl, type, idx, total, isFinalQuiz) {
  if (idx === 0) return { label: "START" };
  if (idx === total - 1) return { label: "END" };

  if (type === "quiz") return { label: isFinalQuiz ? "FINAL QUIZ" : "QUIZ", dim: true };
  if (type === "fillblank") return { label: "FILLBLANK", dim: true };
  if (type === "matching") return { label: "MATCHINGPAIRS", dim: true };

  // type === "content" from here on
  const eyebrowEl = contentEl.querySelector(".eyebrow, .kicker-line");
  const eyebrow = eyebrowEl ? eyebrowEl.textContent.trim() : "";

  if (/vscode challenge/i.test(eyebrow)) return { label: "VSCODECHALLENGE", dim: true };
  if (/γλωσσάρι|λεξιλόγιο/i.test(eyebrow)) return { label: "GLOSSARY", dim: true };

  const h1 = contentEl.querySelector("h1, h2");
  const title = h1 ? h1.textContent.trim() : "";
  return { eyebrow, title };
}

let deckEl, dotsEl, dotsTrackEl, counterEl, fillEl, prevBtn, nextBtn;
let tocSidebarEl, tocBackdropEl, tocOpenBtn, tocCloseBtn, tocResetBtn, tocCloseFooterBtn;
let slideEls, dotEls;
let notifyUrl = null; // set via initSlideDeck({ notifyUrl: "..." }); null = feature off

// ── shared floating dot tooltip ─────────────────────────────────────────── ⊃
// A SINGLE tooltip element lives on document.body (outside #dots entirely),
// so it is never clipped by #dots's overflow:hidden (needed for the
// windowed dot scroller). Positioned with position:fixed + getBoundingClientRect()
// on hover, rather than CSS-only positioning relative to the dot.
let dotTooltipEl = null;

/**
 * Lazily creates (once) and returns the single shared tooltip element.
 * @returns {HTMLElement}
 */
function ensureDotTooltipEl() {
  if (dotTooltipEl) return dotTooltipEl;
  dotTooltipEl = document.createElement("div");
  dotTooltipEl.className = "dot-tooltip";
  dotTooltipEl.innerHTML = '<div class="dt-eyebrow"></div><div class="dt-title"></div>';
  document.body.appendChild(dotTooltipEl);
  return dotTooltipEl;
}

/**
 * Fills and positions the shared tooltip above the given dot, then makes
 * it visible. Reads eyebrow/title from the dot's own data-* attributes
 * (set once at dot-creation time in initSlideDeck).
 * @param {HTMLElement} dot
 */
function showDotTooltip(dot) {
  const tip = ensureDotTooltipEl();
  const eyebrow = dot.dataset.tipEyebrow || "";
  const title = dot.dataset.tipTitle || "";
  const label = dot.dataset.tipLabel || "";

  const ebEl = tip.querySelector(".dt-eyebrow");
  const titleEl = tip.querySelector(".dt-title");

  if (label) {
    // Single-line mode: START/END/QUIZ/FINAL QUIZ/FILLBLANK/MATCHINGPAIRS/
    // VSCODECHALLENGE. Reuses the title line's slot, styled distinctly.
    ebEl.style.display = "none";
    titleEl.textContent = label;
    titleEl.style.display = "";
    titleEl.classList.add("dt-label");
  } else {
    ebEl.textContent = eyebrow;
    ebEl.style.display = eyebrow ? "" : "none";
    titleEl.textContent = title;
    titleEl.style.display = title ? "" : "none";
    titleEl.classList.remove("dt-label");
  }

  // Measure the dot's real on-screen position (position:fixed, viewport
  // coordinates) — this works correctly even though the dot sits inside
  // a scrolled/transformed, clipped ancestor.
  const rect = dot.getBoundingClientRect();
  tip.style.visibility = "hidden";
  tip.style.opacity = "0";
  tip.classList.add("visible");
  const tipRect = tip.getBoundingClientRect();

  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  const margin = 8;
  left = Math.max(margin, Math.min(window.innerWidth - tipRect.width - margin, left));
  const top = rect.top - tipRect.height - 10;

  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
  tip.style.visibility = "";
  tip.style.opacity = "";
}

/** Hides the shared dot tooltip. */
function hideDotTooltip() {
  if (dotTooltipEl) dotTooltipEl.classList.remove("visible");
}

// ── dots windowed scroll (viewport + sliding track + hover arrows) ─────── ⊃
let dotsScrollX = 0; // current translateX applied to #dots-track, in px (<= 0)
let dotsRAF = null;  // active requestAnimationFrame id while an arrow is hovered

/**
 * Clamps and applies the given track offset, then toggles the
 * can-scroll-left/right classes on #dots so the arrow gradients only show
 * when there is actually more track hidden on that side.
 * @param {number} x - Desired translateX in px.
 */
function setDotsScroll(x) {
  if (!dotsEl || !dotsTrackEl) return;
  const viewport = dotsEl.clientWidth;
  const trackWidth = dotsTrackEl.scrollWidth;

  if (trackWidth <= viewport) {
    // Everything fits: center the whole track in the viewport, no
    // scrolling possible, no leftover empty space on either side.
    dotsScrollX = (viewport - trackWidth) / 2;
    dotsTrackEl.style.transform = `translateX(${dotsScrollX}px)`;
    dotsEl.classList.remove("can-scroll-left", "can-scroll-right");
    return;
  }

  const minX = viewport - trackWidth; // most-negative allowed offset (track's right edge meets viewport's right edge exactly, zero leftover space)
  dotsScrollX = Math.max(minX, Math.min(0, x));
  dotsTrackEl.style.transform = `translateX(${dotsScrollX}px)`;
  dotsEl.classList.toggle("can-scroll-left", dotsScrollX < 0);
  dotsEl.classList.toggle("can-scroll-right", dotsScrollX > minX);
}

/**
 * Re-centers the dots track so the dot at the given slide index sits in
 * the middle of the visible viewport (clamped at either end so we never
 * scroll past the first/last dot). Called on every goTo() and on resize.
 *
 * For the FIRST and LAST slide specifically, this requests the exact
 * viewport-edge offset directly (0 / viewport-trackWidth) rather than a
 * computed "center" that setDotsScroll() would clamp to the same value
 * anyway — avoids the boundary dot ever reading as a fraction of a pixel
 * short (and therefore visually clipped) due to subpixel rounding in the
 * offsetLeft/clientWidth math.
 * @param {number} idx - Slide index whose dot should be centered.
 */
function centerDotsOn(idx) {
  if (!dotsEl || !dotsTrackEl || !dotEls || !dotEls[idx]) return;

  if (idx === 0) {
    setDotsScroll(0);
    return;
  }
  if (idx === dotEls.length - 1) {
    setDotsScroll(dotsEl.clientWidth - dotsTrackEl.scrollWidth);
    return;
  }

  const viewport = dotsEl.clientWidth;
  const dot = dotEls[idx];
  // Diamonds live inside a nested .dot-group wrapper, so offsetLeft alone
  // (relative to each element's own offsetParent) is unreliable across
  // both top-level dots and nested diamonds. getBoundingClientRect() vs.
  // the track's own rect gives the true position regardless of nesting.
  // Both rects already reflect the track's CURRENT transform equally
  // (the dot moves together with its ancestor track), so subtracting
  // them cancels that transform out on its own — dotRect.left - trackRect.left
  // is already the dot's untransformed offset within the track's local
  // coordinate space. Do NOT subtract dotsScrollX again here: that would
  // remove the same offset a second time and throw off the centered
  // target whenever the track is already scrolled (i.e. almost always
  // in a deck that doesn't fit the viewport).
  const dotRect = dot.getBoundingClientRect();
  const trackRect = dotsTrackEl.getBoundingClientRect();
  const dotCenter = (dotRect.left - trackRect.left) + dotRect.width / 2;
  setDotsScroll(viewport / 2 - dotCenter);
}

/**
 * Shows a small "x/y" position badge above whichever .dot-group contains
 * the currently active diamond, and hides it everywhere else. A plain
 * top-level content dot has no group, so this only ever affects grouped
 * quiz/fillblank/matching/glossary/vscode-challenge diamonds.
 * @param {number} idx - The newly active slide index.
 */
// ── shared floating group-position badge ────────────────────────────────── ⊃
// Same reasoning as the shared tooltip above: a badge positioned BELOW a
// diamond would be clipped by #dots's overflow:hidden if nested inside
// it (the container is only 26px tall). One shared element on
// document.body, positioned via getBoundingClientRect(), sidesteps that
// entirely — and stays perfectly in sync with the dots-track scroll
// position since it's repositioned fresh on every goTo().
let groupBadgeEl = null;

/** Lazily creates (once) and returns the single shared group-badge element. */
function ensureGroupBadgeEl() {
  if (groupBadgeEl) return groupBadgeEl;
  groupBadgeEl = document.createElement("div");
  groupBadgeEl.className = "dot-group-badge";
  document.body.appendChild(groupBadgeEl);
  return groupBadgeEl;
}

/**
 * Shows a small "x/y" position badge below whichever .dot-group contains
 * the currently active diamond, and hides it everywhere else. A plain
 * top-level content dot has no group, so this only ever affects grouped
 * quiz/fillblank/matching/glossary/vscode-challenge diamonds.
 * @param {number} idx - The newly active slide index.
 */
/**
 * Shows a small position badge below the currently active dot/diamond,
 * and hides it everywhere else. Behavior depends on viewport width:
 *
 * - Above the 920px breakpoint (matches the compact-nav-bar media query
 *   in style.css, which is also where #slide-counter gets hidden): shows
 *   "x/y" — the active diamond's position WITHIN its own group — and
 *   only applies to diamonds (a plain content dot has no group).
 * - At 920px and below: #slide-counter is hidden entirely to save
 *   horizontal space, so this always shows the deck-wide
 *   "current/total" position instead, under whichever dot or diamond is
 *   currently active — replacing the information #slide-counter used to
 *   carry, rather than the group-relative position.
 * @param {number} idx - The newly active slide index.
 */
function updateGroupBadge(idx) {
  const badge = ensureGroupBadgeEl();
  const dot = dotEls[idx];
  if (!dot) {
    badge.classList.remove("visible");
    return;
  }

  const compact = window.innerWidth <= 920;

  if (compact) {
    // Deck-wide counter, always shown under whatever dot is active.
    badge.textContent = `${idx + 1}/${slides.length}`;
  } else if (dot.classList.contains("dot-diamond")) {
    // Desktop: group-relative position, diamonds only.
    const pos = Number(dot.dataset.groupPos) + 1;
    const size = dot.dataset.groupSize;
    badge.textContent = `${pos}/${size}`;
  } else {
    badge.classList.remove("visible");
    return;
  }

  const rect = dot.getBoundingClientRect();
  badge.style.left = `${rect.left + rect.width / 2}px`;
  badge.style.top = `${rect.bottom + 6}px`;
  badge.classList.add("visible");
}

/**
 * Starts a slow, constant-speed auto-scroll of the dots track while the
 * mouse hovers an arrow zone. Stops automatically at either scroll bound.
 * @param {number} direction - -1 to scroll left (reveal earlier dots), +1 for right.
 */
function startDotsAutoScroll(direction) {
  stopDotsAutoScroll();
  const speed = 1.4; // px per frame ≈ slow, steady crawl
  function step() {
    setDotsScroll(dotsScrollX - direction * speed);
    dotsRAF = requestAnimationFrame(step);
  }
  dotsRAF = requestAnimationFrame(step);
}

/** Stops any active dots auto-scroll loop started by startDotsAutoScroll(). */
function stopDotsAutoScroll() {
  if (dotsRAF !== null) {
    cancelAnimationFrame(dotsRAF);
    dotsRAF = null;
  }
}

/** Wires the hover-to-scroll behavior on the two arrow zones. Call once at init. */
function wireDotsArrows() {
  const leftArrow = document.getElementById("dots-arrow-left");
  const rightArrow = document.getElementById("dots-arrow-right");
  if (!leftArrow || !rightArrow) return;

  leftArrow.addEventListener("mouseenter", () => startDotsAutoScroll(-1));
  leftArrow.addEventListener("mouseleave", stopDotsAutoScroll);
  rightArrow.addEventListener("mouseenter", () => startDotsAutoScroll(1));
  rightArrow.addEventListener("mouseleave", stopDotsAutoScroll);

  window.addEventListener("resize", () => { centerDotsOn(current); updateGroupBadge(current); });
}

// ── deck initialization and navigation ─────────────────────────────────── ⊃
/**
 * Navigates to target slide index updating state, progress bar, and transitions.
 * @param {number} i - Target slide index to display.
 */
/**
 * Marks whichever .toc-link has data-slide matching the given index as the
 * "you are here" entry, clearing that mark from any other. Safe to call
 * even when the sidebar has never been opened yet (#toc-list may be empty,
 * or showing search results instead of the browse list — querySelectorAll
 * simply finds nothing in either case, which is fine).
 * @param {number} slideIndex
 */
function goTo(i) {
  if (i < 0 || i >= slides.length) return;
  const goingBack = i < current;

  slideEls[current].classList.remove("active", "dir-prev");
  dotEls[current].classList.remove("active");

  current = i;
  persistCurrentSlide(current);
  updateBackgroundLayer(slides[current].opts);

  slideEls[current].classList.toggle("dir-prev", goingBack);
  slideEls[current].classList.add("active");
  dotEls[current].classList.add("active");
  slideEls[current].scrollTop = 0;
  // This site has no intentional horizontal scrolling anywhere — a bug
  // elsewhere (scrollIntoView reacting to a too-wide slide) once left the
  // whole page shoved sideways with no way back, since nothing reset it.
  // goTo() is the one place every navigation path (Next/Back, dots, hash
  // links) always passes through, so resetting it here unconditionally on
  // every slide switch is the most reliable fix — even if the underlying
  // width issue on some slide isn't found/fixed, this can't get stuck again.
  window.scrollTo({ left: 0 });
  slideEls[current].scrollLeft = 0;
  centerDotsOn(current); // re-center the windowed dots track on the new active dot
  updateGroupBadge(current);

  counterEl.textContent = (current + 1) + " / " + slides.length;
  fillEl.style.width = (((current + 1) / slides.length) * 100) + "%";

  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;
}

/**
 * Clears stored application state for the active course and reloads page.
 */
function performHardReset() {
  const prefix = getStoragePrefix();
  localStorage.removeItem(prefix + "current_slide");
  localStorage.removeItem(prefix + "answers");
  localStorage.removeItem(prefix + "scores");
  localStorage.removeItem(prefix + "notified_100"); // allow re-notification after a fresh 100%
  localStorage.setItem(prefix + "version", activeCourseVersion);
  window.location.reload();
}

/**
 * Wires up the left-hand Contents sidebar: open/close via its own trigger
 * button (#btn-toc, formerly "Reset Progress" — that action now lives
 * inside the sidebar itself, see #btn-reset-inner below), the backdrop,
 * clicking the backdrop, and Escape. Called once from initSlideDeck().
 *
 * Defensive on purpose: this course template is shared across every course
 * HTML file, but the sidebar's own markup is added to each file one at a
 * time by hand. A file that hasn't been patched yet simply won't have
 * #toc-sidebar etc. in its DOM — rather than throwing (which would abort
 * the REST of initSlideDeck() too, breaking slide rendering entirely on
 * any not-yet-patched file), this checks for the elements first and skips
 * wiring quietly if they're missing. Old files keep working exactly as
 * before; the sidebar just isn't there until that file gets the markup.
 *
 * This wires the open/close SHELL only. #toc-list (the heading list) and
 * #toc-search (client-side search) are inert placeholders in the markup
 * for now — populated by later additions to this same file, so index.html
 * doesn't need touching again for those.
 */
/**
 * Inline "press again to confirm" pattern for Reset Progress — no popup.
 * First click turns the button red with a confirming label for 3s; a
 * SECOND click within that window actually resets. No second click in
 * time, and it just reverts back to normal on its own.
 * @param {MouseEvent} e
 */
let resetConfirmTimeout = null;
function handleResetClick(e) {
  const btn = e.currentTarget;
  if (btn.classList.contains("confirming")) {
    clearTimeout(resetConfirmTimeout);
    performHardReset();
    return;
  }
  const originalText = btn.textContent;
  const originalTitle = btn.title;
  btn.classList.add("confirming");
  btn.textContent = "Confirm Reset";
  btn.title = "Σίγουρα; Πάτα ξανά";
  resetConfirmTimeout = setTimeout(() => {
    btn.classList.remove("confirming");
    btn.textContent = originalText;
    btn.title = originalTitle;
  }, 3000);
}

function initTocSidebar() {
  tocSidebarEl = document.getElementById("toc-sidebar");
  tocBackdropEl = document.getElementById("toc-backdrop");
  tocOpenBtn = document.getElementById("btn-toc");
  tocCloseBtn = document.getElementById("toc-close");
  tocResetBtn = document.getElementById("btn-reset-inner");
  tocCloseFooterBtn = document.getElementById("btn-toc-close-footer"); // optional — see below

  // Any one of these missing means this file hasn't been patched with the
  // sidebar markup yet — bail out quietly, nothing else in this function runs.
  if (!tocSidebarEl || !tocBackdropEl || !tocOpenBtn || !tocCloseBtn || !tocResetBtn) {
    return;
  }

  function openToc() {
    tocSidebarEl.classList.add("open");
    tocBackdropEl.classList.add("open");
    document.body.classList.add("toc-pushed"); // CSS only acts on this above 920px
    tocOpenBtn.classList.add("toc-open-btn-hidden");
    // #dots's own width changes on desktop (--toc-offset pushes #nav-bar
    // narrower) — centerDotsOn() reads that width live, but only ever gets
    // called from goTo(); without this, the dots stay positioned for the
    // OLD width until the next slide change. Timed to land after the CSS
    // "left .25s ease" transition on #nav-bar finishes, not before.
    // updateGroupBadge() has the exact same problem — it positions the
    // "N/M" diamond-group badge via a fixed-pixel getBoundingClientRect()
    // snapshot of the active dot, which goes stale the moment the dot
    // itself moves (same underlying cause as the dots re-centering below).
    setTimeout(() => { centerDotsOn(current); updateGroupBadge(current); }, 260);
  }

  function closeToc() {
    tocSidebarEl.classList.remove("open");
    tocBackdropEl.classList.remove("open");
    document.body.classList.remove("toc-pushed");
    tocOpenBtn.classList.remove("toc-open-btn-hidden");
    setTimeout(() => { centerDotsOn(current); updateGroupBadge(current); }, 260);
  }

  tocOpenBtn.addEventListener("click", openToc);
  tocCloseBtn.addEventListener("click", closeToc);
  tocBackdropEl.addEventListener("click", closeToc);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeToc();
      return;
    }

    // A/D navigate slides, W/S scroll the current slide up/down, Q toggles
    // the sidebar — but never while the user is actually typing (search
    // box, fill-in-the-blank inputs, the feedback form, anywhere), and
    // never alongside a modifier key (Ctrl/Cmd/Alt), so this doesn't fight
    // with browser or OS shortcuts that happen to use the same letters.
    const activeTag = document.activeElement ? document.activeElement.tagName : "";
    const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA" ||
      (document.activeElement && document.activeElement.isContentEditable);
    if (isTyping || e.ctrlKey || e.metaKey || e.altKey) return;

    switch (e.code) {
      case "KeyA": navigateTo(current - 1, null); break;
      case "KeyD": navigateTo(current + 1, null); break;
      case "KeyQ":
        if (tocSidebarEl.classList.contains("open")) closeToc(); else openToc();
        break;
      case "KeyW": {
        const container = slideEls[current];
        const step = container.clientHeight * 0.8;
        smoothScrollTop(container, Math.max(0, container.scrollTop - step), 400);
        break;
      }
      case "KeyS": {
        const container = slideEls[current];
        const step = container.clientHeight * 0.8;
        const maxScroll = container.scrollHeight - container.clientHeight;
        smoothScrollTop(container, Math.min(maxScroll, container.scrollTop + step), 400);
        break;
      }
    }
  });

  tocResetBtn.addEventListener("click", handleResetClick);

  // Soft-checked on its own, separately from the required set above: a file
  // that only has the ORIGINAL sidebar footer (just the Reset button, no
  // close-styled-like-Contents button yet) still works fine — it just won't
  // have this specific extra close affordance until it's patched for it too.
  if (tocCloseFooterBtn) {
    tocCloseFooterBtn.addEventListener("click", closeToc);
  }

  // ── search ──────────────────────────────────────────────────────────
  // Also soft-checked: #toc-search / #toc-list existing is what earlier
  // steps already require, but this stays defensive/consistent with the
  // rest of this function rather than assuming.
  const tocSearchEl = document.getElementById("toc-search");
  const tocListEl = document.getElementById("toc-list");

  // Click-delegation for the static, extract_toc.go-generated .toc-link
  // entries (href="#@slug") — needed now that navigation goes through
  // navigateTo()'s own history.pushState() instead of relying on the
  // browser's native anchor-click hash behavior (which pushes its own
  // entry with no custom state, unlike everything else here).
  if (tocListEl) {
    tocListEl.addEventListener("click", (e) => {
      const link = e.target.closest(".toc-link[href^='#']");
      if (!link || !tocListEl.contains(link)) return;
      e.preventDefault();
      const resolved = resolveHash(link.getAttribute("href"));
      if (!resolved) return;
      navigateTo(resolved.slideIndex, resolved.elId);
      const isMobile = window.matchMedia("(max-width: 920px)").matches;
      if (isMobile) closeToc();
    });
  }

  if (tocSearchEl && tocListEl) {
    // Built ONCE from the live DOM — every slide already exists (see the
    // note at the top of decorateSpoilers() for why), so there's nothing
    // to fetch or wait for. Indexes by "content leaf" elements rather than
    // raw text nodes: a <p> containing "some <strong>bold</strong> text"
    // is one entry with the FULL merged text ("some bold text"), not three
    // separate fragments a query could fall between the cracks of. Each
    // entry's own element doubles as the jump target — no ids needed here,
    // unlike the static extract_toc.go-generated heading links.
    const SEARCH_SELECTOR = "p, h1, h2, h3, li, td, .lede, pre code, blockquote";
    // no result cap — every match shows; search only runs at 3+ characters (see renderResults)

    const searchIndex = [];
    document.querySelectorAll(".slide").forEach((slide) => {
      slide.querySelectorAll(SEARCH_SELECTOR).forEach((el) => {
        const text = el.textContent.trim();
        if (!text) return;
        searchIndex.push({ el, text, textLower: text.toLowerCase() });
      });
    });

    tocListEl.querySelectorAll("a.toc-link[href^='#']").forEach((link) => {
      const text = link.textContent.trim();
      if (!text) return;
      const targetEl = document.getElementById(link.getAttribute("href").slice(1));
      if (!targetEl) return;
      searchIndex.push({ el: targetEl, text, textLower: text.toLowerCase() });
    });

    const originalTocListHTML = tocListEl.innerHTML; // browse mode — restored when the search box is cleared
    let searchHitIdCounter = 0;

    /**
     * Builds a "…3-4 words… **match** …3-4 words…" snippet around the
     * first occurrence of query in text — word-boundary-aware (splits on
     * whitespace, finds which word(s) the match falls inside, takes N
     * words of context on each side), with ellipses only where there
     * genuinely wasn't enough text on that side to show. HTML is already
     * out of the picture — text here always comes from .textContent, never
     * innerHTML, both when the index was built and here.
     * @param {string} text
     * @param {string} query
     * @param {number} contextWords
     * @returns {{before: string, match: string, after: string}|null}
     */
    function buildSnippet(text, query, contextWords) {
      const lowerText = text.toLowerCase();
      const matchStart = lowerText.indexOf(query.toLowerCase());
      if (matchStart === -1) return null;
      const matchEnd = matchStart + query.length;

      const words = [];
      const wordRe = /\S+/g;
      let m;
      while ((m = wordRe.exec(text)) !== null) {
        words.push({ text: m[0], start: m.index, end: m.index + m[0].length });
      }

      let firstWordIdx = words.findIndex((w) => w.end > matchStart);
      if (firstWordIdx === -1) firstWordIdx = 0;
      let lastWordIdx = firstWordIdx;
      while (lastWordIdx + 1 < words.length && words[lastWordIdx].end < matchEnd) {
        lastWordIdx++;
      }

      const startIdx = Math.max(0, firstWordIdx - contextWords);
      const endIdx = Math.min(words.length - 1, lastWordIdx + contextWords);

      const before = words.slice(startIdx, firstWordIdx).map((w) => w.text).join(" ");
      const match = words.slice(firstWordIdx, lastWordIdx + 1).map((w) => w.text).join(" ");
      const after = words.slice(lastWordIdx + 1, endIdx + 1).map((w) => w.text).join(" ");

      return {
        before: (startIdx > 0 ? "… " : "") + before,
        match,
        after: after + (endIdx < words.length - 1 ? " …" : ""),
      };
    }

    function renderResults(query) {
      const q = query.trim().toLowerCase();
      if (!q) {
        tocListEl.innerHTML = originalTocListHTML;
        return;
      }

      const matches = searchIndex.filter((entry) => entry.textLower.includes(q));
      tocListEl.innerHTML = "";

      if (matches.length === 0) {
        const empty = document.createElement("div");
        empty.className = "toc-search-empty";
        empty.textContent = "Καμία αντιστοιχία";
        tocListEl.appendChild(empty);
        return;
      }

      function renderEntry(entry) {
        const a = document.createElement("a");
        a.className = "toc-link toc-search-result";

        const snippet = buildSnippet(entry.text, q, 4);
        if (snippet) {
          // Built with real DOM nodes (createTextNode/createElement), not an
          // HTML string — the query and the matched content are both
          // arbitrary text, so this avoids any injection risk entirely,
          // not just "escaped enough".
          a.appendChild(document.createTextNode(snippet.before + " "));
          const strong = document.createElement("strong");
          strong.textContent = snippet.match;
          a.appendChild(strong);
          a.appendChild(document.createTextNode(" " + snippet.after));
        } else {
          a.textContent = entry.text; // shouldn't happen — entry only matched because it contains q
        }

        a.addEventListener("click", (e) => {
          e.preventDefault();
          // Search hits are arbitrary paragraphs/list items/code blocks
          // that usually don't have their own id — give it one, once, the
          // first time it's ever clicked; reused after that.
          if (!entry.el.id) {
            entry.el.id = "@search-hit-" + (searchHitIdCounter++);
          }
          const slide = entry.el.closest(".slide");
          const slideIndex = slide ? parseInt(slide.dataset.index, 10) : NaN;
          if (!isNaN(slideIndex)) navigateTo(slideIndex, entry.el.id);
          const isMobile = window.matchMedia("(max-width: 920px)").matches;
          if (isMobile) closeToc();
        });
        tocListEl.appendChild(a);
      }

      // Matches on an element that already has a real @slug (a heading
      // extract_toc recognized and gave a TOC entry to) are shown first —
      // more likely to be what someone's actually looking for than an
      // arbitrary paragraph that happens to contain the same word. A
      // divider marks the split, but only when there's actually a slug
      // match to put above it.
      const slugMatches = matches.filter((entry) => entry.el.id && entry.el.id.startsWith("@"));
      const otherMatches = matches.filter((entry) => !(entry.el.id && entry.el.id.startsWith("@")));

      slugMatches.forEach(renderEntry);

      if (slugMatches.length > 0) {
        const divider = document.createElement("div");
        divider.className = "toc-search-divider";
        tocListEl.appendChild(divider);
      }

      otherMatches.forEach(renderEntry);
    }

    let searchDebounce = null;
    tocSearchEl.addEventListener("input", () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => renderResults(tocSearchEl.value), 200);
    });
  }
}

/**
 * Initializes slide deck engine with optional course configuration.
 * @param {Object} [config] - Configuration object containing course version string.
 * @param {string} [config.version="1.0.0"] - Active version string of this lesson.
 */
/**
 * The actual "jump to this hash" logic, shared by both the cold-load path
 * and ongoing in-app navigation (see below) — finds the element, works out
 * which slide it's in, switches to it, and scrolls to the exact spot.
 * @param {string} hash - includes the leading '#', e.g. "#@some-slug".
 */
/**
 * Animates container.scrollTop from its current value to targetTop, eased
 * out (fast start, slows into the landing spot) — never touches horizontal
 * scroll at all, which is exactly why this exists instead of
 * scrollIntoView({behavior:"smooth"}): that also has its own horizontal
 * positioning logic (see jumpToHash()'s own comment for the bug that
 * caused), animated or not.
 * @param {HTMLElement} container
 * @param {number} targetTop
 * @param {number} duration - ms
 */
// Shared with the drift-watcher IIFE further down — true only while
// smoothScrollTop()'s own animation is actively running, so that watcher
// can pause during it (see that IIFE's own comment for why).
let ourScrollAnimating = false;

function smoothScrollTop(container, targetTop, maxDuration) {
  const startTop = container.scrollTop;
  const delta = targetTop - startTop;
  const distance = Math.abs(delta);

  // Close enough that any animation would be imperceptible anyway — e.g.
  // clicking a TOC/search link for something already near the current
  // scroll position on the same slide. Jump straight there, no motion.
  if (distance < 24) {
    container.scrollTop = targetTop;
    ourScrollAnimating = false;
    return;
  }

  // Duration scales with distance, clamped to maxDuration at the top end
  // and a floor at the bottom so even a short hop still reads as a
  // deliberate, smooth motion rather than a jerky snap. A short same-slide
  // hop lands well under maxDuration; a genuinely long scroll (or a jump to
  // a different slide) uses closer to the full duration.
  const duration = Math.min(maxDuration, Math.max(120, distance * 0.35));

  const startTime = performance.now();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  ourScrollAnimating = true;
  function step(now) {
    const t = Math.min(1, (now - startTime) / duration);
    container.scrollTop = startTop + delta * easeOutCubic(t);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      ourScrollAnimating = false;
    }
  }
  requestAnimationFrame(step);
}

/**
 * The single entry point for EVERY navigation action that should be
 * representable in browser history — Next/Back, dots, A/D and arrow keys,
 * TOC link clicks, and search result clicks all funnel through this, so
 * the browser's Back/Forward buttons step through all of them, in the
 * order they actually happened, not just link/search jumps. Switches to
 * the given slide, optionally smooth-scrolls to and highlights a specific
 * element within it, then records ONE history entry for the whole move
 * (skipped when this call is ITSELF the result of a Back/Forward action,
 * via fromHistory — otherwise every Back press would immediately push a
 * new entry right back, undoing itself).
 * @param {number} slideIndex
 * @param {string|null} elId - element id to scroll to/highlight within that slide, or null for a plain slide change with no specific target
 * @param {boolean} [fromHistory] - true only when called from the popstate handler itself
 */
function navigateTo(slideIndex, elId, fromHistory) {
  if (slideIndex < 0 || slideIndex >= slides.length) return;

  goTo(slideIndex);

  if (elId) {
    const targetEl = document.getElementById(elId);
    const targetSlide = slideEls[slideIndex];
    if (targetEl && targetSlide) {
      // Wait a frame so goTo()'s active-class switch (display:none ->
      // visible) has actually applied before measuring/scrolling within it.
      requestAnimationFrame(() => {
        // Deliberately NOT scrollIntoView() — it also adjusts HORIZONTAL
        // scroll position based on the target's bounding box, and some
        // slide content here is wider than the viewport (e.g. a wide code
        // block); that combination once shoved the whole page sideways
        // with no way back. Computing scrollTop by hand never touches
        // horizontal position at all.
        const slideRect = targetSlide.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const targetTop = targetSlide.scrollTop + (targetRect.top - slideRect.top) - 10;
        smoothScrollTop(targetSlide, targetTop, 500);

        window.scrollTo({ left: 0 });
        targetSlide.scrollLeft = 0;

        // Brief flash so landing somewhere in a long slide is obvious.
        // Force a reflow before re-adding the class so it re-triggers even
        // if you jump to the same spot twice in a row.
        targetEl.classList.remove("toc-jump-highlight");
        void targetEl.offsetWidth;
        targetEl.classList.add("toc-jump-highlight");
        setTimeout(() => targetEl.classList.remove("toc-jump-highlight"), 8000);
      });
    }
  }

  if (!fromHistory) {
    const url = location.pathname + location.search + (elId ? "#" + elId : "");
    history.pushState({ slideIndex, elId: elId || null }, "", url);
  }
}

// The other end of navigateTo()'s pushState calls — fires on the
// browser's Back/Forward buttons (and only those; a NEW navigateTo() call,
// e.g. clicking a fresh link, does not trigger this, since popstate is
// specifically for moving through EXISTING history entries). e.state is
// whatever navigateTo() pushed, so this can just replay it directly,
// marked fromHistory so it doesn't push yet another entry on top.
window.addEventListener("popstate", (e) => {
  if (e.state && typeof e.state.slideIndex === "number") {
    navigateTo(e.state.slideIndex, e.state.elId, true);
  }
});

/**
 * Resolves a "#@slug"-style hash to its element and containing slide
 * index, or null if it doesn't match anything on this page.
 * @param {string} hash - includes the leading '#'
 * @returns {{elId: string, slideIndex: number}|null}
 */
function resolveHash(hash) {
  if (!hash || hash.length < 2) return null;
  const elId = hash.slice(1);
  const targetEl = document.getElementById(elId);
  if (!targetEl) return null;
  const targetSlide = targetEl.closest(".slide");
  if (!targetSlide) return null;
  const slideIndex = parseInt(targetSlide.dataset.index, 10);
  if (isNaN(slideIndex)) return null;
  return { elId, slideIndex };
}

/**
 * Handles a fresh page load that arrives with a URL hash pointing at a
 * specific heading (e.g. from a link like "00-bash.html#@some-slug",
 * clicked from outside this page — another course, another site,
 * anywhere). Called once, right after the normal localStorage-continuation
 * goTo() in initSlideDeck(), so it overrides "resume where I left off"
 * when a hash is present — a direct deep-link is a more specific intent.
 *
 * Reads window.__initialHash (set by the inline <script> at the very top
 * of <head>) rather than location.hash — that inline script strips the
 * hash from the address bar immediately on load, specifically so the
 * browser's own native scroll-to-fragment attempt never fires at all. That
 * native attempt is guaranteed broken here (the target heading doesn't
 * exist in the static HTML — it's only created once this function's
 * caller, initSlideDeck(), finishes building slides[]), and on top of
 * that, some browsers retry the native attempt once the target DOES
 * appear, landing on a still display:none element with undefined (and
 * inconsistent — hence "only some of the time") scroll behavior.
 */
function handleInitialHashNavigation() {
  const resolved = resolveHash(window.__initialHash);
  if (!resolved) return null;
  // fromHistory:true here on purpose — this is the FIRST navigation of the
  // session, not something to record as a Back-able move in its own right;
  // the caller seeds the baseline history entry itself, using the return
  // value below, once this is done.
  navigateTo(resolved.slideIndex, resolved.elId, true);
  return resolved;
}

// Defensive, real-time safety net for the first couple seconds after load.
// html/body already have overflow-x:hidden (see that rule's own comment),
// and every .slide does too — this site has NO intentional horizontal
// scrolling anywhere. Despite that, some browsers' native "scroll to
// fragment" behavior can still force a scroll position programmatically,
// bypassing CSS overflow rules the same way user-driven scrolling can't —
// and it does so inconsistently: sometimes immediately, sometimes on a
// delayed retry well after our own one-time corrections elsewhere already
// ran (that's the "works sometimes" symptom). Watching the scroll event
// itself and correcting INSTANTLY, for a generous window rather than only
// at fixed points, catches it no matter when it fires.
(function () {
  let watching = true;
  function correctDrift() {
    if (!watching || ourScrollAnimating) return; // don't fight our own vertical animation — see smoothScrollTop()
    if (window.scrollX !== 0) window.scrollTo({ left: 0 });
    if (document.documentElement.scrollLeft !== 0) document.documentElement.scrollLeft = 0;
    if (document.body.scrollLeft !== 0) document.body.scrollLeft = 0;
  }
  window.addEventListener("scroll", correctDrift, { passive: true });
  document.addEventListener("scroll", correctDrift, { passive: true, capture: true });
  setTimeout(() => { watching = false; }, 2500);
})();

function initSlideDeck(config) {
  const opts = config || {};
  const courseVersion = opts.version || "1.0.0";
  notifyUrl = opts.notifyUrl || null; // optional — see maybeNotifyCompletion()

  checkCourseVersion(courseVersion);

  deckEl = document.getElementById("deck");
  dotsEl = document.getElementById("dots");
  dotsTrackEl = document.getElementById("dots-track");
  counterEl = document.getElementById("slide-counter");
  fillEl = document.getElementById("progress-fill");
  prevBtn = document.getElementById("btn-prev");
  nextBtn = document.getElementById("btn-next");

  slides.forEach((s, i) => {
    if (s.type === "quiz") {
      s.data.forEach((q, qIdx) => {
        const idxArr = q.options.map((_, i2) => i2);
        q._order = shuffleSeed(idxArr, i * 7 + 13 + qIdx * 31);
      });
    }
  });

  // The final cumulative quiz is simply the LAST quiz-type slide in the
  // deck — every course has exactly one, always placed after all
  // per-section quizzes, right before the closing glossary/sources slide.
  let lastQuizIdx = -1;
  slides.forEach((s, i) => { if (s.type === "quiz") lastQuizIdx = i; });

  // dotEls stays a SPARSE ARRAY the same length as slides, one entry per
  // slide index — dotEls[i] always resolves to the exact clickable DOM
  // element representing slide i, whether that's a full-size content dot
  // or a small diamond nested inside a group. Everything downstream
  // (goTo(), centerDotsOn()) keeps indexing dotEls[current] exactly as
  // before and needs no changes.
  dotEls = new Array(slides.length);

  // Render every slide's content up front (needed before classifying,
  // since getDotPreviewText reads each slide's real rendered DOM to spot
  // "VSCode Challenge" / "Γλωσσάρι" eyebrows — those are type:"content"
  // slides at the data level, but should still group as small diamonds
  // alongside quiz/fillblank/matching, not as a full-size content dot).
  const contentEls = new Array(slides.length);
  const previews = new Array(slides.length);

  slides.forEach((s, i) => {
    const el = document.createElement("div");
    el.className = "slide";
    el.dataset.index = i;
    const contentEl = document.createElement("div");
    contentEl.className = "slide-content";
    el.appendChild(contentEl);
    deckEl.appendChild(el);
    renderSlide(el, contentEl, s, i);
    contentEls[i] = contentEl;
    previews[i] = getDotPreviewText(contentEl, s.type, i, slides.length, i === lastQuizIdx);
  });

  /**
   * Builds one clickable dot (circle) or diamond element for slide i,
   * wires its click/hover handlers, and returns it. Shared by both the
   * top-level content dots and the small grouped diamonds below.
   * @param {number} i - Slide index this element represents.
   * @param {boolean} isDiamond
   * @returns {HTMLElement}
   */
  function buildDotEl(i, isDiamond) {
    const el = document.createElement("div");
    el.className = isDiamond ? "dot dot-diamond" : "dot";
    if (slides[i].type !== "content") el.classList.add("quiz-dot");
    el.addEventListener("click", () => navigateTo(i, null));

    const preview = previews[i];
    el.dataset.tipEyebrow = preview.eyebrow || "";
    el.dataset.tipTitle = preview.title || "";
    el.dataset.tipLabel = preview.label || "";
    el.addEventListener("mouseenter", () => showDotTooltip(el));
    el.addEventListener("mouseleave", hideDotTooltip);

    dotEls[i] = el;
    return el;
  }

  // Group by the SAME "special" classification getDotPreviewText already
  // uses (preview.dim) — this is quiz/fillblank/matching/glossary/vscode
  // challenge, regardless of each slide's raw .type. Everything else
  // (real theory content, including START/END) gets a full-size dot in
  // the main track; each run of consecutive "special" slides that
  // follows becomes one small .dot-group of diamonds next to it.
  //
  // On top of that, any run of two-or-more consecutive plain content
  // dots with NO diamond group between them (i.e. no quiz/glossary/etc.
  // in between) is wrapped in a .dot-run so they sit flush against each
  // other with zero gap, the same way diamonds within one .dot-group
  // already do. START (index 0) and END (the last slide) are always
  // excluded from this — they never join a .dot-run, so they always
  // keep the normal gap from their neighbor even when that neighbor is
  // plain content with nothing between them.
  const lastIdx = slides.length - 1;
  let i = 0;
  let pendingRun = null; // the currently-open .dot-run wrapper, or null
  let pendingRunLastIdx = -1; // slide index of the last dot appended to pendingRun

  function flushPendingRun() {
    pendingRun = null;
    pendingRunLastIdx = -1;
  }

  function appendTopLevelDot(idx) {
    const dotEl = buildDotEl(idx, false);
    const eligibleForRun = idx !== 0 && idx !== lastIdx;

    if (eligibleForRun && pendingRun && pendingRunLastIdx === idx - 1) {
      // Extends the currently-open run (previous dot had no group after
      // it, and this dot is also run-eligible) — append with zero gap.
      pendingRun.appendChild(dotEl);
      pendingRunLastIdx = idx;
    } else if (eligibleForRun) {
      // Starts a new potential run. We don't know yet whether a second
      // dot will follow it without a group in between, so this always
      // begins life as a single-dot .dot-run — CSS gives a 1-item flex
      // container the exact same visual result as a bare dot, and it
      // costs nothing to leave it wrapped.
      const run = document.createElement("div");
      run.className = "dot-run";
      run.appendChild(dotEl);
      dotsTrackEl.appendChild(run);
      pendingRun = run;
      pendingRunLastIdx = idx;
    } else {
      // START or END: never part of a run, always its own track child.
      flushPendingRun();
      dotsTrackEl.appendChild(dotEl);
    }
  }

  while (i < slides.length) {
    appendTopLevelDot(i);
    i++;

    const groupIndices = [];
    while (i < slides.length && previews[i].dim) {
      groupIndices.push(i);
      i++;
    }
    if (groupIndices.length) {
      // A diamond group breaks any in-progress run of plain content dots.
      flushPendingRun();
      const group = document.createElement("div");
      group.className = "dot-group";
      groupIndices.forEach((gi, posInGroup) => {
        const dEl = buildDotEl(gi, true);
        dEl.dataset.groupPos = posInGroup;
        dEl.dataset.groupSize = groupIndices.length;
        group.appendChild(dEl);
      });
      dotsTrackEl.appendChild(group);
    }
  }

  slideEls = Array.from(document.querySelectorAll(".slide"));
  // Moved here (not earlier, near the other DOM-query lines) specifically
  // because initTocSidebar() builds its search index by walking every
  // .slide's content — that only works once slides actually exist, and
  // they don't until the forEach() loops above finish building them.
  initTocSidebar();

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "F5") {
      e.preventDefault();
      performHardReset();
    }
  });

  prevBtn.addEventListener("click", () => navigateTo(current - 1, null));
  nextBtn.addEventListener("click", () => navigateTo(current + 1, null));
  document.addEventListener("keydown", (e) => {
    const activeTag2 = document.activeElement ? document.activeElement.tagName : "";
    const isTyping2 = activeTag2 === "INPUT" || activeTag2 === "TEXTAREA" ||
      (document.activeElement && document.activeElement.isContentEditable);
    if (isTyping2) return; // let the cursor move normally instead of changing slides

    if (e.key === "ArrowRight") navigateTo(current + 1, null);
    if (e.key === "ArrowLeft") navigateTo(current - 1, null);
  });

  wireDotsArrows();

  if (current >= slides.length) current = 0;
  goTo(current);
  const initialResolved = handleInitialHashNavigation(); // overrides the line above if the URL has a matching #hash

  // Seeds the very first history entry with real state (matching what
  // navigateTo() itself pushes for every subsequent move), so popstate has
  // something to read even when Back is pressed all the way to the start —
  // without this, that first entry would have state:null and need a
  // separate "what do I do with no state" special case. Uses
  // initialResolved.elId (not location.hash — fromHistory:true above
  // deliberately skipped updating that) so a cold-load deep-link still
  // shows its #@slug in the address bar for bookmarking/sharing.
  const initialElId = initialResolved ? initialResolved.elId : null;
  history.replaceState(
    { slideIndex: current, elId: initialElId },
    "",
    location.pathname + location.search + (initialElId ? "#" + initialElId : "")
  );
  // On first load, #dots/#dots-track may not have a finalized layout yet
  // at this exact synchronous point (no paint has happened yet) —
  // clientWidth/scrollWidth/getBoundingClientRect can read 0 or stale
  // here, which throws off both the windowed dot scroller AND the
  // floating group-position badge (same root cause: both rely on real
  // layout geometry) until the next manual navigation forces a
  // recompute. Re-run both once after the next paint, plus one more
  // delayed pass as a safety net for slower initial layouts (e.g. a
  // background tab becoming visible), to guarantee correct measurements.
  requestAnimationFrame(() => { centerDotsOn(current); updateGroupBadge(current); });
  setTimeout(() => { centerDotsOn(current); updateGroupBadge(current); }, 300);
  updateTotalScoreDisplay();

  // Signals to the inline fallback script in <head> that the page reached a
  // genuinely working state. That script only shows its "something's wrong"
  // takeover for an error that happens BEFORE this line ever runs — i.e.
  // the deck never finished building in the first place (the actual
  // failure mode it exists for: a stale saved answer whose data no longer
  // matches the current exercise, throwing partway through the single
  // synchronous build pass). An error AFTER this point means the page is
  // already visibly working — nuking it over something later and likely
  // minor would do more harm than the error itself.
  window.__pageInitialized = true;
}