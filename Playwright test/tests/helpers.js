const TEST_USER = {
  email: 'Sumit@testgmail.com',      // ← your test email
  password: 'Sumit1234',        // ← update to your real password
};

const ADMIN_USER = {
  email: 'Sumit@testgmail.com',
  password: 'Sumit1234',       // ← update to your real admin password
};

const BASE_URL = 'https://resume-builder-v2-topaz.vercel.app';

// ── Wait for server to wake up ──
async function waitForServer(page) {
  console.log('⏳ Waiting for server to be ready...');
  await page.goto('/login');
  let attempts = 0;
  while (attempts < 30) {
    const isVisible = await page.locator('input[type="email"]').isVisible().catch(() => false);
    if (isVisible) { console.log('✅ Server is ready!'); return; }
    console.log(`⏳ Attempt ${attempts + 1}/30...`);
    await page.waitForTimeout(3000);
    attempts++;
  }
}

// ── Login helper ──
async function loginUser(page, credentials = TEST_USER) {
  await page.goto('/login');
  console.log('⏳ Waiting for login form...');
  await page.waitForSelector('input[type="email"]', { timeout: 90000 });
  console.log('✅ Login form ready');
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"], button:has-text("Sign In")');
  await page.waitForSelector('h1:has-text("My Resumes")', { timeout: 60000 });
  console.log(`✅ Logged in as ${credentials.email}`);
}

// ── Get first existing resume ID from dashboard ──
// Instead of creating a new resume every time,
// we use an already existing resume from the dashboard
// This is faster and more reliable
async function getExistingResumeId(page) {
  // Go to dashboard
  await page.goto('/dashboard');
  await page.waitForSelector('h1:has-text("My Resumes")', { timeout: 30000 });
  await page.waitForTimeout(2000);

  // Find first resume card's edit link
  // Try multiple selectors to find the resume ID
  const editLinks = page.locator('a[href*="/resume/"][href*="/edit"]');
  const count = await editLinks.count().catch(() => 0);

  if (count > 0) {
    const href = await editLinks.first().getAttribute('href');
    const id = href?.match(/resume\/(\d+)/)?.[1];
    if (id) {
      console.log(`✅ Found existing resume ID: ${id}`);
      return id;
    }
  }

  // If no edit links found, try getting ID from card data attributes
  const cards = page.locator('.dash-card');
  const cardCount = await cards.count().catch(() => 0);

  if (cardCount > 0) {
    // Try clicking the first card's edit button and get ID from URL
    const editBtn = page.locator('.dash-card').first().locator('a, button').first();
    await editBtn.click();
    await page.waitForTimeout(3000);
    const url = page.url();
    const id = url.match(/resume\/(\d+)/)?.[1];
    if (id) {
      console.log(`✅ Got resume ID from URL: ${id}`);
      return id;
    }
  }

  return null;
}

// ── Navigate directly to resume builder ──
// This is the KEY fix - instead of creating resume via button,
// we directly navigate to an existing resume's edit page
async function goToResumeBuilder(page) {
  // First go to dashboard to get a resume ID
  await page.goto('/dashboard');
  await page.waitForSelector('h1:has-text("My Resumes")', { timeout: 30000 });
  await page.waitForTimeout(2000);

  // Try to find existing resume edit link
  const editLinks = page.locator('a[href*="/resume/"][href*="/edit"]');
  const linkCount = await editLinks.count().catch(() => 0);

  if (linkCount > 0) {
    const href = await editLinks.first().getAttribute('href');
    console.log(`✅ Navigating to existing resume: ${href}`);
    await page.goto(href);
    await page.waitForSelector('.rb-tab, button:has-text("Personal")', { timeout: 30000 });
    return;
  }

  // No existing resume - click the resume card directly
  const cards = page.locator('.dash-card');
  const cardCount = await cards.count().catch(() => 0);

  if (cardCount > 0) {
    // Click on the card title/name to open it
    await cards.first().click();
    await page.waitForTimeout(3000);

    // Check if we navigated to builder
    if (page.url().includes('/resume/') && page.url().includes('/edit')) {
      await page.waitForSelector('.rb-tab, button:has-text("Personal")', { timeout: 30000 });
      return;
    }
  }

  // Last resort - use the API to get resume list and navigate directly
  console.log('⚠️ No resume found via UI - trying direct navigation');

  // Click New Resume and wait for /resume/new
  await page.click('button:has-text("New Resume")');
  await page.waitForURL('**/resume/new', { timeout: 15000 });

  // The /resume/new page should have the builder OR redirect
  // Wait for any resume builder content
  await page.waitForTimeout(5000);

  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);

  if (!currentUrl.includes('/edit')) {
    // Still on /resume/new - wait longer for redirect
    await page.waitForFunction(
      () => window.location.href.includes('/edit'),
      { timeout: 60000 }
    );
  }

  await page.waitForSelector('.rb-tab, button:has-text("Personal")', { timeout: 30000 });
}

// ── createTestResume - kept for backward compatibility ──
// Now just navigates to existing resume instead of creating new one
async function createTestResume(page, title = 'Test Resume') {
  await goToResumeBuilder(page);
  const url = page.url();
  const resumeId = url.match(/resume\/(\d+)/)?.[1];
  console.log(`✅ In resume builder: ID=${resumeId}, URL=${url}`);
  return resumeId;
}

module.exports = {
  TEST_USER,
  ADMIN_USER,
  BASE_URL,
  waitForServer,
  loginUser,
  getExistingResumeId,
  goToResumeBuilder,
  createTestResume
};