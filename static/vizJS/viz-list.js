function createListViz(root) {
  const steps = [
    { curr: 0, added: false, note: "Βήμα 1: Αρχικοποιούμε τον δείκτη curr στο Head (τον πρώτο κόμβο)." },
    { curr: 1, added: false, note: "Βήμα 2: Το curr.Next δεν είναι nil. Προχωράμε στον επόμενο κόμβο (curr = curr.Next)." },
    { curr: 2, added: false, note: "Βήμα 3: Το curr.Next δεν είναι nil. Προχωράμε στον επόμενο κόμβο." },
    { curr: 2, added: true, note: "Βήμα 4: Φτάσαμε! Το curr.Next είναι nil (ο κόμβος δεν έχει επόμενο). Συνδέουμε τον νέο κόμβο εδώ: curr.Next = n." }
  ];
  let cur = 0;

  root.innerHTML = `
    <div class="quiz-code-block" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; background: #1a1a1a;">
      <div id="list-nodes" style="display: flex; gap: 2rem; align-items: center; min-height: 80px;">
         <!-- Nodes will be injected here -->
      </div>
      <div class="vz-controls" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
        <button id="list-prev" class="reset-quiz-btn" disabled>Προηγούμενο</button>
        <div id="list-note" style="color: #ffffff; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 1rem; font-weight: 500; line-height: 1.4; flex: 1; text-align: center; margin: 0 1rem;"></div>
        <button id="list-next" class="reset-quiz-btn">Επόμενο</button>
      </div>
    </div>
  `;

  const prevBtn = root.querySelector('#list-prev');
  const nextBtn = root.querySelector('#list-next');
  const noteEl = root.querySelector('#list-note');
  const nodesContainer = root.querySelector('#list-nodes');

  function render() {
    const step = steps[cur];
    
    // Nodes: [1] -> [2] -> [3] (-> [New])
    const nodeVals = ["Data: 10", "Data: 20", "Data: 30"];
    let html = '';
    
    for (let i = 0; i < nodeVals.length; i++) {
      const isCurr = (i === step.curr);
      const border = isCurr ? 'border: 2px solid var(--accent);' : 'border: 2px solid #444;';
      const shadow = isCurr ? 'box-shadow: 0 0 10px rgba(var(--accent-rgb), 0.3);' : '';
      
      html += `
        <div style="position: relative; padding: 1rem; border-radius: 8px; background: #222; ${border} ${shadow}">
          ${isCurr ? '<div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); color: var(--accent); font-weight: bold; font-size: 0.8rem;">curr</div>' : ''}
          <div style="color: var(--fg); font-family: monospace;">${nodeVals[i]}</div>
          <div style="color: #888; font-family: monospace; font-size: 0.8rem; margin-top: 4px;">Next: ${i === nodeVals.length - 1 && !step.added ? 'nil' : '&rarr;'}</div>
        </div>
      `;
      if (i < nodeVals.length - 1 || step.added) {
        html += `<div style="color: #666; font-weight: bold;">&rarr;</div>`;
      }
    }
    
    if (step.added) {
      html += `
        <div style="position: relative; padding: 1rem; border-radius: 8px; background: rgba(var(--correct-rgb), 0.1); border: 2px solid var(--correct);">
          <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); color: var(--correct); font-weight: bold; font-size: 0.8rem;">n</div>
          <div style="color: var(--fg); font-family: monospace;">Data: "New"</div>
          <div style="color: #888; font-family: monospace; font-size: 0.8rem; margin-top: 4px;">Next: nil</div>
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
  // Fallback if loaded directly
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('viz-listpushback');
    if (root) createListViz(root);
  });
}
