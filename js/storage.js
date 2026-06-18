/* ==========================================================================
   storage.js — localStorage persistence
   ========================================================================== */
(function (global) {
  'use strict';
  const KEY = 'braintrain.v1';

  const DEFAULT = {
    mascot: null,            // { emoji, name }
    history: [],             // [{ ts, date, category, gameId, gameName, score, correct, total }]
    daily: {}                // { 'YYYY-MM-DD': { date, scores:{cat:score}, overall, ts } }
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT));
      const data = JSON.parse(raw);
      return Object.assign(JSON.parse(JSON.stringify(DEFAULT)), data);
    } catch (e) {
      console.warn('Storage load failed, resetting.', e);
      return JSON.parse(JSON.stringify(DEFAULT));
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Storage save failed.', e);
    }
  }

  let state = load();

  const Store = {
    get() { return state; },

    getMascot() { return state.mascot; },
    setMascot(mascot) { state.mascot = mascot; save(state); },

    // record a single game result into the history log
    logGame(rec) {
      state.history.unshift(rec);
      if (state.history.length > 500) state.history.length = 500;
      save(state);
    },

    getHistory(category) {
      return category && category !== 'all'
        ? state.history.filter(h => h.category === category)
        : state.history;
    },

    // save the day's complete workout
    saveDaily(record) {
      state.daily[record.date] = record;
      save(state);
    },

    getDaily(dateKey) { return state.daily[dateKey] || null; },

    isDailyDone(dateKey) { return !!state.daily[dateKey]; },

    // sorted array of daily records (oldest -> newest)
    dailySeries() {
      return Object.values(state.daily).sort((a, b) => a.date.localeCompare(b.date));
    },

    // current consecutive-day streak ending today (or yesterday)
    streak() {
      const keys = Object.keys(state.daily);
      if (!keys.length) return 0;
      const set = new Set(keys);
      let count = 0;
      const d = new Date();
      // allow streak to count from today; if today not done, start from yesterday
      if (!set.has(U.todayKey(d))) d.setDate(d.getDate() - 1);
      while (set.has(U.todayKey(d))) { count++; d.setDate(d.getDate() - 1); }
      return count;
    },

    resetAll() {
      state = JSON.parse(JSON.stringify(DEFAULT));
      save(state);
    }
  };

  global.Store = Store;
})(window);
