// ── Sliding Window step visualizer ──────────────────────────────────────── ⊃
// This file is loaded as a top-level <script> tag, but the slide markup it
// targets (#sw-viz and its children) does not exist yet at that point — the
// course template builds ALL slide DOM later, inside initSlideDeck(), via
// contentEl.innerHTML = slide.html (see renderSlide() in static/script.js).
// A MutationObserver waits for #sw-viz to actually appear before touching it,
// so this works regardless of exactly when initSlideDeck() runs.
(function () {
    function initSlidingWindowViz() {
        const prices = [3, 5, 8, 4, 12, 9, 4, 3, 2, 1, 8, 2, 7];
        const limit = 20;

        // Build the full, granular step sequence — every shrink iteration is its
        // own step, not bundled with the rest of the outer for-loop pass.
        function buildSteps() {
            const steps = [];
            let left = 0;
            let windowSum = 0;
            let bestLength = 0;
            let start = 0;
            let end = 0;

            for (let right = 0; right < prices.length; right++) {
                windowSum += prices[right];
                steps.push({
                    type: "expand",
                    right, left, windowSum,
                    diff: prices[right],
                    length: windowSum <= limit ? right - left + 1 : null,
                    bestLength, start, end
                });

                while (windowSum > limit) {
                    const removed = prices[left];
                    windowSum -= removed;
                    left++;
                    steps.push({
                        type: "shrink",
                        right, left, windowSum,
                        diff: -removed,
                        length: right - left + 1,
                        bestLength, start, end
                    });
                }

                const length = right - left + 1;
                const improved = length > bestLength;
                if (improved) {
                    bestLength = length;
                    start = left;
                    end = right;
                }
                steps.push({
                    type: "measure",
                    right, left, windowSum,
                    diff: null,
                    length, bestLength, start, end, improved
                });
            }

            return steps;
        }

        const steps = buildSteps();
        let current = 0;

        const viz = document.getElementById("sw-viz");
        if (!viz) return; // shouldn't happen — caller already checked

        const arrayRow = document.getElementById("sw-array-row");
        const rightRow = document.getElementById("sw-right-row");
        const leftRow = document.getElementById("sw-left-row");
        const statePanel = document.getElementById("sw-state-panel");
        const diffBadge = document.getElementById("sw-diff-badge");
        const prevBtn = document.getElementById("sw-prev");
        const nextBtn = document.getElementById("sw-next");

        // Guard: if this ever runs twice on the same markup (shouldn't, given
        // the observer below disconnects after first match), don't double-init.
        if (arrayRow.dataset.swInit === "1") return;
        arrayRow.dataset.swInit = "1";

        // Build the static array cells once — only classes/pointer rows change per step.
        prices.forEach((value, i) => {
            const cell = document.createElement("div");
            cell.className = "sw-cell";
            cell.dataset.index = i;
            cell.textContent = value;
            arrayRow.appendChild(cell);

            const rightCell = document.createElement("div");
            rightCell.className = "sw-pointer-cell";
            rightCell.dataset.index = i;
            rightRow.appendChild(rightCell);

            const leftCell = document.createElement("div");
            leftCell.className = "sw-pointer-cell";
            leftCell.dataset.index = i;
            leftRow.appendChild(leftCell);
        });

        // Builds one <tr class="gt-term">…<td class="gt-def">…</tr> row, reusing
        // the site's own .glossary-table row/cell markup and classes.
        function stateRow(label, value, highlight) {
            const tr = document.createElement("tr");
            const tdLabel = document.createElement("td");
            tdLabel.className = "gt-term";
            tdLabel.textContent = label;
            const tdValue = document.createElement("td");
            tdValue.className = "gt-def" + (highlight ? " sw-state-panel-hl" : "");
            tdValue.textContent = value;
            tr.appendChild(tdLabel);
            tr.appendChild(tdValue);
            return tr;
        }

        function render() {
            const step = steps[current];

            // Array cells: highlight the current window [left, right] and mark
            // just-added / just-removed elements for this specific step.
            Array.from(arrayRow.children).forEach((cell) => {
                const i = Number(cell.dataset.index);
                cell.classList.remove("sw-in-window", "sw-just-added", "sw-just-removed");
                if (i >= step.left && i <= step.right) {
                    cell.classList.add("sw-in-window");
                }
                if (step.type === "expand" && i === step.right) {
                    cell.classList.add("sw-just-added");
                }
                if (step.type === "shrink" && i === step.left - 1) {
                    cell.classList.add("sw-just-removed");
                }
            });

            // Pointer markers, on their own rows so left/right never collide visually.
            Array.from(rightRow.children).forEach((cell, i) => {
                cell.textContent = i === step.right ? "↓right↓" : "";
            });
            Array.from(leftRow.children).forEach((cell, i) => {
                cell.textContent = i === step.left ? "↓left↓" : "";
            });

            // Diff badge — only shown for expand/shrink steps, since "measure" steps
            // don't change windowSum.
            if (step.diff !== null) {
                const positive = step.diff > 0;
                diffBadge.textContent = (positive ? "+" : "") + step.diff;
                diffBadge.className =
                    "sw-diff-badge sw-show " + (positive ? "sw-positive" : "sw-negative");
            } else {
                diffBadge.className = "sw-diff-badge";
                diffBadge.textContent = "";
            }

            // State panel — rows in the site's own glossary-table format.
            statePanel.innerHTML = "";
            statePanel.appendChild(stateRow("right", step.right));
            statePanel.appendChild(stateRow("prices[right]", prices[step.right]));
            statePanel.appendChild(stateRow("left", step.left));
            statePanel.appendChild(
                stateRow("prices[left]", step.left < prices.length ? prices[step.left] : "—")
            );
            statePanel.appendChild(
                stateRow("windowSum", step.windowSum, step.type !== "measure")
            );
            statePanel.appendChild(
                stateRow("length", step.length === null ? "—" : step.length)
            );
            statePanel.appendChild(
                stateRow("bestLength", step.bestLength, step.type === "measure" && step.improved)
            );

            prevBtn.disabled = current === 0;
            nextBtn.disabled = current === steps.length - 1;
        }

        prevBtn.addEventListener("click", () => {
            if (current > 0) {
                current--;
                render();
            }
        });

        nextBtn.addEventListener("click", () => {
            if (current < steps.length - 1) {
                current++;
                render();
            }
        });

        render();
    }

    // #sw-viz doesn't exist yet when this file loads (see comment above) —
    // wait for it. If it's somehow already there (e.g. this script got moved
    // to load after initSlideDeck() in the future), init immediately instead
    // of waiting on an observer that would never fire.
    if (document.getElementById("sw-viz")) {
        initSlidingWindowViz();
    } else {
        const observer = new MutationObserver(() => {
            if (document.getElementById("sw-viz")) {
                observer.disconnect();
                initSlidingWindowViz();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();