/* ==========================================================================
   util.js — tiny shared helpers (no dependencies)
   ========================================================================== */
(function (global) {
  'use strict';

  function randInt(min, max) {
    // inclusive of both ends
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Sample n unique items from arr
  function sample(arr, n) {
    return shuffle(arr).slice(0, n);
  }

  // Build a set of unique numeric choices around the correct answer.
  function numericChoices(answer, count, spread) {
    spread = spread || Math.max(2, Math.round(Math.abs(answer) * 0.4) + 2);
    const set = new Set([answer]);
    let guard = 0;
    while (set.size < count && guard < 400) {
      guard++;
      // widen the spread if we're struggling to find enough unique options
      const s = spread + Math.floor(guard / 40);
      let delta = randInt(-s, s);
      if (delta === 0) continue;
      const candidate = answer + delta;
      if (candidate < 0 && answer >= 0) continue; // avoid negatives when answer is non-negative
      set.add(candidate);
    }
    return shuffle(Array.from(set));
  }

  // Normalise a free-text answer for comparison.
  function normalise(str) {
    return String(str).trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function todayKey(d) {
    d = d || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatDate(key) {
    const [y, m, d] = key.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // escape text destined for innerHTML
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  global.U = { randInt, pick, shuffle, sample, numericChoices, normalise, todayKey, formatDate, esc };
})(window);
