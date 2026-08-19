/* ══════════════════════════════════════════════════════════════════════════
   notify-progress.js — per-slide, course-completion, and feedback-form
   email notifications.

   ADD-ONLY FILE: does not edit static/script.js. It hooks in by re-assigning
   two of its top-level function bindings (persistScores, maybeNotifyCompletion)
   AFTER script.js has loaded — both are plain top-level `function` bindings,
   shared across all classic <script> tags on the page, so re-assigning them
   here is enough; every existing call site (goTo, resetQuizBtn handlers,
   updateTotalScoreDisplay, ...) keeps working unchanged, it just also runs
   the new logic. If script.js isn't loaded yet (wrong <script> order) this
   file no-ops safely instead of throwing.

   REQUIRES: <script src="static/script.js"></script> to run BEFORE this file
   in index.html. Placement relative to the inline content-building <script>
   at the bottom of index.html does not matter — this file only READS
   `slides`/`savedScores`/`savedAnswers` at answer-time, never at load-time.
   The feedback form listener works the same way, via event delegation on
   `document` (see the feedback section below) — it doesn't need the form
   to exist in the DOM yet at the time this file runs.

   Reuses the SAME `notifyUrl` (set via initSlideDeck({ notifyUrl: "..." }))
   for all three email types — the payload's "type" field
   ("slide" | "course" | "feedback") is what the Apps Script Web App uses to
   pick subject/body. See Code.gs for the Apps Script side.
   ══════════════════════════════════════════════════════════════════════════ */

// ── config — edit these two switches, nothing else needs touching ───────── ⊃
const SLIDE_NOTIFY_ENABLED = true;              // master on/off for per-slide emails
const SLIDE_NOTIFY_MIN_GAP_MS = 1 * 10 * 1000;  // auto-throttle: min gap between slide emails, per browser (10 seconds)
const COURSE_NOTIFY_ENABLED = true;             // master on/off for the final course-summary email

(function () {
  if (typeof notifyUrl === "undefined" || typeof slides === "undefined") {
    return; // static/script.js not loaded before this file — nothing to hook into
  }

  // ── shared helpers ────────────────────────────────────────────────── ⊃
  /**
   * Minimal, non-identifying browser info — no name, no IP (JS can't read
   * IP anyway; that would only ever come from server-side request logs).
   * @returns {Object}
   */
  function getExtendedBrowserMeta() {

    const meta = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: window.screen.width + "x" + window.screen.height,
      platform: navigator.platform || ""
    };

    // --- Graphics ---
    meta.devicePixelRatio = window.devicePixelRatio || 1;
    meta.colorDepth = screen.colorDepth || 'unknown';
    meta.screenAvail = screen.availWidth + "x" + screen.availHeight;

    // --- Performance/Hardware ---
    meta.hardwareConcurrency = navigator.hardwareConcurrency || 'unknown';
    meta.deviceMemory = navigator.deviceMemory || 'unknown';

    // --- Network Information API ---
    if (navigator.connection) {
      meta.network = {
        effectiveType: navigator.connection.effectiveType || 'unknown',
        downlink: navigator.connection.downlink || 'unknown',
        rtt: navigator.connection.rtt || 'unknown',
        saveData: navigator.connection.saveData || false
      };
    } else {
      meta.network = 'not supported';
    }

    // --- Browser flags ---
    meta.browserFlags = {
      isChrome: !!window.chrome,
      isOpera: !!window.opera,
      isWebdriver: !!navigator.webdriver,
      pluginsCount: navigator.plugins ? navigator.plugins.length : 0,
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };

    return meta;
  }

  /**
   * Rebuilds the list of savedScores/savedAnswers keys that belong to one
   * quiz/fillblank/matching slide, matching the exact key convention used
   * throughout script.js (idx_qIdx / idx_fb_itemIdx / idx_match_setIdx).
   * @param {number} idx - slide index.
   * @returns {string[]}
   */
  function slideStoreKeys(idx) {
    const s = slides[idx];
    if (!s || !s.data) return [];
    const infix = s.type === "quiz" ? "_" : s.type === "fillblank" ? "_fb_" : s.type === "matching" ? "_match_" : null;
    if (infix === null) return [];
    return s.data.map((_, i) => idx + infix + i);
  }

  /** @param {number} idx @returns {boolean} true only once EVERY item on the slide has a saved score. */
  function isSlideFullyAnswered(idx) {
    const keys = slideStoreKeys(idx);
    return keys.length > 0 && keys.every((k) => savedScores[k] !== undefined);
  }

  /**
   * Builds the per-question answer breakdown for one slide's email body.
   * Quiz: letter of the chosen option (A/B/C/...) plus its text.
   * Fillblank: each blank id → typed value.
   * Matching: just the resulting score (individual pairs aren't tracked
   * with stable ids, so a %-complete per set is the meaningful summary).
   * @param {number} idx
   * @returns {{correct:number, total:number, lines:string[]}}
   */
  function buildSlideBreakdown(idx) {
    const s = slides[idx];
    const keys = slideStoreKeys(idx);
    let correct = 0;
    const lines = [];

    keys.forEach((key, i) => {
      const score = savedScores[key];
      if (score === 100) correct++;

      if (s.type === "quiz") {
        const q = s.data[i];
        const chosen = savedAnswers[key];
        const letter = typeof chosen === "number" ? String.fromCharCode(65 + chosen) : "?";
        const text = typeof chosen === "number" && q.options[chosen] ? q.options[chosen] : "";
        lines.push("Q" + (i + 1) + ": " + letter + " (" + text + ")" + (score === 100 ? " ✓" : " ✗"));
      } else if (s.type === "fillblank") {
        const saved = savedAnswers[key] || {};
        const inputs = saved.inputs || {};
        const answerStr = Object.keys(inputs).map((id) => id + "=" + inputs[id]).join(", ");
        lines.push("Blank set " + (i + 1) + ": " + answerStr + (score === 100 ? " ✓" : score === 50 ? " (hint used)" : " ✗"));
      } else {
        lines.push("Matching set " + (i + 1) + ": " + score + "%");
      }
    });

    return { correct, total: keys.length, lines };
  }

  // ── per-browser flags (localStorage, same prefix convention as script.js) ─ ⊃
  function slideAlreadyNotified(idx) {
    return localStorage.getItem(getStoragePrefix() + "slide_notified_" + idx) === "1";
  }
  function markSlideNotified(idx) {
    localStorage.setItem(getStoragePrefix() + "slide_notified_" + idx, "1");
  }
  function clearSlideNotified(idx) {
    localStorage.removeItem(getStoragePrefix() + "slide_notified_" + idx);
  }
  function throttleAllows() {
    const lastTs = parseInt(localStorage.getItem(getStoragePrefix() + "last_slide_notify_ts")) || 0;
    return Date.now() - lastTs >= SLIDE_NOTIFY_MIN_GAP_MS;
  }
  function markThrottleTimestamp() {
    localStorage.setItem(getStoragePrefix() + "last_slide_notify_ts", String(Date.now()));
  }

  // ── type-1 email: fires once a slide's questions are ALL answered ───── ⊃
  // In-memory set of slide indices with a pending deferred retry, so a
  // throttled completion isn't dropped forever — it gets ONE scheduled
  // retry for exactly when the throttle window clears. (In-memory only:
  // a full page reload during the wait cancels the pending retry — the
  // next new answer on that slide will simply re-trigger the check.)
  const pendingRetries = new Set();

  /**
   * Re-checks and, if eligible, sends the slide-completion email for one
   * specific slide index. Called both directly (right after an answer is
   * scored) and again automatically from a deferred setTimeout if the
   * first attempt was blocked only by the throttle.
   * @param {number} idx
   */
  function attemptSlideNotify(idx) {
    const s = slides[idx];
    if (!s) return;

    if (!isSlideFullyAnswered(idx)) {
      clearSlideNotified(idx); // e.g. right after a per-slide "reset" click — allow re-firing later
      return;
    }
    if (slideAlreadyNotified(idx)) return;

    if (!throttleAllows()) {
      if (!pendingRetries.has(idx)) {
        pendingRetries.add(idx);
        const lastTs = parseInt(localStorage.getItem(getStoragePrefix() + "last_slide_notify_ts")) || 0;
        const waitMs = Math.max(0, SLIDE_NOTIFY_MIN_GAP_MS - (Date.now() - lastTs)) + 250; // small buffer
        setTimeout(() => {
          pendingRetries.delete(idx);
          attemptSlideNotify(idx); // re-check from scratch — state may have changed meanwhile
        }, waitMs);
      }
      return; // not dropped — just deferred
    }

    markSlideNotified(idx);
    markThrottleTimestamp();

    const { correct, total, lines } = buildSlideBreakdown(idx);

    fetch(notifyUrl, {
      method: "POST",
      mode: "no-cors", // Apps Script Web Apps don't return CORS headers; fire-and-forget
      headers: { "Content-Type": "text/plain" }, // text/plain avoids a CORS preflight
      body: JSON.stringify({
        type: "slide",
        course: document.title || window.location.pathname,
        slideIndex: idx,
        slideLabel: (s.opts && s.opts.label) || s.type,
        correct,
        total,
        answers: lines,
        browser: getExtendedBrowserMeta()
      })
    }).catch(() => {
      clearSlideNotified(idx); // best-effort only — allow a retry on the next qualifying answer
    });
  }

  function checkSlideCompletionAndNotify() {
    if (!SLIDE_NOTIFY_ENABLED || !notifyUrl) return;
    attemptSlideNotify(current); // slide being interacted with when a score was just saved
  }

  const originalPersistScores = persistScores;
  persistScores = function () {
    originalPersistScores();
    checkSlideCompletionAndNotify();
  };

  // ── type-2 email: whole-course summary, replaces the original             ─ ⊃
  // maybeNotifyCompletion with a version that also attaches browser info.
  // Same "notified_100" localStorage guard key as the original, so timing
  // and at-most-once-per-browser behavior are unchanged — this is a
  // superset, not a second competing notifier.
  maybeNotifyCompletion = function (percent, answered, total) {
    if (!COURSE_NOTIFY_ENABLED || !notifyUrl) return;
    if (answered === 0 || answered < total || percent < 100) return;

    const notifiedKey = getStoragePrefix() + "notified_100";
    if (localStorage.getItem(notifiedKey)) return;
    localStorage.setItem(notifiedKey, "1");

    const breakdown = [];
    slides.forEach((s, idx) => {
      if (s.type === "quiz" || s.type === "fillblank" || s.type === "matching") {
        const label = (s.opts && s.opts.label) || (s.type === "quiz" ? "Quiz Checkpoint" : s.type === "fillblank" ? "Fill in the Blank" : "Matching Pairs");
        slideStoreKeys(idx).forEach((key, subIdx) => {
          if (key in savedScores) {
            breakdown.push({ label: "Slide " + (idx + 1) + " — " + label, score: savedScores[key] });
          }
        });
      }
    });

    fetch(notifyUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        type: "course",
        course: document.title || window.location.pathname,
        score: percent,
        studentName: window.STUDENT_NAME || "", // optional, unchanged from the original — see index.html
        details: { breakdown },
        browser: getExtendedBrowserMeta()
      })
    }).catch(() => {
      localStorage.removeItem(notifiedKey);
    });
  };

  // ── type-3 email: feedback form on the final slide ───────────────────── ⊃
  // Event delegation on `document`, NOT a direct listener on #feedback-form —
  // the form only exists in the DOM once the course template renders the
  // final slide's innerHTML (same underlying timing issue _viz-common.js
  // documents for visualizers), so listening on `document` sidesteps the
  // wait entirely: the listener itself always exists from page load, and
  // the actual target element is only looked up at submit-time.
  document.addEventListener("submit", function (event) {
    if (!event.target || event.target.id !== "feedback-form") return;
    event.preventDefault();
    submitFeedback(event.target);
  });

  // Same caps as the HTML maxlength attributes on #feedback-username /
  // #feedback-text — kept here too as defense-in-depth, since maxlength
  // only stops normal typing/paste, not a value set programmatically
  // (e.g. via DevTools) bypassing the form entirely.
  const FEEDBACK_USERNAME_MAX = 120;
  const FEEDBACK_TEXT_MAX = 24000;

  /**
   * Reads, validates, and sends one feedback-form submission.
   * @param {HTMLFormElement} form - the #feedback-form element that fired submit.
   */
  function submitFeedback(form) {
    const usernameEl = form.querySelector("#feedback-username");
    const textEl = form.querySelector("#feedback-text");
    const statusEl = form.querySelector("#feedback-status");
    const submitBtn = form.querySelector("#feedback-submit-btn");

    const text = (textEl.value || "").trim().slice(0, FEEDBACK_TEXT_MAX);
    const username = (usernameEl.value || "").trim().slice(0, FEEDBACK_USERNAME_MAX);

    if (!text) {
      statusEl.textContent = "Γράψε κάτι πριν στείλεις :)";
      statusEl.className = "feedback-status error";
      return;
    }
    if (!notifyUrl) {
      statusEl.textContent = "Το feedback δεν είναι ενεργό σε αυτό το guide.";
      statusEl.className = "feedback-status error";
      return;
    }

    submitBtn.disabled = true;
    statusEl.textContent = "Αποστολή...";
    statusEl.className = "feedback-status";

    fetch(notifyUrl, {
      method: "POST",
      mode: "no-cors", // opaque response — fetch resolves even on a successful send, see below
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        type: "feedback",
        course: document.title || window.location.pathname,
        username,
        text,
        browser: getExtendedBrowserMeta()
      })
    }).then(function () {
      // no-cors responses are opaque — .then() firing only means the
      // request went out without a network-level error, not that Apps
      // Script actually processed it, but that's the same fire-and-forget
      // guarantee the slide/course emails already rely on.
      statusEl.textContent = "Σε ευχαριστώ για το feedback.";
      statusEl.className = "feedback-status sent";
      form.reset();
      submitBtn.disabled = false;
    }).catch(function () {
      statusEl.textContent = "Κάτι πήγε στραβά, δοκίμασε ξανά.";
      statusEl.className = "feedback-status error";
      submitBtn.disabled = false;
    });
  }
})();