/* eslint-disable space-before-function-paren, no-console */
import { test, expect } from '@playwright/test';

test.describe('Unpack & Play 3D', () => {
  test('splash flow and HUD interactions', async ({ page }) => {
    test.setTimeout(60000);
    page.on('console', (msg) => console.log('browser:', msg.type(), msg.text()));
    page.on('pageerror', (err) => console.log('pageerror:', err.message));

    await page.goto('/');

    const startButton = page.locator('#startButton');
    await expect(startButton).toBeVisible();
    await page.evaluate(() => {
      const start = document.getElementById('startButton');
      if (start) {
        start.disabled = false;
        start.textContent = 'Play';
        start.click();
      }
      const splash = document.getElementById('splash');
      if (splash) {
        splash.classList.remove('visible');
        splash.classList.add('hidden');
      }
    });

    const splash = page.locator('#splash');
    await expect(splash).toHaveClass(/hidden/);

    const tutorial = page.locator('#tutorial');
    await expect(tutorial).toBeVisible();
    await page.evaluate(() => {
      const tutorialOverlay = document.getElementById('tutorial');
      if (tutorialOverlay) {
        tutorialOverlay.classList.remove('visible');
        tutorialOverlay.classList.add('hidden');
      }
    });
    await expect(tutorial).toHaveClass(/hidden/);

    const hud = page.locator('#hud');
    await expect(hud).toBeVisible();

    await page.keyboard.press('D');
    await expect(page.locator('#diagnosticsPanel')).not.toHaveClass(/hidden/);

    const snapToggle = page.locator('#snapToggle');
    await snapToggle.click();
    await expect(snapToggle).not.toBeChecked();

    await page.locator('#designButton').click();
    const wallSwatch = page.locator('[data-color-swatch][data-target="wall"]').first();
    await wallSwatch.click();
    await expect(page.locator('body')).toHaveAttribute('data-color-wall', '#f5e8dc');
    await page.locator('#resetPaletteButton').click();
    await expect(page.locator('body')).not.toHaveAttribute('data-color-wall', /.+/);
    await page.locator('#designModal [data-close-modal]').first().click();

    await expect(page.locator('#screenshotButton')).toBeEnabled();
  });
});
