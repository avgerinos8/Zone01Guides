/* ══════════════════════════════════════════════════════════════════════════
   _viz-common.js — shared init-timing helper for step-by-step visualizers.

   WHY THIS EXISTS: every visualizer's <script> tag loads at PAGE LOAD, but
   the slide markup it targets doesn't exist in the DOM until later — the
   course template builds ALL slide DOM inside initSlideDeck(), via
   contentEl.innerHTML = slide.html (see renderSlide() in static/script.js).
   A plain document.getElementById() at load time returns null, and any code
   that stops there silently does nothing — no error, just an empty box.

   VizWaitFor solves this ONCE, here, so every future visualizer doesn't have
   to rediscover/reimplement it. It does NOT define any step/state logic —
   each visualizer owns its own steps array, its own render() shape, and its
   own event wiring. This file only answers "when can I safely touch the
   DOM?", nothing about "what happens once I can".
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Waits for an element with the given id to exist in the DOM, then calls
 * initFn exactly once with that element. Safe to call at page-load time,
 * before the course template has rendered any slide content.
 *
 * @param {string} rootId - id of the visualizer's root container element
 *   (e.g. "sw-viz") — this is what render_svg checks for on each mutation.
 * @param {(root: HTMLElement) => void} initFn - called once, the first time
 *   rootId is found in the DOM. Receives the root element itself, so initFn
 *   doesn't need to re-query it.
 *
 * Usage (inside your own _viz-<name>.js, wrapped in an IIFE):
 *   VizWaitFor("sw-viz", function (root) {
 *     // root is the #sw-viz element — safe to query its children now
 *     const arrayRow = document.getElementById("sw-array-row");
 *     ...
 *   });
 */
function VizWaitFor(rootId, initFn) {
    const existing = document.getElementById(rootId);
    if (existing) {
        initFn(existing);
        return;
    }

    const observer = new MutationObserver(() => {
        const root = document.getElementById(rootId);
        if (root) {
            observer.disconnect();
            initFn(root);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}