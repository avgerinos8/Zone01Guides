/* ══════════════════════════════════════════════════════════════════════════
   script.js — reusable slide-deck engine for the Zone01 template.
   Pairs with index.html + style.css.

   DO NOT put course content in this file. This file only defines the
   building blocks (addContent, addQuiz, addFillBlank, addMatching) and the
   rendering/navigation engine. All actual lesson content lives in the
   inline <script> at the bottom of index.html, which calls these functions
   and finishes with initSlideDeck().
   ══════════════════════════════════════════════════════════════════════════ */

// ── slide data store ────────────────────────────────────────────────────── ⊃
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

// ── multiple-choice question renderer ───────────────────────────────────── ⊃
/**
 * Renders a single multiple-choice question inside a quiz box container.
 * Handles answer click events, correctness feedback, and state persistence.
 * @param {HTMLElement} box - Container element to append question to.
 * @param {Object} q - Question data object.
 * @param {string} storeKey - Unique key for local storage persistence.
 */
function renderQuestion(box, q, storeKey) {
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
      localStorage.setItem("quiz_answers", JSON.stringify(savedAnswers));
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
function renderFillBlank(wrap, item, storeKey) {
  const box = document.createElement("div");
  box.className = "fb-item";

  const pre = document.createElement("pre");
  const codeEl = document.createElement("code");

  const savedData = savedAnswers[storeKey] || { inputs: {}, checked: false };

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
          savedAnswers[storeKey] = { inputs: {}, checked: false };
        }
        savedAnswers[storeKey].inputs[blankId] = inp.value;
        localStorage.setItem("quiz_answers", JSON.stringify(savedAnswers));
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
    resultSpan.textContent = allCorrect ? "ΣΩΣΤΟ!" : "Υπάρχουν λάθη — δες τα κόκκινα κενά.";
    resultSpan.className = "fb-result " + (allCorrect ? "ok" : "bad");
    explainDiv.classList.add("show");
    checkBtn.disabled = true;
  }

  checkBtn.addEventListener("click", () => {
    if (!savedAnswers[storeKey]) {
      savedAnswers[storeKey] = { inputs: {}, checked: false };
    }
    box.querySelectorAll(".fb-blank").forEach(inp => {
      savedAnswers[storeKey].inputs[inp.dataset.blankId] = inp.value;
    });
    savedAnswers[storeKey].checked = true;
    localStorage.setItem("quiz_answers", JSON.stringify(savedAnswers));
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
 * @param {HTMLElement} wrap - Container element to append exercise to.
 * @param {Array} pairs - Array of term-definition matching objects.
 * @param {number} seed - Seed used for shuffling options deterministically.
 * @param {string} storeKey - Unique key for local storage persistence.
 */
function renderMatching(wrap, pairs, seed, storeKey) {
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
      localStorage.setItem("quiz_answers", JSON.stringify(savedAnswers));
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
function buildInteractiveHeader(el, defaultLabel, opts) {
  const header = document.createElement("div");
  header.className = "quiz-head-row";
  const eyebrow = document.createElement("div");
  eyebrow.className = "eyebrow";
  eyebrow.style.marginBottom = "0";
  eyebrow.textContent = (opts && opts.label) || defaultLabel;
  const resetQuizBtn = document.createElement("button");
  resetQuizBtn.className = "reset-quiz-btn";
  resetQuizBtn.type = "button";
  resetQuizBtn.textContent = "↺ Reset this quiz";
  header.appendChild(eyebrow);
  header.appendChild(resetQuizBtn);
  el.appendChild(header);

  if (opts && opts.note) {
    const note = document.createElement("p");
    note.className = "lede";
    note.style.marginBottom = "20px";
    note.innerHTML = "<em>" + opts.note + "</em>";
    el.appendChild(note);
  }

  return resetQuizBtn;
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
    const resetQuizBtn = buildInteractiveHeader(el, "Quiz Checkpoint", slide.opts);

    function renderAllQuestions() {
      el.querySelectorAll(".quiz-box").forEach(n => n.remove());
      slide.data.forEach((q, qIdx) => {
        const box = document.createElement("div");
        box.className = "quiz-box";
        box.style.marginBottom = "18px";
        renderQuestion(box, q, idx + "_" + qIdx);
        el.appendChild(box);
      });
    }

    resetQuizBtn.addEventListener("click", () => {
      slide.data.forEach((q, qIdx) => {
        delete savedAnswers[idx + "_" + qIdx];
        q._order = shuffleSeed(q.options.map((_, i2) => i2), Date.now() % 100000 + qIdx);
      });
      localStorage.setItem("quiz_answers", JSON.stringify(savedAnswers));
      renderAllQuestions();
    });

    renderAllQuestions();
    return;
  }

  if (slide.type === "fillblank") {
    el.innerHTML = "";
    const resetQuizBtn = buildInteractiveHeader(el, "Fill in the Blank", slide.opts);

    function renderAllItems() {
      el.querySelectorAll(".fb-item").forEach(n => n.remove());
      slide.data.forEach((item, itemIdx) => {
        renderFillBlank(el, item, idx + "_fb_" + itemIdx);
      });
    }

    resetQuizBtn.addEventListener("click", () => {
      slide.data.forEach((_, itemIdx) => {
        delete savedAnswers[idx + "_fb_" + itemIdx];
      });
      localStorage.setItem("quiz_answers", JSON.stringify(savedAnswers));
      renderAllItems();
    });

    renderAllItems();
    return;
  }

  if (slide.type === "matching") {
    el.innerHTML = "";
    const resetQuizBtn = buildInteractiveHeader(el, "Matching Pairs", slide.opts);

    let seed = idx * 17 + 3;

    function renderAllPairs() {
      el.querySelectorAll(".matching-container").forEach(n => n.remove());
      renderMatching(el, slide.data, seed, idx + "_match");
    }

    resetQuizBtn.addEventListener("click", () => {
      seed = Date.now() % 100000;
      delete savedAnswers[idx + "_match"];
      localStorage.setItem("quiz_answers", JSON.stringify(savedAnswers));
      renderAllPairs();
    });

    renderAllPairs();
  }
}

// ── persisted state management ──────────────────────────────────────────── ⊃
const slides = [];
let current = parseInt(localStorage.getItem("quiz_current_slide")) || 0;
let savedAnswers = JSON.parse(localStorage.getItem("quiz_answers")) || {};

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
  localStorage.setItem("quiz_current_slide", current);

  slideEls[current].classList.toggle("dir-prev", goingBack);
  slideEls[current].classList.add("active");
  dotEls[current].classList.add("active");
  slideEls[current].scrollTop = 0;

  counterEl.textContent = (current + 1) + " / " + slides.length;
  fillEl.style.width = (((current + 1) / slides.length) * 100) + "%";

  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;
}

/**
 * Clears stored application state from local storage and reloads browser window.
 */
function performHardReset() {
  localStorage.removeItem("quiz_current_slide");
  localStorage.removeItem("quiz_answers");
  window.location.href = window.location.pathname + "?cache-bust=" + Date.now() + window.location.hash;
}

/**
 * Initializes slide deck engine, sets up event listeners and loads stored state.
 */
function initSlideDeck() {
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