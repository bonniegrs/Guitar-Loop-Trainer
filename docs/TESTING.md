# Testing Guide

This project has two levels of automated testing: **Unit Tests** and **End-to-End (E2E) Tests**.

---

## Prerequisites

Make sure dependencies are installed (one-time setup):

```bash
npm install
```

For E2E tests, you also need the Chromium browser installed (one-time setup):

```bash
npx playwright install chromium
```

---

## Unit Tests (Vitest)

### What they test

Unit tests verify individual **functions in isolation** — no browser, no server, no network.

| Test file | Module tested | What's covered |
|---|---|---|
| `tests/utils.test.js` | `js/utils.js` | `formatTime` — zero, seconds, minutes, padding, fractional, negative, NaN |
| | | `escapeHtml` — ampersands, angle brackets, quotes, falsy input |
| `tests/player.test.js` | `js/player.js` | `extractVideoId` — standard URL, short URL, embed URL, /v/ URL, shorts URL, bare ID, hyphens/underscores, invalid input |
| `tests/storage.test.js` | `js/storage.js` | `loadPlaylist` / `savePlaylist` — round-trip, empty state, corrupted JSON |
| | | `addToPlaylist` — ordering, promotion, MAX_PLAYLIST limit, default fields |
| | | `getPlaylistItem` — found vs. not found |
| `tests/config.test.js` | `js/config.js` | Constant validity (types, ranges) |
| | | Speed clamping — below min, above max, in-range, rounding |
| | | BPM clamping — below 30, above 300, in-range, rounding |

### How to run

```bash
npm test
```

This runs all unit tests once and exits. Expected output:

```
 Test Files  4 passed (4)
      Tests  45 passed (45)
```

### Watch mode (for development)

Automatically re-runs tests when you save a file:

```bash
npm run test:watch
```

Press `q` to quit watch mode.

---

## End-to-End Tests (Playwright)

### What they test

E2E tests launch a **real Chromium browser**, open the app, and interact with it exactly like a user would — clicking buttons, pressing keys, checking what appears on screen.

| Test group | What's verified |
|---|---|
| **Page Load** | No JavaScript console errors, correct page title, header text |
| **URL Input** | Input and Load button visible, invalid URL shows a toast notification |
| **Transport Controls** | Play/pause, stop, go-to-start, mute buttons visible; volume defaults to 100 |
| **Loop Region** | Loop toggle checked by default, A/B/restart/reset buttons visible, time displays show 0:00 |
| **Speed Control** | Badge shows 1.00x, slider defaults to 1, clicking a preset updates the badge, moving slider updates badge |
| **Metronome** | BPM shows 120, +/- buttons increment/decrement, 4 beat dots visible, progressive tempo toggle works |
| **Playlist Sidebar** | Auto-loads videos from `data/playlist.json`, items show titles, export/import buttons visible |
| **Keyboard Shortcuts** | Space key works, T key toggles metronome with toast, shortcuts are ignored when typing in the URL input |
| **Responsive Layout** | Keyboard hints hidden on narrow viewport (800px), visible on wide viewport (1200px) |

### How to run

```bash
npm run test:e2e
```

Playwright serves the app on **port 3001** (configured in `playwright.config.js`), separate from the default **port 3000** used by `scripts/start.bat` and `npm start`, so you can keep a development server running without port conflicts.

Expected output:

```
  29 passed (58.6s)
```

### Run with visible browser (for debugging)

If a test fails and you want to see what the browser is doing:

```bash
npx playwright test --headed
```

### Run a single test

```bash
npx playwright test -g "speed preset updates the badge"
```

### View the HTML report after a failure

```bash
npx playwright show-report
```

---

## Run All Tests

```bash
npm run test:all
```

This runs unit tests first, then E2E tests. If unit tests fail, E2E tests will not run.

---

## When to Run Tests

| Situation | Command |
|---|---|
| After changing any JS logic | `npm test` |
| After changing UI / HTML / CSS | `npm run test:e2e` |
| Before merging a branch | `npm run test:all` |
| During development (continuous) | `npm run test:watch` |

---

## Adding New Tests

### Adding a unit test

Create or edit a file in `tests/` with the `.test.js` extension. Example:

```javascript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../js/myModule.js';

describe('myFunction', () => {
    it('does the expected thing', () => {
        expect(myFunction('input')).toBe('expected output');
    });
});
```

### Adding an E2E test

Edit `e2e/app.spec.js` or create a new `.spec.js` file in `e2e/`. Example:

```javascript
import { test, expect } from '@playwright/test';

test('my new feature works', async ({ page }) => {
    await page.goto('/');
    await page.click('#myButton');
    await expect(page.locator('#result')).toHaveText('Success');
});
```

---

## File Structure

```
tests/
├── setup.js            # DOM fixture for Vitest (auto-loaded)
├── utils.test.js       # Unit tests for formatTime, escapeHtml
├── player.test.js      # Unit tests for extractVideoId
├── storage.test.js     # Unit tests for localStorage operations
└── config.test.js      # Unit tests for constants and clamping logic

e2e/
└── app.spec.js         # All end-to-end browser tests

vitest.config.js        # Unit test runner configuration
playwright.config.js    # E2E test runner configuration
```
