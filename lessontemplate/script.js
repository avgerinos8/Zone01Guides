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
const slides = [];

/**
 * Adds a plain content slide to the slide deck data array.
 * Accepts HTML string and optional background configuration options.
 * @param {string} html - Raw HTML for the slide body.
 * @param {Object} [opts] - Background and overlay options.
 */
function addContent(html, opts) {
  slides.push({ type: "content", html, opts: opts || {} });
}

/**
 * Adds one or more multiple-choice questions on a single slide.
 * Wraps single question objects in an array for unified processing.
 * @param {Object|Object[]} qOrArray - Single question object or array of questions.
 */
function addQuiz(qOrArray) {
  const questions = Array.isArray(qOrArray) ? qOrArray : [qOrArray];
  slides.push({ type: "quiz", data: questions });
}

/**
 * Adds one or more fill-in-the-blank code exercises on a single slide.
 * Accepts code templates containing __id__ markers and corresponding answers.
 * @param {Object|Object[]} itemOrArray - Single exercise or array of exercises.
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
 * Shuffles an array deterministically using a Linear Congruential Generator algorithm.
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
 * Scans the container for code blocks and wraps them with an interactive copy button.
 * Avoids double-wrapping by checking for existing wrapper elements.
 * @param {HTMLElement} container - The element containing pre code blocks.
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
 * Renders one MC question inside a given quiz-box container.
 * Restores previous user selections and evaluates correctness.
 * @param {HTMLElement} box - Container to append this question's markup to.
 * @param {Object} q - Question object containing options, correct index, and explanation.
 * @param {string} storeKey - localStorage key for persisting answer state.
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
 * Renders one fill-in-the-blank exercise with code inputs and validation logic.
 * Restores previous user inputs and submitted correctness states from local storage.
 * @param {HTMLElement} wrap - Container element to append this exercise to.
 * @param {Object} item - Exercise object with code template, blank answers, and explanation.
 * @param {string} storeKey - Unique localStorage key for this fill-blank item.
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
 * Renders a matching-pairs exercise with interactive column selection.
 * Restores previously matched pairs and persists new matches to local storage.
 * @param {HTMLElement} wrap - Container element to append the exercise to.
 * @param {Array} pairs - Array of term-definition matching objects.
 * @param {number} seed - Seed used for shuffling options deterministically.
 * @param {string} storeKey - Unique localStorage key for matching state.
 */
function renderMatching(wrap, pairs, seed, storeKey) {
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

  function onPick(btn, side, pairIndex) {
    if (btn.classList.contains("matched")) return;

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
      selected.btn.classList.remove("selected");
      selected.btn.classList.add("matched");
      btn.classList.add("matched");

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
    const btn = document.createElement("button");
    btn.className = "match-btn";
    btn.textContent = pairs[pairIndex].term;
    if (matchedPairs.has(pairIndex)) {
      btn.classList.add("matched");
    }
    btn.addEventListener("click", () => onPick(btn, "L", pairIndex));
    leftCol.appendChild(btn);
  });
  rightOrder.forEach(pairIndex => {
    const btn = document.createElement("button");
    btn.className = "match-btn";
    btn.textContent = pairs[pairIndex].def;
    if (matchedPairs.has(pairIndex)) {
      btn.classList.add("matched");
    }
    btn.addEventListener("click", () => onPick(btn, "R", pairIndex));
    rightCol.appendChild(btn);
  });

  grid.appendChild(leftCol);
  grid.appendChild(rightCol);
  wrap.appendChild(grid);
}

// ── header row shared by interactive slides ────────────────────────────── ⊃
/**
 * Constructs the header row with an eyebrow label and reset button for interactive slides.
 * Appends an optional instructional note paragraph when provided.
 * @param {HTMLElement} el - Parent slide element to append the header components to.
 * @param {string} defaultLabel - Default text label for the eyebrow header.
 * @param {Object} [opts] - Optional configuration containing custom label and note.
 * @returns {HTMLButtonElement} The created reset button element for attaching click events.
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
 * Renders slide content dynamically according to the slide type definition.
 * Handles DOM construction and resets for content, quiz, fillblank, and matching types.
 * @param {HTMLElement} el - Target DOM element representing the slide container.
 * @param {Object} slide - Slide definition object containing type and payload data.
 * @param {number} idx - Index position of the current slide in the deck.
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
      el.querySelectorAll(".matching-wrap").forEach(n => n.remove());
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
let current = parseInt(localStorage.getItem("quiz_current_slide")) || 0;
let savedAnswers = JSON.parse(localStorage.getItem("quiz_answers")) || {};

let deckEl, dotsEl, counterEl, fillEl, prevBtn, nextBtn, resetBtn;
let slideEls, dotEls;

// ── deck initialization and navigation ─────────────────────────────────── ⊃
/**
 * Navigates to a target slide index while updating state, UI, and transitions.
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
 * Clears all stored application state from localStorage and reloads the browser window.
 */
function performHardReset() {
  localStorage.removeItem("quiz_current_slide");
  localStorage.removeItem("quiz_answers");
  window.location.href = window.location.pathname + "?cache-bust=" + Date.now() + window.location.hash;
}

/**
 * Initializes the entire slide deck framework, binding events and rendering slides.
 * Must be invoked after all content builder functions have been called.
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