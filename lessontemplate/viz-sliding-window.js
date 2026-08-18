// ── Sliding Window step visualizer ──────────────────────────────────────── ⊃
// Uses VizWaitFor (see static/_viz-common.js) to safely wait for #sw-viz to
// exist in the DOM before touching it — see that file's header comment for
// why this is needed on this course template.
(function () {
    VizWaitFor("sw-viz", function () {
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

        const arrayRow = document.getElementById("sw-array-row");
        const rightRow = document.getElementById("sw-right-row");
        const leftRow = document.getElementById("sw-left-row");
        const statePanel = document.getElementById("sw-state-panel");
        const diffBadge = document.getElementById("sw-diff-badge");
        const prevBtn = document.getElementById("sw-prev");
        const nextBtn = document.getElementById("sw-next");
        const playBtn = document.getElementById("sw-play");
        const resetBtn = document.getElementById("sw-reset");

        // Build the static array cells once — only classes/pointer rows change per step.
        // vz-cell / vz-pointer-cell / vz-pointer-row come from static/_viz-common.css.
        prices.forEach((value, i) => {
            const cell = document.createElement("div");
            cell.className = "vz-cell";
            cell.dataset.index = i;
            cell.textContent = value;
            arrayRow.appendChild(cell);

            const rightCell = document.createElement("div");
            rightCell.className = "vz-pointer-cell";
            rightCell.dataset.index = i;
            rightRow.appendChild(rightCell);

            const leftCell = document.createElement("div");
            leftCell.className = "vz-pointer-cell";
            leftCell.dataset.index = i;
            leftRow.appendChild(leftCell);
        });

        // Builds one .gs-pill (the site's own glossary-strip pill markup) for
        // the state panel — reusing .glossary-strip/.gs-pill/.gs-name/.gs-def.
        // emphasisBg (optional, inline) gives one specific pill its own
        // background color so it visually stands out from the rest — used for
        // windowSum, per user request, without touching the shared CSS classes.
        function statePill(label, value, highlight, emphasisBg) {
            const pill = document.createElement("div");
            pill.className = "gs-pill";
            if (emphasisBg) {
                pill.style.background = emphasisBg;
            }
            const name = document.createElement("span");
            name.className = "gs-name";
            name.textContent = label;
            const def = document.createElement("span");
            def.className = "gs-def" + (highlight ? " vz-state-hl" : "");
            def.textContent = value;
            pill.appendChild(name);
            pill.appendChild(def);
            return pill;
        }

        function render() {
            const step = steps[current];

            // Array cells: vz-highlight-a = inside the current window,
            // vz-highlight-b = just added (this step), vz-highlight-c = just removed.
            Array.from(arrayRow.children).forEach((cell) => {
                const i = Number(cell.dataset.index);
                cell.classList.remove("vz-highlight-a", "vz-highlight-b", "vz-highlight-c");
                if (i >= step.left && i <= step.right) {
                    cell.classList.add("vz-highlight-a");
                }
                if (step.type === "expand" && i === step.right) {
                    cell.classList.add("vz-highlight-b");
                }
                if (step.type === "shrink" && i === step.left - 1) {
                    cell.classList.add("vz-highlight-c");
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
            // don't change windowSum. Shows "+N = <new windowSum>" — the "+N"/"-N"
            // part inherits the badge's own positive/negative color (vz-positive/
            // vz-negative below), while "=" and the resulting value are wrapped in
            // their own spans so they render in gray / plain --ink instead.
            if (step.diff !== null) {
                const positive = step.diff > 0;
                const deltaText = (positive ? "+" : "") + step.diff;
                diffBadge.innerHTML =
                    deltaText +
                    '<span class="vz-diff-eq"> = </span>' +
                    '<span class="vz-diff-value">' + step.windowSum + '</span>';
                diffBadge.className =
                    "vz-diff-badge vz-show " + (positive ? "vz-positive" : "vz-negative");
            } else {
                diffBadge.className = "vz-diff-badge";
                diffBadge.textContent = "";
            }

            // State panel — pills in the site's own glossary-strip format.
            // windowSum comes FIRST and gets its own background tint (accent,
            // via the site's --accent-rgb token) so it stands out from the rest.
            statePanel.innerHTML = "";
            statePanel.appendChild(
                statePill("windowSum", step.windowSum, step.type !== "measure", "rgba(var(--accent-rgb), 0.18)")
            );
            statePanel.appendChild(statePill("right", step.right));
            statePanel.appendChild(statePill("prices[right]", prices[step.right]));
            statePanel.appendChild(statePill("left", step.left));
            statePanel.appendChild(
                statePill("prices[left]", step.left < prices.length ? prices[step.left] : "—")
            );
            statePanel.appendChild(
                statePill("length", step.length === null ? "—" : step.length)
            );
            statePanel.appendChild(
                statePill("bestLength", step.bestLength, step.type === "measure" && step.improved)
            );

            prevBtn.disabled = current === 0;
            nextBtn.disabled = current === steps.length - 1;
        }

        // ── Autoplay (play/pause) + wheel-adjustable speed ──────────────────── ⊃
        const DEFAULT_INTERVAL_MS = 900; // "1.0x" baseline
        const MIN_INTERVAL_MS = 200;     // fastest playback (~4.5x)
        const MAX_INTERVAL_MS = 2000;    // slowest playback (~0.5x)
        const WHEEL_STEP_MS = 150;       // interval change per wheel "tick"
        const SPEED_LABEL_HOLD_MS = 900; // how long "speed: N.Nx" stays before reverting

        let intervalMs = DEFAULT_INTERVAL_MS;
        let autoplayTimer = null;
        let speedLabelTimer = null;

        function playLabel() {
            return autoplayTimer ? "─•── stop ───" : "▶ autoplay ↕";
        }

        function stopAutoplay() {
            if (autoplayTimer) {
                clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
            playBtn.textContent = playLabel();
        }

        function startAutoplay() {
            if (current >= steps.length - 1) return; // nothing left to play
            autoplayTimer = setInterval(() => {
                if (current < steps.length - 1) {
                    current++;
                    render();
                }
                if (current >= steps.length - 1) {
                    stopAutoplay(); // reached the end — auto-pause instead of idling
                }
            }, intervalMs);
            playBtn.textContent = playLabel();
        }

        function restartAutoplayIfRunning() {
            // Called after intervalMs changes while already playing, so the new
            // speed takes effect immediately instead of waiting for the current tick.
            if (autoplayTimer) {
                stopAutoplay();
                startAutoplay();
            }
        }

        playBtn.addEventListener("click", () => {
            if (autoplayTimer) {
                stopAutoplay();
            } else {
                startAutoplay();
            }
        });

        // Scroll the mouse wheel while hovering the play/pause button to adjust
        // playback speed — no visible slider, the wheel itself is the control.
        // The button label temporarily shows "speed: N.Nx", then reverts to the
        // normal play/pause icon after SPEED_LABEL_HOLD_MS of no further scrolling.
        playBtn.addEventListener(
            "wheel",
            (event) => {
                event.preventDefault(); // don't scroll the page while adjusting speed
                // Scroll up (deltaY < 0) = faster playback = smaller interval.
                // Scroll down (deltaY > 0) = slower playback = larger interval.
                const delta = event.deltaY < 0 ? -WHEEL_STEP_MS : WHEEL_STEP_MS;
                intervalMs = Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, intervalMs + delta));

                const speedMultiplier = DEFAULT_INTERVAL_MS / intervalMs;
                playBtn.textContent = "speed: " + speedMultiplier.toFixed(1) + "x";

                restartAutoplayIfRunning();

                clearTimeout(speedLabelTimer);
                speedLabelTimer = setTimeout(() => {
                    playBtn.textContent = playLabel();
                }, SPEED_LABEL_HOLD_MS);
            },
            { passive: false }
        );

        resetBtn.addEventListener("click", () => {
            stopAutoplay();
            current = 0;
            render();
        });

        prevBtn.addEventListener("click", () => {
            stopAutoplay(); // manual stepping always pauses playback first
            if (current > 0) {
                current--;
                render();
            }
        });

        nextBtn.addEventListener("click", () => {
            stopAutoplay(); // manual stepping always pauses playback first
            if (current < steps.length - 1) {
                current++;
                render();
            }
        });

        render();
    });
})();