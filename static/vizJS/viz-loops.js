/* ══════════════════════════════════════════════════════════════════════════
   viz-loops.js — two step visualizers for the loops section of
   piscine-go-week1.html.

   Roots: #loop-continue-viz (a single for with continue) and
          #loop-nested-viz  (a nested for filling a 3x3 grid)

   Built on VizWaitFor from viz-common.js. Neither viz-common.js nor
   viz-style.css is modified; this file only uses classes they already
   provide, plus the deck's own .reset-quiz-btn / .quiz-code-block /
   .glossary-strip / .gs-pill.

   NOTE: the nested visualizer is the first real user of .vz-grid /
   .vz-grid-cell, which viz-style.css shipped but nothing had exercised
   end to end. The --vz-grid-cols custom property is set inline.

   Step granularity follows the standing rule: every pass of an inner loop
   is its own clickable step, never folded into the outer pass.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── controls shared shape, duplicated per visualizer on purpose ───────── ⊃ */
/* (no shared step engine exists by design — each visualizer owns its own
   steps array and render function) */

(function () {
  var N = 10;

  function buildSteps() {
    var steps = [];
    var sum = 0;
    steps.push({
      i: -1, sum: 0, decision: "—", act: null,
      note: "sum := 0 — ο συσσωρευτής ξεκινά από το μηδέν, πριν μπει το loop."
    });
    for (var i = 0; i < N; i++) {
      var even = (i % 2 === 0);
      steps.push({
        i: i, sum: sum, decision: i + " % 2 == 0 → " + (even ? "true" : "false"), act: "test",
        note: even
          ? "Το υπόλοιπο είναι μηδέν, άρα ο αριθμός είναι άρτιος. Το continue θα ενεργοποιηθεί."
          : "Το υπόλοιπο δεν είναι μηδέν, άρα ο αριθμός είναι περιττός. Το σώμα συνεχίζει κανονικά."
      });
      if (even) {
        steps.push({
          i: i, sum: sum, decision: "continue", act: "skip",
          note: "Το continue παραλείπει την υπόλοιπη επανάληψη. Το sum μένει " + sum + "."
        });
      } else {
        sum += i;
        steps.push({
          i: i, sum: sum, decision: "sum += " + i, act: "add",
          note: "Ο περιττός προστίθεται. Το sum γίνεται " + sum + "."
        });
      }
    }
    steps.push({
      i: N, sum: sum, decision: "i < 10 → false", act: null,
      note: "Η συνθήκη έγινε ψευδής και το loop τερμάτισε. Τελικό sum: " + sum + "."
    });
    return steps;
  }

  VizWaitFor("loop-continue-viz", function (root) {
    var steps = buildSteps(), cur = 0, timer = null, speed = 1;

    root.innerHTML =
      '<div class="vz-controls">' +
      '  <button class="reset-quiz-btn" data-act="prev">← prev step</button>' +
      '  <button class="reset-quiz-btn" data-act="next">next step →</button>' +
      '  <button class="reset-quiz-btn" data-act="reset">⟲ reset</button>' +
      '  <button class="reset-quiz-btn vz-btn-stable" data-act="play">▶ autoplay ↕</button>' +
      '</div>' +
      '<div class="quiz-code-block">' +
      '  <div class="vz-pointer-row" data-el="ptr"></div>' +
      '  <div class="vz-array-row" data-el="cells"></div>' +
      '</div>' +
      '<div class="glossary-group"><div class="glossary-strip">' +
      '  <div class="gs-pill"><span class="gs-name">i</span><span class="gs-def" data-el="i">—</span></div>' +
      '  <div class="gs-pill"><span class="gs-name">έλεγχος</span><span class="gs-def" data-el="dec">—</span></div>' +
      '  <div class="gs-pill"><span class="gs-name">sum</span><span class="gs-def" data-el="sum">0</span></div>' +
      '</div></div>' +
      '<p data-el="note" style="margin-top:6px"></p>' +
      '<p data-el="count" style="opacity:.55"></p>';

    var ptrRow = root.querySelector('[data-el="ptr"]');
    var cellRow = root.querySelector('[data-el="cells"]');
    var ptrCells = [], cells = [];
    for (var k = 0; k < N; k++) {
      var p = document.createElement("div");
      p.className = "vz-pointer-cell";
      ptrRow.appendChild(p); ptrCells.push(p);
      var c = document.createElement("div");
      c.className = "vz-cell";
      c.textContent = k;
      cellRow.appendChild(c); cells.push(c);
    }

    function render() {
      var s = steps[cur];
      for (var k = 0; k < N; k++) {
        ptrCells[k].textContent = (k === s.i) ? "↓ i" : "";
        cells[k].className = "vz-cell";
        if (k < s.i && k % 2 !== 0) cells[k].classList.add("vz-highlight-a");
        if (k === s.i && s.act === "add") cells[k].classList.add("vz-highlight-b");
        if (k === s.i && s.act === "skip") cells[k].classList.add("vz-highlight-c");
      }
      root.querySelector('[data-el="i"]').textContent = (s.i < 0 || s.i >= N) ? "—" : s.i;
      root.querySelector('[data-el="dec"]').textContent = s.decision;
      root.querySelector('[data-el="sum"]').textContent = s.sum;
      root.querySelector('[data-el="note"]').textContent = s.note;
      root.querySelector('[data-el="count"]').textContent = "βήμα " + (cur + 1) + " από " + steps.length;
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

(function () {
  var SIZE = 3;

  function buildSteps() {
    var steps = [];
    var filled = [];
    steps.push({ i: 0, j: 0, filled: [], out: "", note: "Το εξωτερικό loop δεν έχει ξεκινήσει ακόμη." });
    for (var i = 1; i <= SIZE; i++) {
      steps.push({
        i: i, j: 0, filled: filled.slice(), out: outOf(filled),
        note: "Νέα επανάληψη του εξωτερικού loop: i = " + i + ". Το j ξεκινά ξανά από το 1."
      });
      for (var j = 1; j <= SIZE; j++) {
        filled = filled.concat([{ i: i, j: j, v: i * j }]);
        steps.push({
          i: i, j: j, filled: filled.slice(), out: outOf(filled),
          note: "fmt.Print(i*j) με i = " + i + " και j = " + j + " → τυπώνεται " + (i * j) + "."
        });
      }
      steps.push({
        i: i, j: 0, filled: filled.slice(), out: outOf(filled) + "\n",
        note: "Το εσωτερικό loop τελείωσε. Η fmt.Println() κλείνει τη γραμμή και το i προχωράει."
      });
    }
    steps.push({
      i: 0, j: 0, filled: filled.slice(), out: outOf(filled),
      note: "Και τα δύο loops τερμάτισαν. Το σώμα του εσωτερικού έτρεξε 3 × 3 = 9 φορές."
    });
    return steps;
  }

  function outOf(filled) {
    var lines = [];
    for (var r = 1; r <= SIZE; r++) {
      var row = filled.filter(function (f) { return f.i === r; })
                      .map(function (f) { return f.v; }).join(" ");
      if (row) lines.push(row);
    }
    return lines.join("\n");
  }

  VizWaitFor("loop-nested-viz", function (root) {
    var steps = buildSteps(), cur = 0, timer = null, speed = 1;

    root.innerHTML =
      '<div class="vz-controls">' +
      '  <button class="reset-quiz-btn" data-act="prev">← prev step</button>' +
      '  <button class="reset-quiz-btn" data-act="next">next step →</button>' +
      '  <button class="reset-quiz-btn" data-act="reset">⟲ reset</button>' +
      '  <button class="reset-quiz-btn vz-btn-stable" data-act="play">▶ autoplay ↕</button>' +
      '</div>' +
      '<div class="quiz-code-block">' +
      '  <div class="vz-grid" style="--vz-grid-cols:3" data-el="grid"></div>' +
      '</div>' +
      '<div class="glossary-group"><div class="glossary-strip">' +
      '  <div class="gs-pill"><span class="gs-name">i (εξωτερικό)</span><span class="gs-def" data-el="i">—</span></div>' +
      '  <div class="gs-pill"><span class="gs-name">j (εσωτερικό)</span><span class="gs-def" data-el="j">—</span></div>' +
      '  <div class="gs-pill"><span class="gs-name">εκτελέσεις σώματος</span><span class="gs-def" data-el="n">0</span></div>' +
      '</div></div>' +
      '<pre style="margin:8px 0"><code data-el="out"></code></pre>' +
      '<p data-el="note" style="margin-top:6px"></p>' +
      '<p data-el="count" style="opacity:.55"></p>';

    var grid = root.querySelector('[data-el="grid"]');
    var gcells = [];
    for (var k = 0; k < SIZE * SIZE; k++) {
      var c = document.createElement("div");
      c.className = "vz-grid-cell";
      grid.appendChild(c); gcells.push(c);
    }

    function render() {
      var s = steps[cur];
      for (var k = 0; k < gcells.length; k++) {
        gcells[k].textContent = "";
        gcells[k].className = "vz-grid-cell";
      }
      s.filled.forEach(function (f) {
        var idx = (f.i - 1) * SIZE + (f.j - 1);
        gcells[idx].textContent = f.v;
        gcells[idx].classList.add("vz-highlight-a");
      });
      if (s.i && s.j) {
        var cu = (s.i - 1) * SIZE + (s.j - 1);
        gcells[cu].classList.remove("vz-highlight-a");
        gcells[cu].classList.add("vz-highlight-b");
      }
      root.querySelector('[data-el="i"]').textContent = s.i || "—";
      root.querySelector('[data-el="j"]').textContent = s.j || "—";
      root.querySelector('[data-el="n"]').textContent = s.filled.length;
      root.querySelector('[data-el="out"]').textContent = s.out || " ";
      root.querySelector('[data-el="note"]').textContent = s.note;
      root.querySelector('[data-el="count"]').textContent = "βήμα " + (cur + 1) + " από " + steps.length;
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
      }, 1000 / speed);
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
