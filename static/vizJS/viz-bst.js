function createBstViz(root) {
  const steps = [
    { val: 15, path: [], added: false, note: "Θέλουμε να προσθέσουμε το 15 (n). Ξεκινάμε από τη ρίζα (20)." },
    { val: 15, path: [0], added: false, note: "Το 15 είναι μικρότερο από το 20. Πάμε αριστερά." },
    { val: 15, path: [0, 1], added: false, note: "Το 15 είναι μεγαλύτερο από το 10. Πάμε δεξιά." },
    { val: 15, path: [0, 1], added: true, note: "Ο δεξιός κόμβος (Next) είναι nil! Τοποθετούμε το 15 εδώ." }
  ];
  let cur = 0;

  root.innerHTML = `
    <div class="quiz-code-block" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; background: #1a1a1a;">
      <div style="position: relative; height: 180px; width: 100%;">
         <!-- Root: 20 -->
         <div id="n-20" style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 40px; height: 40px; border-radius: 50%; background: #333; border: 2px solid #555; display: flex; align-items: center; justify-content: center; font-family: monospace; font-weight: bold; z-index: 2;">20</div>
         <!-- L: 10 -->
         <div id="n-10" style="position: absolute; top: 70px; left: 35%; transform: translateX(-50%); width: 40px; height: 40px; border-radius: 50%; background: #333; border: 2px solid #555; display: flex; align-items: center; justify-content: center; font-family: monospace; font-weight: bold; z-index: 2;">10</div>
         <!-- R: 30 -->
         <div id="n-30" style="position: absolute; top: 70px; left: 65%; transform: translateX(-50%); width: 40px; height: 40px; border-radius: 50%; background: #333; border: 2px solid #555; display: flex; align-items: center; justify-content: center; font-family: monospace; font-weight: bold; z-index: 2;">30</div>
         <!-- LL: 5 -->
         <div id="n-5" style="position: absolute; top: 130px; left: 25%; transform: translateX(-50%); width: 40px; height: 40px; border-radius: 50%; background: #333; border: 2px solid #555; display: flex; align-items: center; justify-content: center; font-family: monospace; font-weight: bold; z-index: 2;">5</div>
         <!-- New node: 15 (LR) -->
         <div id="n-15" style="position: absolute; top: 130px; left: 45%; transform: translateX(-50%); width: 40px; height: 40px; border-radius: 50%; background: rgba(var(--correct-rgb), 0.2); border: 2px solid var(--correct); color: var(--correct); display: none; align-items: center; justify-content: center; font-family: monospace; font-weight: bold; z-index: 2;">15</div>
         
         <!-- Lines -->
         <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;">
            <line x1="50%" y1="30" x2="35%" y2="70" stroke="#555" stroke-width="2" />
            <line x1="50%" y1="30" x2="65%" y2="70" stroke="#555" stroke-width="2" />
            <line x1="35%" y1="90" x2="25%" y2="130" stroke="#555" stroke-width="2" />
            <line id="line-15" x1="35%" y1="90" x2="45%" y2="130" stroke="var(--correct)" stroke-width="2" stroke-dasharray="4" style="display: none;" />
         </svg>
      </div>
      <div class="vz-controls" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
        <button id="bst-prev" class="reset-quiz-btn" disabled>Προηγούμενο</button>
        <div id="bst-note" style="color: var(--tone-2); font-size: 0.9rem; flex: 1; text-align: center; margin: 0 1rem;"></div>
        <button id="bst-next" class="reset-quiz-btn">Επόμενο</button>
      </div>
    </div>
  `;

  const prevBtn = root.querySelector('#bst-prev');
  const nextBtn = root.querySelector('#bst-next');
  const noteEl = root.querySelector('#bst-note');
  
  const nodes = {
    root: root.querySelector('#n-20'),
    l: root.querySelector('#n-10'),
    r: root.querySelector('#n-30'),
    ll: root.querySelector('#n-5'),
    new: root.querySelector('#n-15'),
    line: root.querySelector('#line-15')
  };

  function render() {
    const step = steps[cur];
    
    // Reset highlights
    Object.values(nodes).forEach(n => {
      if (n.style && n.id !== 'n-15') {
        n.style.borderColor = '#555';
        n.style.boxShadow = 'none';
      }
    });

    // Determine current node
    let curEl = nodes.root;
    if (step.path.length === 1 && step.path[0] === 0) curEl = nodes.l;
    
    curEl.style.borderColor = 'var(--accent)';
    curEl.style.boxShadow = '0 0 10px rgba(var(--accent-rgb), 0.5)';

    if (step.added) {
      nodes.new.style.display = 'flex';
      nodes.line.style.display = 'block';
    } else {
      nodes.new.style.display = 'none';
      nodes.line.style.display = 'none';
    }

    noteEl.textContent = step.note;
    
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur === steps.length - 1;
  }

  prevBtn.onclick = () => { if (cur > 0) { cur--; render(); } };
  nextBtn.onclick = () => { if (cur < steps.length - 1) { cur++; render(); } };

  render();
}

if (typeof VizWaitFor === 'function') {
  VizWaitFor('viz-bst', createBstViz);
} else {
  // Fallback
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('viz-bst');
    if (root) createBstViz(root);
  });
}
