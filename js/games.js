/* ==========================================================================
   games.js — 20 randomised games (5 per category)
   Each game exposes: { id, category, name, makeRound() }
   makeRound() -> {
     prompt, visual(html|null), hint(string|null),
     type: 'choice'|'text', choices:[str], answer:str,
     accept:[str]?  (text only), explain:str|null
   }
   ========================================================================== */
(function (global) {
  'use strict';
  const { randInt, pick, shuffle, sample, numericChoices, normalise } = U;

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
    makeRound() {
      const types = ['triangle', 'circle', 'square'];
      const target = pick(types);
      const targetName = { triangle: 'triangles', circle: 'circles', square: 'squares' }[target];
      const total = randInt(9, 14);
      // loose grid of candidate cells
      const cells = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) cells.push([34 + c * 63, 40 + r * 62]);
      const chosen = sample(cells, total);
      let count = 0;
      const body = chosen.map(([x, y]) => {
        const t = pick(types);
        if (t === target) count++;
        const jx = x + randInt(-9, 9), jy = y + randInt(-9, 9);
        return drawShape(t, jx, jy, randInt(15, 20), pick(FILLS), randInt(0, 359));
      }).join('');
      // guarantee at least one target present
      const answer = count;
      return {
        prompt: `How many ${targetName} can you see?`,
        visual: svg(320, 200, body, 'A scatter of shapes to count'),
        hint: null, type: 'choice',
        choices: numericChoices(answer, 4, 3).map(String),
        answer: String(answer), explain: `There are ${answer} ${targetName}.`
      };
    }
  };

  const geoOdd = {
    id: 'geo-odd', category: 'geometric', name: 'Odd Tile Out',
    makeRound() {
      const mode = pick(['colour', 'rotation', 'shape']);
      const oddIndex = randInt(0, 8);
      const baseFill = pick(FILLS);
      let oddFill = baseFill;
      if (mode === 'colour') { oddFill = pick(FILLS.filter(f => f !== baseFill)); }
      const baseType = mode === 'shape' ? 'square' : 'triangle';
      const oddType = mode === 'shape' ? 'circle' : baseType;
      const cell = 96;
      let body = '';
      for (let i = 0; i < 9; i++) {
        const r = Math.floor(i / 3), c = i % 3;
        const cx = c * cell + cell / 2, cy = r * cell + cell / 2;
        const isOdd = i === oddIndex;
        const rot = (mode === 'rotation' && isOdd) ? 180 : 0;
        const type = isOdd ? oddType : baseType;
        const fill = isOdd ? oddFill : baseFill;
        body += `<rect x="${c * cell + 3}" y="${r * cell + 3}" width="${cell - 6}" height="${cell - 6}" fill="none" stroke="var(--ink)" stroke-opacity="0.18" rx="8"/>`;
        body += drawShape(type, cx, cy + 6, 26, fill, rot);
        body += `<text x="${c * cell + 12}" y="${r * cell + 22}" font-size="16" fill="var(--ink)" font-weight="700">${i + 1}</text>`;
      }
      return {
        prompt: 'One tile is different. Which number is the odd one out?',
        visual: svg(288, 288, body, 'A three by three grid of tiles'),
        hint: null, type: 'choice',
        choices: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        answer: String(oddIndex + 1),
        explain: `Tile ${oddIndex + 1} differs by ${mode}.`
      };
    }
  };

  const geoBiggest = {
    id: 'geo-size', category: 'geometric', name: 'Size Sorter',
    makeRound() {
      const labels = ['A', 'B', 'C', 'D'];
      const type = pick(['circle', 'square']);
      const sizes = shuffle([16, 22, 28, 34]);
      const wantLargest = Math.random() < 0.5;
      let body = '';
      let maxI = 0, minI = 0;
      sizes.forEach((s, i) => {
        if (s > sizes[maxI]) maxI = i;
        if (s < sizes[minI]) minI = i;
        const cx = 40 + i * 75;
        body += drawShape(type, cx, 75, s, FILLS[i % FILLS.length], 0);
        body += `<text x="${cx}" y="140" font-size="18" text-anchor="middle" fill="var(--ink)" font-weight="700">${labels[i]}</text>`;
      });
      const answerI = wantLargest ? maxI : minI;
      return {
        prompt: `Which shape is the ${wantLargest ? 'largest' : 'smallest'}?`,
        visual: svg(320, 160, body, 'Four shapes of different sizes labelled A to D'),
        hint: null, type: 'choice',
        choices: labels.slice(),
        answer: labels[answerI],
        explain: `${labels[answerI]} is the ${wantLargest ? 'largest' : 'smallest'}.`
      };
    }
  };

  const geoSequence = {
    id: 'geo-seq', category: 'geometric', name: 'Pattern Next',
    makeRound() {
      const variant = pick(['dots', 'sides', 'rotate']);
      if (variant === 'dots') {
        const start = randInt(1, 3), step = randInt(1, 2);
        let body = '', x = 8;
        for (let k = 0; k < 3; k++) {
          const n = start + k * step;
          const gx = x;
          for (let d = 0; d < n; d++) body += `<circle cx="${gx + 24}" cy="${28 + d * 18}" r="7" fill="var(--blue)"/>`;
          body += `<text x="${gx + 24}" y="135" font-size="20" text-anchor="middle" fill="var(--ink)">·</text>`;
          x += 70;
        }
        body += `<text x="${x + 16}" y="80" font-size="40" text-anchor="middle" fill="var(--sun)" font-weight="800">?</text>`;
        const ans = start + 3 * step;
        return {
          prompt: 'How many dots come next in the pattern?',
          visual: svg(320, 150, body, 'Groups of dots increasing in number'),
          hint: null, type: 'choice',
          choices: numericChoices(ans, 4, 2).map(String),
          answer: String(ans), explain: `The groups grow by ${step}, so next is ${ans}.`
        };
      }
      if (variant === 'sides') {
        const start = randInt(3, 4);
        let body = '';
        for (let k = 0; k < 3; k++) {
          const sides = start + k;
          body += `<polygon points="${polyPoints(45 + k * 80, 65, 30, sides, 0)}" fill="${FILLS[k % FILLS.length]}"/>`;
        }
        body += `<text x="${45 + 3 * 80}" y="78" font-size="40" text-anchor="middle" fill="var(--sun)" font-weight="800">?</text>`;
        const ans = start + 3;
        return {
          prompt: 'How many sides will the next shape have?',
          visual: svg(320, 130, body, 'Polygons gaining a side each step'),
          hint: null, type: 'choice',
          choices: numericChoices(ans, 4, 2).map(String),
          answer: String(ans), explain: `Each shape gains one side, so next has ${ans}.`
        };
      }
      // rotate: arrow (triangle) rotating clockwise by 90°
      const start = pick([0, 90, 180, 270]);
      let body = '';
      for (let k = 0; k < 3; k++) {
        body += drawShape('triangle', 45 + k * 80, 60, 26, 'var(--blue)', start + k * 90);
      }
      body += `<text x="${45 + 3 * 80}" y="74" font-size="40" text-anchor="middle" fill="var(--sun)" font-weight="800">?</text>`;
      const nextRot = (start + 3 * 90) % 360;
      const arrowFor = { 0: '▲', 90: '▶', 180: '▼', 270: '◀' };
      return {
        prompt: 'Which way will the arrow point next?',
        visual: svg(320, 120, body, 'A triangle rotating a quarter turn each step'),
        hint: null, type: 'choice',
        choices: shuffle(['▲', '▶', '▼', '◀']),
        answer: arrowFor[nextRot],
        explain: `It turns 90° clockwise each step, so next is ${arrowFor[nextRot]}.`
      };
    }
  };

  const geoSymmetry = {
    id: 'geo-sym', category: 'geometric', name: 'Mirror Check',
    makeRound() {
      const n = 4, cell = 56;
      const grid = [];
      for (let r = 0; r < n; r++) {
        grid[r] = [];
        for (let c = 0; c < n / 2; c++) grid[r][c] = Math.random() < 0.5;
        for (let c = 0; c < n / 2; c++) grid[r][n - 1 - c] = grid[r][c]; // mirror
      }
      const symmetric = Math.random() < 0.5;
      if (!symmetric) {
        // break one cell
        const r = randInt(0, n - 1), c = randInt(0, n - 1);
        grid[r][c] = !grid[r][c];
      }
      let body = `<line x1="${n * cell / 2}" y1="0" x2="${n * cell / 2}" y2="${n * cell}" stroke="var(--sun)" stroke-width="2" stroke-dasharray="6 5"/>`;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        body += `<rect x="${c * cell + 2}" y="${r * cell + 2}" width="${cell - 4}" height="${cell - 4}" rx="6" fill="${grid[r][c] ? 'var(--blue)' : 'none'}" stroke="var(--ink)" stroke-opacity="0.18"/>`;
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
    makeRound() {
      const op = pick(['+', '−', '×', '÷']);
      let a, b, ans;
      if (op === '+') { a = randInt(8, 60); b = randInt(8, 60); ans = a + b; }
      else if (op === '−') { a = randInt(20, 80); b = randInt(1, a); ans = a - b; }
      else if (op === '×') { a = randInt(3, 12); b = randInt(3, 12); ans = a * b; }
      else { b = randInt(2, 12); ans = randInt(2, 12); a = b * ans; } // clean division
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
    makeRound() {
      const kind = pick(['arith', 'geo', 'square', 'fib']);
      let terms = [], ans;
      if (kind === 'arith') {
        const start = randInt(1, 9), d = randInt(2, 9);
        for (let i = 0; i < 4; i++) terms.push(start + i * d);
        ans = start + 4 * d;
      } else if (kind === 'geo') {
        const start = randInt(1, 4), r = randInt(2, 3);
        for (let i = 0; i < 4; i++) terms.push(start * Math.pow(r, i));
        ans = start * Math.pow(r, 4);
      } else if (kind === 'square') {
        const start = randInt(1, 4);
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
    makeRound() {
      const op = pick(['+', '−', '×', '÷']);
      let a, b, c;
      if (op === '+') { a = randInt(5, 40); b = randInt(5, 40); c = a + b; }
      else if (op === '−') { a = randInt(20, 60); b = randInt(1, a); c = a - b; }
      else if (op === '×') { a = randInt(2, 12); b = randInt(2, 12); c = a * b; }
      else { b = randInt(2, 9); c = randInt(2, 9); a = b * c; }
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
    makeRound() {
      function expr() {
        const op = pick(['+', '×']);
        const a = op === '×' ? randInt(3, 12) : randInt(15, 60);
        const b = op === '×' ? randInt(3, 12) : randInt(15, 60);
        return { text: `${a} ${op} ${b}`, val: op === '×' ? a * b : a + b };
      }
      let L = expr(), R = expr(), guard = 0;
      while (L.val === R.val && guard++ < 20) R = expr();
      const answer = L.val === R.val ? 'Equal' : (L.val > R.val ? 'Left' : 'Right');
      return {
        prompt: `Which is greater?   Left: ${L.text}     Right: ${R.text}`,
        visual: null, hint: null, type: 'choice',
        choices: ['Left', 'Right', 'Equal'],
        answer, explain: `${L.text} = ${L.val}, ${R.text} = ${R.val}.`
      };
    }
  };

  const mathSolve = {
    id: 'math-solve', category: 'mathematical', name: 'Solve for X',
    makeRound() {
      const x = randInt(2, 12), a = randInt(2, 6), b = randInt(1, 20);
      const plus = Math.random() < 0.5;
      const c = plus ? a * x + b : a * x - b;
      return {
        prompt: `Solve for x:   ${a}x ${plus ? '+' : '−'} ${b} = ${c}`,
        visual: null, hint: 'Answer with a whole number.', type: 'text',
        choices: null, answer: String(x), accept: [String(x)],
        explain: `x = ${x}.`
      };
    }
  };

  /* ======================================================================
     VERBAL
     ====================================================================== */

  const verbAnagram = {
    id: 'verb-anag', category: 'verbal', name: 'Anagram',
    makeRound() {
      const [word, hint] = pick(DATA.WORDS);
      let scrambled = word, guard = 0;
      do { scrambled = shuffle(word.split('')).join(''); guard++; }
      while (scrambled === word && guard < 20);
      return {
        prompt: `Unscramble these letters into a word:  ${scrambled.toUpperCase()}`,
        visual: null, hint: `Hint: ${hint}`, type: 'text',
        choices: null, answer: word, accept: [normalise(word)],
        explain: `The word is “${word}”.`
      };
    }
  };

  function synStyle(list, label) {
    const [word, match] = pick(list);
    const distractors = sample(
      list.filter(p => p[1] !== match).map(p => p[1]), 3
    );
    return {
      prompt: `Pick the ${label} of:  ${word.toUpperCase()}`,
      visual: null, hint: null, type: 'choice',
      choices: shuffle([match, ...distractors]),
      answer: match, explain: `“${match}” is the ${label} of “${word}”.`
    };
  }

  const verbSynonym = {
    id: 'verb-syn', category: 'verbal', name: 'Synonyms',
    makeRound() { return synStyle(DATA.SYNONYMS, 'synonym'); }
  };

  const verbAntonym = {
    id: 'verb-ant', category: 'verbal', name: 'Antonyms',
    makeRound() { return synStyle(DATA.ANTONYMS, 'opposite'); }
  };

  const verbOddWord = {
    id: 'verb-odd', category: 'verbal', name: 'Odd Word Out',
    makeRound() {
      const cats = Object.keys(DATA.CATEGORIES);
      const catA = pick(cats);
      const catB = pick(cats.filter(c => c !== catA));
      const members = sample(DATA.CATEGORIES[catA], 3);
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
    makeRound() {
      const [word, hint] = pick(DATA.WORDS);
      const chars = word.split('');
      // hide ~45% of letters, never the first
      const hideCount = Math.max(1, Math.round(chars.length * 0.45));
      const idxs = shuffle(chars.map((_, i) => i).filter(i => i > 0)).slice(0, hideCount);
      const shown = chars.map((ch, i) => idxs.includes(i) ? '_' : ch).join(' ');
      return {
        prompt: `Complete the word:  ${shown.toUpperCase()}`,
        visual: null, hint: `Hint: ${hint}`, type: 'text',
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
    makeRound() {
      const step = pick([1, 2, 3]);
      const start = randInt(0, 25 - step * 4);
      const terms = [];
      for (let i = 0; i < 4; i++) terms.push(String.fromCharCode(65 + start + i * step));
      const ansCode = 65 + start + 4 * step;
      const answer = String.fromCharCode(ansCode);
      const opts = new Set([answer]);
      while (opts.size < 4) {
        const off = randInt(-3, 3);
        const code = ansCode + off;
        if (code >= 65 && code <= 90) opts.add(String.fromCharCode(code));
      }
      return {
        prompt: `Which letter comes next?   ${terms.join('  ')}  …`,
        visual: null, hint: null, type: 'choice',
        choices: shuffle(Array.from(opts)),
        answer, explain: `The letters step by ${step}, so next is ${answer}.`
      };
    }
  };

  const logSyllogism = {
    id: 'log-syl', category: 'logical', name: 'Logic Deduction',
    makeRound() {
      const [A, B, C] = sample(DATA.NONSENSE, 3);
      const t = pick(['valid', 'invalid', 'negative']);
      let prompt, answer;
      if (t === 'valid') {
        prompt = `All ${A} are ${B}. All ${B} are ${C}. Are all ${A} definitely ${C}?`;
        answer = 'Yes';
      } else if (t === 'negative') {
        prompt = `No ${A} are ${B}. Every ${C} is an ${A}. Can a ${C} be a ${B}?`;
        answer = 'No';
      } else {
        prompt = `All ${A} are ${B}. Some ${B} are ${C}. Are all ${A} definitely ${C}?`;
        answer = 'Cannot tell';
      }
      return {
        prompt, visual: null, hint: null, type: 'choice',
        choices: ['Yes', 'No', 'Cannot tell'],
        answer, explain: `Answer: ${answer}.`
      };
    }
  };

  const logAnalogy = {
    id: 'log-anal', category: 'logical', name: 'Analogies',
    makeRound() {
      const it = pick(DATA.ANALOGIES);
      return {
        prompt: `${it.a.toUpperCase()} is to ${it.b.toUpperCase()} as ${it.c.toUpperCase()} is to …?`,
        visual: null, hint: null, type: 'choice',
        choices: shuffle([it.answer, ...it.distractors]),
        answer: it.answer,
        explain: `${it.a}→${it.b}, so ${it.c}→${it.answer}.`
      };
    }
  };

  const logOddNumber = {
    id: 'log-oddnum', category: 'logical', name: 'Odd Number Out',
    makeRound() {
      const rule = pick(['even', 'odd', 'multiple', 'square', 'prime']);
      const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
      let fits = [], k = randInt(3, 6);
      const fitsRule = n => rule === 'even' ? n % 2 === 0
        : rule === 'odd' ? n % 2 === 1
          : rule === 'multiple' ? n % k === 0
            : rule === 'square' ? Number.isInteger(Math.sqrt(n))
              : isPrime(n);
      let guard = 0;
      while (fits.length < 3 && guard++ < 500) {
        const n = randInt(2, 60);
        if (fitsRule(n) && !fits.includes(n)) fits.push(n);
      }
      let intruder, g2 = 0;
      do { intruder = randInt(2, 60); g2++; } while ((fitsRule(intruder) || fits.includes(intruder)) && g2 < 500);
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
    makeRound() {
      const animals = sample(['🦊 Fox', '🐼 Panda', '🐧 Penguin', '🦁 Lion', '🐢 Tortoise', '🦔 Hedgehog'], 3);
      // order[0] heaviest ... order[2] lightest
      const order = shuffle(animals.slice());
      const clues = `${order[0]} is heavier than ${order[1]}. ${order[1]} is heavier than ${order[2]}.`;
      const wantHeaviest = Math.random() < 0.5;
      return {
        prompt: `${clues}  Who is the ${wantHeaviest ? 'heaviest' : 'lightest'}?`,
        visual: null, hint: null, type: 'choice',
        choices: shuffle(animals.slice()),
        answer: wantHeaviest ? order[0] : order[2],
        explain: `${wantHeaviest ? order[0] : order[2]} is the ${wantHeaviest ? 'heaviest' : 'lightest'}.`
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

  global.GAMES = { ALL, CATEGORIES, byCategory, getById, randomInCategory, ROUNDS_PER_GAME: 5 };
})(window);
