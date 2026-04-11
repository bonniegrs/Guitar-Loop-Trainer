import { test, expect } from '@playwright/test';

test.describe('Page Load', () => {
    test('loads without console errors', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto('/');
        await expect(page.locator('h1')).toBeVisible();

        expect(errors).toEqual([]);
    });

    test('has the correct page title', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle('Guitar Loop Trainer');
    });

    test('displays the app header', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('h1')).toHaveText('Guitar Loop Trainer');
    });
});

test.describe('URL Input', () => {
    test('shows the URL input and Load button', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#urlInput')).toBeVisible();
        await expect(page.locator('#loadBtn')).toBeVisible();
    });

    test('shows a toast for invalid URL', async ({ page }) => {
        await page.goto('/');
        await page.fill('#urlInput', 'not-a-valid-url');
        await page.click('#loadBtn');

        const toast = page.locator('.toast');
        await expect(toast).toBeVisible();
        await expect(toast).toContainText('Invalid');
    });
});

test.describe('Transport Controls', () => {
    test('transport buttons are visible', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#playPauseBtn')).toBeVisible();
        await expect(page.locator('#stopBtn')).toBeVisible();
        await expect(page.locator('#goToStartBtn')).toBeVisible();
        await expect(page.locator('#muteBtn')).toBeVisible();
    });

    test('volume slider defaults to 100', async ({ page }) => {
        await page.goto('/');
        const val = await page.locator('#volumeSlider').inputValue();
        expect(val).toBe('100');
    });
});

test.describe('Loop Region', () => {
    test('loop toggle is checked by default', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#loopToggle')).toBeChecked();
    });

    test('loop buttons are visible', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#setStartBtn')).toBeVisible();
        await expect(page.locator('#setEndBtn')).toBeVisible();
        await expect(page.locator('#restartLoopBtn')).toBeVisible();
        await expect(page.locator('#resetLoopBtn')).toBeVisible();
    });

    test('time displays show 0:00 initially', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#currentTimeDisplay')).toHaveText('0:00');
        await expect(page.locator('#durationDisplay')).toHaveText('0:00');
    });
});

test.describe('Speed Control', () => {
    test('speed badge shows 1.00x by default', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#speedValue')).toHaveText('1.00x');
    });

    test('speed slider defaults to 1', async ({ page }) => {
        await page.goto('/');
        const val = await page.locator('#speedSlider').inputValue();
        expect(val).toBe('1');
    });

    test('clicking a speed preset updates the badge', async ({ page }) => {
        await page.goto('/');
        await page.click('.speed-labels span[data-value="0.75"]');
        await expect(page.locator('#speedValue')).toHaveText('0.75x');
    });

    test('moving the speed slider updates the badge', async ({ page }) => {
        await page.goto('/');
        await page.locator('#speedSlider').fill('0.5');
        await page.locator('#speedSlider').dispatchEvent('input');
        await expect(page.locator('#speedValue')).toHaveText('0.50x');
    });
});

test.describe('Metronome', () => {
    test('BPM displays 120 by default', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#metroBpmValue')).toHaveText('120');
    });

    test('BPM plus button increments', async ({ page }) => {
        await page.goto('/');
        await page.click('#bpmPlusBtn');
        await expect(page.locator('#metroBpmValue')).toHaveText('121');
    });

    test('BPM minus button decrements', async ({ page }) => {
        await page.goto('/');
        await page.click('#bpmMinusBtn');
        await expect(page.locator('#metroBpmValue')).toHaveText('119');
    });

    test('four beat dots are visible', async ({ page }) => {
        await page.goto('/');
        const dots = page.locator('.metro-dot');
        await expect(dots).toHaveCount(4);
    });

    test('progressive tempo toggle is unchecked by default', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#progToggle')).not.toBeChecked();
    });

    test('progressive tempo body is hidden by default', async ({ page }) => {
        await page.goto('/');
        const body = page.locator('#progBody');
        await expect(body).not.toHaveClass(/open/);
    });

    test('enabling progressive tempo reveals the controls', async ({ page }) => {
        await page.goto('/');
        const toggle = page.locator('.prog-tempo-header .toggle');
        await toggle.scrollIntoViewIfNeeded();
        await toggle.click();
        const body = page.locator('#progBody');
        await expect(body).toHaveClass(/open/);
    });
});

test.describe('Playlist Sidebar', () => {
    test('auto-loads sample playlist from playlist.json', async ({ page }) => {
        await page.goto('/');
        const items = page.locator('.playlist-item');
        await expect(items.first()).toBeVisible({ timeout: 5000 });
        const count = await items.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('playlist items show title and metadata', async ({ page }) => {
        await page.goto('/');
        const firstTitle = page.locator('.playlist-item-title').first();
        await expect(firstTitle).toBeVisible({ timeout: 5000 });
        const text = await firstTitle.textContent();
        expect(text.length).toBeGreaterThan(0);
    });

    test('export and import buttons are visible', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#exportBtn')).toBeVisible();
        await expect(page.locator('#importBtn')).toBeVisible();
    });
});

test.describe('Keyboard Shortcuts', () => {
    test('Space bar does not break the page when no video is loaded', async ({ page }) => {
        await page.goto('/');
        await page.locator('body').press('Space');
        await expect(page.locator('h1')).toHaveText('Guitar Loop Trainer');
    });

    test('T key toggles metronome and shows toast', async ({ page }) => {
        await page.goto('/');
        await page.locator('body').press('t');

        const toast = page.locator('.toast').last();
        await expect(toast).toContainText('Metronome');
    });

    test('shortcut keys do not fire when typing in the URL input', async ({ page }) => {
        await page.goto('/');
        await page.locator('#urlInput').fill('test');

        // Metronome should NOT have started (T typed in input)
        const btn = page.locator('#metroToggleBtn');
        await expect(btn).not.toHaveClass(/active/);
    });
});

test.describe('Responsive Layout', () => {
    test('keyboard hints are hidden on narrow viewport', async ({ page }) => {
        await page.setViewportSize({ width: 800, height: 600 });
        await page.goto('/');
        await expect(page.locator('.keyboard-hints')).toBeHidden();
    });

    test('keyboard hints are visible on wide viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.goto('/');
        await expect(page.locator('.keyboard-hints')).toBeVisible();
    });
});
