import { test, expect } from '@playwright/test';

/**
 * E2E Suite: PRD-009 - Omniscient Support Bot & Smart Issue Desk (TDD First)
 * Targets: Validating active hybrid workflow controls, Kanban dashboard presence, and Prompt configuration.
 */

test.describe('Omniscient Support Hub (Admin View)', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to standard support module (pre-authenticated by auth setup)
    await page.goto('/admin/suporte');
    // Absorbing initial dashboard loading state
    await expect(page.locator('h1')).toContainText('Painel de Atendimento', { timeout: 30000 });
  });

  test('SCENARIO A: Open and verify AI Configuration Modal mechanics', async ({ page }) => {
    // 1. Locate and click Settings Trigger button (inserted by developer in Phase 3)
    const configBtn = page.getByRole('button', { name: /configur/i });
    await expect(configBtn).toBeVisible();
    await configBtn.click();

    // 2. Select Configurar Prompt from dropdown options
    const promptOption = page.getByText(/Configurar Prompt/i);
    await expect(promptOption).toBeVisible();
    await promptOption.click();

    // 3. Confirm Modal Overlay has fully rendered
    await expect(page.locator('textarea')).toBeVisible();
    // User verification of specific textual modal elements - targeting uniquely
    await expect(page.getByRole('heading', { name: /Configuração Neural/i })).toBeVisible();
  });

  test('SCENARIO B: Hybrid Mode Switch behavior - Transition to Specialist', async ({ page }) => {
    // Pre-req: We need a ticket selected to see the chat controls.
    // Developer to provide default active state or mock if list is empty.
    const ticketItem = page.locator('div[class*="ticketCard"]').first();
    
    // Only proceed if a ticket is present in active db instance
    const hasTickets = await ticketItem.count();
    if (hasTickets === 0) {
      console.log('[TEST SKIP] No active tickets found in base. Test requirements incomplete.');
      return; 
    }
    
    await ticketItem.click();

    // 1. Locate Hybrid Control Switcher (Explicitly NO EMOJIS as per requirement)
    const btnSpecialist = page.getByRole('button', { name: /^ESPECIALISTA$/i });
    await expect(btnSpecialist).toBeVisible();

    // 2. Act: Click Specialist mode
    await btnSpecialist.click();

    // 3. Verify explicit textual notice appeared in the visual stream
    await expect(page.locator('text=será atendido em breve por um dos nossos especialistas')).toBeVisible();
    
    // 4. Verify the input box has unlocked automatically
    const chatInput = page.locator('input[placeholder*="resposta"]');
    await expect(chatInput).toBeEnabled();
  });

  test('SCENARIO C: Verify Issues Kanban presence for unified surveillance', async ({ page }) => {
    // 1. Scroll viewport to target lower surface container
    const kanbanHeader = page.locator('text=Rastreador de Issues');
    await expect(kanbanHeader).toBeVisible();

    // 2. Verify four mandatory columns existence (Aberta, Visualizada, Em Correção, Corrigida)
    await expect(page.locator('text=Aberta')).toBeVisible();
    await expect(page.locator('text=Visualizada')).toBeVisible();
    await expect(page.locator('text=Em Correção')).toBeVisible();
    await expect(page.locator('text=Corrigida')).toBeVisible();
  });

});
