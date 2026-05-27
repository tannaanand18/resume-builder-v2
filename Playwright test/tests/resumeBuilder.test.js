const { test, expect } = require('@playwright/test');
const { loginUser, goToResumeBuilder } = require('./helpers');

// ── Login and navigate to resume builder before each test ──
test.beforeEach(async ({ page }) => {
  await loginUser(page);
  await goToResumeBuilder(page);
});

// ============================================================
// TEST 1: Resume builder loads with all 6 tabs
// ============================================================
test('Resume builder loads with all 6 tabs', async ({ page }) => {
  const tabs = ['Personal', 'Experience', 'Education', 'Skills', 'Projects', 'Certifications'];
for (const tab of tabs) {
  await expect(page.locator(`.rb-tab:has-text("${tab}")`)).toBeVisible({ timeout: 10000 });
  console.log(`  ✓ Tab "${tab}" visible`);
}
  await expect(page.locator('button:has-text("Dashboard")')).toBeVisible();
  await expect(page.locator('button:has-text("Save")').first()).toBeVisible();
  console.log('✅ All 6 tabs visible');
});

// ============================================================
// TEST 2: Personal details tab works
// ============================================================
test('Personal details can be filled and saved', async ({ page }) => {
  await page.click('button:has-text("Personal")');
  await page.waitForTimeout(1000);

  // Fill Full Name
  const nameInput = page.locator('input').first();
  await nameInput.fill('John Doe');

  // Fill Email
  const emailInput = page.locator('input[placeholder*="email" i]').first();
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill('john@example.com');
  }

  // Fill Phone
  const phoneInput = page.locator('input[placeholder*="Phone" i]').first();
  if (await phoneInput.isVisible().catch(() => false)) {
    await phoneInput.fill('+91 9876543210');
  }

  // Click Save
  await page.click('button:has-text("Save Personal Info"), button:has-text("Save")');

  // Check success toast
  await expect(page.locator('text=saved successfully').first()).toBeVisible({ timeout: 10000 });
  console.log('✅ Personal details saved');
});

// ============================================================
// TEST 3: Experience tab - add experience
// ============================================================
test('Work experience can be added', async ({ page }) => {
  await page.click('button:has-text("Experience")');
  await page.waitForTimeout(1000);

  // Fill company
  const companyInput = page.locator('input[placeholder*="Google" i], input[placeholder*="Company" i]').first();
  await expect(companyInput).toBeVisible({ timeout: 10000 });
  await companyInput.fill('Google');

  // Fill role
  const roleInput = page.locator('input[placeholder*="Engineer" i], input[placeholder*="Role" i]').first();
  await roleInput.fill('Software Engineer');

  // Fill start date
  const startInput = page.locator('input[placeholder*="Jan 2022" i], input[placeholder*="Start" i]').first();
  await startInput.fill('Jan 2022');

  // Fill end date
  const endInput = page.locator('input[placeholder*="Present" i], input[placeholder*="End" i]').first();
  await endInput.fill('Present');

  // Click Add
  await page.click('button:has-text("+ Add Experience")');
  await page.waitForTimeout(2000);

  // Check Google appears
  await expect(page.locator('text=Google').first()).toBeVisible({ timeout: 10000 });
  console.log('✅ Work experience added');
});

// ============================================================
// TEST 4: Education tab
// ============================================================
test('Education can be added', async ({ page }) => {
  await page.click('button:has-text("Education")');
  await page.waitForTimeout(1000);

  const degreeInput = page.locator('input[placeholder*="B.Tech" i], input[placeholder*="Degree" i]').first();
  await expect(degreeInput).toBeVisible({ timeout: 10000 });
  await degreeInput.fill('B.Tech Computer Science');

  const institutionInput = page.locator('input[placeholder*="IIT" i], input[placeholder*="Institution" i]').first();
  await institutionInput.fill('Silver Oak University');

  const startYearInput = page.locator('input[placeholder*="2018" i], input[placeholder*="Start Year" i]').first();
  await startYearInput.fill('2020');

  const endYearInput = page.locator('input[placeholder*="2022" i], input[placeholder*="End Year" i]').first();
  await endYearInput.fill('2024');

  await page.click('button:has-text("+ Add Education")');
  await page.waitForTimeout(2000);

  await expect(page.locator('text=Silver Oak University').first()).toBeVisible({ timeout: 10000 });
  console.log('✅ Education added');
});

// ============================================================
// TEST 5: Skills tab
// ============================================================
test('Skills can be added', async ({ page }) => {
  await page.click('button:has-text("Skills")');
  await page.waitForTimeout(1000);

  const skillInput = page.locator('input[placeholder*="React" i], input[placeholder*="Skill" i]').first();
  await expect(skillInput).toBeVisible({ timeout: 10000 });
  await skillInput.fill('Python');

  // Select level
  const levelSelect = page.locator('select').first();
  if (await levelSelect.isVisible().catch(() => false)) {
    await levelSelect.selectOption('Advanced');
  }

  await page.click('button:has-text("+ Add")');
  await page.waitForTimeout(2000);

  await expect(page.locator('text=Python').first()).toBeVisible({ timeout: 10000 });
  console.log('✅ Skill added');
});

// ============================================================
// TEST 6: Projects tab
// ============================================================
test('Projects can be added', async ({ page }) => {
  await page.click('button:has-text("Projects")');
  await page.waitForTimeout(1000);

  const titleInput = page.locator('input[placeholder*="AI Resume" i], input[placeholder*="Title" i]').first();
  await expect(titleInput).toBeVisible({ timeout: 10000 });
  await titleInput.fill('Portfolio Website');

  const techInput = page.locator('input[placeholder*="React, Flask" i], input[placeholder*="Tech Stack" i]').first();
  await techInput.fill('React, Node.js');

  const descTextarea = page.locator('textarea').first();
  await descTextarea.fill('My personal portfolio website');

  await page.click('button:has-text("+ Add Project")');
  await page.waitForTimeout(2000);

  await expect(page.locator('text=Portfolio Website').first()).toBeVisible({ timeout: 10000 });
  console.log('✅ Project added');
});

// ============================================================
// TEST 7: Certifications tab
// ============================================================
test('Certifications can be added', async ({ page }) => {
  await page.click('button:has-text("Certifications")');
  await page.waitForTimeout(1000);

  const nameInput = page.locator('input[placeholder*="AWS" i], input[placeholder*="Name" i]').first();
  await expect(nameInput).toBeVisible({ timeout: 10000 });
  await nameInput.fill('AWS Solutions Architect');

  const issuerInput = page.locator('input[placeholder*="Amazon" i], input[placeholder*="Issuer" i]').first();
  await issuerInput.fill('Amazon');

  const dateInput = page.locator('input[placeholder*="Jan 2023" i], input[placeholder*="Issue Date" i]').first();
  await dateInput.fill('Jan 2023');

  await page.click('button:has-text("+ Add Certification")');
  await page.waitForTimeout(2000);

  await expect(page.locator('text=AWS Solutions Architect').first()).toBeVisible({ timeout: 10000 });
  console.log('✅ Certification added');
});

// ============================================================
// TEST 8: Template selector works
// ============================================================
test('Template selector opens and allows selection', async ({ page }) => {
  // Find template button
  const templateBtn = page.locator('button').filter({ hasText: /template|classic|harvard|modern|rosewood/i }).first();
  await templateBtn.click();
  await page.waitForTimeout(1000);

  // Check dropdown opened
  await expect(page.locator('text=Classic').first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator('text=Harvard').first()).toBeVisible();

  // Select Harvard
  await page.click('button:has-text("Harvard")');
  await page.waitForTimeout(1000);

  console.log('✅ Template selector works');
});

// ============================================================
// TEST 9: AI Generate Summary button exists
// ============================================================
test('AI Generate Summary button is visible', async ({ page }) => {
  await page.click('button:has-text("Personal")');
  await expect(page.locator('button:has-text("Generate with AI")')).toBeVisible({ timeout: 10000 });
  console.log('✅ AI Generate button visible');
});

// ============================================================
// TEST 10: Mobile toggle (desktop only - skip)
// ============================================================
test('Mobile Edit/Preview toggle works on mobile', async ({ page, isMobile }) => {
  if (!isMobile) {
    console.log('⏭️ Desktop - mobile toggle not shown, skipping');
    return;
  }
  await expect(page.locator('button:has-text("Edit Resume")')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('button:has-text("Preview")')).toBeVisible();
  await page.click('button:has-text("Preview")');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Edit Resume")');
  console.log('✅ Mobile toggle works');
});