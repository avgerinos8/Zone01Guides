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
 */
function addQuiz(qOrArray) {
  const questions = Array.isArray(qOrArray) ? qOrArray : [qOrArray];
  slides.push({ type: "quiz", data: questions });
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
 * Adds a matching-pairs exercise slide with term-definition pairs.
 * @param {Array} pairs - Array of objects with term and def properties.
 * @param {Object} [opts] - Optional label and instructional note options.
 */
function addMatching(pairs, opts) {
  slides.push({ type: "matching", data: pairs, opts: opts || {} });
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
 * @returns {{percent:number, answered:number, total:number}|null} null if nothing scored yet.
 */
function computeTotalScore() {
  const vals = Object.values(savedScores);
  let total = 0;
  slides.forEach(s => {
    if (s.type === "quiz") total += s.data.length;
    else if (s.type === "fillblank") total += s.data.length;
    else if (s.type === "matching") total += 1;
  });
  if (vals.length === 0) return null;
  const percent = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  return { percent, answered: vals.length, total };
}

/**
 * Renders/updates the total-score box appended to the LAST slide of the deck.
 * Called on init and every time the user navigates to the last slide.
 */
function updateTotalScoreDisplay() {
  if (!slideEls || slideEls.length === 0) return; // not built yet — goTo() at end of init will catch it
  const lastEl = slideEls[slideEls.length - 1];
  if (!lastEl) return;
  let box = lastEl.querySelector(".total-score-box");
  const result = computeTotalScore();
  if (!result) {
    if (box) box.remove();
    return;
  }
  if (!box) {
    box = document.createElement("div");
    box.className = "total-score-box";
    lastEl.appendChild(box);
  }
  const tier = scoreTier(result.percent);
  const messages = {
    good: "Άψογα — τα πήγες πολύ καλά!",
    mid: "Καλή προσπάθεια — ξαναδές μερικά σημεία.",
    bad: "Χρειάζεται λίγο ακόμα διάβασμα, ξαναπροσπάθησε."
  };
  box.className = "total-score-box " + tier;
  box.innerHTML =
    `<div class="ts-percent">Score ${result.percent}%</div>` +
    `<div class="ts-message">${messages[tier]}</div>` +
    `<div class="ts-progress">Απαντήθηκαν ${result.answered} / ${result.total}</div>`;
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

  const optsDiv = document.createElement("div");
  optsDiv.className = "quiz-options";

  const explainDiv = document.createElement("div");
  explainDiv.className = "quiz-explain";

  function handleSelection(selectedIndex, clickedBtn) {
    const allBtns = optsDiv.querySelectorAll(".quiz-opt");
    allBtns.forEach(b => b.classList.add("disabled"));

    if (selectedIndex === q.correct) {
      if (clickedBtn) clickedBtn.classList.add("correct");
      explainDiv.innerHTML = "<strong>ΣΩΣΤΟ!</strong><br>" + q.explain;
    } else {
      if (clickedBtn) clickedBtn.classList.add("wrong");
      explainDiv.innerHTML = "<strong>ΛΑΘΟΣ.</strong><br>" + q.explain;
    }

    allBtns.forEach((b, i2) => {
      if (order[i2] === q.correct) b.classList.add("correct");
      if (!clickedBtn && order[i2] === selectedIndex && selectedIndex !== q.correct) {
        b.classList.add("wrong");
      }
    });

    allBtns.forEach(b => {
      const badge = b.querySelector(".quiz-badge");
      if (!badge) return;
      if (b.classList.contains("correct")) badge.textContent = "ΣΩΣΤΟ";
      else if (b.classList.contains("wrong")) badge.textContent = "ΛΑΘΟΣ";
    });

    explainDiv.classList.add("show");

    savedScores[storeKey] = selectedIndex === q.correct ? 100 : 0;
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

  const parts = item.code.split(/__([a-zA-Z0-9]+)__/g);
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      codeEl.appendChild(document.createTextNode(parts[i]));
    } else {
      const blankId = parts[i];
      const inp = document.createElement("input");
      inp.type = "text";
      inp.className = "fb-blank";
      inp.dataset.blankId = blankId;
      inp.autocomplete = "off";
      inp.spellcheck = false;
      inp.size = 6;
      if (savedData.inputs && savedData.inputs[blankId] !== undefined) {
        inp.value = savedData.inputs[blankId];
      }
      inp.addEventListener("input", () => {
        if (!savedAnswers[storeKey]) {
          savedAnswers[storeKey] = { inputs: {}, checked: false, revealed: [] };
        }
        savedAnswers[storeKey].inputs[blankId] = inp.value;
        persistAnswers();
      });
      codeEl.appendChild(inp);
    }
  }
  pre.appendChild(codeEl);
  box.appendChild(pre);

  const actions = document.createElement("div");
  actions.className = "fb-actions";
  const checkBtn = document.createElement("button");
  checkBtn.className = "fb-check-btn";
  checkBtn.type = "button";
  checkBtn.textContent = "Έλεγχος";
  const resultSpan = document.createElement("span");
  resultSpan.className = "fb-result";
  actions.appendChild(checkBtn);
  actions.appendChild(resultSpan);
  box.appendChild(actions);

  // "Reveal hint": shows ONE not-yet-revealed answer as plain text, for a
  // currently-empty blank — never says which blank it belongs to. Repeated
  // clicks reveal more, one at a time, until every blank has been revealed.
  const hintsDiv = document.createElement("div");
  hintsDiv.className = "fb-hints";
  box.appendChild(hintsDiv);

  const hintBtn = document.createElement("button");
  hintBtn.className = "fb-hint-btn";
  hintBtn.type = "button";
  box.appendChild(hintBtn);

  function renderHints() {
    hintsDiv.innerHTML = "";
    revealedIds.forEach(id => {
      const answer = item.blanks.find(b => b.id === id)?.answer ?? "";
      const line = document.createElement("div");
      line.className = "fb-hint-line";
      line.textContent = answer;
      hintsDiv.appendChild(line);
    });
    const totalBlanks = item.blanks.length;
    if (revealedIds.size >= totalBlanks) {
      hintBtn.textContent = "Όλα αποκαλύφθηκαν";
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
    revealedIds.add(emptyIds[0]);
    if (!savedAnswers[storeKey]) {
      savedAnswers[storeKey] = { inputs: {}, checked: false, revealed: [] };
    }
    savedAnswers[storeKey].revealed = Array.from(revealedIds);
    persistAnswers();
    renderHints();
  });

  renderHints();

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
      if (!ok) allCorrect = false;
    });
    const usedHint = revealedIds.size > 0;
    resultSpan.textContent = allCorrect
      ? (usedHint ? "ΣΩΣΤΟ! (με hint — 50%)" : "ΣΩΣΤΟ!")
      : "Υπάρχουν λάθη — δες τα κόκκινα κενά.";
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
function renderMatching(wrap, pairs, seed, storeKey, onScored) {
  const container = document.createElement("div");
  container.className = "matching-container";

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
    termBox.textContent = pairs[pairIndex].term;

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
    defBox.textContent = pairs[pairIndex].def;

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
    btn.textContent = pairs[pairIndex].term;
    btn.addEventListener("click", () => onPick(btn, "L", pairIndex));
    leftCol.appendChild(btn);
  });

  rightOrder.forEach(pairIndex => {
    if (matchedPairs.has(pairIndex)) return;
    const btn = document.createElement("button");
    btn.className = "match-btn";
    btn.textContent = pairs[pairIndex].def;
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
function renderSlide(el, slide, idx) {
  if (slide.type === "content") {
    el.innerHTML = slide.html;
    if (slide.opts && slide.opts.bg) {
      el.classList.add("has-bg");
      el.style.setProperty("--slide-bg-image", `url('${slide.opts.bg}')`);
      if (slide.opts.overlayAlpha !== undefined) {
        el.style.setProperty("--slide-bg-overlay-alpha", slide.opts.overlayAlpha);
      }
    }
    decorateCodeBlocks(el);
    return;
  }

  if (slide.type === "quiz") {
    el.innerHTML = "";
    const { resetBtn: resetQuizBtn, scoreBadge } = buildInteractiveHeader(el, "Quiz Checkpoint", slide.opts);
    const storeKeys = slide.data.map((_, qIdx) => idx + "_" + qIdx);
    const refresh = () => { refreshScoreBadge(scoreBadge, storeKeys); updateTotalScoreDisplay(); };

    function renderAllQuestions() {
      el.querySelectorAll(".quiz-box").forEach(n => n.remove());
      slide.data.forEach((q, qIdx) => {
        const box = document.createElement("div");
        box.className = "quiz-box";
        box.style.marginBottom = "18px";
        renderQuestion(box, q, idx + "_" + qIdx, refresh);
        el.appendChild(box);
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
    el.innerHTML = "";
    const { resetBtn: resetQuizBtn, scoreBadge } = buildInteractiveHeader(el, "Fill in the Blank", slide.opts);
    const storeKeys = slide.data.map((_, itemIdx) => idx + "_fb_" + itemIdx);
    const refresh = () => { refreshScoreBadge(scoreBadge, storeKeys); updateTotalScoreDisplay(); };

    function renderAllItems() {
      el.querySelectorAll(".fb-item").forEach(n => n.remove());
      slide.data.forEach((item, itemIdx) => {
        renderFillBlank(el, item, idx + "_fb_" + itemIdx, refresh);
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
    el.innerHTML = "";
    const { resetBtn: resetQuizBtn, scoreBadge } = buildInteractiveHeader(el, "Matching Pairs", slide.opts);
    const storeKeys = [idx + "_match"];
    const refresh = () => { refreshScoreBadge(scoreBadge, storeKeys); updateTotalScoreDisplay(); };

    let seed = idx * 17 + 3;

    function renderAllPairs() {
      el.querySelectorAll(".matching-container").forEach(n => n.remove());
      renderMatching(el, slide.data, seed, idx + "_match", refresh);
      refresh();
    }

    resetQuizBtn.addEventListener("click", () => {
      seed = Date.now() % 100000;
      delete savedAnswers[idx + "_match"];
      delete savedScores[idx + "_match"];
      persistAnswers();
      persistScores();
      renderAllPairs();
    });

    renderAllPairs();
  }
}

let deckEl, dotsEl, counterEl, fillEl, prevBtn, nextBtn, resetBtn;
let slideEls, dotEls;

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

  slideEls[current].classList.toggle("dir-prev", goingBack);
  slideEls[current].classList.add("active");
  dotEls[current].classList.add("active");
  slideEls[current].scrollTop = 0;

  counterEl.textContent = (current + 1) + " / " + slides.length;
  fillEl.style.width = (((current + 1) / slides.length) * 100) + "%";

  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;

  if (current === slides.length - 1) updateTotalScoreDisplay();
}

/**
 * Clears stored application state for the active course and reloads page.
 */
function performHardReset() {
  const prefix = getStoragePrefix();
  localStorage.removeItem(prefix + "current_slide");
  localStorage.removeItem(prefix + "answers");
  localStorage.removeItem(prefix + "scores");
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

  checkCourseVersion(courseVersion);

  deckEl = document.getElementById("deck");
  dotsEl = document.getElementById("dots");
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

  slides.forEach((s, i) => {
    const el = document.createElement("div");
    el.className = "slide";
    el.dataset.index = i;
    deckEl.appendChild(el);
    renderSlide(el, s, i);

    const dot = document.createElement("div");
    dot.className = "dot" + (s.type !== "content" ? " quiz-dot" : "");
    dot.addEventListener("click", () => goTo(i));
    dotsEl.appendChild(dot);
  });

  slideEls = Array.from(document.querySelectorAll(".slide"));
  dotEls = Array.from(document.querySelectorAll(".dot"));

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

  if (current >= slides.length) current = 0;
  goTo(current);
}