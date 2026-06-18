/* ==========================================================================
   games.js — 20 adaptive, randomised games (5 per category)

   Each game exposes: { id, category, name, makeRound(level) }
   `level` (>=1) scales difficulty; higher = harder. It climbs as the player
   answers correctly and eases on a wrong answer (driven by the runner).

   makeRound(level) -> {
     prompt, visual(html|null), hint(string|null),
     type: 'choice'|'text', choices:[str], answer:str,
     accept:[str]?  (text only), explain:str|null
   }
   ========================================================================== */
(function (global) {
  'use strict';
  const { randInt, pick, shuffle, sample, numericChoices, normalise } = U;

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const lvl = L => clamp(Math.round(L || 2), 1, 12);

  // Pick a word whose length suits the level (longer words at higher levels).
  function wordByLevel(L) {
    const want = clamp(3 + L, 4, 9);
    let pool = DATA.WORDS.filter(w => Math.abs(w[0].length - want) <= 1);
    if (!pool.length) pool = DATA.WORDS;
    return pick(pool);
  }

  /* --- SVG drawing helpers ---------------------------------------------- */
  const FILLS = ['var(--ink)', 'var(--blue)', 'var(--sun)'];

  function polyPoints(cx, cy, r, sides, rotDeg) {
    const rot = (rotDeg || 0) * Math.PI / 180 - Math.PI / 2;
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = rot + i * 2 * Math.PI / sides;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  }

  function drawShape(type, cx, cy, s, fill, rot) {
    switch (type) {
      case 'circle':
        return `<circle cx="${cx}" cy="${cy}" r="${s}" fill="${fill}"/>`;
      case 'square':
        return `<rect x="${cx - s}" y="${cy - s}" width="${2 * s}" height="${2 * s}" fill="${fill}" transform="rotate(${rot || 0} ${cx} ${cy})"/>`;
      case 'triangle':
        return `<polygon points="${polyPoints(cx, cy, s * 1.15, 3, rot || 0)}" fill="${fill}"/>`;
      default:
        return '';
    }
  }

  function svg(w, h, body, label) {
    return `<div class="visual"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label || 'puzzle figure'}" preserveAspectRatio="xMidYMid meet">${body}</svg></div>`;
  }

  /* ======================================================================
     GEOMETRIC
     ====================================================================== */

  const geoCount = {
    id: 'geo-count', category: 'geometric', name: 'Shape Counter',
    makeRound(level) {
      const L = lvl(level);
      const types = ['triangle', 'circle', 'square'];
      const target = pick(types);
      const targetName = { triangle: 'triangles', circle: 'circles', square: 'squares' }[target];
      const total = clamp(8 + L * 2, 10, 22);           // more clutter as level rises
      const cells = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) cells.push([28 + c * 53, 30 + r * 48]);
      const chosen = sample(cells, total);
      let count = 0;
      const body = chosen.map(([x, y]) => {
        const t = pick(types);
        if (t === target) count++;
        const jx = x + randInt(-8, 8), jy = y + randInt(-8, 8);
        return drawShape(t, jx, jy, randInt(11, 15), pick(FILLS), randInt(0, 359));
      }).join('');
      const spread = clamp(4 - Math.floor(L / 2), 1, 3); // tighter distractors when harder
      return {
        prompt: `How many ${targetName} can you see?`,
        visual: svg(320, 210, body, 'A scatter of shapes to count'),
        hint: null, type: 'choice',
        choices: numericChoices(count, 4, spread).map(String),
        answer: String(count), explain: `There are ${count} ${targetName}.`
      };
    }
  };

  const geoOdd = {
    id: 'geo-odd', category: 'geometric', name: 'Odd Tile Out',
    makeRound(level) {
      const L = lvl(level);
      const n = L <= 2 ? 3 : L <= 4 ? 4 : 5;             // bigger grid = harder
      const W = 300, cell = W / n, size = cell * 0.26;
      const oddIndex = randInt(0, n * n - 1);
      const mode = pick(['colour', 'rotation', 'shape']);
      const baseFill = pick(FILLS);
      const oddFill = mode === 'colour' ? pick(FILLS.filter(f => f !== baseFill)) : baseFill;
      const baseType = mode === 'shape' ? 'square' : 'triangle';
      const oddType = mode === 'shape' ? 'circle' : baseType;
      const oddRot = L <= 2 ? 180 : L <= 4 ? 90 : 45;    // subtler tilt when harder
      let body = '';
      for (let i = 0; i < n * n; i++) {
        const r = Math.floor(i / n), c = i % n;
        const cx = c * cell + cell / 2, cy = r * cell + cell / 2;
        const isOdd = i === oddIndex;
        body += `<rect x="${c * cell + 3}" y="${r * cell + 3}" width="${cell - 6}" height="${cell - 6}" fill="none" stroke="var(--ink)" stroke-opacity="0.18" rx="8"/>`;
        body += drawShape(isOdd ? oddType : baseType, cx, cy + 4, size, isOdd ? oddFill : baseFill, (mode === 'rotation' && isOdd) ? oddRot : 0);
        body += `<text x="${c * cell + 9}" y="${r * cell + 20}" font-size="14" fill="var(--ink)" font-weight="700">${i + 1}</text>`;
      }
      const choices = [];
      for (let i = 1; i <= n * n; i++) choices.push(String(i));
      return {
        prompt: 'One tile is different. Which number is the odd one out?',
        visual: svg(W, W, body, `A ${n} by ${n} grid of tiles`),
        hint: null, type: 'choice',
        choices, answer: String(oddIndex + 1),
        explain: `Tile ${oddIndex + 1} differs by ${mode}.`
      };
    }
  };

  const geoBiggest = {
    id: 'geo-size', category: 'geometric', name: 'Size Sorter',
    makeRound(level) {
      const L = lvl(level);
      const count = clamp(3 + Math.floor(L / 2), 3, 6);  // more shapes = harder
      const gap = clamp(9 - L, 2, 8);                    // closer sizes = harder
      const labels = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, count);
      const type = pick(['circle', 'square']);
      const sizes = shuffle(Array.from({ length: count }, (_, i) => 16 + i * gap));
      const wantLargest = Math.random() < 0.5;
      let maxI = 0, minI = 0, body = '';
      const stepX = (320 - 50) / (count - 1);
      sizes.forEach((s, i) => {
        if (s > sizes[maxI]) maxI = i;
        if (s < sizes[minI]) minI = i;
        const cx = 25 + i * stepX;
        body += drawShape(type, cx, 70, s, FILLS[i % FILLS.length], 0);
        body += `<text x="${cx}" y="140" font-size="17" text-anchor="middle" fill="var(--ink)" font-weight="700">${labels[i]}</text>`;
      });
      const answerI = wantLargest ? maxI : minI;
      return {
        prompt: `Which shape is the ${wantLargest ? 'largest' : 'smallest'}?`,
        visual: svg(320, 160, body, `${count} shapes of different sizes`),
        hint: null, type: 'choice',
        choices: labels.slice(),
        answer: labels[answerI],
        explain: `${labels[answerI]} is the ${wantLargest ? 'largest' : 'smallest'}.`
      };
    }
  };

  const geoSequence = {
    id: 'geo-seq', category: 'geometric', name: 'Pattern Next',
    makeRound(level) {
      const L = lvl(level);
      const variant = pick(['dots', 'sides', 'rotate']);
      if (variant === 'dots') {
        const start = randInt(1, 2 + L), step = randInt(1, clamp(1 + Math.floor(L / 2), 1, 4));
        let body = '', x = 8;
        for (let k = 0; k < 3; k++) {
          const num = start + k * step;
          for (let d = 0; d < num; d++) body += `<circle cx="${x + 24}" cy="${20 + d * 15}" r="6" fill="var(--blue)"/>`;
          x += 70;
        }
        body += `<text x="${x + 16}" y="80" font-size="40" text-anchor="middle" fill="var(--sun)" font-weight="800">?</text>`;
        const ans = start + 3 * step;
        return {
          prompt: 'How many dots come next in the pattern?',
          visual: svg(320, 160, body, 'Groups of dots increasing in number'),
          hint: null, type: 'choice',
          choices: numericChoices(ans, 4, clamp(3 - Math.floor(L / 3), 1, 3)).map(String),
          answer: String(ans), explain: `The groups grow by ${step}, so next is ${ans}.`
        };
      }
      if (variant === 'sides') {
        const step = L >= 4 ? randInt(1, 2) : 1;
        const start = randInt(3, clamp(3 + Math.floor(L / 3), 3, 5));
        let body = '';
        for (let k = 0; k < 3; k++) {
          const sides = start + k * step;
          body += `<polygon points="${polyPoints(45 + k * 80, 65, 30, sides, 0)}" fill="${FILLS[k % FILLS.length]}"/>`;
        }
        body += `<text x="${45 + 3 * 80}" y="78" font-size="40" text-anchor="middle" fill="var(--sun)" font-weight="800">?</text>`;
        const ans = start + 3 * step;
        return {
          prompt: `How many sides will the next shape have?`,
          visual: svg(320, 130, body, 'Polygons gaining sides each step'),
          hint: null, type: 'choice',
          choices: numericChoices(ans, 4, 2).map(String),
          answer: String(ans), explain: `Each shape gains ${step} side${step > 1 ? 's' : ''}, so next has ${ans}.`
        };
      }
      // rotate: a triangle turning 90° each step; direction flips at higher levels
      const cw = L < 4 ? true : Math.random() < 0.5;
      const start = pick([0, 90, 180, 270]);
      let body = '';
      for (let k = 0; k < 3; k++) {
        body += drawShape('triangle', 45 + k * 80, 60, 26, 'var(--blue)', start + (cw ? 1 : -1) * k * 90);
      }
      body += `<text x="${45 + 3 * 80}" y="74" font-size="40" text-anchor="middle" fill="var(--sun)" font-weight="800">?</text>`;
      const nextRot = ((start + (cw ? 1 : -1) * 3 * 90) % 360 + 360) % 360;
      const arrowFor = { 0: '▲', 90: '▶', 180: '▼', 270: '◀' };
      return {
        prompt: `Which way will the arrow point next?`,
        visual: svg(320, 120, body, 'A triangle rotating a quarter turn each step'),
        hint: L < 4 ? null : `It is turning ${cw ? 'clockwise' : 'anticlockwise'}.`,
        type: 'choice',
        choices: shuffle(['▲', '▶', '▼', '◀']),
        answer: arrowFor[nextRot],
        explain: `It turns 90° ${cw ? 'clockwise' : 'anticlockwise'} each step, so next is ${arrowFor[nextRot]}.`
      };
    }
  };

  const geoSymmetry = {
    id: 'geo-sym', category: 'geometric', name: 'Mirror Check',
    makeRound(level) {
      const L = lvl(level);
      const n = L <= 2 ? 4 : L <= 4 ? 5 : 6;             // bigger grid = harder
      const cell = Math.floor(240 / n);
      const half = Math.floor(n / 2);
      const grid = [];
      for (let r = 0; r < n; r++) {
        grid[r] = [];
        for (let c = 0; c < half; c++) { grid[r][c] = Math.random() < 0.5; grid[r][n - 1 - c] = grid[r][c]; }
        if (n % 2) grid[r][half] = Math.random() < 0.5; // free centre column stays symmetric
      }
      const symmetric = Math.random() < 0.5;
      if (!symmetric) { const r = randInt(0, n - 1), c = randInt(0, n - 1); grid[r][c] = !grid[r][c]; }
      let body = `<line x1="${n * cell / 2}" y1="0" x2="${n * cell / 2}" y2="${n * cell}" stroke="var(--sun)" stroke-width="2" stroke-dasharray="6 5"/>`;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        body += `<rect x="${c * cell + 2}" y="${r * cell + 2}" width="${cell - 4}" height="${cell - 4}" rx="5" fill="${grid[r][c] ? 'var(--blue)' : 'none'}" stroke="var(--ink)" stroke-opacity="0.18"/>`;
      }
      return {
        prompt: 'Is this pattern symmetrical about the dashed line?',
        visual: svg(n * cell, n * cell, body, 'A grid pattern with a vertical mirror line'),
        hint: null, type: 'choice',
        choices: ['Yes', 'No'],
        answer: symmetric ? 'Yes' : 'No',
        explain: symmetric ? 'The two halves mirror perfectly.' : 'One cell breaks the mirror.'
      };
    }
  };

  /* ======================================================================
     MATHEMATICAL
     ====================================================================== */

  const mathArith = {
    id: 'math-arith', category: 'mathematical', name: 'Arithmetic Sprint',
    makeRound(level) {
      const L = lvl(level);
      const op = pick(['+', '−', '×', '÷']);
      let a, b, ans;
      if (op === '+') { const hi = 10 + L * 12; a = randInt(5, hi); b = randInt(5, hi); ans = a + b; }
      else if (op === '−') { a = randInt(10, 15 + L * 12); b = randInt(1, a); ans = a - b; }
      else if (op === '×') { const hi = clamp(6 + L * 2, 9, 30); a = randInt(3, hi); b = randInt(3, hi); ans = a * b; }
      else { const hi = clamp(4 + L, 6, 15); b = randInt(2, hi); ans = randInt(2, hi); a = b * ans; }
      return {
        prompt: `What is ${a} ${op} ${b}?`,
        visual: null, hint: null, type: 'text',
        choices: null, answer: String(ans), accept: [String(ans)],
        explain: `${a} ${op} ${b} = ${ans}.`
      };
    }
  };

  const mathSeq = {
    id: 'math-seq', category: 'mathematical', name: 'Number Sequence',
    makeRound(level) {
      const L = lvl(level);
      const kinds = L <= 2 ? ['arith'] : L <= 4 ? ['arith', 'geo', 'square'] : ['geo', 'square', 'fib', 'arith'];
      const kind = pick(kinds);
      let terms = [], ans;
      if (kind === 'arith') {
        const start = randInt(1, 5 + L), d = randInt(2, 4 + L * 2);
        for (let i = 0; i < 4; i++) terms.push(start + i * d);
        ans = start + 4 * d;
      } else if (kind === 'geo') {
        const start = randInt(1, 4), r = randInt(2, L >= 5 ? 4 : 3);
        for (let i = 0; i < 4; i++) terms.push(start * Math.pow(r, i));
        ans = start * Math.pow(r, 4);
      } else if (kind === 'square') {
        const start = randInt(1, 3 + L);
        for (let i = 0; i < 4; i++) terms.push(Math.pow(start + i, 2));
        ans = Math.pow(start + 4, 2);
      } else {
        let x = randInt(1, 4), y = randInt(x, x + 3);
        terms = [x, y];
        for (let i = 0; i < 2; i++) { const z = x + y; terms.push(z); x = y; y = z; }
        ans = x + y;
      }
      return {
        prompt: `What number comes next?  ${terms.join(',  ')},  …`,
        visual: null, hint: null, type: 'text',
        choices: null, answer: String(ans), accept: [String(ans)],
        explain: `The next term is ${ans}.`
      };
    }
  };

  const mathOperator = {
    id: 'math-op', category: 'mathematical', name: 'Missing Operator',
    makeRound(level) {
      const L = lvl(level);
      const op = pick(['+', '−', '×', '÷']);
      let a, b, c;
      if (op === '+') { const hi = 10 + L * 8; a = randInt(5, hi); b = randInt(5, hi); c = a + b; }
      else if (op === '−') { a = randInt(15, 20 + L * 8); b = randInt(1, a); c = a - b; }
      else if (op === '×') { const hi = clamp(4 + L, 5, 15); a = randInt(2, hi); b = randInt(2, hi); c = a * b; }
      else { const hi = clamp(3 + L, 4, 12); b = randInt(2, hi); c = randInt(2, hi); a = b * c; }
      return {
        prompt: `Which operator makes this true?   ${a}  ?  ${b}  =  ${c}`,
        visual: null, hint: null, type: 'choice',
        choices: ['+', '−', '×', '÷'],
        answer: op, explain: `${a} ${op} ${b} = ${c}.`
      };
    }
  };

  const mathCompare = {
    id: 'math-cmp', category: 'mathematical', name: 'Which Is Bigger?',
    makeRound(level) {
      const L = lvl(level);
      const hiMul = clamp(8 + L, 9, 20), hiAdd = 20 + L * 10;
      function expr() {
        const op = pick(['+', '×']);
        const a = op === '×' ? randInt(3, hiMul) : randInt(15, hiAdd);
        const b = op === '×' ? randInt(3, hiMul) : randInt(15, hiAdd);
        return { text: `${a} ${op} ${b}`, val: op === '×' ? a * b : a + b };
      }
      const maxDiff = clamp(40 - L * 4, 2, 40);          // closer values = harder
      let Lx = expr(), Rx = expr(), guard = 0;
      while ((Math.abs(Lx.val - Rx.val) > maxDiff || Lx.val === Rx.val) && guard++ < 60) Rx = expr();
      const answer = Lx.val === Rx.val ? 'Equal' : (Lx.val > Rx.val ? 'Left' : 'Right');
      return {
        prompt: `Which is greater?   Left: ${Lx.text}     Right: ${Rx.text}`,
        visual: null, hint: null, type: 'choice',
        choices: ['Left', 'Right', 'Equal'],
        answer, explain: `${Lx.text} = ${Lx.val}, ${Rx.text} = ${Rx.val}.`
      };
    }
  };

  const mathSolve = {
    id: 'math-solve', category: 'mathematical', name: 'Solve for X',
    makeRound(level) {
      const L = lvl(level);
      const x = randInt(2, 5 + L * 2), a = randInt(2, 3 + L), b = randInt(1, 5 + L * 4);
      const plus = Math.random() < 0.5;
      const c = plus ? a * x + b : a * x - b;
      return {
        prompt: `Solve for x:   ${a}x ${plus ? '+' : '−'} ${b} = ${c}`,
        visual: null, hint: 'Answer with a whole number.', type: 'text',
        choices: null, answer: String(x), accept: [String(x)],
        explain: `${a} × ${x} ${plus ? '+' : '−'} ${b} = ${c}, so x = ${x}.`
      };
    }
  };

  /* ======================================================================
     VERBAL
     ====================================================================== */

  const verbAnagram = {
    id: 'verb-anag', category: 'verbal', name: 'Anagram',
    makeRound(level) {
      const L = lvl(level);
      const [word, hint] = wordByLevel(L);
      let scrambled = word, guard = 0;
      do { scrambled = shuffle(word.split('')).join(''); guard++; }
      while (scrambled === word && guard < 20);
      return {
        prompt: `Unscramble these letters into a word:  ${scrambled.toUpperCase()}`,
        visual: null, hint: L <= 3 ? `Hint: ${hint}` : null, type: 'text',
        choices: null, answer: word, accept: [normalise(word)],
        explain: `The word is “${word}”.`
      };
    }
  };

  function synStyle(list, label, L) {
    const [word, match] = pick(list);
    const nChoices = clamp(3 + Math.floor(L / 2), 3, 6);
    const distractors = sample(list.filter(p => p[1] !== match).map(p => p[1]), nChoices - 1);
    return {
      prompt: `Pick the ${label} of:  ${word.toUpperCase()}`,
      visual: null, hint: null, type: 'choice',
      choices: shuffle([match, ...distractors]),
      answer: match, explain: `“${match}” is the ${label} of “${word}”.`
    };
  }

  const verbSynonym = {
    id: 'verb-syn', category: 'verbal', name: 'Synonyms',
    makeRound(level) { return synStyle(DATA.SYNONYMS, 'synonym', lvl(level)); }
  };

  const verbAntonym = {
    id: 'verb-ant', category: 'verbal', name: 'Antonyms',
    makeRound(level) { return synStyle(DATA.ANTONYMS, 'opposite', lvl(level)); }
  };

  const verbOddWord = {
    id: 'verb-odd', category: 'verbal', name: 'Odd Word Out',
    makeRound(level) {
      const L = lvl(level);
      const cats = Object.keys(DATA.CATEGORIES);
      const catA = pick(cats);
      const catB = pick(cats.filter(c => c !== catA));
      const memberCount = clamp(3 + Math.floor((L - 1) / 2), 3, 5);
      const members = sample(DATA.CATEGORIES[catA], memberCount);
      const intruder = pick(DATA.CATEGORIES[catB]);
      return {
        prompt: 'Which word does NOT belong with the others?',
        visual: null, hint: null, type: 'choice',
        choices: shuffle([...members, intruder]),
        answer: intruder,
        explain: `“${intruder}” is the odd one — the rest are ${catA.toLowerCase()}.`
      };
    }
  };

  const verbComplete = {
    id: 'verb-fill', category: 'verbal', name: 'Word Completion',
    makeRound(level) {
      const L = lvl(level);
      const [word, hint] = wordByLevel(L);
      const chars = word.split('');
      const frac = clamp(0.35 + L * 0.06, 0.35, 0.8);    // hide more letters when harder
      const hideCount = clamp(Math.round(chars.length * frac), 1, chars.length - 1);
      const idxs = shuffle(chars.map((_, i) => i).filter(i => i > 0)).slice(0, hideCount);
      const shown = chars.map((ch, i) => idxs.includes(i) ? '_' : ch).join(' ');
      return {
        prompt: `Complete the word:  ${shown.toUpperCase()}`,
        visual: null, hint: L <= 3 ? `Hint: ${hint}` : null, type: 'text',
        choices: null, answer: word, accept: [normalise(word)],
        explain: `The word is “${word}”.`
      };
    }
  };

  /* ======================================================================
     LOGICAL
     ====================================================================== */

  const logLetterSeq = {
    id: 'log-letseq', category: 'logical', name: 'Letter Sequence',
    makeRound(level) {
      const L = lvl(level);
      const terms = [];
      let ansCode;
      if (L <= 3) {
        const step = randInt(1, clamp(1 + L, 2, 4));
        const start = randInt(0, 25 - step * 4);
        for (let i = 0; i < 4; i++) terms.push(String.fromCharCode(65 + start + i * step));
        ansCode = 65 + start + 4 * step;
      } else {
        // alternating two-step pattern, e.g. +2, +3, +2, +3 …
        const s1 = randInt(1, 3), s2 = randInt(1, 4);
        const span = s1 * 2 + s2 * 2;
        const start = randInt(0, clamp(25 - span, 0, 25));
        let code = 65 + start;
        for (let i = 0; i < 4; i++) { terms.push(String.fromCharCode(code)); code += (i % 2 === 0 ? s1 : s2); }
        ansCode = code;
      }
      const answer = String.fromCharCode(clamp(ansCode, 65, 90));
      const opts = new Set([answer]);
      let guard = 0;
      while (opts.size < 4 && guard++ < 60) {
        const code = ansCode + randInt(-3, 3);
        if (code >= 65 && code <= 90) opts.add(String.fromCharCode(code));
      }
      return {
        prompt: `Which letter comes next?   ${terms.join('  ')}  …`,
        visual: null, hint: null, type: 'choice',
        choices: shuffle(Array.from(opts)),
        answer, explain: `Following the pattern, the next letter is ${answer}.`
      };
    }
  };

  const logSyllogism = {
    id: 'log-syl', category: 'logical', name: 'Logic Deduction',
    makeRound(level) {
      const L = lvl(level);
      if (L >= 4 && Math.random() < 0.6) {
        // three-premise chain
        const [A, B, C, D] = sample(DATA.NONSENSE, 4);
        const valid = Math.random() < 0.5;
        if (valid) {
          return {
            prompt: `All ${A} are ${B}. All ${B} are ${C}. All ${C} are ${D}. Are all ${A} definitely ${D}?`,
            visual: null, hint: null, type: 'choice',
            choices: ['Yes', 'No', 'Cannot tell'], answer: 'Yes', explain: 'The chain links A→B→C→D, so yes.'
          };
        }
        return {
          prompt: `All ${A} are ${B}. All ${B} are ${C}. Some ${C} are ${D}. Are all ${A} definitely ${D}?`,
          visual: null, hint: null, type: 'choice',
          choices: ['Yes', 'No', 'Cannot tell'], answer: 'Cannot tell',
          explain: 'Only “some” C are D, so we cannot be sure.'
        };
      }
      const [A, B, C] = sample(DATA.NONSENSE, 3);
      const t = pick(['valid', 'invalid', 'negative']);
      let prompt, answer;
      if (t === 'valid') { prompt = `All ${A} are ${B}. All ${B} are ${C}. Are all ${A} definitely ${C}?`; answer = 'Yes'; }
      else if (t === 'negative') { prompt = `No ${A} are ${B}. Every ${C} is an ${A}. Can a ${C} be a ${B}?`; answer = 'No'; }
      else { prompt = `All ${A} are ${B}. Some ${B} are ${C}. Are all ${A} definitely ${C}?`; answer = 'Cannot tell'; }
      return {
        prompt, visual: null, hint: null, type: 'choice',
        choices: ['Yes', 'No', 'Cannot tell'], answer, explain: `Answer: ${answer}.`
      };
    }
  };

  const logAnalogy = {
    id: 'log-anal', category: 'logical', name: 'Analogies',
    makeRound(level) {
      const L = lvl(level);
      const it = pick(DATA.ANALOGIES);
      const nChoices = clamp(4 + Math.floor((L - 1) / 2), 4, 6);
      // start with this item's distractors, then pad from other answers if needed
      const distractors = new Set(it.distractors);
      const others = shuffle(DATA.ANALOGIES.map(a => a.answer).filter(w => w !== it.answer && !distractors.has(w)));
      for (let i = 0; distractors.size < nChoices - 1 && i < others.length; i++) distractors.add(others[i]);
      const choices = shuffle([it.answer, ...sample(Array.from(distractors), nChoices - 1)]);
      return {
        prompt: `${it.a.toUpperCase()} is to ${it.b.toUpperCase()} as ${it.c.toUpperCase()} is to …?`,
        visual: null, hint: null, type: 'choice',
        choices, answer: it.answer,
        explain: `${it.a}→${it.b}, so ${it.c}→${it.answer}.`
      };
    }
  };

  const logOddNumber = {
    id: 'log-oddnum', category: 'logical', name: 'Odd Number Out',
    makeRound(level) {
      const L = lvl(level);
      const rule = L <= 2 ? pick(['even', 'odd', 'multiple'])
        : L <= 4 ? pick(['multiple', 'square', 'prime'])
          : pick(['square', 'prime', 'multiple']);
      const hi = clamp(20 + L * 12, 30, 140);
      const isPrime = m => { if (m < 2) return false; for (let i = 2; i * i <= m; i++) if (m % i === 0) return false; return true; };
      const k = randInt(3, 7);
      const fitsRule = m => rule === 'even' ? m % 2 === 0
        : rule === 'odd' ? m % 2 === 1
          : rule === 'multiple' ? m % k === 0
            : rule === 'square' ? Number.isInteger(Math.sqrt(m))
              : isPrime(m);
      const fitCount = clamp(3 + Math.floor((L - 1) / 2), 3, 5);
      let fits = [], guard = 0;
      while (fits.length < fitCount && guard++ < 800) {
        const m = randInt(2, hi);
        if (fitsRule(m) && !fits.includes(m)) fits.push(m);
      }
      let intruder, g2 = 0;
      do { intruder = randInt(2, hi); g2++; } while ((fitsRule(intruder) || fits.includes(intruder)) && g2 < 800);
      const labelRule = { even: 'even numbers', odd: 'odd numbers', multiple: `multiples of ${k}`, square: 'square numbers', prime: 'prime numbers' }[rule];
      return {
        prompt: 'Which number does NOT belong with the others?',
        visual: null, hint: null, type: 'choice',
        choices: shuffle([...fits, intruder].map(String)),
        answer: String(intruder),
        explain: `The others are all ${labelRule}.`
      };
    }
  };

  const logBalance = {
    id: 'log-bal', category: 'logical', name: 'Weighing Up',
    makeRound(level) {
      const L = lvl(level);
      const count = clamp(3 + Math.floor((L - 1) / 2), 3, 5);
      const pool = ['🦊 Fox', '🐼 Panda', '🐧 Penguin', '🦁 Lion', '🐢 Tortoise', '🦔 Hedgehog', '🦦 Otter'];
      const animals = sample(pool, count);
      const order = shuffle(animals.slice());          // order[0] heaviest … last lightest
      const clues = [];
      for (let i = 0; i < order.length - 1; i++) clues.push(`${order[i]} is heavier than ${order[i + 1]}.`);
      const wantHeaviest = Math.random() < 0.5;
      return {
        prompt: `${shuffle(clues).join(' ')}  Who is the ${wantHeaviest ? 'heaviest' : 'lightest'}?`,
        visual: null, hint: null, type: 'choice',
        choices: shuffle(animals.slice()),
        answer: wantHeaviest ? order[0] : order[order.length - 1],
        explain: `${wantHeaviest ? order[0] : order[order.length - 1]} is the ${wantHeaviest ? 'heaviest' : 'lightest'}.`
      };
    }
  };

  /* --- Registry ---------------------------------------------------------- */
  const ALL = [
    geoCount, geoOdd, geoBiggest, geoSequence, geoSymmetry,
    mathArith, mathSeq, mathOperator, mathCompare, mathSolve,
    verbAnagram, verbSynonym, verbAntonym, verbOddWord, verbComplete,
    logLetterSeq, logSyllogism, logAnalogy, logOddNumber, logBalance
  ];

  const CATEGORIES = {
    geometric: { label: 'Geometric', icon: '🔷' },
    mathematical: { label: 'Mathematical', icon: '➗' },
    verbal: { label: 'Verbal', icon: '🔤' },
    logical: { label: 'Logical', icon: '🧩' }
  };

  function byCategory(cat) { return ALL.filter(g => g.category === cat); }
  function getById(id) { return ALL.find(g => g.id === id); }
  function randomInCategory(cat) { return pick(byCategory(cat)); }

  global.GAMES = {
    ALL, CATEGORIES, byCategory, getById, randomInCategory,
    ROUNDS_PER_GAME: 5,
    START_LEVEL: 2     // begins a notch above trivial; climbs with each correct answer
  };
})(window);
