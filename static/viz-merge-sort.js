/* ══════════════════════════════════════════════════════════════════════════
   _viz-merge-sort.js — two step-by-step visualizers for section 6.3
   (Divide and Conquer):

     #ms-merge-viz  the merge() function itself, stepped over the two sorted
                    halves of the deck's own example: [1,2,5,9] + [3,4,7,8]
     #ms-tree-viz   the whole MergeSort call tree over [5,2,9,1,7,3,8,4],
                    stepped in REAL call order (post-order / depth first),
                    not level by level - because level by level is a lie
                    about how the recursion actually runs

   Depends on VizWaitFor from _viz-common.js (must be loaded first) and on
   the .vzm-* classes appended to _viz-common.css. Nothing in either shared
   file is modified or relied upon beyond what already existed.

   Control labels and behaviour deliberately mirror the sliding-window
   visualizer: prev step / next step / reset / autoplay, with wheel-over-
   autoplay adjusting the speed multiplier.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
    "use strict";

    const PLAY_LABEL = "▶ autoplay ↕";
    const PAUSE_LABEL = "⏸ pause ↕";
    const SPEEDS = [0.5, 0.75, 1, 1.5, 2, 3];
    const DEFAULT_SPEED = 2; // index into SPEEDS -> 1x

    // ── tiny DOM helpers ─────────────────────────────────────────────────── ⊃
    function pick(root, name) {
        return root.querySelector('[data-vzm="' + name + '"]');
    }

    function fillWith(container, count, cls) {
        container.innerHTML = "";
        for (let n = 0; n < count; n++) {
            const node = document.createElement("div");
            node.className = cls;
            container.appendChild(node);
        }
    }

    function show(values) {
        return "[" + values.join(", ") + "]";
    }

    // ── shared step player: prev / next / reset / autoplay + counter ─────── ⊃
    // Knows nothing about either algorithm - it only owns the current index
    // and calls paintStep(index). Each visualizer keeps its own step shape.
    // Wheel over the autoplay button changes the speed multiplier; the label
    // shows "speed: N.Nx" for a moment, then goes back to play/pause.
    function makePlayer(root, count, paintStep, interval) {
        const prevBtn = pick(root, "prev");
        const nextBtn = pick(root, "next");
        const resetBtn = pick(root, "reset");
        const playBtn = pick(root, "play");
        const counterEl = pick(root, "counter");
        let index = 0;
        let timer = null;
        let speed = DEFAULT_SPEED;
        let labelTimer = null;

        function currentLabel() {
            return (timer !== null) ? PAUSE_LABEL : PLAY_LABEL;
        }

        function paint() {
            paintStep(index);
            prevBtn.disabled = (index === 0);
            nextBtn.disabled = (index === count - 1);
            resetBtn.disabled = (index === 0 && timer === null);
            if (counterEl) {
                counterEl.textContent = "βήμα " + index + " / " + (count - 1);
            }
        }

        function pause() {
            if (timer !== null) {
                clearInterval(timer);
                timer = null;
            }
            playBtn.textContent = currentLabel();
        }

        function play() {
            if (index === count - 1) {
                index = 0; // restart from the top instead of doing nothing
            }
            timer = setInterval(function () {
                // The slide DOM can be replaced; never keep ticking on a
                // detached tree.
                if (!root.isConnected || index >= count - 1) {
                    pause();
                    paint();
                    return;
                }
                index += 1;
                paint();
            }, interval / SPEEDS[speed]);
            playBtn.textContent = PAUSE_LABEL;
            paint();
        }

        function restartIfRunning() {
            if (timer !== null) {
                clearInterval(timer);
                timer = null;
                play();
            }
        }

        prevBtn.addEventListener("click", function () {
            pause();
            if (index > 0) { index -= 1; }
            paint();
        });

        nextBtn.addEventListener("click", function () {
            pause();
            if (index < count - 1) { index += 1; }
            paint();
        });

        resetBtn.addEventListener("click", function () {
            pause();
            index = 0;
            paint();
        });

        playBtn.addEventListener("click", function () {
            if (timer !== null) { pause(); paint(); } else { play(); }
        });

        // passive:false is required, otherwise preventDefault() is ignored
        // and the wheel scrolls the slide instead of changing the speed.
        playBtn.addEventListener("wheel", function (event) {
            event.preventDefault();
            const step = (event.deltaY < 0) ? 1 : -1;
            const next = speed + step;
            if (next < 0 || next > SPEEDS.length - 1) { return; }
            speed = next;
            playBtn.textContent = "speed: " + SPEEDS[speed].toFixed(1) + "x";
            if (labelTimer !== null) { clearTimeout(labelTimer); }
            labelTimer = setTimeout(function () {
                playBtn.textContent = currentLabel();
                labelTimer = null;
            }, 900);
            restartIfRunning();
        }, { passive: false });

        playBtn.textContent = PLAY_LABEL;
        paint();
    }

    // ══════════════════════════════════════════════════════════════════════
    //  VISUALIZER 1 - the merge function
    // ══════════════════════════════════════════════════════════════════════

    const LEFT = [1, 2, 5, 9];
    const RIGHT = [3, 4, 7, 8];
    const TOTAL = LEFT.length + RIGHT.length;

    // Every loop iteration becomes TWO steps on purpose: "compare" shows the
    // two candidates with no verdict yet (the reader can predict), "take"
    // reveals the winner and advances exactly one pointer.
    function buildMergeSteps() {
        const steps = [];
        const result = [];
        let i = 0;
        let j = 0;
        let comparisons = 0;

        steps.push({
            phase: "init", i: 0, j: 0, result: [], comparisons: 0,
            note: "Δύο δείκτες, ένας για κάθε λίστα, και οι δύο στην αρχή. " +
                "Το <b>result</b> είναι άδειο και έχει χώρο για " + TOTAL + " στοιχεία."
        });

        while (i < LEFT.length && j < RIGHT.length) {
            const takeLeft = LEFT[i] <= RIGHT[j];
            const fromI = i;
            const fromJ = j;
            comparisons += 1;

            steps.push({
                phase: "compare", i: i, j: j, result: result.slice(), comparisons: comparisons,
                cmp: { i: fromI, j: fromJ, takeLeft: takeLeft },
                note: `Σύγκρινε <b>left[${fromI}] = ${LEFT[fromI]}</b> με ` +
                    `<b>right[${fromJ}] = ${RIGHT[fromJ]}</b>. ` +
                    "Κανένα άλλο στοιχείο δεν χρειάζεται να κοιταχτεί."
            });

            const value = takeLeft ? LEFT[i] : RIGHT[j];
            const slot = result.length;
            result.push(value);
            if (takeLeft) { i += 1; } else { j += 1; }

            steps.push({
                phase: "take", i: i, j: j, result: result.slice(), comparisons: comparisons,
                cmp: { i: fromI, j: fromJ, takeLeft: takeLeft },
                taken: {
                    side: takeLeft ? "left" : "right",
                    from: takeLeft ? fromI : fromJ,
                    slot: slot
                },
                note: `Το <b>${value}</b> είναι το μικρότερο, οπότε μπαίνει στη θέση ` +
                    `<b>result[${slot}]</b>. Προχωράει ΜΟΝΟ ο δείκτης ` +
                    `<b>${takeLeft ? "i" : "j"}</b> — η άλλη λίστα δεν έχασε τίποτα.`
            });
        }

        const leftOver = (i < LEFT.length) ? LEFT.slice(i) : RIGHT.slice(j);
        const tailSide = (i < LEFT.length) ? "left" : "right";
        const emptySide = (tailSide === "left") ? "right" : "left";
        const tailSlot = result.length;
        const tailFrom = (tailSide === "left") ? i : j;
        for (let t = 0; t < leftOver.length; t++) {
            result.push(leftOver[t]);
        }

        steps.push({
            phase: "flush", i: i, j: j, result: result.slice(), comparisons: comparisons,
            tail: { side: tailSide, from: tailFrom, slot: tailSlot },
            note: `Η λίστα <b>${emptySide}</b> άδειασε, οπότε η λούπα σταμάτησε. ` +
                `Ό,τι απομένει στο <b>${tailSide}</b> — δηλαδή ` +
                `<b>${tailSide}[${tailFrom}:] = ${show(leftOver)}</b> — μπαίνει ` +
                "στο τέλος ως έχει, χωρίς καμία επιπλέον σύγκριση."
        });

        steps.push({
            phase: "done", i: i, j: j, result: result.slice(), comparisons: comparisons,
            note: `Μία ταξινομημένη λίστα από δύο: <b>${show(result)}</b>. ` +
                "Κάθε στοιχείο πέρασε ακριβώς μία φορά — γι' αυτό το merge " +
                "κοστίζει <b>O(n)</b>."
        });

        return steps;
    }

    // ── merge visualizer: painting ───────────────────────────────────────── ⊃
    function paintSide(cellsEl, ptrEl, values, side, step) {
        const cursor = (side === "left") ? step.i : step.j;
        const cmpIndex = step.cmp ? (side === "left" ? step.cmp.i : step.cmp.j) : -1;

        for (let idx = 0; idx < values.length; idx++) {
            const cell = cellsEl.children[idx];
            let cls = "vzm-cell";

            if (step.phase === "done") {
                cls += " vzm-used";
            } else if (step.taken && step.taken.side === side && step.taken.from === idx) {
                cls += " vzm-win";
            } else if (step.tail && step.tail.side === side && idx >= step.tail.from) {
                cls += " vzm-tail";
            } else if (idx < cursor) {
                cls += " vzm-used";
            } else if (idx === cmpIndex && step.phase === "compare") {
                cls += " vzm-cand";
            } else if (idx === cmpIndex && step.phase === "take") {
                cls += " vzm-lose";
            }

            cell.className = cls;
            ptrEl.children[idx].textContent =
                (idx === cursor && step.phase !== "done")
                    ? (side === "left" ? "↓ i" : "↓ j")
                    : "";
        }
    }

    function paintResult(cellsEl, step) {
        for (let k = 0; k < TOTAL; k++) {
            const cell = cellsEl.children[k];
            if (k >= step.result.length) {
                cell.textContent = "";
                cell.className = "vzm-cell vzm-slot";
                continue;
            }
            cell.textContent = String(step.result[k]);
            if (step.phase === "done") {
                cell.className = "vzm-cell vzm-done";
            } else if (step.taken && step.taken.slot === k) {
                cell.className = "vzm-cell vzm-just";
            } else if (step.tail && k >= step.tail.slot) {
                cell.className = "vzm-cell vzm-tail";
            } else {
                cell.className = "vzm-cell";
            }
        }
    }

    function compareBarHTML(step) {
        if (step.phase === "init") {
            return '<span class="vzm-cmp-hint">Κοιτάμε πάντα ΜΟΝΟ τα δύο πρώτα αχρησιμοποίητα στοιχεία.</span>';
        }
        if (step.phase === "flush") {
            return '<span class="vzm-cmp-hint">Καμία σύγκριση εδώ — η μία λίστα άδειασε.</span>';
        }
        if (step.phase === "done") {
            return '<span class="vzm-cmp-hint">' + TOTAL + " στοιχεία, " +
                step.comparisons + " συγκρίσεις.</span>";
        }

        const cmp = step.cmp;
        const leftValue = LEFT[cmp.i];
        const rightValue = RIGHT[cmp.j];
        const decided = (step.phase === "take");
        const leftCls = decided ? (cmp.takeLeft ? "is-win" : "is-lose") : "";
        const rightCls = decided ? (cmp.takeLeft ? "is-lose" : "is-win") : "";
        const operator = decided ? (cmp.takeLeft ? "&le;" : "&gt;") : "vs";
        const outcome = decided
            ? '<span class="vzm-cmp-out">→ ' + (cmp.takeLeft ? leftValue : rightValue) +
            " στο result, " + (cmp.takeLeft ? "i++" : "j++") + "</span>"
            : '<span class="vzm-cmp-hint">ποιο είναι μικρότερο;</span>';

        return '<span class="vzm-cmp-side ' + leftCls + '">left[' + cmp.i + "] = " + leftValue + "</span>" +
            '<span class="vzm-cmp-op">' + operator + "</span>" +
            '<span class="vzm-cmp-side ' + rightCls + '">right[' + cmp.j + "] = " + rightValue + "</span>" +
            outcome;
    }

    VizWaitFor("ms-merge-viz", function (root) {
        const refs = {
            leftCells: pick(root, "left-cells"),
            leftPtr: pick(root, "left-ptr"),
            rightCells: pick(root, "right-cells"),
            rightPtr: pick(root, "right-ptr"),
            resultCells: pick(root, "result-cells"),
            compare: pick(root, "compare"),
            note: pick(root, "note"),
            iLabel: pick(root, "i-label"),
            jLabel: pick(root, "j-label"),
            kLabel: pick(root, "k-label")
        };

        fillWith(refs.leftPtr, LEFT.length, "");
        fillWith(refs.rightPtr, RIGHT.length, "");
        fillWith(refs.leftCells, LEFT.length, "vzm-cell");
        fillWith(refs.rightCells, RIGHT.length, "vzm-cell");
        fillWith(refs.resultCells, TOTAL, "vzm-cell vzm-slot");

        for (let idx = 0; idx < LEFT.length; idx++) {
            refs.leftCells.children[idx].textContent = String(LEFT[idx]);
        }
        for (let idx = 0; idx < RIGHT.length; idx++) {
            refs.rightCells.children[idx].textContent = String(RIGHT[idx]);
        }

        const steps = buildMergeSteps();

        makePlayer(root, steps.length, function (index) {
            const step = steps[index];
            refs.iLabel.textContent = "i = " + step.i + (step.i >= LEFT.length ? " (τέλος)" : "");
            refs.jLabel.textContent = "j = " + step.j + (step.j >= RIGHT.length ? " (τέλος)" : "");
            refs.kLabel.textContent = step.result.length + " / " + TOTAL;
            paintSide(refs.leftCells, refs.leftPtr, LEFT, "left", step);
            paintSide(refs.rightCells, refs.rightPtr, RIGHT, "right", step);
            paintResult(refs.resultCells, step);
            refs.compare.innerHTML = compareBarHTML(step);
            refs.note.innerHTML = step.note;
        }, 1200);
    });

    // ══════════════════════════════════════════════════════════════════════
    //  VISUALIZER 2 - the whole MergeSort call tree
    // ══════════════════════════════════════════════════════════════════════

    const INPUT = [5, 2, 9, 1, 7, 3, 8, 4];

    function buildTree() {
        const nodes = [];

        function makeNode(start, values, depth) {
            const node = {
                id: nodes.length, start: start, depth: depth,
                values: values, left: null, right: null
            };
            nodes.push(node);
            if (values.length > 1) {
                const mid = Math.floor(values.length / 2);
                node.left = makeNode(start, values.slice(0, mid), depth + 1);
                node.right = makeNode(start + mid, values.slice(mid), depth + 1);
            }
            return node;
        }

        const root = makeNode(0, INPUT.slice(), 0);
        return { root: root, nodes: nodes };
    }

    function mergePlain(left, right) {
        const out = [];
        let i = 0;
        let j = 0;
        while (i < left.length && j < right.length) {
            if (left[i] <= right[j]) {
                out.push(left[i]);
                i += 1;
            } else {
                out.push(right[j]);
                j += 1;
            }
        }
        return out.concat(left.slice(i)).concat(right.slice(j));
    }

    // Steps follow the REAL execution order: divide, then the entire left
    // subtree, then the entire right subtree, then the merge. That is exactly
    // a post-order walk, and it is the part every static diagram gets wrong.
    function buildTreeSteps(tree) {
        const steps = [];
        const live = {};
        tree.nodes.forEach(function (node) {
            live[node.id] = {
                status: (node.depth === 0) ? "open" : "hidden",
                values: node.values.slice()
            };
        });

        function snapshot(extra) {
            const copy = {};
            Object.keys(live).forEach(function (id) {
                copy[id] = { status: live[id].status, values: live[id].values.slice() };
            });
            extra.state = copy;
            steps.push(extra);
        }

        snapshot({
            phase: "αρχή", call: "MergeSort", depth: 0, active: [],
            note: `Μία μόνο κλήση στην αρχή: <b>MergeSort(${show(INPUT)})</b>. ` +
                "Τα αχνά κουτιά από κάτω είναι οι κλήσεις που ΔΕΝ έχουν γίνει ακόμα."
        });

        function run(node) {
            if (node.values.length <= 1) {
                live[node.id].status = "done";
                snapshot({
                    phase: "base case", call: `MergeSort(${show(node.values)})`,
                    depth: node.depth, active: [node.id],
                    note: `<b>MergeSort(${show(node.values)})</b>: μήκος 1, άρα base case. ` +
                        "Επιστρέφει αμέσως, χωρίς καμία σύγκριση — μια λίστα ενός " +
                        "στοιχείου είναι ήδη ταξινομημένη."
                });
                return node.values.slice();
            }

            live[node.left.id].status = "open";
            live[node.right.id].status = "open";
            snapshot({
                phase: "divide ↓", call: `MergeSort(${show(node.values)})`,
                depth: node.depth, active: [node.id],
                note: `<b>MergeSort(${show(node.values)})</b>: μήκος ${node.values.length} > 1, ` +
                    `οπότε σπάει στη μέση σε <b>${show(node.left.values)}</b> και ` +
                    `<b>${show(node.right.values)}</b>. Καλεί πρώτα τον εαυτό του για το ` +
                    "αριστερό μισό — και ΜΕΝΕΙ ΕΚΕΙ μέχρι να τελειώσει ολόκληρο."
            });

            const leftSorted = run(node.left);
            const rightSorted = run(node.right);
            const merged = mergePlain(leftSorted, rightSorted);

            live[node.id].values = merged;
            live[node.id].status = "done";
            snapshot({
                phase: "merge ↑", call: `merge(${show(leftSorted)}, ${show(rightSorted)})`,
                depth: node.depth, active: [node.id], src: [node.left.id, node.right.id],
                note: "Και τα δύο μισά γύρισαν ταξινομημένα, οπότε τώρα τρέχει το " +
                    `<b>merge</b> και δίνει <b>${show(merged)}</b>. ` +
                    "Εδώ γίνεται όλη η πραγματική δουλειά αυτού του επιπέδου."
            });
            return merged;
        }

        const finalSorted = run(tree.root);
        steps[steps.length - 1].note =
            `Η αρχική κλήση επιστρέφει <b>${show(finalSorted)}</b>. ` +
            "Πρόσεξε: τίποτα δεν ταξινομήθηκε στην κατάβαση — όλη η ταξινόμηση " +
            "έγινε στην <b>άνοδο</b>, και σε κάθε επίπεδο η συνολική δουλειά ήταν " +
            `ακριβώς ${INPUT.length} στοιχεία. ${INPUT.length} δουλειά × 3 επίπεδα = ` +
            "<b>O(n log n)</b>.";

        return steps;
    }

    VizWaitFor("ms-tree-viz", function (root) {
        const treeEl = pick(root, "tree");
        const noteEl = pick(root, "note");
        const phaseEl = pick(root, "phase");
        const callEl = pick(root, "call");
        const depthEl = pick(root, "depth");

        const tree = buildTree();
        const nodeEls = {};

        treeEl.innerHTML = "";
        tree.nodes.forEach(function (node) {
            const box = document.createElement("div");
            box.className = "vzm-node";
            box.setAttribute("data-depth", String(node.depth));
            box.style.gridColumn = (node.start + 1) + " / span " + node.values.length;
            box.style.gridRow = String(node.depth + 1);
            treeEl.appendChild(box);
            nodeEls[node.id] = box;
        });

        const steps = buildTreeSteps(tree);

        makePlayer(root, steps.length, function (index) {
            const step = steps[index];

            tree.nodes.forEach(function (node) {
                const box = nodeEls[node.id];
                const state = step.state[node.id];
                let cls = "vzm-node vzm-node-" + state.status;
                if (step.src && step.src.indexOf(node.id) !== -1) { cls += " vzm-node-src"; }
                if (step.active && step.active.indexOf(node.id) !== -1) { cls += " vzm-node-active"; }
                box.className = cls;

                box.innerHTML = "";
                state.values.forEach(function (value) {
                    const cell = document.createElement("span");
                    cell.className = "vzm-num";
                    cell.textContent = (state.status === "hidden") ? "·" : String(value);
                    box.appendChild(cell);
                });
            });

            phaseEl.textContent = step.phase;
            callEl.textContent = step.call;
            depthEl.textContent = String(step.depth);
            noteEl.innerHTML = step.note;
        }, 1000);
    });
})();