import { test, expect } from '@playwright/test';

test.setTimeout(35e3);

test('go to /', async ({ page }) => {
  await page.goto('/');
});

test('single player rankings smoke test', async ({ page }) => {
  await page.goto('/single-player-rank');

  // Check card structure
  const cardBody = page.locator('.card.bg-base-100.shadow-xl .card-body');
  await expect(cardBody).toBeVisible();

  // Check header with icon
  const header = cardBody.locator('h2.card-title');
  await expect(header).toBeVisible();
  await expect(header.locator('svg')).toBeVisible(); // User icon
  await expect(header).toHaveText(/Single Player Rankings/);

  // Check table structure
  const table = page.locator('table.table.table-zebra.table-pin-rows');
  await expect(table).toBeVisible();

  // Verify table headers
  const expectedHeaders = ['Rank', 'Player', 'Score', 'Last Updated'];
  for (const header of expectedHeaders) {
    await expect(table.locator('thead th', { hasText: header })).toBeVisible();
  }

  // Check first row content structure
  const firstRow = table.locator('tbody tr').first();
  if (await firstRow.isVisible()) {
    // Check rank badge (updated selector)
    const rankBadge = firstRow.locator('td').first().locator('.badge.badge-lg');
    await expect(rankBadge).toBeVisible();
    await expect(rankBadge).toHaveClass(/badge-primary|badge-secondary|badge-accent|badge-ghost/);

    // Check player info section
    const playerCell = firstRow.locator('td').nth(1);
    await expect(playerCell.locator('.avatar')).toBeVisible();
    await expect(playerCell.locator('img')).toBeVisible();
    await expect(playerCell.locator('.font-bold')).toBeVisible();

    // Check score badge
    await expect(firstRow.locator('.badge.badge-outline.badge-lg')).toBeVisible();

    // Check date format
    const dateCell = firstRow.locator('td').last();
    await expect(dateCell).toHaveText(/^\d{2}\/\d{2}\/\d{4}$/);

    // Test stats tooltip interaction
    await firstRow.click();
    const tooltip = page.locator('.animate-in');
    await expect(tooltip).toBeVisible();
    await expect(tooltip.getByText('Player Stats')).toBeVisible();

    // Check tooltip content structure
    await expect(tooltip.getByText('Total')).toBeVisible();
    await expect(tooltip.getByText('Won')).toBeVisible();
    await expect(tooltip.getByText('Lost')).toBeVisible();
    await expect(tooltip.getByText('Win Rate')).toBeVisible();

    // Close tooltip
    await firstRow.click();
    await expect(tooltip).not.toBeVisible();
  }

  // Test empty state (if no rankings)
  const rows = table.locator('tbody tr');
  const rowCount = await rows.count();
  if (rowCount === 0) {
    // Could add empty state checks here if you have any
    console.log('No ranking data found');
  }
});



// test('add a post', async ({ page }) => {
//   const nonce = `${Math.random()}`;

//   await page.goto('/');
//   await page.fill(`[name=title]`, nonce);
//   await page.fill(`[name=text]`, nonce);
//   await page.click(`form [type=submit]`);
//   await page.waitForLoadState('networkidle');
//   await page.reload();

//   await page.waitForSelector(`text="${nonce}"`);
// });
