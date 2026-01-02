import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport E2E', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 13

  test('should display landing page correctly on mobile', async ({ page }) => {
    await page.goto('/');

    // Main heading should be visible
    await expect(page.getByRole('heading', { name: /boggle party/i })).toBeVisible();

    // Create and join buttons should be stacked vertically
    const createButton = page.locator('button:has-text("Crear Sala")');
    const joinButton = page.locator('button:has-text("Unirse a Sala")');

    await expect(createButton).toBeVisible();
    await expect(joinButton).toBeVisible();

    // Buttons should be full width on mobile
    const createBox = await createButton.boundingBox();
    expect(createBox?.width).toBeGreaterThan(350);

    const joinBox = await joinButton.boundingBox();
    expect(joinBox?.width).toBeGreaterThan(350);
  });

  test('should display waiting room correctly on mobile', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[placeholder="Tu nombre"]', 'MobileHost');
    await page.click('button:has-text("¡Crear Sala!")');

    // Room code should be large and readable
    await expect(page.locator('[data-testid="room-code-display"]')).toBeVisible();

    // Grid size selector should be horizontally scrollable or stacked
    await expect(page.locator('[data-testid="grid-size-selector"]')).toBeVisible();

    // Player list should be scrollable if many players
    await expect(page.locator('[data-testid="player-list"]')).toBeVisible();
  });

  test('should display game board correctly on mobile', async ({ page, browser }) => {
    // Create room on desktop
    const desktopContext = await browser.newContext();
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto('/');
    await desktopPage.fill('input[placeholder="Tu nombre"]', 'DesktopHost');
    await desktopPage.click('button:has-text("¡Crear Sala!")');

    const url = desktopPage.url();
    const match = url.match(/\/room\/([A-Z0-9]{6})/);
    const roomCode = match![1];

    // Join on mobile
    await page.goto('/');
    await page.fill('input[placeholder="CÓDIGO"]', roomCode);
    await page.fill('input[placeholder="Tu nombre"]', 'MobilePlayer');
    await page.click('button:has-text("¡Unirse!")');

    // Host starts game
    await desktopPage.click('[data-testid="grid-size-4"]');
    await desktopPage.waitForTimeout(500);
    await desktopPage.click('button:has-text("¡Empezar Juego!")');

    // Wait for game to start on mobile
    await page.waitForURL(/\/game\//, { timeout: 10000 });

    // Game board should fit within viewport
    await expect(page.locator('[data-testid="game-board"]')).toBeVisible();

    const board = page.locator('[data-testid="game-board"]');
    const box = await board.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(390);

    // Timer should be visible
    await expect(page.locator('[data-testid="timer"]')).toBeVisible();

    await desktopContext.close();
  });

  test('should handle touch interactions on game board', async ({ page, browser }) => {
    // Create room on desktop
    const desktopContext = await browser.newContext();
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto('/');
    await desktopPage.fill('input[placeholder="Tu nombre"]', 'DesktopHost');
    await desktopPage.click('button:has-text("¡Crear Sala!")');

    const url = desktopPage.url();
    const match = url.match(/\/room\/([A-Z0-9]{6})/);
    const roomCode = match![1];

    // Join on mobile
    await page.goto('/');
    await page.fill('input[placeholder="CÓDIGO"]', roomCode);
    await page.fill('input[placeholder="Tu nombre"]', 'MobilePlayer');
    await page.click('button:has-text("¡Unirse!")');

    // Host starts game
    await desktopPage.click('[data-testid="grid-size-4"]');
    await desktopPage.waitForTimeout(500);
    await desktopPage.click('button:has-text("¡Empezar Juego!")');

    // Wait for game to start on mobile
    await page.waitForURL(/\/game\//, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Simulate touch drag on game board
    const board = page.locator('[data-testid="game-board"]');
    await expect(board).toBeVisible();

    // Get first cell
    const firstCell = board.locator('[data-testid^="board-cell-"]').first();
    await expect(firstCell).toBeVisible();

    // Simulate touch interaction
    await firstCell.tap();
    await page.waitForTimeout(100);

    await desktopContext.close();
  });

  test('should display results page correctly on mobile', async ({ page }) => {
    // Navigate directly to a results page (assuming we have a test room code)
    // In real scenario, we'd complete a game first

    await page.goto('/results/test-room');

    // Final ranking should be visible and scrollable
    await expect(page.locator('[data-testid="final-ranking"]')).toBeVisible();

    // Play again button should be prominent
    const playAgainButton = page.locator('button:has-text("Jugar otra vez")');
    if (await playAgainButton.isVisible()) {
      // Check if it's tappable on mobile (minimum 44x44px)
      const box = await playAgainButton.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should be readable in both orientations', async ({ page }) => {
    await page.goto('/');

    // Portrait (default)
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('heading', { name: /boggle party/i })).toBeVisible();

    // Landscape
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.getByRole('heading', { name: /boggle party/i })).toBeVisible();

    // Small mobile (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { name: /boggle party/i })).toBeVisible();
  });
});
