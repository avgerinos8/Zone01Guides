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
 * Wires up drag-to-reveal "spoiler" blocks. Markup pattern (write this by
 * hand inside addContent()'s HTML):
 *   <div class="spoiler">
 *     <div class="spoiler-lock"><span>Drag to reveal →</span></div>
 *     <pre><code>...</code></pre>
 *   </div>
 * Requires an actual horizontal DRAG past ~40% of the lock's width to
 * reveal — a simple click/tap does nothing, on purpose.
 * @param {HTMLElement} container
 */
function decorateSpoilers(container) {
  container.querySelectorAll(".spoiler-lock").forEach(lock => {
    if (lock.dataset.wired) return;
    lock.dataset.wired = "1";

    let dragging = false;
    let startX = 0;
    let width = 0;

    function pointX(e) {
      return e.touches ? e.touches[0].clientX : e.clientX;
    }

    function onDown(e) {
      dragging = true;
      startX = pointX(e);
      width = lock.offsetWidth;
      lock.style.transition = "none";
      lock.classList.add("dragging");
    }

    function onMove(e) {
      if (!dragging) return;
      const dx = Math.max(0, pointX(e) - startX);
      lock.style.transform = `translateX(${dx}px)`;
    }

    function onUp(e) {
      if (!dragging) return;
      dragging = false;
      lock.classList.remove("dragging");
      const dx = Math.max(0, pointX(e) - startX);
      lock.style.transition = "transform .25s ease, opacity .25s ease";
      if (dx > width * 0.4) {
        lock.style.transform = `translateX(${width}px)`;
        lock.style.opacity = "0";
        lock.classList.add("revealed");
        setTimeout(() => { lock.style.display = "none"; }, 250);
      } else {
        lock.style.transform = "translateX(0)";
      }
    }

    lock.addEventListener("pointerdown", onDown);
    lock.addEventListener("pointermove", onMove);
    lock.addEventListener("pointerup", onUp);
    lock.addEventListener("pointercancel", onUp);
    // touch fallback for browsers without full Pointer Events support
    lock.addEventListener("touchstart", onDown, { passive: true });
    lock.addEventListener("touchmove", onMove, { passive: true });
    lock.addEventListener("touchend", onUp);
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

  if (savedAnswers[storeKey] !== undefined) {
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

  // Optional syntax coloring (v2, opt-in via item.lang, e.g. "go"/"js"/
  // "generic"): only static text segments between blanks are colored, via
  // highlighter.js's exported window.Zone01Highlight(lang, text). The blank
  // <input> elements themselves are never touched by this — unlike putting
  // a class="lang-*" directly on <code> (which would wipe them out, since
  // the highlighter normally rewrites a code element's whole innerHTML from
  // its textContent). When item.lang is omitted, this is a no-op and the
  // exact original text-node behavior below runs unchanged.
  if (item.lang && window.Zone01Highlight) {
    codeEl.classList.add("lang-" + item.lang, "fb-code-colored");
    // Pre-mark as highlighted so highlighter.js's MutationObserver (which
    // would otherwise see this class-"lang-*" <code> get inserted and try
    // to rewrite its whole innerHTML from textContent) skips it entirely —
    // that rewrite would wipe out the live <input> blanks built below.
    codeEl.dataset.highlighted = "1";
  }

  const parts = item.code.split(/__([a-zA-Z0-9]+)__/g);
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (item.lang && window.Zone01Highlight) {
        const span = document.createElement("span");
        span.innerHTML = window.Zone01Highlight(item.lang, parts[i]);
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

  const matchedPairs = new Set(savedAnswers[storeKey] || []);
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

let deckEl, dotsEl, dotsTrackEl, counterEl, fillEl, prevBtn, nextBtn, resetBtn;
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
function updateGroupBadge(idx) {
  const badge = ensureGroupBadgeEl();
  const dot = dotEls[idx];
  if (!dot || !dot.classList.contains("dot-diamond")) {
    badge.classList.remove("visible");
    return;
  }

  const pos = Number(dot.dataset.groupPos) + 1;
  const size = dot.dataset.groupSize;
  badge.textContent = `${pos}/${size}`;

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

  window.addEventListener("resize", () => centerDotsOn(current));
}

// ── deck initialization and navigation ─────────────────────────────────── ⊃
/**
 * Navigates to target slide index updating state, progress bar, and transitions.
 * @param {number} i - Target slide index to display.
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
 * Initializes slide deck engine with optional course configuration.
 * @param {Object} [config] - Configuration object containing course version string.
 * @param {string} [config.version="1.0.0"] - Active version string of this lesson.
 */
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
  resetBtn = document.getElementById("btn-reset");

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
    el.addEventListener("click", () => goTo(i));

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
  let i = 0;
  while (i < slides.length) {
    dotsTrackEl.appendChild(buildDotEl(i, false));
    i++;

    const groupIndices = [];
    while (i < slides.length && previews[i].dim) {
      groupIndices.push(i);
      i++;
    }
    if (groupIndices.length) {
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

  resetBtn.addEventListener("click", performHardReset);
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "F5") {
      e.preventDefault();
      performHardReset();
    }
  });

  prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn.addEventListener("click", () => goTo(current + 1));
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") goTo(current + 1);
    if (e.key === "ArrowLeft") goTo(current - 1);
  });

  wireDotsArrows();

  if (current >= slides.length) current = 0;
  goTo(current);
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
}