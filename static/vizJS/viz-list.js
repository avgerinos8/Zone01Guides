function createListViz(rootElement) {
  let listNodes = [10, 20]; // Permanent nodes
  let llSteps = [{ curr: -1, added: false, note: "Δοκίμασε να κάνεις PushBack προσθέτοντας έναν νέο αριθμό!" }];
  let curStep = 0;
  let newNodeVal = null;

  let htmlStructure = `
    <style>
      .bst-viz-container {
        padding: 0.75rem; background: #09090b; border-radius: 16px; 
        border: 1px solid #27272a; box-shadow: inset 0 0 40px rgba(0,0,0,0.5); font-family: system-ui, sans-serif;
      }
      .viz-ll-nodes-wrapper {
        position: relative; overflow-x: auto; overflow-y: hidden; width: 100%; 
        border: 1px solid #27272a; border-radius: 8px; background: #000; min-height: 180px;
        display: flex; align-items: center; padding: 2rem 1rem 3rem 1rem;
      }
      .viz-ll-nodes {
        display: flex; gap: 0.5rem; align-items: center; 
        transition: all 0.3s; margin: 0 auto;
      }
      .vz-header { 
          position: absolute; 
          bottom: -26px; 
          left: 50%; 
          transform: translateX(-50%);
          z-index: 10; 
          display: flex; 
          gap: 0.5rem; 
          align-items: center; 
          background: rgba(39, 39, 42, 0.85); 
          backdrop-filter: blur(8px);
          padding: 0.5rem;
          border-radius: 12px;
          border: 1px solid #52525b;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          transition: all 0.3s;
      }
      .vz-header.disabled { filter: grayscale(100%); opacity: 0.6; pointer-events: none; }
      .vz-input { background: rgba(24, 24, 27, 0.85); backdrop-filter: blur(4px); border: 2px solid #3f3f46; color: #fff; padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 1.1rem; width: 110px; outline: none; transition: border-color 0.2s; }
      .vz-input:focus { border-color: var(--accent); }
      .vz-btn { background: #18181b; border: 2px solid #3f3f46; color: #fff; padding: 0.6rem 1.4rem; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 1.1rem; }
      .vz-btn:hover:not(:disabled) { background: #27272a; border-color: #52525b; }
      .vz-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      
      .btn-glow { border-color: #fff !important; box-shadow: 0 0 15px rgba(255,255,255,0.4) !important; animation: pulse-white 1.5s infinite; }
      .btn-glow-accent { border-color: var(--accent) !important; box-shadow: 0 0 15px var(--accent) !important; animation: pulse-accent 1.5s infinite; }
      @keyframes pulse-white { 0% { box-shadow: 0 0 10px rgba(255,255,255,0.2); } 50% { box-shadow: 0 0 20px rgba(255,255,255,0.6); } 100% { box-shadow: 0 0 10px rgba(255,255,255,0.2); } }
      @keyframes pulse-accent { 0% { box-shadow: 0 0 10px rgba(96, 165, 250, 0.2); } 50% { box-shadow: 0 0 20px rgba(96, 165, 250, 0.6); } 100% { box-shadow: 0 0 10px rgba(96, 165, 250, 0.2); } }
      
      .viz-ll-node {
        background: #18181b; border: 2px solid #3f3f46; border-radius: 12px;
        display: flex; flex-direction: row; overflow: hidden; position: relative;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        min-width: 130px; height: 60px; flex-shrink: 0;
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
    
    <div class="bst-viz-container">
      <div style="position: relative; width: 100%;">
        <div class="viz-ll-nodes-wrapper" id="list-nodes-wrapper">
          <div id="list-nodes" class="viz-ll-nodes"></div>
        </div>
        <div class="vz-header" id="list-panel">
          <input type="number" id="list-input" class="vz-input" placeholder="Αριθμός..." />
          <button id="list-push" class="vz-btn btn-glow" style="padding: 0.5rem 1rem;">PushBack</button>
        </div>
      </div>
      
      <div class="vz-controls" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; margin-bottom: 0px;">
        <button id="list-prev" class="vz-btn" disabled>Προηγούμενο</button>
        <div id="list-note" style="color: #e4e4e7; font-family: system-ui, sans-serif; font-size: 1.1rem; font-weight: 500; flex: 1; text-align: center; margin: 0 1rem; min-height: 2em; display: flex; align-items: center; justify-content: center;"></div>
        <button id="list-next" class="vz-btn">Επόμενο</button>
      </div>
    </div>
  `;

  rootElement.innerHTML = htmlStructure;

  const prevBtn = rootElement.querySelector('#list-prev');
  const nextBtn = rootElement.querySelector('#list-next');
  const noteEl = rootElement.querySelector('#list-note');
  const nodesContainer = rootElement.querySelector('#list-nodes');
  const scrollWrapper = rootElement.querySelector('#list-nodes-wrapper');
  
  const inputEl = rootElement.querySelector('#list-input');
  const btnPush = rootElement.querySelector('#list-push');
  const panelEl = rootElement.querySelector('#list-panel');

  const arrowSvg = `<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;

  function render() {
    const step = llSteps[curStep];
    const showNewNode = step && step.added;
    let html = '';
    
    for (let i = 0; i < listNodes.length; i++) {
      const isCurr = (step && i === step.curr);
      
      html += `
        <div class="viz-ll-node ${isCurr ? 'active' : ''}">
          <div class="viz-ll-curr-badge">curr</div>
          <div class="viz-ll-data">${listNodes[i]}</div>
          <div class="viz-ll-next"><div class="viz-ll-next-dot"></div></div>
        </div>
      `;
      
      if (i < listNodes.length - 1 || showNewNode) {
        let arrowColor = (i === listNodes.length - 1 && showNewNode) ? 'color: var(--correct, #34d399);' : '';
        html += `<div class="viz-ll-arrow" style="${arrowColor}">${arrowSvg}</div>`;
      }
    }
    
    if (showNewNode && newNodeVal !== null) {
      html += `
        <div class="viz-ll-node viz-ll-new">
          <div class="viz-ll-new-badge">n</div>
          <div class="viz-ll-data" style="color: var(--correct, #34d399);">${newNodeVal}</div>
          <div class="viz-ll-next" style="border-left-color: var(--correct, #34d399);"><div class="viz-ll-next-dot"></div></div>
        </div>
      `;
    }

    nodesContainer.innerHTML = html;
    if (step) noteEl.innerHTML = step.note;
    
    let isIdle = (llSteps.length <= 1 || curStep === llSteps.length - 1);
    
    prevBtn.disabled = (curStep === 0 || isIdle);
    nextBtn.disabled = (curStep === llSteps.length - 1 || isIdle);
    
    if (!isIdle && curStep < llSteps.length - 1) {
      nextBtn.classList.add('btn-glow-accent');
    } else {
      nextBtn.classList.remove('btn-glow-accent');
    }

    if (isIdle) {
      inputEl.disabled = false;
      btnPush.disabled = false;
      btnPush.classList.add('btn-glow');
      panelEl.classList.remove('disabled');
    } else {
      inputEl.disabled = true;
      btnPush.disabled = true;
      btnPush.classList.remove('btn-glow');
      panelEl.classList.add('disabled');
    }

    // Auto-scroll to the end if we are expanding
    if (step && (step.curr > 2 || step.added)) {
       setTimeout(() => {
         scrollWrapper.scrollTo({ left: scrollWrapper.scrollWidth, behavior: 'smooth' });
       }, 50);
    }
  }

  btnPush.onclick = () => {
    let val = parseInt(inputEl.value);
    if (isNaN(val)) return;

    if (newNodeVal !== null) {
       listNodes.push(newNodeVal); // commit previous
    }
    
    newNodeVal = val;
    llSteps = [];
    curStep = 0;

    if (listNodes.length === 0) {
      llSteps.push({ curr: -1, added: true, val: val, note: `Η λίστα είναι άδεια. Ο νέος κόμβος ${val} γίνεται απευθείας το Head!` });
    } else {
      llSteps.push({ curr: 0, added: false, note: "Βήμα 1: Το <strong>curr</strong> ξεκινάει ΠΑΝΤΑ από την αρχή (Head)." });
      for (let i = 1; i < listNodes.length; i++) {
        llSteps.push({ curr: i, added: false, note: `Βήμα ${i+1}: Το curr.Next υπάρχει. Άρα περπατάμε στον επόμενο κόμβο...` });
      }
      llSteps.push({ curr: listNodes.length - 1, added: true, val: val, note: `Τέλος! Το curr.Next είναι nil! Βρέθηκε η ουρά, συνδέουμε το ${val}.` });
    }
    
    inputEl.value = '';
    render();
  };

  prevBtn.onclick = () => { if (curStep > 0) { curStep--; render(); } };
  nextBtn.onclick = () => { if (curStep < llSteps.length - 1) { curStep++; render(); } };
  
  inputEl.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && !btnPush.disabled) btnPush.click();
  });

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

