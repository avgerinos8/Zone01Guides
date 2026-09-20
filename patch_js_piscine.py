import re

with open('js-piscine.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Insert CSS
css_to_insert = """
    /* New layout styles */
    main {
        max-width: none !important; /* take all available width */
        padding-right: 2rem !important; /* hug the right side */
    }
    article[hidden] {
        display: none !important;
    }
    article:has(.sol-container) {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 30px;
    }
    .exercise-content {
        flex: 1 1 0%;
        min-width: 0; 
    }
    .sol-container {
        flex: 1 1 0%; /* exactly same flex as exercise-content for a 50/50 split */
        min-width: 0; 
        max-width: none;
        margin-top: 0;
        position: sticky;
        top: 2rem;
    }
    @media (max-width: 1200px) {
        .sol-container {
            flex: 1 1 100%;
            max-width: none;
            position: static;
            margin-top: 20px;
        }
    }
    /* Petrol Styling */
    .sol-btn {
        background: #24362D;
        color: #e0e6e2;
        border: 1px solid #364F42;
        padding: 8px 16px;
        cursor: pointer;
        border-radius: 4px;
        font-weight: bold;
        font-family: Consolas, "Courier New", monospace;
        transition: background 0.2s;
        width: 100%;
        text-align: left;
    }
    .sol-btn:hover {
        background: #2E453A;
    }
    .sol-code {
        margin-top: 10px;
        background: #1E2B24;
        padding: 10px 0;
        border-radius: 6px;
        border: 1px solid #364F42;
        font-family: Consolas, "Courier New", monospace;
        font-size: 14px;
        color: #ffffff;
        line-height: 1.6;
        overflow-x: auto;
        counter-reset: line;
        position: relative;
    }
    .sol-line {
        display: flex;
        border-bottom: 1px solid #2B3D34;
    }
    .sol-line:last-child {
        border-bottom: none;
    }
    .sol-line::before {
        counter-increment: line;
        content: counter(line);
        width: 2.5em;
        text-align: right;
        padding-right: 12px;
        color: #556B5F;
        border-right: 1px solid #2B3D34;
        margin-right: 12px;
        flex-shrink: 0;
    }
    .sol-line-content {
        white-space: pre;
        flex-grow: 1;
    }
    .copy-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(54, 79, 66, 0.8);
        border: 1px solid #556B5F;
        color: #e0e6e2;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        opacity: 0.5;
        transition: opacity 0.2s, background 0.2s;
    }
    .sol-code:hover .copy-btn {
        opacity: 1;
    }
    .copy-btn:hover {
        background: #2E453A;
    }
</style>
"""

if "/* New layout styles */" not in html:
    html = html.replace("</style>", css_to_insert)

# 2. Insert JS
js_to_insert = """
  <script>
    function copySolution(btn) {
        const codeDiv = btn.parentElement;
        const lines = Array.from(codeDiv.querySelectorAll('.sol-line-content')).map(d => d.textContent);
        navigator.clipboard.writeText(lines.join('\\n')).then(() => {
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = originalText, 2000);
        });
    }
  </script>
</body>
"""
if "function copySolution" not in html:
    html = html.replace("</body>", js_to_insert)

# 3. Transform articles
def replace_article(match):
    full_match = match.group(0)
    slug = match.group(1)
    inner_html = match.group(2)
    
    if 'class="exercise-content"' in inner_html:
        return full_match # Already transformed
        
    new_inner = f"""
      <div class="exercise-content">
{inner_html}
      </div>
      <div class="sol-container">
        <button class="sol-btn" onclick="document.getElementById('sol-{slug}').hidden = !document.getElementById('sol-{slug}').hidden">Toggle Solution</button>
        <div id="sol-{slug}" hidden class="sol-code">
          <div class="sol-line"><div class="sol-line-content"> </div></div>
          <button class="copy-btn" onclick="copySolution(this)">Copy</button>
        </div>
      </div>
"""
    return f"<article id='{slug}' hidden>{new_inner}</article>"

html = re.sub(r"<article id='([^']+)' hidden>(.*?)</article>", replace_article, html, flags=re.DOTALL)

with open('js-piscine.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("js-piscine.html patched successfully!")
