# 🧠 Brain Trainer

A simple daily brain-training app covering four categories — **geometric,
mathematical, verbal and logical** — with five randomised games in each.
No build step, no dependencies: just open `index.html` in a browser.

## Features

- **20 games** (5 per category), each procedurally randomised so no two plays
  are identical.
- **Adaptive difficulty** — every game starts a notch above trivial and each
  game scales with a difficulty *level*. Answer correctly and the next question
  gets harder; slip up and it eases back by one level. The current level is
  shown while you play, and the top level you reached is recorded with each
  result.
- **Daily workout** — one random game from each of the four categories, giving
  an **overall daily score** out of 100.
- **Dashboard** with a progress graph of daily scores over time, plus a day
  streak, days-trained and best-score stats.
- **History log** of every game played, filterable by category.
- **Practice mode** — play a single random game from any category (logged to
  history, but it doesn't affect your daily score).
- **Pick a mascot** — an emoji animal/item with an alliterative name whose first
  name is an obscure chemical element or natural mineral
  (e.g. 🐯 *Tellurium Tiger*, 🦦 *Osmium Otter*). Shuffle for fresh suggestions.

## Design

- **Font:** [Josefin Sans](https://fonts.google.com/specimen/Josefin+Sans)
  (Google Fonts), with a system-font fallback if offline.
- **Four-colour palette** only: white, ink (navy `#0B2545`), blue (`#1565C0`)
  and sun/amber (`#C77E22`). Tints used are opacity variations of these hues.
- **WCAG AA compliant**: verified contrast ratios (ink-on-white ≈16:1,
  white-on-blue ≈5.75:1, ink-on-sun ≈4.72:1), visible focus rings, keyboard
  operability, screen-reader live announcements, semantic landmarks, meaning
  never conveyed by colour alone (✓/✗ icons + text), and
  `prefers-reduced-motion` support.

## The games

| Category | Games |
| --- | --- |
| 🔷 Geometric | Shape Counter · Odd Tile Out · Size Sorter · Pattern Next · Mirror Check |
| ➗ Mathematical | Arithmetic Sprint · Number Sequence · Missing Operator · Which Is Bigger? · Solve for X |
| 🔤 Verbal | Anagram · Synonyms · Antonyms · Odd Word Out · Word Completion |
| 🧩 Logical | Letter Sequence · Logic Deduction · Analogies · Odd Number Out · Weighing Up |

## Running

Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

All progress is saved in the browser's `localStorage` (per device/browser).
Use **Reset all data** in the footer to start fresh.

## Project structure

```
index.html        markup + script order
css/styles.css    the four-colour, WCAG-compliant theme
js/util.js        small shared helpers (RNG, dates, escaping)
js/data.js        content banks: mascots, words, categories, analogies
js/games.js       the 20 randomised game generators
js/storage.js     localStorage persistence (mascot, history, daily scores)
js/charts.js      accessible hand-rolled SVG line chart
js/app.js         UI controller, navigation and the game runner
```
