/* ══════════════════════════════════════════════════════════════════════════
   viz-bytes-runes.js — step visualizer contrasting a byte walk with a rune
   walk over the same Greek string (piscine-go-week1.html, §5).

   Root id: #bytes-runes-viz. Built on VizWaitFor from static/viz-common.js.
   viz-common.js and viz-style.css are never modified — the character row is
   widened with an inline flex value instead of a new CSS class, since the
   existing .vz-cell already provides everything else.

   Phase 1 walks s[i] over all 8 bytes. Phase 2 walks range over the 4
   characters, showing that its index counts bytes, not characters.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  var TEXT = "Γεια";
  var BYTES = [206, 147, 206, 181, 206, 185, 206, 177];
  var CHARS = [
    { ch: "Γ", at: 0, code: 915 },
    { ch: "ε", at: 2, code: 949 },
    { ch: "ι", at: 4, code: 953 },
    { ch: "α", at: 6, code: 945 }
  ];

  function buildSteps() {
    var steps = [];
    steps.push({
      phase: "intro", byteAt: -1, charAt: -1,
      code: "s := \"" + TEXT + "\"",
      note: "Τέσσερις χαρακτήρες, οκτώ bytes. Οι δύο επαναλήψεις παρακάτω δίνουν διαφορετικό πλήθος βημάτων."
    });
    for (var i = 0; i < BYTES.length; i++) {
      steps.push({
        phase: "bytes", byteAt: i, charAt: -1,
        code: "for i := 0; i < len(s); i++ → s[" + i + "]",
        note: "Το s[" + i + "] δίνει " + BYTES[i] + ", δηλαδή ένα byte — το " + (i % 2 === 0 ? "πρώτο" : "δεύτερο") + " μισό ενός γράμματος."
      });
    }
    steps.push({
      phase: "bytes-done", byteAt: -1, charAt: -1,
      code: "len(s) = 8",
      note: "Οκτώ επαναλήψεις για τέσσερα γράμματα. Καμία από τις οκτώ τιμές δεν είναι ολόκληρος χαρακτήρας."
    });
    for (var c = 0; c < CHARS.length; c++) {
      steps.push({
        phase: "runes", byteAt: CHARS[c].at, charAt: c,
        code: "for i, r := range s → i = " + CHARS[c].at + ", r = '" + CHARS[c].ch + "'",
        note: "Ο χαρακτήρας " + CHARS[c].ch + " έχει κωδικό " + CHARS[c].code + ". Η θέση μετριέται σε bytes, γι' αυτό προχωράει κατά δύο."
      });
    }
    steps.push({
      phase: "runes-done", byteAt: -1, charAt: -1,
      code: "len([]rune(s)) = 4",
      note: "Τέσσερις επαναλήψεις, μία ανά χαρακτήρα. Αυτό είναι το πλήθος που ψάχνεις όταν μετράς χαρακτήρες."
    });
    return steps;
  }

  VizWaitFor("bytes-runes-viz", function (root) {
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
      '  <div class="vz-pointer-row" data-el="bptr"></div>' +
      '  <div class="vz-array-row" data-el="bytes"></div>' +
      '  <div class="vz-array-row" data-el="chars" style="margin-top:10px"></div>' +
      '  <div class="vz-pointer-row" data-el="cptr" style="margin-top:2px"></div>' +
      '</div>' +
      '<div class="glossary-group"><div class="glossary-strip">' +
      '  <div class="gs-pill"><span class="gs-name">γραμμή</span><span class="gs-def" data-el="code">—</span></div>' +
      '</div></div>' +
      '<p data-el="note" style="margin-top:6px"></p>' +
      '<p data-el="count" style="opacity:.55"></p>';

    var bptr = root.querySelector('[data-el="bptr"]');
    var brow = root.querySelector('[data-el="bytes"]');
    var crow = root.querySelector('[data-el="chars"]');
    var cptr = root.querySelector('[data-el="cptr"]');

    var byteCells = [], bytePtrCells = [], charCells = [], charPtrCells = [];
    var i;
    for (i = 0; i < BYTES.length; i++) {
      var pc = document.createElement("div");
      pc.className = "vz-pointer-cell";
      bptr.appendChild(pc); bytePtrCells.push(pc);

      var bc = document.createElement("div");
      bc.className = "vz-cell";
      bc.textContent = BYTES[i];
      brow.appendChild(bc); byteCells.push(bc);
    }
    for (i = 0; i < CHARS.length; i++) {
      // flex:2 makes one character cell span exactly two byte cells, so the
      // two rows stay aligned without adding any new shared CSS class.
      var cc = document.createElement("div");
      cc.className = "vz-cell";
      cc.style.flex = "2 1 0";
      cc.textContent = CHARS[i].ch;
      crow.appendChild(cc); charCells.push(cc);

      var cp = document.createElement("div");
      cp.className = "vz-pointer-cell";
      cp.style.flex = "2 1 0";
      cptr.appendChild(cp); charPtrCells.push(cp);
    }

    function render() {
      var s = steps[cur];
      for (var k = 0; k < BYTES.length; k++) {
        bytePtrCells[k].textContent = (s.phase === "bytes" && k === s.byteAt) ? "↓ i" : "";
        byteCells[k].className = "vz-cell";
        if (k === s.byteAt) byteCells[k].classList.add(s.phase === "runes" ? "vz-highlight-a" : "vz-highlight-b");
      }
      for (var m = 0; m < CHARS.length; m++) {
        charPtrCells[m].textContent = (s.phase === "runes" && m === s.charAt) ? "↑ r" : "";
        charCells[m].className = "vz-cell";
        charCells[m].style.flex = "2 1 0";
        if (m === s.charAt) charCells[m].classList.add("vz-highlight-b");
      }
      root.querySelector('[data-el="code"]').textContent = s.code;
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
