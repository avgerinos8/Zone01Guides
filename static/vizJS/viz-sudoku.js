/* ══════════════════════════════════════════════════════════════════════════
   viz-sudoku.js — two step-by-step backtracking visualizers over the SAME
   44-empty-cell puzzle (unique solution, verified with CountSolutions), so
   the only variable between them is which empty cell gets picked next:

     #sudoku-naive-viz  first empty cell in scan order  -> 1930 events
     #sudoku-mrv-viz    fewest-candidates cell (MRV)    ->   88 events

   One step = one digit tried, rejections included, per the course's
   granularity rule.

   PERFORMANCE NOTE: at speed x50 a step lasts ~6ms, which is shorter than a
   60fps frame. Autoplay therefore runs on requestAnimationFrame, advances as
   many steps as real elapsed time allows, and paints ONCE per frame, writing
   only the cells whose rendered key actually changed. setInterval at 6ms
   would queue up faster than the browser can paint and the animation would
   visibly stutter and drift.

   Depends on VizWaitFor from viz-common.js (loaded first) and the .vzs-*
   classes appended to viz-style.css. Nothing existing is modified.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
    "use strict";

    // ── the puzzle: 44 empty cells, verified single solution ─────────────── ⊃
    const PUZZLE = [
        [0, 0, 4, 3, 0, 0, 1, 0, 0],
        [5, 3, 2, 0, 6, 1, 8, 0, 0],
        [1, 7, 0, 8, 0, 9, 5, 0, 4],
        [0, 5, 9, 0, 1, 0, 0, 0, 0],
        [0, 0, 3, 9, 0, 8, 0, 0, 0],
        [4, 0, 1, 0, 0, 0, 0, 7, 0],
        [2, 0, 7, 0, 0, 0, 0, 5, 0],
        [3, 0, 5, 0, 9, 4, 0, 0, 8],
        [9, 6, 0, 0, 5, 2, 0, 0, 1]
    ];

    // Speed is the product of two independent controls: the speed button
    // cycles the coarse step and resets the fine nudge (that is the
    // "override"), the wheel over autoplay nudges around whatever coarse
    // step is currently set.
    const SPEEDS = [1, 5, 10, 20, 50];
    const FINE = [0.5, 0.7, 1, 1.4, 2];
    const FINE_CENTER = 2;                // index of the neutral 1x multiplier

    const BASE_MS = 300;                  // milliseconds per step at x1
    const MAX_FRAME_MS = 250;             // clamp, so a backgrounded tab never jumps

    // ── the two code panels ──────────────────────────────────────────────── ⊃
    // [code, trailing comment]. Rendered with textContent, so no escaping.
    const CODE_NAIVE = [
        ["func SolveSudoku(grid [][]int) bool {", ""],
        ["    for row := 0; row < 9; row++ {", ""],
        ["        for col := 0; col < 9; col++ {", ""],
        ["            if grid[row][col] != 0 {", ""],
        ["                continue", "  // already filled"],
        ["            }", ""],
        ["", ""],
        ["            for val := 1; val <= 9; val++ {", ""],
        ["                if !isValidMove(grid, row, col, val) {", ""],
        ["                    continue", "  // PRUNE"],
        ["                }", ""],
        ["", ""],
        ["                grid[row][col] = val", "   // 1. CHOOSE"],
        ["                if SolveSudoku(grid) {", " // 2. EXPLORE"],
        ["                    return true", ""],
        ["                }", ""],
        ["                grid[row][col] = 0", "     // 3. UN-CHOOSE"],
        ["            }", ""],
        ["", ""],
        ["            return false", "  // no digit fits here"],
        ["        }", ""],
        ["    }", ""],
        ["    return true", "  // BASE CASE: no empty cell left - solved"],
        ["}", ""]
    ];

    const CODE_MRV = [
        ["func SolveSudokuMRV(grid [][]int) bool {", ""],
        ["    row, col, options, found := findBestCell(grid)", ""],
        ["    if !found {", ""],
        ["        return true", "  // BASE CASE: no empty cell left - solved"],
        ["    }", ""],
        ["", ""],
        ["    for _, val := range options {", ""],
        ["        grid[row][col] = val", "      // 1. CHOOSE"],
        ["        if SolveSudokuMRV(grid) {", " // 2. EXPLORE"],
        ["            return true", ""],
        ["        }", ""],
        ["        grid[row][col] = 0", "        // 3. UN-CHOOSE"],
        ["    }", ""],
        ["    return false", "  // every candidate failed"],
        ["}", ""]
    ];

    const LINES_NAIVE = {
        start: [0], reject: [8, 9], place: [12], undo: [16], dead: [19], solved: [22]
    };
    const LINES_MRV = {
        start: [0], pick: [1], place: [7], undo: [11], dead: [13], solved: [3]
    };

    // ── tiny helpers ─────────────────────────────────────────────────────── ⊃
    function pick(root, name) {
        return root.querySelector('[data-vzs="' + name + '"]');
    }

    function cloneGrid(grid) {
        return grid.map(function (row) { return row.slice(); });
    }

    function cellName(r, c) {
        return "(" + (r + 1) + "," + (c + 1) + ")";
    }

    // Mirrors isValidMove's scan order exactly, so the conflicting cell the
    // visualizer points at is the same one the Go code would hit first.
    function findConflict(grid, row, col, val) {
        for (let i = 0; i < 9; i++) {
            if (grid[row][i] === val) return { r: row, c: i, kind: "γραμμή" };
            if (grid[i][col] === val) return { r: i, c: col, kind: "στήλη" };
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (grid[r][c] === val) return { r: r, c: c, kind: "κουτί 3x3" };
            }
        }
        return null;
    }

    function candidates(grid, row, col) {
        const used = new Array(10).fill(false);
        for (let i = 0; i < 9; i++) {
            used[grid[row][i]] = true;
            used[grid[i][col]] = true;
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                used[grid[r][c]] = true;
            }
        }
        const options = [];
        for (let val = 1; val <= 9; val++) {
            if (!used[val]) options.push(val);
        }
        return options;
    }

    // ── event traces ─────────────────────────────────────────────────────── ⊃
    // Events are INVERTIBLE (place <-> clear), so stepping backwards never
    // needs a stored grid snapshot per step - only the event itself.
    function traceNaive(start) {
        const grid = cloneGrid(start);
        const events = [];

        function go(depth) {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (grid[row][col] !== 0) continue;

                    for (let val = 1; val <= 9; val++) {
                        const conflict = findConflict(grid, row, col, val);
                        if (conflict) {
                            events.push({
                                type: "reject", r: row, c: col, v: val,
                                conflict: conflict, depth: depth
                            });
                            continue;
                        }
                        events.push({ type: "place", r: row, c: col, v: val, depth: depth });
                        grid[row][col] = val;
                        if (go(depth + 1)) return true;
                        grid[row][col] = 0;
                        events.push({ type: "undo", r: row, c: col, v: val, depth: depth });
                    }

                    events.push({ type: "dead", r: row, c: col, depth: depth });
                    return false;
                }
            }
            return true;
        }

        go(0);
        events.push({ type: "solved", depth: 0 });
        return events;
    }

    function traceMRV(start) {
        const grid = cloneGrid(start);
        const events = [];

        function go(depth) {
            let bestRow = -1;
            let bestCol = -1;
            let bestOpts = null;
            let fewest = 10;

            for (let row = 0; row < 9 && fewest > 1; row++) {
                for (let col = 0; col < 9; col++) {
                    if (grid[row][col] !== 0) continue;
                    const opts = candidates(grid, row, col);
                    if (opts.length < fewest) {
                        bestRow = row;
                        bestCol = col;
                        bestOpts = opts;
                        fewest = opts.length;
                        if (fewest <= 1) break;
                    }
                }
            }

            if (bestRow < 0) return true;

            events.push({ type: "pick", r: bestRow, c: bestCol, opts: bestOpts, depth: depth });
            for (let i = 0; i < bestOpts.length; i++) {
                const val = bestOpts[i];
                events.push({
                    type: "place", r: bestRow, c: bestCol, v: val,
                    opts: bestOpts, depth: depth
                });
                grid[bestRow][bestCol] = val;
                if (go(depth + 1)) return true;
                grid[bestRow][bestCol] = 0;
                events.push({
                    type: "undo", r: bestRow, c: bestCol, v: val,
                    opts: bestOpts, depth: depth
                });
            }
            events.push({ type: "dead", r: bestRow, c: bestCol, opts: bestOpts, depth: depth });
            return false;
        }

        go(0);
        events.push({ type: "solved", depth: 0 });
        return events;
    }

    // Cumulative counters, precomputed so any index can be shown instantly
    // without replaying the trace.
    function addStats(events) {
        let att = 0;
        let placed = 0;
        let back = 0;
        events.forEach(function (e) {
            if (e.type === "reject" || e.type === "place") att += 1;
            if (e.type === "place") placed += 1;
            if (e.type === "undo") back += 1;
            e.att = att;
            e.placed = placed;
            e.back = back;
        });
        return events;
    }

    // ── narration ────────────────────────────────────────────────────────── ⊃
    function narrate(e, isMRV, total) {
        if (!e) {
            return isMRV
                ? "Το ίδιο πλέγμα, 44 κενά κελιά. Αυτή τη φορά κάθε κλήση διαλέγει " +
                "<b>το κελί με τους λιγότερους υποψηφίους</b>, όχι το πρώτο που θα συναντήσει."
                : "44 κενά κελιά. Κάθε κλήση πιάνει <b>το πρώτο κενό</b> που θα βρει σαρώνοντας " +
                "από πάνω αριστερά, και δοκιμάζει τα ψηφία 1 έως 9 με τη σειρά.";
        }
        switch (e.type) {
            case "pick":
                return "Σάρωση όλων των κενών κελιών: το <b>" + cellName(e.r, e.c) + "</b> έχει τους " +
                    "λιγότερους υποψηφίους — <b>" + e.opts.length + "</b>" +
                    (e.opts.length > 0 ? " (" + e.opts.join(", ") + ")" : "") + ". " +
                    (e.opts.length === 1
                        ? "Ένας μόνο υποψήφιος σημαίνει ότι δεν υπάρχει επιλογή, άρα ούτε ρίσκο."
                        : (e.opts.length === 0
                            ? "Μηδέν υποψήφιοι: αδιέξοδο, πριν καν δοκιμαστεί ψηφίο."
                            : "Κανένα άλλο κενό κελί δεν είναι πιο περιορισμένο."));
            case "reject":
                return "Το <span class='is-bad'>" + e.v + "</span> δεν χωράει στο <b>" + cellName(e.r, e.c) +
                    "</b>: υπάρχει ήδη στη " + e.conflict.kind + ", στο " + cellName(e.conflict.r, e.conflict.c) +
                    ". <code>isValidMove</code> false, <b>continue</b> — αυτό είναι το pruning.";
            case "place":
                return "Το <span class='is-good'>" + e.v + "</span> περνάει τους ελέγχους και γράφεται στο <b>" +
                    cellName(e.r, e.c) + "</b> (<b>choose</b>). Η αναδρομική κλήση αναλαμβάνει τώρα ολόκληρο " +
                    "το υπόλοιπο puzzle — βάθος " + (e.depth + 1) + ".";
            case "undo":
                return "Η κλήση από κάτω γύρισε <span class='is-bad'>false</span>. Το <b>" + e.v +
                    "</b> στο <b>" + cellName(e.r, e.c) + "</b> σβήνεται (<b>un-choose</b>) και το πλέγμα " +
                    "επιστρέφει ακριβώς όπως ήταν πριν τη δοκιμή.";
            case "dead":
                return "Κανένα από τα ψηφία δεν χωράει στο <b>" + cellName(e.r, e.c) + "</b>. " +
                    "<b>return false</b>: το λάθος δεν είναι εδώ, είναι σε κάποια προηγούμενη επιλογή, " +
                    "και ο caller πρέπει να την αλλάξει.";
            case "solved":
                return "Κανένα κενό κελί δεν έμεινε — το <b>base case</b> επιστρέφει <b>true</b>, και η " +
                    "επιτυχία ανεβαίνει αμετάβλητη μέχρι την αρχική κλήση. Σύνολο: <b>" + e.att +
                    "</b> δοκιμές ψηφίων, <b>" + e.placed + "</b> τοποθετήσεις, <b>" + e.back +
                    "</b> backtracks σε " + total + " βήματα.";
        }
        return "";
    }

    // ── one visualizer ───────────────────────────────────────────────────── ⊃
    function build(root, config) {
        const events = addStats(config.trace(PUZZLE));
        const stepCount = events.length + 1;      // index 0 = untouched board
        const lineMap = config.lines;
        const isMRV = config.isMRV;

        const boardEl = pick(root, "board");
        const digitsEl = pick(root, "digits");
        const codeEl = pick(root, "code");
        const noteEl = pick(root, "note");
        const counterEl = pick(root, "counter");
        const statAtt = pick(root, "stat-att");
        const statPlaced = pick(root, "stat-placed");
        const statBack = pick(root, "stat-back");
        const statDepth = pick(root, "stat-depth");

        const prevBtn = pick(root, "prev");
        const nextBtn = pick(root, "next");
        const resetBtn = pick(root, "reset");
        const playBtn = pick(root, "play");
        const speedBtn = pick(root, "speed");

        // ── build the static DOM once ───────────────────────────────────── ⊃
        const cells = [];
        const painted = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement("div");
                let cls = "vz-grid-cell";
                if (c === 2 || c === 5) cls += " vzs-box-right";
                if (r === 2 || r === 5) cls += " vzs-box-bottom";
                cell.className = cls;
                cell.dataset.base = cls;
                boardEl.appendChild(cell);
                cells.push(cell);
                painted.push(null);
            }
        }

        const digitEls = [];
        for (let d = 1; d <= 9; d++) {
            const el = document.createElement("span");
            el.className = "vzs-digit";
            el.textContent = String(d);
            digitsEl.appendChild(el);
            digitEls.push(el);
        }

        const lineEls = config.code.map(function (pair) {
            const line = document.createElement("span");
            line.className = "vzs-line";
            const code = document.createElement("span");
            code.textContent = pair[0];
            line.appendChild(code);
            if (pair[1]) {
                const comment = document.createElement("span");
                comment.className = "vzs-code-comment";
                comment.textContent = pair[1];
                line.appendChild(comment);
            }
            codeEl.appendChild(line);
            return line;
        });

        // ── mutable state ───────────────────────────────────────────────── ⊃
        const grid = cloneGrid(PUZZLE);
        let index = 0;
        let baseIdx = 0;
        let fineIdx = FINE_CENTER;
        let running = false;
        let rafId = null;
        let lastTs = 0;
        let carry = 0;
        let activeLines = [];

        function resetGrid() {
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) grid[r][c] = PUZZLE[r][c];
            }
        }

        function forward() {
            const e = events[index];
            if (e.type === "place") grid[e.r][e.c] = e.v;
            else if (e.type === "undo") grid[e.r][e.c] = 0;
            index += 1;
        }

        function backward() {
            index -= 1;
            const e = events[index];
            if (e.type === "place") grid[e.r][e.c] = 0;
            else if (e.type === "undo") grid[e.r][e.c] = e.v;
        }

        // ── painting ────────────────────────────────────────────────────── ⊃
        function highlightFor(e, r, c) {
            if (!e || e.type === "solved") return "";

            // the existing digit that explains a rejection, when it is not
            // the cell we are standing on
            if (e.conflict && e.conflict.r === r && e.conflict.c === c &&
                !(e.r === r && e.c === c)) {
                return " vzs-conflict";
            }
            if (e.r !== r || e.c !== c) return "";

            let cls = " vzs-focus"; // always mark where the algorithm stands
            if (e.type === "place") cls += " vzs-good";
            else if (e.type === "reject" || e.type === "undo" || e.type === "dead") cls += " vzs-bad";
            else if (e.type === "pick") cls += " vzs-active";
            return cls;
        }

        function paint() {
            const e = index > 0 ? events[index - 1] : null;

            // board - only cells whose rendered key actually changed
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    const i = r * 9 + c;
                    const value = grid[r][c];
                    let cls = cells[i].dataset.base;
                    if (PUZZLE[r][c] !== 0) cls += " vzs-given";
                    else if (value !== 0) cls += " vzs-filled";
                    cls += highlightFor(e, r, c);

                    const key = value + "|" + cls;
                    if (painted[i] === key) continue;
                    painted[i] = key;
                    cells[i].className = cls;
                    cells[i].textContent = value === 0 ? "" : String(value);
                }
            }
            boardEl.classList.toggle("vzs-solved", !!e && e.type === "solved");

            // digit strip
            const hasCell = !!e && e.type !== "solved";
            for (let d = 1; d <= 9; d++) {
                let cls = "vzs-digit";
                if (!hasCell) {
                    cls += " is-pending";
                } else if (isMRV) {
                    const opts = e.opts || [];
                    const at = opts.indexOf(d);
                    if (at === -1) cls += " is-illegal";
                    else if (e.type === "pick") cls += " is-pending";
                    else if (d === e.v) cls += (e.type === "place") ? " is-current-good" : " is-current-bad";
                    else if (at < opts.indexOf(e.v)) cls += " is-tried";
                    else cls += " is-pending";
                } else {
                    if (e.type === "dead") cls += " is-tried";
                    else if (d < e.v) cls += " is-tried";
                    else if (d === e.v) cls += (e.type === "place") ? " is-current-good" : " is-current-bad";
                    else cls += " is-pending";
                }
                if (digitEls[d - 1].className !== cls) digitEls[d - 1].className = cls;
            }

            // code panel
            const wanted = lineMap[e ? e.type : "start"] || [];
            if (wanted.join() !== activeLines.join()) {
                activeLines.forEach(function (n) { lineEls[n].classList.remove("is-active"); });
                wanted.forEach(function (n) { lineEls[n].classList.add("is-active"); });
                activeLines = wanted;
            }

            // counters and narration
            statAtt.textContent = e ? String(e.att) : "0";
            statPlaced.textContent = e ? String(e.placed) : "0";
            statBack.textContent = e ? String(e.back) : "0";
            statDepth.textContent = e ? String(e.depth) : "0";
            counterEl.textContent = "βήμα " + index + " / " + (stepCount - 1);
            noteEl.innerHTML = narrate(e, isMRV, stepCount - 1);

            prevBtn.disabled = (index === 0);
            nextBtn.disabled = (index === stepCount - 1);
            resetBtn.disabled = (index === 0 && !running);
        }

        // ── autoplay on requestAnimationFrame ───────────────────────────── ⊃
        function multiplier() {
            return SPEEDS[baseIdx] * FINE[fineIdx];
        }

        function refreshLabels() {
            const shown = Math.round(multiplier() * 10) / 10;
            playBtn.textContent = (running ? "⏸ pause ×" : "▶ autoplay ×") + shown + " ↕";
            speedBtn.textContent = "speed ×" + SPEEDS[baseIdx] + " ⟳";
        }

        function stop() {
            running = false;
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            refreshLabels();
        }

        function frame(ts) {
            if (!running) return;
            if (!root.isConnected) { stop(); return; }
            if (!lastTs) lastTs = ts;

            let delta = ts - lastTs;
            lastTs = ts;
            if (delta > MAX_FRAME_MS) delta = MAX_FRAME_MS;
            carry += delta;

            const perStep = BASE_MS / multiplier();
            let moved = false;
            while (carry >= perStep && index < stepCount - 1) {
                carry -= perStep;
                forward();
                moved = true;
            }
            if (moved) paint();

            if (index >= stepCount - 1) { stop(); paint(); return; }
            rafId = requestAnimationFrame(frame);
        }

        function start() {
            if (index === stepCount - 1) {
                index = 0;
                resetGrid();
            }
            running = true;
            lastTs = 0;
            carry = 0;
            refreshLabels();
            rafId = requestAnimationFrame(frame);
            paint();
        }

        // ── wiring ──────────────────────────────────────────────────────── ⊃
        prevBtn.addEventListener("click", function () {
            stop();
            if (index > 0) backward();
            paint();
        });

        nextBtn.addEventListener("click", function () {
            stop();
            if (index < stepCount - 1) forward();
            paint();
        });

        resetBtn.addEventListener("click", function () {
            stop();
            index = 0;
            resetGrid();
            paint();
        });

        playBtn.addEventListener("click", function () {
            if (running) { stop(); paint(); } else { start(); }
        });

        // passive:false so preventDefault actually stops the slide scrolling
        playBtn.addEventListener("wheel", function (event) {
            event.preventDefault();
            const next = fineIdx + (event.deltaY < 0 ? 1 : -1);
            if (next < 0 || next > FINE.length - 1) return;
            fineIdx = next;
            carry = 0;
            refreshLabels();
        }, { passive: false });

        function setBase(direction) {
            baseIdx = (baseIdx + direction + SPEEDS.length) % SPEEDS.length;
            fineIdx = FINE_CENTER; // the coarse button overrides the fine nudge
            carry = 0;
            refreshLabels();
        }

        speedBtn.addEventListener("click", function () { setBase(1); });
        speedBtn.addEventListener("wheel", function (event) {
            event.preventDefault();
            setBase(event.deltaY < 0 ? 1 : -1);
        }, { passive: false });

        refreshLabels();
        paint();
    }

    VizWaitFor("sudoku-naive-viz", function (root) {
        build(root, { trace: traceNaive, code: CODE_NAIVE, lines: LINES_NAIVE, isMRV: false });
    });

    VizWaitFor("sudoku-mrv-viz", function (root) {
        build(root, { trace: traceMRV, code: CODE_MRV, lines: LINES_MRV, isMRV: true });
    });
})();