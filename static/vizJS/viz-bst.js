function createBstViz(root) {
  const steps = [
    { curr: 50, added: false, note: "Θέλουμε να προσθέσουμε το 88. Ξεκινάμε από τη ρίζα (50)." },
    { curr: 75, added: false, note: "Το 88 είναι μεγαλύτερο από το 50. Πάμε δεξιά (75)." },
    { curr: 87, added: false, note: "Το 88 είναι μεγαλύτερο από το 75. Πάμε δεξιά (87)." },
    { curr: 95, added: false, note: "Το 88 είναι μεγαλύτερο από το 87. Πάμε δεξιά (95)." },
    { curr: 95, added: true, note: "Το 88 είναι μικρότερο από το 95, και το αριστερό παιδί είναι κενό! Τοποθετούμε το 88 εκεί." }
  ];
  let cur = 0;

  const lines = [
    [380, 60, 200, 140], [380, 60, 560, 140],
    [200, 140, 110, 220], [200, 140, 290, 220], [560, 140, 470, 220], [560, 140, 650, 220],
    [110, 220, 65, 300], [110, 220, 155, 300], [470, 220, 425, 300], [650, 220, 605, 300], [650, 220, 695, 300]
  ];

  const nodeData = [
     { val: 50, x: 380, y: 60 },
     { val: 25, x: 200, y: 140 }, { val: 75, x: 560, y: 140 },
     { val: 12, x: 110, y: 220 }, { val: 37, x: 290, y: 220 }, { val: 62, x: 470, y: 220 }, { val: 87, x: 650, y: 220 },
     { val: 6, x: 65, y: 300 }, { val: 18, x: 155, y: 300 }, { val: 56, x: 425, y: 300 }, { val: 81, x: 605, y: 300 }, { val: 95, x: 695, y: 300 }
  ];

  function render() {
    const step = steps[cur];
    
    let svgHtml = `
      <style>
        .bst-viz-container { padding: 2rem; background: #09090b; border-radius: 16px; border: 1px solid #27272a; box-shadow: inset 0 0 40px rgba(0,0,0,0.5); }
        .blacked-shadow { filter: drop-shadow(2px 2px 0px #000) drop-shadow(-1px -1px 0px #000) drop-shadow(1px -1px 0px #000) drop-shadow(-1px 1px 0px #000); }
        .node-circle { transition: all 0.3s; }
      </style>
      <div class="bst-viz-container">
        <svg viewBox="0 0 760 400" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:760px;height:auto;display:block;margin:0 auto;color:var(--ink)">
          <defs>
            <pattern id="hatch-tree-viz" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="var(--accent, #60a5fa)" fill-opacity="0.4" />
              <line x1="0" y1="0" x2="0" y2="8" stroke="#000000" stroke-width="2" stroke-opacity="0.6" />
            </pattern>
            <pattern id="hatch-tree-viz-correct" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="var(--correct, #34d399)" fill-opacity="0.4" />
              <line x1="0" y1="0" x2="0" y2="8" stroke="#000000" stroke-width="2" stroke-opacity="0.6" />
            </pattern>
            <filter id="glow-correct" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
    `;

    // Static lines
    lines.forEach(l => {
      svgHtml += `<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}" stroke="#71717a" stroke-width="2"/>`;
    });

    // New Line (if added)
    if (step.added) {
      svgHtml += `<line x1="695" y1="300" x2="650" y2="370" stroke="var(--correct, #34d399)" stroke-width="3" stroke-dasharray="6"/>`;
    }

    // Static nodes
    nodeData.forEach(n => {
      const isCurr = (step.curr === n.val);
      const stroke = isCurr ? 'var(--correct, #34d399)' : 'var(--accent, #60a5fa)';
      const fill = isCurr ? 'url(#hatch-tree-viz-correct)' : 'url(#hatch-tree-viz)';
      const glow = isCurr ? 'filter="url(#glow-correct)"' : '';
      const w = isCurr ? 5 : 3;
      
      svgHtml += `
        <g transform="translate(${n.x}, ${n.y})">
          <circle r="28" fill="${fill}" stroke="${stroke}" stroke-width="${w}" ${glow} class="node-circle" />
          <text y="7" font-size="20" text-anchor="middle" style="fill:var(--tone-text); font-family:monospace; font-weight:bold" class="blacked-shadow">${n.val}</text>
        </g>
      `;
    });

    // New Node (if added)
    if (step.added) {
      svgHtml += `
        <g transform="translate(650, 370)">
          <circle r="28" fill="url(#hatch-tree-viz-correct)" stroke="var(--correct, #34d399)" stroke-width="4" filter="url(#glow-correct)" class="node-circle">
            <animate attributeName="r" values="0;32;28" dur="0.5s" calcMode="spline" keySplines="0.175 0.885 0.32 1.275; 0.175 0.885 0.32 1.275" />
          </circle>
          <text y="7" font-size="20" text-anchor="middle" style="fill:var(--tone-text); font-family:monospace; font-weight:bold" class="blacked-shadow">88</text>
        </g>
      `;
    }

    svgHtml += `</svg>
      <div class="vz-controls" style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem;">
        <button id="bst-prev" class="reset-quiz-btn" ${cur === 0 ? 'disabled' : ''}>Προηγούμενο</button>
        <div id="bst-note" style="color: #e4e4e7; font-family: system-ui, sans-serif; font-size: 1.1rem; font-weight: 500; flex: 1; text-align: center; margin: 0 1rem;">${step.note}</div>
        <button id="bst-next" class="reset-quiz-btn" ${cur === steps.length - 1 ? 'disabled' : ''}>Επόμενο</button>
      </div>
    </div>`;

    root.innerHTML = svgHtml;

    root.querySelector('#bst-prev').onclick = () => { if (cur > 0) { cur--; render(); } };
    root.querySelector('#bst-next').onclick = () => { if (cur < steps.length - 1) { cur++; render(); } };
  }

  render();
}

if (typeof VizWaitFor === 'function') {
  VizWaitFor('viz-bst', createBstViz);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('viz-bst');
    if (root) createBstViz(root);
  });
}
