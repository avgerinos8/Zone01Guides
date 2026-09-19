(function () {
    const vizId = "freq-viz";
    const container = document.getElementById(vizId);
    if (!container) return;

    const data = "hello";
    const chars = data.split('');
    let mapState = {};
    let step = 0; // 0 = start, 1..len = processing
    let maxSteps = chars.length;

    const btnNext = container.querySelector("#freq-next");
    const btnPrev = container.querySelector("#freq-prev");
    const btnReset = container.querySelector("#freq-reset");
    const arrayRow = container.querySelector("#freq-array-row");
    const ptrRow = container.querySelector("#freq-ptr-row");
    const mapContainer = container.querySelector("#freq-map-container");

    function renderArray() {
        arrayRow.innerHTML = "";
        ptrRow.innerHTML = "";
        chars.forEach((c, i) => {
            // ptr
            const pCell = document.createElement("div");
            pCell.className = "vz-pointer-cell";
            if (i === step && step < maxSteps) {
                pCell.textContent = "↓";
            }
            ptrRow.appendChild(pCell);

            // cell
            const cCell = document.createElement("div");
            cCell.className = "vz-cell";
            cCell.textContent = "'" + c + "'";
            if (i === step && step < maxSteps) {
                cCell.classList.add("vz-highlight-a");
            } else if (i < step) {
                cCell.style.opacity = "0.4"; // processed
            }
            arrayRow.appendChild(cCell);
        });
    }

    function renderMap() {
        // Build current map state up to step
        mapState = {};
        for(let i=0; i<step; i++) {
            const c = chars[i];
            mapState[c] = (mapState[c] || 0) + 1;
        }

        // Just updated char
        let justUpdated = (step > 0 && step <= maxSteps) ? chars[step-1] : null;

        mapContainer.innerHTML = "";
        if (Object.keys(mapState).length === 0) {
            mapContainer.innerHTML = "<div style='color:rgba(var(--ink-rgb),0.4); font-family:var(--font-mono); font-size:13px; margin:auto;'>empty map</div>";
            return;
        }

        for (const [k, v] of Object.entries(mapState)) {
            const entry = document.createElement("div");
            entry.className = "vzf-map-entry vzf-show";

            const kDiv = document.createElement("div");
            kDiv.className = "vzf-map-key";
            kDiv.textContent = "'" + k + "'";

            const vDiv = document.createElement("div");
            vDiv.className = "vzf-map-val";
            vDiv.textContent = v;

            if (k === justUpdated) {
                vDiv.classList.add("vzf-highlight");
            }

            entry.appendChild(kDiv);
            entry.appendChild(vDiv);
            mapContainer.appendChild(entry);
        }
    }

    function update() {
        renderArray();
        renderMap();
        btnPrev.disabled = (step === 0);
        btnNext.disabled = (step === maxSteps);
    }

    btnNext.addEventListener("click", () => {
        if (step < maxSteps) { step++; update(); }
    });
    btnPrev.addEventListener("click", () => {
        if (step > 0) { step--; update(); }
    });
    btnReset.addEventListener("click", () => {
        step = 0; update();
    });

    update();
})();
