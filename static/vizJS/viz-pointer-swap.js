/* ══════════════════════════════════════════════════════════════════════════
   viz-pointer-swap.js — step visualizer for a swap performed through two
   pointers (piscine-go-week1.html, §8).

   Root id: #pointer-swap-viz. Built on VizWaitFor from static/viz-common.js.
   viz-common.js and viz-style.css are never modified; this file only uses
   their existing classes plus the deck's own .reset-quiz-btn /
   .quiz-code-block / .glossary-strip.

   Every line of the function body is its own clickable step, so the moment
   where temp saves the value that would otherwise be lost is visible.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  function buildSteps() {
    return [
      {
        line: "x, y := 1, 2",
        x: 1, y: 2, temp: null, aOn: false, bOn: false, hl: null,
        note: "Δύο μεταβλητές στη μνήμη της main, με τιμές 1 και 2."
      },
      {
        line: "Swap(&x, &y)",
        x: 1, y: 2, temp: null, aOn: true, bOn: true, hl: null,
        note: "Η κλήση δίνει διευθύνσεις. Το a δείχνει στο x και το b στο y."
      },
      {
        line: "temp := *a",
        x: 1, y: 2, temp: 1, aOn: true, bOn: true, hl: "x",
        note: "Το *a διαβάζει την τιμή του x. Το temp την κρατάει, γιατί η επόμενη γραμμή θα τη σβήσει."
      },
      {
        line: "*a = *b",
        x: 2, y: 2, temp: 1, aOn: true, bOn: true, hl: "x",
        note: "Γραφή μέσω του a: το x παίρνει την τιμή του y. Το παλιό 1 υπάρχει πλέον μόνο στο temp."
      },
      {
        line: "*b = temp",
        x: 2, y: 1, temp: 1, aOn: true, bOn: true, hl: "y",
        note: "Γραφή μέσω του b: το y παίρνει το 1 από το temp. Η ανταλλαγή ολοκληρώθηκε."
      },
      {
        line: "return",
        x: 2, y: 1, temp: null, aOn: false, bOn: false, hl: null,
        note: "Οι δείκτες και το temp χάνονται. Οι αλλαγές παραμένουν, γιατί έγιναν στη μνήμη της main."
      }
    ];
  }

  VizWaitFor("pointer-swap-viz", function (root) {
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
      '  <div class="vz-pointer-row" data-el="aptr"></div>' +
      '  <div class="vz-pointer-row" data-el="bptr"></div>' +
      '  <div class="vz-array-row" data-el="cells"></div>' +
      '  <div class="vz-pointer-row" data-el="names" style="margin-top:2px"></div>' +
      '</div>' +
      '<div class="glossary-group"><div class="glossary-strip">' +
      '  <div class="gs-pill"><span class="gs-name">γραμμή</span><span class="gs-def" data-el="line">—</span></div>' +
      '  <div class="gs-pill"><span class="gs-name">temp</span><span class="gs-def" data-el="temp">—</span></div>' +
      '</div></div>' +
      '<p data-el="note" style="margin-top:6px"></p>' +
      '<p data-el="count" style="opacity:.55"></p>';

    var aptr = root.querySelector('[data-el="aptr"]');
    var bptr = root.querySelector('[data-el="bptr"]');
    var cellRow = root.querySelector('[data-el="cells"]');
    var nameRow = root.querySelector('[data-el="names"]');

    var aCells = [], bCells = [], cells = [], nameCells = [];
    var labels = ["x", "y"];
    for (var k = 0; k < 2; k++) {
      var ac = document.createElement("div");
      ac.className = "vz-pointer-cell";
      aptr.appendChild(ac); aCells.push(ac);

      var bc = document.createElement("div");
      bc.className = "vz-pointer-cell";
      bptr.appendChild(bc); bCells.push(bc);

      var c = document.createElement("div");
      c.className = "vz-cell";
      cellRow.appendChild(c); cells.push(c);

      var nc = document.createElement("div");
      nc.className = "vz-pointer-cell";
      nc.textContent = labels[k];
      nameRow.appendChild(nc); nameCells.push(nc);
    }

    function render() {
      var s = steps[cur];
      var vals = [s.x, s.y];
      aCells[0].textContent = s.aOn ? "↓ a" : "";
      aCells[1].textContent = "";
      bCells[0].textContent = "";
      bCells[1].textContent = s.bOn ? "↓ b" : "";
      for (var k = 0; k < 2; k++) {
        cells[k].textContent = vals[k];
        cells[k].className = "vz-cell";
        if (s.hl === labels[k]) cells[k].classList.add("vz-highlight-b");
        else cells[k].classList.add("vz-highlight-a");
      }
      root.querySelector('[data-el="line"]').textContent = s.line;
      root.querySelector('[data-el="temp"]').textContent = (s.temp === null) ? "—" : s.temp;
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
      }, 1400 / speed);
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
