/* ==========================================================================
   app.js — UI controller, navigation, and the game runner
   ========================================================================== */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const nav = document.getElementById('topnav');
  const live = document.getElementById('sr-live');
  const { CATEGORIES, ROUNDS_PER_GAME, START_LEVEL } = GAMES;
  const CAT_ORDER = ['geometric', 'mathematical', 'verbal', 'logical'];

  function announce(msg) { live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 30); }
  function scoreWord(s) { return s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Keep going' : 'Warming up'; }

  /* ---------------------------------------------------------------- nav -- */
  function renderNav() {
    const m = Store.getMascot();
    if (!m) { nav.innerHTML = ''; nav.hidden = true; return; }
    nav.hidden = false;
    nav.innerHTML = `
      <span class="brand" aria-hidden="true">${m.emoji}</span>
      <span class="brand-name">Brain Trainer</span>
      <span class="nav-spacer"></span>
      <button class="nav-btn" data-go="dashboard">Dashboard</button>
      <button class="nav-btn" data-go="history">History</button>`;
    nav.querySelectorAll('[data-go]').forEach(b =>
      b.addEventListener('click', () => go(b.dataset.go)));
  }

  /* --------------------------------------------------------- onboarding -- */
  let suggestions = [];
  function renderOnboard() {
    suggestions = DATA.suggestMascots(6);
    app.innerHTML = `
      <section class="screen" aria-labelledby="ob-h">
        <h1 id="ob-h" class="hero-title">🧠 Brain Trainer</h1>
        <p class="lede">A daily geometric, mathematical, verbal &amp; logical workout.
          First, choose your mascot — an alliterative companion named after an
          obscure element or mineral.</p>
        <h2 class="section-title">Pick your mascot</h2>
        <div class="mascot-grid" id="mascot-grid"></div>
        <button class="btn btn-ghost" id="shuffle-mascots">↻ Shuffle suggestions</button>
      </section>`;
    paintMascots();
    document.getElementById('shuffle-mascots').addEventListener('click', () => {
      suggestions = DATA.suggestMascots(6);
      paintMascots();
      announce('New mascot suggestions loaded.');
    });
  }

  function paintMascots() {
    const grid = document.getElementById('mascot-grid');
    grid.innerHTML = suggestions.map((s, i) => `
      <button class="mascot-card" data-i="${i}">
        <span class="mascot-emoji" aria-hidden="true">${s.emoji}</span>
        <span class="mascot-name">${U.esc(s.name)}</span>
      </button>`).join('');
    grid.querySelectorAll('[data-i]').forEach(b =>
      b.addEventListener('click', () => {
        const m = suggestions[+b.dataset.i];
        Store.setMascot(m);
        renderNav();
        announce(`${m.name} is now your mascot.`);
        go('dashboard');
      }));
  }

  /* ---------------------------------------------------------- dashboard -- */
  function renderDashboard() {
    const m = Store.getMascot();
    const today = U.todayKey();
    const done = Store.isDailyDone(today);
    const todayRec = Store.getDaily(today);
    const series = Store.dailySeries();
    const streak = Store.streak();
    const best = series.reduce((mx, d) => Math.max(mx, d.overall), 0);

    let dailyCard;
    if (done) {
      dailyCard = `
        <div class="daily-done">
          <div class="ring" style="--p:${todayRec.overall}">
            <span class="ring-num">${todayRec.overall}</span><span class="ring-max">/100</span>
          </div>
          <div>
            <h3 class="card-h">Today’s workout complete ✓</h3>
            <p class="muted">${scoreWord(todayRec.overall)}! Come back tomorrow for a fresh set.</p>
            <ul class="cat-breakdown">
              ${CAT_ORDER.map(c => `<li><span aria-hidden="true">${CATEGORIES[c].icon}</span> ${CATEGORIES[c].label}<b>${todayRec.scores[c]}</b></li>`).join('')}
            </ul>
          </div>
        </div>`;
    } else {
      dailyCard = `
        <h3 class="card-h">Today’s workout</h3>
        <p class="muted">One game from each category, picked at random. Earn an overall daily score.</p>
        <ul class="cat-list">
          ${CAT_ORDER.map(c => `<li><span class="cat-ico" aria-hidden="true">${CATEGORIES[c].icon}</span>${CATEGORIES[c].label}</li>`).join('')}
        </ul>
        <button class="btn btn-primary btn-lg" id="start-workout">Start today’s workout</button>`;
    }

    app.innerHTML = `
      <section class="screen" aria-labelledby="dash-h">
        <header class="greet">
          <span class="greet-emoji" aria-hidden="true">${m.emoji}</span>
          <div>
            <h1 id="dash-h" class="greet-title">${U.esc(m.name)}</h1>
            <p class="muted">Your daily brain workout</p>
          </div>
        </header>

        <div class="stat-row">
          <div class="stat"><b>${streak}</b><span>day streak</span></div>
          <div class="stat"><b>${series.length}</b><span>days trained</span></div>
          <div class="stat"><b>${best}</b><span>best score</span></div>
        </div>

        <div class="card daily-card">${dailyCard}</div>

        <h2 class="section-title">Progress over time</h2>
        <div class="card chart-card">${Charts.dailyChart(series)}</div>

        <div class="action-row">
          <button class="btn btn-secondary" id="practice">🎯 Practice a category</button>
          <button class="btn btn-ghost" id="to-history">📜 Full history</button>
          <button class="btn btn-ghost" id="change-mascot">${m.emoji} Change mascot</button>
        </div>

        ${renderRecent()}
      </section>`;

    const sw = document.getElementById('start-workout');
    if (sw) sw.addEventListener('click', startWorkout);
    document.getElementById('practice').addEventListener('click', renderPracticePicker);
    document.getElementById('to-history').addEventListener('click', () => go('history'));
    document.getElementById('change-mascot').addEventListener('click', renderOnboard);
  }

  function renderRecent() {
    const recent = Store.getHistory().slice(0, 6);
    if (!recent.length) return '';
    return `
      <h2 class="section-title">Recent games</h2>
      <ul class="log-list">
        ${recent.map(logRow).join('')}
      </ul>`;
  }

  function logRow(h) {
    return `<li class="log-row">
      <span class="log-ico" aria-hidden="true">${CATEGORIES[h.category].icon}</span>
      <span class="log-main"><b>${U.esc(h.gameName)}</b><span class="muted">${CATEGORIES[h.category].label} · ${U.formatDate(h.date)}${h.topLevel ? ` · level ${h.topLevel}` : ''}</span></span>
      <span class="log-score" aria-label="score ${h.score} of 100">${h.score}</span>
    </li>`;
  }

  /* ------------------------------------------------------------ history -- */
  let historyFilter = 'all';
  function renderHistory() {
    const filters = ['all', ...CAT_ORDER];
    const rows = Store.getHistory(historyFilter);
    app.innerHTML = `
      <section class="screen" aria-labelledby="hist-h">
        <h1 id="hist-h" class="section-title">History log</h1>
        <div class="filters" role="group" aria-label="Filter by category">
          ${filters.map(f => `<button class="chip ${f === historyFilter ? 'is-active' : ''}" data-f="${f}" ${f === historyFilter ? 'aria-pressed="true"' : 'aria-pressed="false"'}>${f === 'all' ? 'All' : CATEGORIES[f].label}</button>`).join('')}
        </div>
        ${rows.length
          ? `<ul class="log-list">${rows.map(logRow).join('')}</ul>`
          : `<p class="muted empty">No games logged in this category yet.</p>`}
        <button class="btn btn-ghost" id="back-dash">← Back to dashboard</button>
      </section>`;
    app.querySelectorAll('[data-f]').forEach(b =>
      b.addEventListener('click', () => { historyFilter = b.dataset.f; renderHistory(); }));
    document.getElementById('back-dash').addEventListener('click', () => go('dashboard'));
  }

  /* ----------------------------------------------------------- practice -- */
  function renderPracticePicker() {
    app.innerHTML = `
      <section class="screen" aria-labelledby="pr-h">
        <h1 id="pr-h" class="section-title">Practice a category</h1>
        <p class="muted">Play a single random game. Scores are saved to your history but
          don’t affect your daily score.</p>
        <div class="cat-pick">
          ${CAT_ORDER.map(c => `
            <button class="cat-pick-btn" data-cat="${c}">
              <span class="cat-pick-ico" aria-hidden="true">${CATEGORIES[c].icon}</span>
              <span>${CATEGORIES[c].label}</span>
            </button>`).join('')}
        </div>
        <button class="btn btn-ghost" id="back-dash">← Back to dashboard</button>
      </section>`;
    app.querySelectorAll('[data-cat]').forEach(b =>
      b.addEventListener('click', () => {
        const game = GAMES.randomInCategory(b.dataset.cat);
        runGames([game], 'practice');
      }));
    document.getElementById('back-dash').addEventListener('click', () => go('dashboard'));
  }

  /* ------------------------------------------------------- game runner -- */
  function startWorkout() {
    const games = CAT_ORDER.map(c => GAMES.randomInCategory(c));
    runGames(games, 'workout');
  }

  // games: array; mode: 'workout' | 'practice'
  function runGames(games, mode) {
    const results = [];
    let gi = 0;

    function nextGame() {
      if (gi >= games.length) return finish();
      playGame(games[gi], gi, games.length, mode, res => {
        results.push(res);
        gi++;
        nextGame();
      });
    }

    function finish() {
      const ts = Date.now();
      const date = U.todayKey();
      results.forEach(r => Store.logGame({
        ts, date, category: r.game.category, gameId: r.game.id,
        gameName: r.game.name, score: r.score, correct: r.correct, total: r.total,
        topLevel: r.topLevel
      }));
      if (mode === 'workout') {
        const scores = {};
        results.forEach(r => { scores[r.game.category] = r.score; });
        const overall = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
        Store.saveDaily({ date, scores, overall, ts });
        renderWorkoutResult(results, overall);
      } else {
        renderPracticeResult(results[0]);
      }
    }

    nextGame();
  }

  // Run a single game's rounds, callback with {game, score, correct, total, topLevel}
  function playGame(game, index, count, mode, done) {
    let ri = 0, correct = 0;
    let level = START_LEVEL;   // adaptive: climbs on a correct answer, eases on a wrong one
    let topLevel = level;      // highest level the player reached
    let round = null;          // current round, generated on the fly at `level`

    function header() {
      if (mode === 'workout') {
        return `<div class="play-progress">
          <span class="badge" aria-hidden="true">${CATEGORIES[game.category].icon}</span>
          <span>Game ${index + 1} of ${count} · ${CATEGORIES[game.category].label}</span>
        </div>`;
      }
      return `<div class="play-progress"><span class="badge" aria-hidden="true">${CATEGORIES[game.category].icon}</span><span>Practice · ${CATEGORIES[game.category].label}</span></div>`;
    }

    function showRound() {
      if (ri >= ROUNDS_PER_GAME) {
        const score = Math.round(correct / ROUNDS_PER_GAME * 100);
        return done({ game, score, correct, total: ROUNDS_PER_GAME, topLevel });
      }
      const r = round = game.makeRound(level);
      const dots = Array.from({ length: ROUNDS_PER_GAME }, (_, i) =>
        `<span class="dot ${i < ri ? 'done' : i === ri ? 'now' : ''}"></span>`).join('');

      app.innerHTML = `
        <section class="screen play" aria-labelledby="q-h">
          ${header()}
          <div class="round-meta">
            <h2 class="game-name">${U.esc(game.name)}</h2>
            <div class="dots" aria-label="Round ${ri + 1} of ${ROUNDS_PER_GAME}">${dots}</div>
          </div>
          <div class="level-bar">
            <span class="level-tag" aria-label="Difficulty level ${level}">Level ${level}</span>
            <span class="level-note muted">Get it right and the next one gets harder.</span>
          </div>
          <div class="card q-card">
            <p id="q-h" class="prompt">${U.esc(r.prompt)}</p>
            ${r.visual || ''}
            ${r.hint ? `<p class="hint">${U.esc(r.hint)}</p>` : ''}
            <div id="answer-area"></div>
            <div id="feedback" class="feedback"></div>
          </div>
        </section>`;

      const area = document.getElementById('answer-area');
      if (r.type === 'choice') renderChoice(r, area);
      else renderText(r, area);
    }

    function renderChoice(r, area) {
      area.className = 'answer-area choices';
      area.innerHTML = r.choices.map((c, i) =>
        `<button class="choice" data-c="${i}">${U.esc(c)}</button>`).join('');
      area.querySelectorAll('.choice').forEach(btn =>
        btn.addEventListener('click', () => {
          const val = r.choices[+btn.dataset.c];
          grade(val === r.answer, r, area, btn);
        }));
    }

    function renderText(r, area) {
      area.className = 'answer-area';
      area.innerHTML = `
        <form id="ans-form" class="text-answer">
          <label class="visually-hidden" for="ans-input">Your answer</label>
          <input id="ans-input" type="text" autocomplete="off" autocapitalize="off"
            spellcheck="false" inputmode="text" placeholder="Type your answer…" />
          <button class="btn btn-primary" type="submit">Check</button>
        </form>`;
      const form = document.getElementById('ans-form');
      const input = document.getElementById('ans-input');
      input.focus();
      form.addEventListener('submit', e => {
        e.preventDefault();
        const accept = r.accept || [U.normalise(r.answer)];
        const ok = accept.includes(U.normalise(input.value));
        grade(ok, r, area, null);
      });
    }

    function grade(ok, r, area, btn) {
      // adaptive step: harder after a correct answer, a notch easier after a wrong one
      let levelMsg = '';
      if (ok) {
        correct++;
        topLevel = Math.max(topLevel, level);
        level = level + 1;
        levelMsg = ` Level up — next question is level ${level}.`;
      } else if (level > 1) {
        level = level - 1;
        levelMsg = ` Difficulty eased to level ${level}.`;
      }
      // lock inputs
      area.querySelectorAll('button, input').forEach(el => el.disabled = true);
      if (btn) {
        btn.classList.add(ok ? 'correct' : 'wrong');
        if (!ok) {
          // highlight the right one
          const idx = r.choices.indexOf(r.answer);
          const right = area.querySelector(`.choice[data-c="${idx}"]`);
          if (right) right.classList.add('correct');
        }
      }
      const last = ri === ROUNDS_PER_GAME - 1;
      const fb = document.getElementById('feedback');
      fb.innerHTML = `
        <span class="fb-mark ${ok ? 'ok' : 'no'}" aria-hidden="true">${ok ? '✓' : '✗'}</span>
        <span><b>${ok ? 'Correct' : 'Not quite'}.</b> ${r.explain ? U.esc(r.explain) : ''}${last ? '' : `<span class="fb-level">${ok ? '▲ Harder next' : '▼ Easier next'}</span>`}</span>
        <button class="btn btn-primary fb-next" id="next-round">${last ? 'Finish game' : 'Next'} →</button>`;
      announce(`${ok ? 'Correct' : 'Not quite'}. ${r.explain || ''}${last ? '' : levelMsg}`);
      const nb = document.getElementById('next-round');
      nb.focus();
      nb.addEventListener('click', () => { ri++; showRound(); });
    }

    showRound();
  }

  /* ------------------------------------------------------------ results -- */
  function renderWorkoutResult(results, overall) {
    app.innerHTML = `
      <section class="screen result" aria-labelledby="res-h">
        <h1 id="res-h" class="section-title">Workout complete!</h1>
        <div class="ring big" style="--p:${overall}">
          <span class="ring-num">${overall}</span><span class="ring-max">/100</span>
        </div>
        <p class="result-word">${scoreWord(overall)}!</p>
        <ul class="result-list">
          ${results.map(r => `
            <li>
              <span class="log-ico" aria-hidden="true">${CATEGORIES[r.game.category].icon}</span>
              <span class="log-main"><b>${U.esc(r.game.name)}</b><span class="muted">${CATEGORIES[r.game.category].label} · reached level ${r.topLevel}</span></span>
              <span class="log-score">${r.score}</span>
            </li>`).join('')}
        </ul>
        <button class="btn btn-primary btn-lg" id="res-done">See dashboard</button>
      </section>`;
    announce(`Workout complete. Overall score ${overall} out of 100.`);
    document.getElementById('res-done').addEventListener('click', () => go('dashboard'));
  }

  function renderPracticeResult(r) {
    app.innerHTML = `
      <section class="screen result" aria-labelledby="pres-h">
        <h1 id="pres-h" class="section-title">${U.esc(r.game.name)}</h1>
        <div class="ring big" style="--p:${r.score}">
          <span class="ring-num">${r.score}</span><span class="ring-max">/100</span>
        </div>
        <p class="result-word">${r.correct} of ${r.total} correct · reached level ${r.topLevel} · ${scoreWord(r.score)}!</p>
        <div class="action-row">
          <button class="btn btn-primary" id="again">Play another</button>
          <button class="btn btn-ghost" id="res-done">Dashboard</button>
        </div>
      </section>`;
    announce(`Practice complete. ${r.correct} of ${r.total} correct.`);
    document.getElementById('again').addEventListener('click', renderPracticePicker);
    document.getElementById('res-done').addEventListener('click', () => go('dashboard'));
  }

  /* --------------------------------------------------------------- router */
  function go(screen) {
    window.scrollTo(0, 0);
    if (screen === 'dashboard') renderDashboard();
    else if (screen === 'history') renderHistory();
    else if (screen === 'onboard') renderOnboard();
  }

  /* ----------------------------------------------------------------- boot */
  function boot() {
    renderNav();
    if (Store.getMascot()) go('dashboard');
    else renderOnboard();
  }

  boot();
})();
