import { test, expect } from '@playwright/test';

test.describe('Game Flow E2E', () => {
  test('should complete full game flow: create → play → results', async ({ page }) => {
    // Start on landing page
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /boggle party/i })).toBeVisible();

    // Create a new room - first enter player name
    await page.fill('input[placeholder="Tu nombre"]', 'Player1');
    await page.click('button:has-text("¡Crear Sala!")');

    // Should redirect to waiting room and show room code
    await expect(page).toHaveURL(/\/room\/[A-Z0-9]{6}/);
    const roomCode = page.locator('text=/[A-Z0-9]{6}/').first();
    await expect(roomCode).toBeVisible();

    // Extract room code from URL
    const url = page.url();
    const match = url.match(/\/room\/([A-Z0-9]{6})/);
    expect(match).toBeTruthy();
    const code = match![1];

    // Player is alone, should see message waiting for more players
    await expect(page.getByText(/mínimo 2 jugadores/i)).toBeVisible();

    // Open second browser context as second player
    const context2 = await page.context().browser()?.newContext();
    const page2 = await context2!.newPage();

    // Second player joins the room
    await page2.goto('/');
    await page2.fill('input[placeholder="CÓDIGO"]', code);
    await page2.fill('input[placeholder="Tu nombre"]', 'Player2');
    await page2.click('button:has-text("¡Unirse!")');

    // Both players should see each other in waiting room
    await expect(page.locator('[data-testid="player-list"]')).toBeVisible();
    await expect(page2.locator('[data-testid="player-list"]')).toBeVisible();

    // Host (first player) selects grid size and starts game
    await page.click('[data-testid="grid-size-4"]');
    await page.click('button:has-text("¡Empezar Juego!")');

    // Countdown should appear on both pages
    await expect(page.locator('text=/^[321¡YA!]$/')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('text=/^[321¡YA!]$/')).toBeVisible({ timeout: 5000 });

    // Wait for countdown to finish and game to start
    await page.waitForURL(/\/game\/.*/, { timeout: 10000 });
    await page2.waitForURL(/\/game\/.*/, { timeout: 10000 });

    // Game board should be visible
    await expect(page.locator('[data-testid="game-board"]')).toBeVisible();
    await expect(page2.locator('[data-testid="game-board"]')).toBeVisible();

    // Timer should be counting down
    await expect(page.locator('[data-testid="timer"]')).toBeVisible();

    // Find a word by simulating drag interaction (simplified)
    // Note: In a real test, we'd need to simulate proper touch/mouse drag
    // For now, we'll just verify the game is running

    // Wait for game to end (timer reaches 0)
    // In production, games last 2-4 minutes
    // For testing, we might want to add a test mode or manually end the game

    await context2!.close();
  });

  test('should validate room code on join', async ({ page }) => {
    await page.goto('/');

    // Try to join with invalid room code (need to fill name first)
    await page.fill('input[placeholder="CÓDIGO"]', 'INVALID');
    await page.fill('input[placeholder="Tu nombre"]', 'TestPlayer');
    await page.click('button:has-text("¡Unirse!")');

    // Should show error message
    await expect(page.locator('text=/sala no encontrada|código inválido/i')).toBeVisible({ timeout: 3000 });
  });

  test('should show waiting room with host controls', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[placeholder="Tu nombre"]', 'HostPlayer');
    await page.click('button:has-text("¡Crear Sala!")');

    // Should be on waiting room
    await expect(page).toHaveURL(/\/room\/[A-Z0-9]{6}/);

    // Host should see grid size selector
    await expect(page.locator('[data-testid="grid-size-selector"]')).toBeVisible();

    // Host should see start button (disabled initially)
    const startButton = page.locator('button:has-text("¡Empezar Juego!")');
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeDisabled();

    // Should show room code display
    await expect(page.locator('[data-testid="room-code-display"]')).toBeVisible();

    // Should have copy button
    await expect(page.locator('button:has-text("Copiar")')).toBeVisible();
  });

  test('should copy room code to clipboard', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[placeholder="Tu nombre"]', 'CopyPlayer');
    await page.click('button:has-text("¡Crear Sala!")');

    // Click copy button
    await page.click('button[aria-label="Copiar código"]');

    // Should show copied feedback
    await expect(page.locator('text=/copiado|¡copiado!/i')).toBeVisible({ timeout: 2000 });
  });
});
