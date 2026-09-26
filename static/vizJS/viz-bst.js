function createBstViz(rootElement) {
  class BSTNode {
    constructor(val) { this.val = val; this.left = null; this.right = null; this.x = 0; this.y = 0; }
  }
  
  let bstRoot = null;
  let bstSteps = [{ note: "Δοκίμασε να βάλεις έναν δικό σου αριθμό και πάτα Insert!" }];
  let curStep = 0;
  let newNodeVal = null;
  
  function rawInsert(val) {
    if (!bstRoot) { bstRoot = new BSTNode(val); return; }
    let curr = bstRoot;
    while(true) {
      if(val === curr.val) return;
      if(val < curr.val) {
        if(!curr.left) { curr.left = new BSTNode(val); break; }
        else curr = curr.left;
      } else {
        if(!curr.right) { curr.right = new BSTNode(val); break; }
        else curr = curr.right;
      }
    }
  }

  function assignLayout(node, minX, maxX, depth) {
    if (!node) return;
    node.x = (minX + maxX) / 2;
    node.y = 60 + depth * 80;
    assignLayout(node.left, minX, node.x, depth + 1);
    assignLayout(node.right, node.x, maxX, depth + 1);
  }

  function getMaxDepth(node, depth = 0) {
    if (!node) return depth;
    return Math.max(getMaxDepth(node.left, depth + 1), getMaxDepth(node.right, depth + 1));
  }

  // Init with default tree
  [50, 25, 75, 12, 37, 62, 87].forEach(v => rawInsert(v));

  let styles = `
    <style>
      .bst-viz-container { padding: 0.75rem; background: #09090b; border-radius: 16px; border: 1px solid #27272a; box-shadow: inset 0 0 40px rgba(0,0,0,0.5); font-family: system-ui, sans-serif; }
      .blacked-shadow { filter: drop-shadow(2px 2px 0px #000) drop-shadow(-1px -1px 0px #000) drop-shadow(1px -1px 0px #000) drop-shadow(-1px 1px 0px #000); }
      .node-circle { transition: all 0.3s; }
      
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
      .vz-header.disabled {
          filter: grayscale(100%);
          opacity: 0.6;
          pointer-events: none;
      }
      
      .vz-input { background: #18181b; border: 2px solid #3f3f46; color: #fff; padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 1.1rem; width: 110px; outline: none; transition: border-color 0.2s; }
      .vz-input:focus { border-color: var(--accent); }
      .vz-input:disabled { opacity: 0.5; cursor: not-allowed; }
      
      .vz-btn { background: #18181b; border: 2px solid #3f3f46; color: #fff; padding: 0.6rem 1.4rem; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 1.1rem; }
      .vz-btn:hover:not(:disabled) { background: #27272a; border-color: #52525b; }
      .vz-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      
      .btn-glow { border-color: #fff !important; box-shadow: 0 0 15px rgba(255,255,255,0.4) !important; animation: pulse-white 1.5s infinite; }
      .btn-glow-accent { border-color: var(--accent) !important; box-shadow: 0 0 15px var(--accent) !important; animation: pulse-accent 1.5s infinite; }
      
      @keyframes pulse-white { 0% { box-shadow: 0 0 10px rgba(255,255,255,0.2); } 50% { box-shadow: 0 0 20px rgba(255,255,255,0.6); } 100% { box-shadow: 0 0 10px rgba(255,255,255,0.2); } }
      @keyframes pulse-accent { 0% { box-shadow: 0 0 10px rgba(96, 165, 250, 0.2); } 50% { box-shadow: 0 0 20px rgba(96, 165, 250, 0.6); } 100% { box-shadow: 0 0 10px rgba(96, 165, 250, 0.2); } }
    </style>
  `;

  let htmlStructure = `
    ${styles}
    <div class="bst-viz-container">
      <div style="position: relative; width: 100%;">
        <div id="bst-svg-wrapper" style="overflow: hidden; width: 100%; border: 1px solid #27272a; border-radius: 8px; background: #000; min-height: 120px;">
        </div>
        <div class="vz-header" id="bst-panel">
          <input type="number" id="bst-input" class="vz-input" placeholder="Αριθμός..." />
          <button id="bst-insert" class="vz-btn btn-glow" style="padding: 0.5rem 1rem;">Insert</button>
        </div>
      </div>
      <div class="vz-controls" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; margin-bottom: 0px;">
        <button id="bst-prev" class="vz-btn">Προηγούμενο</button>
        <div id="bst-note" style="color: #e4e4e7; font-size: 1.1rem; font-weight: 500; flex: 1; text-align: center; margin: 0 1rem; min-height: 2em; display: flex; align-items: center; justify-content: center;"></div>
        <button id="bst-next" class="vz-btn">Επόμενο</button>
      </div>
    </div>
  `;
  rootElement.innerHTML = htmlStructure;

  const svgWrapper = rootElement.querySelector('#bst-svg-wrapper');
  const noteEl = rootElement.querySelector('#bst-note');
  const btnPrev = rootElement.querySelector('#bst-prev');
  const btnNext = rootElement.querySelector('#bst-next');
  const inputEl = rootElement.querySelector('#bst-input');
  const btnInsert = rootElement.querySelector('#bst-insert');
  const panelEl = rootElement.querySelector('#bst-panel');

  function render() {
    let totalNodes = 0;
    function countNodes(node) {
      if(!node) return;
      totalNodes++;
      countNodes(node.left);
      countNodes(node.right);
    }
    countNodes(bstRoot);

    let spacing = Math.max(30, 70 - totalNodes * 1.5);
    let r = Math.min(36, 28 + Math.max(0, totalNodes - 7) * 0.5);

    let maxDepth = 0;
    function traverseDepth(node, d) {
      if (!node) return;
      node.y = 40 + d * 60;
      maxDepth = Math.max(maxDepth, d);
      traverseDepth(node.left, d + 1);
      traverseDepth(node.right, d + 1);
    }
    traverseDepth(bstRoot, 0);

    let H = Math.max(180, maxDepth * 60 + 90);

    let treeWidth = (totalNodes > 0 ? totalNodes - 1 : 0) * spacing;
    let W = Math.max(760, treeWidth + 100);
    
    // Force aspect ratio scaling so the SVG scales down instead of becoming too tall on screen
    W = Math.max(W, H * 2.8);
    let offsetX = (W - treeWidth) / 2;

    let inorderIdx = 0;
    function assignLayoutTight(node) {
      if (!node) return;
      assignLayoutTight(node.left);
      node.x = offsetX + inorderIdx * spacing;
      inorderIdx++;
      assignLayoutTight(node.right);
    }
    assignLayoutTight(bstRoot);

    const step = bstSteps[curStep];
    const showNewNode = step && step.added;

    let nodes = [];
    let lines = [];
    
    function collect(node) {
      if(!node) return;
      if(node.val === newNodeVal && !showNewNode) return;
      nodes.push(node);
      
      if(node.left && !(node.left.val === newNodeVal && !showNewNode)) {
        lines.push({ x1: node.x, y1: node.y, x2: node.left.x, y2: node.left.y, isNew: node.left.val === newNodeVal });
        collect(node.left);
      }
      if(node.right && !(node.right.val === newNodeVal && !showNewNode)) {
        lines.push({ x1: node.x, y1: node.y, x2: node.right.x, y2: node.right.y, isNew: node.right.val === newNodeVal });
        collect(node.right);
      }
    }
    collect(bstRoot);

    let svgHtml = `
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
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

    lines.forEach(l => {
      let stroke = l.isNew ? 'var(--correct, #34d399)' : '#71717a';
      let w = l.isNew ? 3 : 2;
      let dash = l.isNew ? 'stroke-dasharray="6"' : '';
      svgHtml += `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${stroke}" stroke-width="${w}" ${dash} />`;
    });

    nodes.forEach(n => {
      let isCurr = (step && step.curr === n.val);
      let isAdded = (n.val === newNodeVal && step && step.added);
      
      let stroke = (isCurr || isAdded) ? 'var(--correct, #34d399)' : 'var(--accent, #60a5fa)';
      let fill = (isCurr || isAdded) ? 'url(#hatch-tree-viz-correct)' : 'url(#hatch-tree-viz)';
      let filter = (isCurr || isAdded) ? 'filter="url(#glow-correct)"' : '';
      
      let animate = '';
      if(isAdded) {
         animate = `<animate attributeName="r" values="0;${r + 4};${r}" dur="0.5s" calcMode="spline" keySplines="0.175 0.885 0.32 1.275; 0.175 0.885 0.32 1.275" />`;
      }
      
      svgHtml += `
        <g transform="translate(${n.x}, ${n.y})">
          <circle r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${isCurr?5:3}" ${filter} class="node-circle">
            ${animate}
          </circle>
          <text y="7" font-size="20" text-anchor="middle" style="fill:var(--tone-text); font-family:monospace; font-weight:bold" class="blacked-shadow">${n.val}</text>
        </g>
      `;
    });

    svgHtml += `</svg>`;
    svgWrapper.innerHTML = svgHtml;

    if (step) noteEl.innerHTML = step.note;

    let isIdle = (bstSteps.length <= 1 || curStep === bstSteps.length - 1);

    btnPrev.disabled = (curStep === 0 || isIdle);
    btnNext.disabled = (curStep === bstSteps.length - 1 || isIdle);
    
    if (!isIdle && curStep < bstSteps.length - 1) {
      btnNext.classList.add('btn-glow-accent');
    } else {
      btnNext.classList.remove('btn-glow-accent');
    }

    if (isIdle) {
      inputEl.disabled = false;
      btnInsert.disabled = false;
      btnInsert.classList.add('btn-glow');
      panelEl.classList.remove('disabled');
    } else {
      inputEl.disabled = true;
      btnInsert.disabled = true;
      btnInsert.classList.remove('btn-glow');
      panelEl.classList.add('disabled');
    }
  }

  function exists(val) {
    let curr = bstRoot;
    while(curr) {
      if(val === curr.val) return true;
      if(val < curr.val) curr = curr.left;
      else curr = curr.right;
    }
    return false;
  }

  btnInsert.onclick = () => {
    let val = parseInt(inputEl.value);
    if (isNaN(val)) return;
    
    if (exists(val)) {
        inputEl.value = '';
        return;
    }
    
    newNodeVal = val;
    bstSteps = [];
    curStep = 0;
    
    if (!bstRoot) {
      bstSteps.push({ curr: null, added: true, val: val, note: `Το δέντρο είναι άδειο. Το ${val} γίνεται η νέα ρίζα.` });
      rawInsert(val);
      render();
      inputEl.value = '';
      return;
    }
    
    let curr = bstRoot;
    while(true) {
      if (val === curr.val) {
        bstSteps.push({ curr: curr.val, added: false, note: `Το ${val} υπάρχει ήδη στο δέντρο.` });
        break;
      }
      if (val < curr.val) {
        bstSteps.push({ curr: curr.val, added: false, note: `Το ${val} είναι μικρότερο από το ${curr.val}. Πάμε αριστερά.` });
        if (!curr.left) {
          bstSteps.push({ curr: curr.val, added: true, val: val, note: `Το αριστερό παιδί είναι κενό! Τοποθετούμε το ${val} εκεί.` });
          rawInsert(val);
          break;
        } else {
          curr = curr.left;
        }
      } else {
        bstSteps.push({ curr: curr.val, added: false, note: `Το ${val} είναι μεγαλύτερο από το ${curr.val}. Πάμε δεξιά.` });
        if (!curr.right) {
          bstSteps.push({ curr: curr.val, added: true, val: val, note: `Το δεξί παιδί είναι κενό! Τοποθετούμε το ${val} εκεί.` });
          rawInsert(val);
          break;
        } else {
          curr = curr.right;
        }
      }
    }
    
    inputEl.value = '';
    render();
  };

  btnPrev.onclick = () => { if (curStep > 0) { curStep--; render(); } };
  btnNext.onclick = () => { if (curStep < bstSteps.length - 1) { curStep++; render(); } };
  
  inputEl.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && !btnInsert.disabled) btnInsert.click();
  });

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
