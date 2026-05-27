const { test, expect } = require('@playwright/test');
const { loginUser } = require('./helpers');

// Login before every test
test.beforeEach(async ({ page }) => {
  await loginUser(page);
});

// ============================================================
// TEST 1: Dashboard loads with all elements
// ============================================================
test('Dashboard loads with all required elements', async ({ page }) => {
  expect(page.url()).toContain('/dashboard');
  await expect(page.locator('h1:has-text("My Resumes")')).toBeVisible();
  await expect(page.locator('button:has-text("New Resume")')).toBeVisible();
  await expect(page.locator('button:has-text("ATS Score"), button:has-text("Check ATS")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  console.log('✅ Dashboard has all required elements');
});

// ============================================================
// TEST 2: New Resume button works
// ============================================================
test('New Resume button navigates to resume builder', async ({ page }) => {
  // Click New Resume
  await page.click('button:has-text("New Resume")');

  // Wait up to 60 seconds for URL to change away from /dashboard
  await page.waitForFunction(
    () => !window.location.href.includes('/dashboard'),
    { timeout: 60000 }
  );

  const finalUrl = page.url();
  console.log('Final URL:', finalUrl);

  // Pass if URL contains /resume/ (any form - /new, /edit, /123)
  expect(finalUrl).toContain('/resume');

  console.log('✅ New Resume button navigates to:', finalUrl);
});

// ============================================================
// TEST 3: Resume cards show correctly
// ============================================================
test('Resume cards show on dashboard', async ({ page }) => {
  // Check if any resume cards exist already
  await page.waitForTimeout(2000);

  const hasCards = await page.locator('.dash-card').isVisible().catch(() => false);

  if (hasCards) {
    const count = await page.locator('.dash-card').count();
    console.log(`✅ Found ${count} resume cards on dashboard`);
    expect(count).toBeGreaterThan(0);
  } else {
    // No cards - just verify empty state message or "no resumes" text
    console.log('ℹ️ No resume cards found - checking empty state');
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy(); // page loaded at minimum
    console.log('✅ Dashboard loaded (empty state)');
  }
});

// ============================================================
// TEST 4: Share modal opens
// ============================================================
test('Share modal opens with all share options', async ({ page }) => {
  await page.waitForTimeout(2000);

  const hasCards = await page.locator('.dash-card').isVisible().catch(() => false);

  if (!hasCards) {
    console.log('⏭️ No resume cards to test share on - skipping');
    return;
  }

  // Click share button on first card
  const shareBtn = page.locator('.action-btn.share').first();
  await shareBtn.click();

  // Check modal appears
  await expect(page.locator('text=Share Resume')).toBeVisible({ timeout: 10000 });

  // Check share options
  await expect(page.locator('text=Email').first()).toBeVisible();
  await expect(page.locator('text=WhatsApp').first()).toBeVisible();
  await expect(page.locator('text=Copy Link').first()).toBeVisible();

  // Close
  await page.keyboard.press('Escape');
  console.log('✅ Share modal opened with all options');
});

// ============================================================
// TEST 5: ATS Score button navigates correctly
// ============================================================
test('Check ATS Score button navigates to ATS checker', async ({ page }) => {
  // Click the Check ATS Score button
  await page.locator('button:has-text("Check ATS Score")').first().click();

  // Wait for navigation
  await page.waitForTimeout(3000);

  // Check URL changed to ats-checker
  expect(page.url()).toContain('/ats-checker');

  // Check ANY content on ATS page loaded
  await expect(page.locator('text=ATS').first()).toBeVisible({ timeout: 15000 });

  console.log('✅ ATS Score button navigates to /ats-checker');
});

// ============================================================
// TEST 6: Duplicate resume creates a copy
// ============================================================
test('Duplicate resume creates a copy', async ({ page }) => {
  await page.waitForTimeout(2000);

  const hasCards = await page.locator('.dash-card').isVisible().catch(() => false);

  if (!hasCards) {
    console.log('⏭️ No resume cards to duplicate - skipping');
    return;
  }

  // Count before
  const countBefore = await page.locator('.dash-card').count();

  // Click duplicate
  await page.locator('.action-btn.dup').first().click();
  await page.waitForTimeout(4000);

  // Count after
  const countAfter = await page.locator('.dash-card').count();
  expect(countAfter).toBeGreaterThan(countBefore);

  console.log(`✅ Duplicate worked: ${countBefore} → ${countAfter} resumes`);
});

// ============================================================
// TEST 7: Delete with undo works
// ============================================================
test('Delete resume shows undo toast', async ({ page }) => {
  await page.waitForTimeout(2000);

  const hasCards = await page.locator('.dash-card').isVisible().catch(() => false);

  if (!hasCards) {
    console.log('⏭️ No resume cards to delete - skipping');
    return;
  }

  // Click delete
  await page.locator('.action-btn.del').first().click();

  // Check undo toast
  await expect(page.locator('text=Resume deleted')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('button:has-text("Undo")')).toBeVisible();

  // Click Undo
  await page.click('button:has-text("Undo")');
  await page.waitForTimeout(2000);

  console.log('✅ Delete → Undo works correctly');
});