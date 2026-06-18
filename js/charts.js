/* ==========================================================================
   charts.js — hand-rolled accessible SVG line chart of daily scores
   ========================================================================== */
(function (global) {
  'use strict';

  // series: [{date, overall}], returns an SVG string.
  function dailyChart(series) {
    const W = 640, H = 240;
    const pad = { l: 36, r: 16, t: 18, b: 34 };
    const innerW = W - pad.l - pad.r;
    const innerH = H - pad.t - pad.b;

    if (!series.length) {
      return `<div class="chart-empty">No workouts yet — complete today’s workout to start your graph.</div>`;
    }

    const data = series.slice(-30); // last 30 days
    const n = data.length;
    const maxY = 100;
    const x = i => pad.l + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = v => pad.t + innerH - (v / maxY) * innerH;

    // gridlines + y labels at 0,25,50,75,100
    let grid = '';
    [0, 25, 50, 75, 100].forEach(v => {
      const gy = y(v);
      grid += `<line x1="${pad.l}" y1="${gy}" x2="${W - pad.r}" y2="${gy}" stroke="var(--ink)" stroke-opacity="0.12"/>`;
      grid += `<text x="${pad.l - 8}" y="${gy + 4}" font-size="11" text-anchor="end" fill="var(--ink)" fill-opacity="0.7">${v}</text>`;
    });

    // line path
    const linePts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.overall).toFixed(1)}`).join(' ');
    const area = `${pad.l},${y(0)} ${linePts} ${x(n - 1)},${y(0)}`;

    // points + sparse x labels
    let dots = '', xlabels = '';
    const labelEvery = Math.ceil(n / 6);
    data.forEach((d, i) => {
      const cx = x(i), cy = y(d.overall);
      dots += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.5" fill="var(--blue)"><title>${U.formatDate(d.date)}: ${d.overall}</title></circle>`;
      if (i % labelEvery === 0 || i === n - 1) {
        xlabels += `<text x="${cx.toFixed(1)}" y="${H - 10}" font-size="11" text-anchor="middle" fill="var(--ink)" fill-opacity="0.7">${U.formatDate(d.date)}</text>`;
      }
    });

    const avg = Math.round(data.reduce((s, d) => s + d.overall, 0) / n);
    const label = `Line graph of daily workout scores over the last ${n} day${n > 1 ? 's' : ''}. Average ${avg} out of 100.`;

    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${U.esc(label)}" preserveAspectRatio="xMidYMid meet">
      ${grid}
      <polygon points="${area}" fill="var(--blue)" fill-opacity="0.12"/>
      <polyline points="${linePts}" fill="none" stroke="var(--blue)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
      ${xlabels}
    </svg>`;
  }

  global.Charts = { dailyChart };
})(window);
