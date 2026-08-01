/* ══════════════════════════════════════════════════════════════════════════
   highlighter.js — standalone, VS-Code-Dark+-style syntax highlighter for
   Go, JavaScript, HTML, and CSS. Fully independent of script.js/style.css —
   include it separately (see the 3 CSS additions needed, listed at the
   bottom of this file) and it does the rest on its own, automatically.

   USAGE: put class="lang-go" | "lang-js" | "lang-html" | "lang-css" on any
   <code> element (inside a <pre>, as usual). No other setup needed — this
   file watches the page and highlights matching elements as soon as they
   appear, including ones added later (e.g. by script.js building slides).

   Each highlighter below is a lightweight, single-pass-ish regex tokenizer
   — good for teaching snippets, NOT a full language parser/lexer. It won't
   handle every edge case (e.g. deeply nested template literals, CSS
   preprocessor syntax) but covers everything typical course code needs.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ── Go ───────────────────────────────────────────────────────────────── ⊃
  const GO_KEYWORDS = new Set(["break", "case", "chan", "const", "continue", "default", "defer", "else", "fallthrough", "for", "func", "go", "goto", "if", "import", "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var", "make", "new", "nil", "true", "false", "iota"]);
  const GO_TYPES = new Set(["int", "int8", "int16", "int32", "int64", "uint", "uint8", "uint16", "uint32", "uint64", "uintptr", "float32", "float64", "complex64", "complex128", "string", "bool", "byte", "rune", "error", "any"]);

  function highlightGo(source) {
    return tokenizeCLike(source, GO_KEYWORDS, GO_TYPES, /`[^`]*`/);
  }

  // ── JavaScript ───────────────────────────────────────────────────────── ⊃
  const JS_KEYWORDS = new Set(["break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "export", "extends", "finally", "for", "function", "if", "import", "in", "instanceof", "let", "new", "of", "return", "static", "super", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "yield", "async", "await", "null", "true", "false", "undefined"]);
  const JS_TYPES = new Set(["Array", "Object", "String", "Number", "Boolean", "Map", "Set", "Promise", "Symbol", "Error", "Date", "RegExp"]);

  function highlightJS(source) {
    return tokenizeCLike(source, JS_KEYWORDS, JS_TYPES, /`(?:[^`\\]|\\.)*`/);
  }

  // Shared tokenizer for C-like languages (Go, JS): // and /* */ comments,
  // "..."/'...'/template-literal strings, numbers, keywords, types, and
  // identifier-followed-by-"(" treated as a function call.
  function tokenizeCLike(source, keywords, types, templateLiteralRe) {
    const tokenRe = new RegExp(
      "(\\/\\/[^\\n]*)" +                              // 1: line comment
      "|(\\/\\*[\\s\\S]*?\\*\\/)" +                     // 2: block comment
      "|(\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*'|" + templateLiteralRe.source + ")" + // 3: string
      "|(\\b\\d+\\.?\\d*\\b)" +                         // 4: number
      "|(\\b[A-Za-z_$][A-Za-z0-9_$]*\\b)(\\()?",        // 5: identifier, 6: optional "("
      "g"
    );
    let out = "", last = 0, m;
    while ((m = tokenRe.exec(source)) !== null) {
      out += escapeHtml(source.slice(last, m.index));
      const [, lineComment, blockComment, str, num, ident, paren] = m;
      if (lineComment || blockComment) {
        out += `<span class="tok-com">${escapeHtml(lineComment || blockComment)}</span>`;
      } else if (str) {
        out += `<span class="tok-str">${escapeHtml(str)}</span>`;
      } else if (num) {
        out += `<span class="tok-num">${escapeHtml(num)}</span>`;
      } else if (ident) {
        if (keywords.has(ident)) out += `<span class="tok-kw">${ident}</span>`;
        else if (types.has(ident)) out += `<span class="tok-type">${ident}</span>`;
        else if (paren) out += `<span class="tok-func">${ident}</span>`;
        else out += ident;
        if (paren) out += "(";
      }
      last = tokenRe.lastIndex;
    }
    out += escapeHtml(source.slice(last));
    return out;
  }

  // ── HTML ─────────────────────────────────────────────────────────────── ⊃
  function highlightHTML(source) {
    const tagRe = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z][^>]*>)/g;
    let out = "", last = 0, m;
    while ((m = tagRe.exec(source)) !== null) {
      out += escapeHtml(source.slice(last, m.index));
      out += m[1] ? `<span class="tok-com">${escapeHtml(m[1])}</span>` : highlightHtmlTag(m[2]);
      last = tagRe.lastIndex;
    }
    out += escapeHtml(source.slice(last));
    return out;
  }

  function highlightHtmlTag(tag) {
    const re = /(<\/?)([a-zA-Z][a-zA-Z0-9-]*)|(\s)([a-zA-Z_:][a-zA-Z0-9_:.-]*)(=)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\/?>)/g;
    let out = "", last = 0, m;
    while ((m = re.exec(tag)) !== null) {
      out += escapeHtml(tag.slice(last, m.index));
      if (m[2] !== undefined) {
        out += `<span class="tok-punct">${escapeHtml(m[1])}</span><span class="tok-kw">${escapeHtml(m[2])}</span>`;
      } else if (m[4] !== undefined) {
        out += `${escapeHtml(m[3])}<span class="tok-attr">${escapeHtml(m[4])}</span><span class="tok-punct">${escapeHtml(m[5])}</span>`;
      } else if (m[6] !== undefined) {
        out += `<span class="tok-str">${escapeHtml(m[6])}</span>`;
      } else if (m[7] !== undefined) {
        out += `<span class="tok-punct">${escapeHtml(m[7])}</span>`;
      }
      last = re.lastIndex;
    }
    out += escapeHtml(tag.slice(last));
    return out;
  }

  // ── CSS ──────────────────────────────────────────────────────────────── ⊃
  // Structural approximation, not a real parser: comments/strings are
  // protected first, then hex colors, numbers+units, @-rules, property
  // names (word right before ":"), and selector lines (text right before
  // "{") are colored in separate passes over the remaining plain text.
  function highlightCSS(source) {
    const stash = [];
    function keep(str, cls) {
      stash.push({ str, cls });
      return "\u0000" + (stash.length - 1) + "\u0000";
    }

    let src = source
      .replace(/\/\*[\s\S]*?\*\//g, m => keep(m, "tok-com"))
      .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, m => keep(m, "tok-str"))
      .replace(/#[0-9a-fA-F]{3,8}\b/g, m => keep(m, "tok-num"))
      .replace(/\b\d+\.?\d*(?:px|em|rem|%|vh|vw|vmin|vmax|deg|s|ms)?\b/g, m => keep(m, "tok-num"))
      .replace(/@[a-zA-Z-]+/g, m => keep(m, "tok-kw"))
      .replace(/([{;]\s*)([a-zA-Z-]+)(\s*:)/g, (m, pre, prop, colon) => pre + keep(prop, "tok-attr") + colon)
      .replace(/(^|\n)(\s*)([a-zA-Z-]+)(\s*:)/g, (m, nl, ws, prop, colon) => nl + ws + keep(prop, "tok-attr") + colon)
      .replace(/([^{}\n]+)\{/g, (m, sel) => (sel.trim().startsWith("\u0000") ? m : keep(sel, "tok-sel") + "{"));

    let out = escapeHtml(src);
    out = out.replace(/\u0000(\d+)\u0000/g, (m, i) => {
      const item = stash[Number(i)];
      return `<span class="${item.cls}">${escapeHtml(item.str)}</span>`;
    });
    return out;
  }

  // ── dispatch + auto-run ─────────────────────────────────────────────── ⊃
  const LANG_MAP = { "lang-go": highlightGo, "lang-js": highlightJS, "lang-html": highlightHTML, "lang-css": highlightCSS };

  function highlightElement(codeEl) {
    if (codeEl.dataset.highlighted === "1") return;
    const langClass = Object.keys(LANG_MAP).find(c => codeEl.classList.contains(c));
    if (!langClass) return;
    codeEl.innerHTML = LANG_MAP[langClass](codeEl.textContent);
    codeEl.dataset.highlighted = "1";
  }

  function scan(root) {
    if (root.nodeType !== 1) return;
    if (root.matches && root.matches('code[class*="lang-"]')) highlightElement(root);
    root.querySelectorAll && root.querySelectorAll('code[class*="lang-"]').forEach(highlightElement);
  }

  document.addEventListener("DOMContentLoaded", () => scan(document.body));

  // Slides in this template are built dynamically (script.js sets innerHTML
  // per slide) — a MutationObserver catches those without needing any
  // change to script.js itself.
  new MutationObserver(muts => {
    muts.forEach(mut => mut.addedNodes.forEach(scan));
  }).observe(document.body, { childList: true, subtree: true });
})();

/* ══════════════════════════════════════════════════════════════════════════
   CSS ADDITIONS NEEDED — see the chat message for the exact snippet to
   paste into static/style.css (near the existing .tok-* rules). Only 2 new
   colors + 2 new classes; everything else (kw/type/str/com/num/func)
   already exists and is reused as-is.
   ══════════════════════════════════════════════════════════════════════════ */
