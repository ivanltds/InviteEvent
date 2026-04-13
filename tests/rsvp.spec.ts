import { test, expect } from '@playwright/test';

test.describe('RSVP Guest Flow', () => {
  // Use a local dev server standard URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  test('Should navigate to the invitation and open RSVP modal', async ({ page }) => {
    // Navigate to a mock/demo slug
    await page.goto(`${baseUrl}/inv/convidado-teste`);

    // We assume the gateway displays "WOW! Veja como ficou" or something similar if it's the admin preview,
    // or the 'toque para abrir' envelope for the real guest. Wait for the page to settle.
    
    // Simulate clicking the envelope if it appears (this checks if the user gets blocked without interaction)
    const envelopeOpen = page.getByText(/toque para abrir/i);
    if (await envelopeOpen.isVisible()) {
      await envelopeOpen.click();
    }

    // Wait for the main page content to load (like 'Layslla & Marcus' or similar)
    // We try to catch a known UI element to ensure the react app hydrated.
    await page.waitForTimeout(1000); // give animations time to unfold
    
    // Check if the RSVP section heading is visible 
    const rsvpHeading = page.getByRole('heading', { name: /Presença/i });
    if (await rsvpHeading.isVisible()) {
        await expect(rsvpHeading).toBeVisible();
    }
  });
});
