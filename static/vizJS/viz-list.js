function createListViz(root) {
  const steps = [
    { curr: 0, added: false, note: "Βήμα 1: Αρχικοποιούμε τον δείκτη curr στο Head (τον πρώτο κόμβο)." },
    { curr: 1, added: false, note: "Βήμα 2: Το curr.Next δεν είναι nil. Προχωράμε στον επόμενο κόμβο (curr = curr.Next)." },
    { curr: 2, added: false, note: "Βήμα 3: Το curr.Next δεν είναι nil. Προχωράμε στον επόμενο κόμβο." },
    { curr: 2, added: true, note: "Βήμα 4: Φτάσαμε! Το curr.Next είναι nil. Συνδέουμε τον νέο κόμβο εδώ: curr.Next = n." }
  ];
  let cur = 0;

  root.innerHTML = `
    <style>
      .viz-ll-container {
        padding: 2rem; background: #09090b; border-radius: 16px; 
        border: 1px solid #27272a; display: flex; flex-direction: column; gap: 2rem;
        box-shadow: inset 0 0 40px rgba(0,0,0,0.5);
      }
      .viz-ll-nodes {
        display: flex; gap: 0.5rem; align-items: center; justify-content: center; min-height: 120px;
        flex-wrap: wrap;
      }
      .viz-ll-node {
        background: #18181b; border: 2px solid #3f3f46; border-radius: 12px;
        display: flex; flex-direction: row; overflow: hidden; position: relative;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        width: 130px; height: 60px;
      }
      .viz-ll-node.active {
        border-color: var(--accent, #60a5fa);
        box-shadow: 0 10px 25px rgba(var(--accent-rgb, 96, 165, 250), 0.3);
        transform: translateY(-8px);
      }
      .viz-ll-new {
        border-color: var(--correct, #34d399);
        background: rgba(var(--correct-rgb, 52, 211, 153), 0.05);
        opacity: 0; transform: scale(0.8) translateX(-20px);
        animation: popIn 0.5s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      @keyframes popIn { to { opacity: 1; transform: scale(1) translateX(0); box-shadow: 0 10px 25px rgba(var(--correct-rgb, 52, 211, 153), 0.3); } }
      .viz-ll-data {
        padding: 0; flex: 1; display: flex; align-items: center; justify-content: center;
        font-family: monospace; font-size: 1.3rem; font-weight: bold; color: #fff;
        border-right: 2px solid #3f3f46;
      }
      .viz-ll-next {
        width: 40px; display: flex; align-items: center; justify-content: center; background: #27272a;
      }
      .viz-ll-next-dot {
        width: 12px; height: 12px; border-radius: 50%; background: #71717a; transition: all 0.3s;
      }
      .viz-ll-node.active .viz-ll-next-dot { background: var(--accent, #60a5fa); box-shadow: 0 0 10px var(--accent, #60a5fa); }
      .viz-ll-new .viz-ll-next-dot { background: var(--correct, #34d399); }
      .viz-ll-arrow {
        color: #52525b; font-size: 1.5rem; margin: 0 4px; font-weight: bold; display: flex; align-items: center;
      }
      .viz-ll-arrow svg { width: 32px; height: 32px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      .viz-ll-curr-badge {
        position: absolute; top: -35px; left: 50%; transform: translateX(-50%);
        background: var(--accent, #60a5fa); color: #000; padding: 4px 10px; border-radius: 20px;
        font-size: 0.8rem; font-weight: bold; font-family: monospace;
        opacity: 0; transition: opacity 0.3s; pointer-events: none;
      }
      .viz-ll-node.active .viz-ll-curr-badge { opacity: 1; }
      .viz-ll-new-badge {
        position: absolute; top: -35px; left: 50%; transform: translateX(-50%);
        background: var(--correct, #34d399); color: #000; padding: 4px 10px; border-radius: 20px;
        font-size: 0.8rem; font-weight: bold; font-family: monospace;
      }
    </style>
    <div class="viz-ll-container">
      <div id="list-nodes" class="viz-ll-nodes"></div>
      <div class="vz-controls" style="display: flex; justify-content: space-between; align-items: center;">
        <button id="list-prev" class="reset-quiz-btn" disabled>Προηγούμενο</button>
        <div id="list-note" style="color: #e4e4e7; font-family: system-ui, sans-serif; font-size: 1.1rem; font-weight: 500; flex: 1; text-align: center; margin: 0 1rem;"></div>
        <button id="list-next" class="reset-quiz-btn">Επόμενο</button>
      </div>
    </div>
  `;

  const prevBtn = root.querySelector('#list-prev');
  const nextBtn = root.querySelector('#list-next');
  const noteEl = root.querySelector('#list-note');
  const nodesContainer = root.querySelector('#list-nodes');

  const arrowSvg = `<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;

  function render() {
    const step = steps[cur];
    const nodeVals = ["10", "20", "30"];
    let html = '';
    
    for (let i = 0; i < nodeVals.length; i++) {
      const isCurr = (i === step.curr);
      
      html += `
        <div class="viz-ll-node ${isCurr ? 'active' : ''}">
          <div class="viz-ll-curr-badge">curr</div>
          <div class="viz-ll-data">${nodeVals[i]}</div>
          <div class="viz-ll-next"><div class="viz-ll-next-dot"></div></div>
        </div>
      `;
      
      if (i < nodeVals.length - 1 || step.added) {
        let arrowColor = (i === nodeVals.length - 1 && step.added) ? 'color: var(--correct, #34d399);' : '';
        html += `<div class="viz-ll-arrow" style="${arrowColor}">${arrowSvg}</div>`;
      }
    }
    
    if (step.added) {
      html += `
        <div class="viz-ll-node viz-ll-new">
          <div class="viz-ll-new-badge">n</div>
          <div class="viz-ll-data" style="color: var(--correct, #34d399);">88</div>
          <div class="viz-ll-next" style="border-left-color: var(--correct, #34d399);"><div class="viz-ll-next-dot"></div></div>
        </div>
      `;
    }

    nodesContainer.innerHTML = html;
    noteEl.textContent = step.note;
    
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur === steps.length - 1;
  }

  prevBtn.onclick = () => { if (cur > 0) { cur--; render(); } };
  nextBtn.onclick = () => { if (cur < steps.length - 1) { cur++; render(); } };

  render();
}

if (typeof VizWaitFor === 'function') {
  VizWaitFor('viz-listpushback', createListViz);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('viz-listpushback');
    if (root) createListViz(root);
  });
}

