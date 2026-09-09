/* ══════════════════════════════════════════════════════════════════════════
   viz-slice-loop.js — step visualizer for the counter-based for loop over a
   slice (piscine-go-week1.html, §4 "Επανάληψη με μετρητή").

   Root id: #slice-loop-viz. Built on VizWaitFor from static/viz-common.js —
   that file and static/viz-style.css are never modified; everything here
   reuses their existing vz-* classes plus the deck's own native ones.

   Step granularity follows the standing rule: every condition check and
   every body execution is its own clickable step, never bundled together.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  var VALUES = [10, 20, 30, 40, 50];

  // ── step sequence, built once ─────────────────────────────────────────── ⊃
  function buildSteps() {
    var steps = [];
    steps.push({ kind: "init", i: 0, printed: [], note: "i := 0 — ο μετρητής παίρνει την πρώτη θέση" });
    var printed = [];
    for (var i = 0; i < VALUES.length; i++) {
      steps.push({
        kind: "check", i: i, printed: printed.slice(), ok: true,
        note: "i < len(values): " + i + " < " + VALUES.length + " — αληθές, το σώμα εκτελείται"
      });
      printed = printed.concat([VALUES[i]]);
      steps.push({
        kind: "body", i: i, printed: printed.slice(),
        note: "values[" + i + "] είναι " + VALUES[i] + " — τυπώνεται"
      });
      steps.push({
        kind: "inc", i: i + 1, printed: printed.slice(),
        note: "i++ — ο μετρητής γίνεται " + (i + 1)
      });
    }
    steps.push({
      kind: "check", i: VALUES.length, printed: printed.slice(), ok: false,
      note: "i < len(values): " + VALUES.length + " < " + VALUES.length + " — ψευδές, το loop τελειώνει"
    });
    steps.push({ kind: "done", i: VALUES.length, printed: printed.slice(), note: "Το loop ολοκληρώθηκε" });
    return steps;
  }

  VizWaitFor("slice-loop-viz", function (root) {
    var steps = buildSteps();
    var cur = 0;
    var timer = null;
    var speed = 1;

    root.innerHTML =
      '<div class="vz-controls">' +
      '  <button class="reset-quiz-btn" data-act="prev">← prev step</button>' +
      '  <button class="reset-quiz-btn" data-act="next">next step →</button>' +
      '  <button class="reset-quiz-btn" data-act="reset">⟲ reset</button>' +
      '  <button class="reset-quiz-btn vz-btn-stable" data-act="play">▶ autoplay ↕</button>' +
      '</div>' +
      '<div class="quiz-code-block">' +
      '  <div class="vz-pointer-row" data-el="pointer"></div>' +
      '  <div class="vz-array-row" data-el="cells"></div>' +
      '</div>' +
      '<div class="glossary-group"><div class="glossary-strip">' +
      '  <div class="gs-pill"><span class="gs-name">i</span><span class="gs-def" data-el="i">0</span></div>' +
      '  <div class="gs-pill"><span class="gs-name">len(values)</span><span class="gs-def">' + VALUES.length + '</span></div>' +
      '  <div class="gs-pill"><span class="gs-name">έξοδος</span><span class="gs-def" data-el="out">—</span></div>' +
      '</div></div>' +
      '<p data-el="note" style="margin-top:6px"></p>' +
      '<p data-el="count" style="opacity:.55"></p>';

    var pointerRow = root.querySelector('[data-el="pointer"]');
    var cellRow = root.querySelector('[data-el="cells"]');
    var elI = root.querySelector('[data-el="i"]');
    var elOut = root.querySelector('[data-el="out"]');
    var elNote = root.querySelector('[data-el="note"]');
    var elCount = root.querySelector('[data-el="count"]');

    var pointerCells = [];
    var cells = [];
    for (var k = 0; k < VALUES.length; k++) {
      var pc = document.createElement("div");
      pc.className = "vz-pointer-cell";
      pointerRow.appendChild(pc);
      pointerCells.push(pc);

      var c = document.createElement("div");
      c.className = "vz-cell";
      c.textContent = VALUES[k];
      cellRow.appendChild(c);
      cells.push(c);
    }

    function render() {
      var s = steps[cur];
      for (var k = 0; k < VALUES.length; k++) {
        pointerCells[k].textContent = (k === s.i) ? "↓ i" : "";
        cells[k].className = "vz-cell";
        if (k < s.printed.length) cells[k].classList.add("vz-highlight-a");
        if (s.kind === "body" && k === s.i) cells[k].classList.add("vz-highlight-b");
        if (s.kind === "check" && k === s.i && s.ok === false) cells[k].classList.add("vz-highlight-c");
      }
      elI.textContent = s.i;
      elOut.textContent = s.printed.length ? s.printed.join(" ") : "—";
      elNote.textContent = s.note;
      elCount.textContent = "βήμα " + (cur + 1) + " από " + steps.length;
      root.querySelector('[data-act="prev"]').disabled = (cur === 0);
      root.querySelector('[data-act="next"]').disabled = (cur === steps.length - 1);
    }

    function stopPlay() {
      if (timer) { clearInterval(timer); timer = null; }
      root.querySelector('[data-act="play"]').textContent = "▶ autoplay ↕";
    }

    function startPlay() {
      root.querySelector('[data-act="play"]').textContent = "⏸ " + speed.toFixed(1) + "x ↕";
      timer = setInterval(function () {
        if (cur < steps.length - 1) { cur++; render(); } else { stopPlay(); }
      }, 900 / speed);
    }

    root.addEventListener("click", function (e) {
      var act = e.target.getAttribute && e.target.getAttribute("data-act");
      if (!act) return;
      if (act === "prev" && cur > 0) { stopPlay(); cur--; render(); }
      if (act === "next" && cur < steps.length - 1) { stopPlay(); cur++; render(); }
      if (act === "reset") { stopPlay(); cur = 0; render(); }
      if (act === "play") { if (timer) { stopPlay(); } else { startPlay(); } }
    });

    root.querySelector('[data-act="play"]').addEventListener("wheel", function (e) {
      e.preventDefault();
      speed = Math.min(4, Math.max(0.5, speed + (e.deltaY < 0 ? 0.5 : -0.5)));
      if (timer) { stopPlay(); startPlay(); }
      else { this.textContent = "▶ " + speed.toFixed(1) + "x ↕"; }
    }, { passive: false });

    render();
  });
})();
