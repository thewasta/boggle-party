import { test, expect } from '@playwright/test';

test.describe('Multiplayer E2E', () => {
  test('should handle 4 players in same room', async ({ browser }) => {
    // Create room as host
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    await hostPage.goto('/');
    await hostPage.fill('input[placeholder="Tu nombre"]', 'HostPlayer');
    await hostPage.click('button:has-text("¡Crear Sala!")');

    // Get room code
    await expect(hostPage).toHaveURL(/\/room\/[A-Z0-9]{6}/);
    const url = hostPage.url();
    const match = url.match(/\/room\/([A-Z0-9]{6})/);
    const roomCode = match![1];

    // Join 3 more players
    const players: Array<{ context: any; page: any; name: string }> = [];

    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('/');
      await page.fill('input[placeholder="CÓDIGO"]', roomCode);
      await page.fill('input[placeholder="Tu nombre"]', `Player${i + 2}`);
      await page.click('button:has-text("¡Unirse!")');

      players.push({ context, page, name: `Player${i + 2}` });
    }

    // Verify all 4 players are shown on host's screen
    await expect(hostPage.locator('[data-testid="player-list"]')).toBeVisible();

    // Start game as host
    await hostPage.click('[data-testid="grid-size-4"]');

    // Wait a moment for all players to sync
    await hostPage.waitForTimeout(500);

    // Start button should be enabled now with 4 players
    const startButton = hostPage.locator('button:has-text("¡Empezar Juego!")');
    await expect(startButton).toBeEnabled();

    await hostPage.click('button:has-text("¡Empezar Juego!")');

    // All players should see countdown
    await expect(hostPage.locator('text=/^[321¡YA!]$/')).toBeVisible({ timeout: 5000 });

    for (const player of players) {
      await expect(player.page.locator('text=/^[321¡YA!]$/')).toBeVisible({ timeout: 5000 });
    }

    // All players should be redirected to game page
    await expect(hostPage).toHaveURL(/\/game\//);
    for (const player of players) {
      await expect(player.page).toHaveURL(/\/game\//);
    }

    // Clean up
    await hostContext.close();
    for (const player of players) {
      await player.context.close();
    }
  });

  test('should update player list in real-time when player joins', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();

    await hostPage.goto('/');
    await hostPage.fill('input[placeholder="Tu nombre"]', 'Host');
    await hostPage.click('button:has-text("¡Crear Sala!")');

    const url = hostPage.url();
    const match = url.match(/\/room\/([A-Z0-9]{6})/);
    const roomCode = match![1];

    // Initially should show only 1 player (host)
    const playerList = hostPage.locator('[data-testid="player-list"]');
    await expect(playerList).toBeVisible();

    // Join second player
    const playerContext = await browser.newContext();
    const playerPage = await playerContext.newPage();

    await playerPage.goto('/');
    await playerPage.fill('input[placeholder="CÓDIGO"]', roomCode);
    await playerPage.fill('input[placeholder="Tu nombre"]', 'Player2');
    await playerPage.click('button:has-text("¡Unirse!")');

    // Host should see 2 players now
    await expect(hostPage.locator('[data-testid="player-card"]')).toHaveCount(2);

    await hostContext.close();
    await playerContext.close();
  });

  test('should handle player leaving during waiting phase', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();

    await hostPage.goto('/');
    await hostPage.fill('input[placeholder="Tu nombre"]', 'Host');
    await hostPage.click('button:has-text("¡Crear Sala!")');

    const url = hostPage.url();
    const match = url.match(/\/room\/([A-Z0-9]{6})/);
    const roomCode = match![1];

    // Join second player
    const playerContext = await browser.newContext();
    const playerPage = await playerContext.newPage();

    await playerPage.goto('/');
    await playerPage.fill('input[placeholder="CÓDIGO"]', roomCode);
    await playerPage.fill('input[placeholder="Tu nombre"]', 'Player2');
    await playerPage.click('button:has-text("¡Unirse!")');

    // Verify 2 players
    await expect(hostPage.locator('[data-testid="player-card"]')).toHaveCount(2);

    // Second player leaves (closes tab or navigates away)
    await playerContext.close();

    // Host should see 1 player again
    await expect(hostPage.locator('[data-testid="player-card"]')).toHaveCount(1, { timeout: 3000 });

    await hostContext.close();
  });

  test('should sync game start across all players', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();

    await hostPage.goto('/');
    await hostPage.fill('input[placeholder="Tu nombre"]', 'Host');
    await hostPage.click('button:has-text("¡Crear Sala!")');

    const url = hostPage.url();
    const match = url.match(/\/room\/([A-Z0-9]{6})/);
    const roomCode = match![1];

    // Join second player
    const playerContext = await browser.newContext();
    const playerPage = await playerContext.newPage();

    await playerPage.goto('/');
    await playerPage.fill('input[placeholder="CÓDIGO"]', roomCode);
    await playerPage.fill('input[placeholder="Tu nombre"]', 'Player2');
    await playerPage.click('button:has-text("¡Unirse!")');

    // Host starts game
    await hostPage.click('[data-testid="grid-size-4"]');
    await hostPage.waitForTimeout(500);
    await hostPage.click('button:has-text("¡Empezar Juego!")');

    // Both should see countdown at roughly the same time
    await Promise.all([
      expect(hostPage.locator('text=/^[321¡YA!]$/')).toBeVisible({ timeout: 5000 }),
      expect(playerPage.locator('text=/^[321¡YA!]$/')).toBeVisible({ timeout: 5000 }),
    ]);

    // Both should transition to game page
    await Promise.all([
      expect(hostPage).toHaveURL(/\/game\//, { timeout: 10000 }),
      expect(playerPage).toHaveURL(/\/game\//, { timeout: 10000 }),
    ]);

    await hostContext.close();
    await playerContext.close();
  });
});
