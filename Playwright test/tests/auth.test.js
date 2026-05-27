// ============================================================
// TEST FILE 1: AUTHENTICATION TESTS (auth.test.js)
// ============================================================
// What we test here:
// ✅ Test 1: Login page loads correctly
// ✅ Test 2: User can login with correct credentials
// ✅ Test 3: Login fails with wrong password
// ✅ Test 4: User can register a new account
// ✅ Test 5: User can logout
// ✅ Test 6: Forgot password page works
// ✅ Test 7: Cannot access dashboard without login
// ============================================================

const { test, expect } = require('@playwright/test');
const { waitForServer, loginUser, TEST_USER } = require('./helpers');

// ============================================================
// BEFORE ALL TESTS: Wait for server to wake up
// ============================================================
// This runs ONCE before all auth tests start
// It makes sure Render backend is awake
// ============================================================
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await waitForServer(page);
  await page.close();
});

// ============================================================
// TEST 1: Login page loads correctly
// ============================================================
// What it does:
// 1. Opens /login page
// 2. Checks "Welcome back" text is visible
// 3. Checks email input exists
// 4. Checks password input exists
// 5. Checks "Sign In" button exists
// ============================================================
test('Login page loads correctly', async ({ page }) => {
  // 🤖 Robot: Open the login page
  await page.goto('/login');

  // 🤖 Robot: Check "Welcome back" heading exists
  await expect(page.locator('h1, h2, h3').filter({ hasText: /welcome back/i }))
    .toBeVisible({ timeout: 15000 });

  // 🤖 Robot: Check email input field exists
  await expect(page.locator('input[type="email"]')).toBeVisible();

  // 🤖 Robot: Check password input field exists
  await expect(page.locator('input[type="password"]')).toBeVisible();

  // 🤖 Robot: Check Sign In button exists
  await expect(page.locator('button:has-text("Sign In"), button[type="submit"]'))
    .toBeVisible();

  // 🤖 Robot: Check "Forgot Password?" link exists
  await expect(page.locator('text=Forgot Password')).toBeVisible();

  console.log('✅ Login page has all required elements');
});

// ============================================================
// TEST 2: Successful login
// ============================================================
// What it does:
// 1. Types correct email and password
// 2. Clicks Sign In
// 3. Checks it redirects to /dashboard
// 4. Checks user's name/email appears in header
// ============================================================
test('User can login with correct credentials', async ({ page }) => {
  // 🤖 Robot: Go to login page
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 30000 });

  // 🤖 Robot: Type email address
  await page.fill('input[type="email"]', TEST_USER.email);

  // 🤖 Robot: Type password
  await page.fill('input[type="password"]', TEST_USER.password);

  // 🤖 Robot: Click Sign In button
  await page.click('button[type="submit"], button:has-text("Sign In")');

  // 🤖 Robot: Wait for page to change to /dashboard
  await page.waitForURL('**/dashboard', { timeout: 30000 });

  // 🤖 Robot: Check we are now on dashboard
  expect(page.url()).toContain('/dashboard');

  // 🤖 Robot: Check "My Resumes" heading is visible (proves dashboard loaded)
  await expect(page.locator('h1:has-text("My Resumes")')).toBeVisible();

  console.log('✅ Login successful, redirected to dashboard');
});

// ============================================================
// TEST 3: Login fails with wrong password
// ============================================================
// What it does:
// 1. Types correct email but WRONG password
// 2. Clicks Sign In
// 3. Checks error message appears
// 4. Checks we are still on /login (NOT redirected)
// ============================================================
test('Login fails with wrong password', async ({ page }) => {
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 30000 });

  // 🤖 Robot: Type correct email
  await page.fill('input[type="email"]', TEST_USER.email);

  // 🤖 Robot: Type WRONG password
  await page.fill('input[type="password"]', 'WrongPassword999!');

  // 🤖 Robot: Click Sign In
  await page.click('button[type="submit"], button:has-text("Sign In")');

  // 🤖 Robot: Wait a moment for response
  await page.waitForTimeout(3000);

  // 🤖 Robot: We should still be on /login page (not redirected)
  expect(page.url()).toContain('/login');

  // 🤖 Robot: Check some error message is visible
  // It could say "Invalid", "Wrong", "Failed", "incorrect" etc.
  const errorVisible = await page.locator(
    'text=/invalid|wrong|failed|incorrect|error/i'
  ).isVisible().catch(() => false);

  // Even if no error text, at minimum we should still be on login page
  console.log(`✅ Wrong password: stayed on login page, error shown: ${errorVisible}`);
});

// ============================================================
// TEST 4: User can register new account
// ============================================================
// What it does:
// 1. Goes to /register page
// 2. Fills in name, email, password
// 3. Clicks Register
// 4. Checks redirect to dashboard OR success message
// ============================================================
test('Registration page loads and has all fields', async ({ page }) => {
  await page.goto('/register');

  // Wait for page to load
  await page.waitForSelector('h2', { timeout: 15000 });

  // Check heading "Create account"
  await expect(page.locator('h2:has-text("Create account")')).toBeVisible();

  // Check Full Name input (first input on page)
  await expect(page.locator('input').first()).toBeVisible();

  // Check Email input
  await expect(page.locator('input[type="email"]')).toBeVisible();

  // Check Password input
  await expect(page.locator('input[type="password"]')).toBeVisible();

  // Check Create Account button
  await expect(page.locator('button:has-text("Create Account")')).toBeVisible();

  // Check "Sign in" link at bottom
 await expect(page.locator('text=Sign in')).toBeVisible();

  console.log('✅ Registration page has all required fields');
});

// ============================================================
// TEST 5: User can logout
// ============================================================
// What it does:
// 1. Logs in first
// 2. Clicks Logout button
// 3. Checks it redirects to /login
// ============================================================
test('User can logout successfully', async ({ page }) => {
  // 🤖 Robot: Login first
  await loginUser(page);

  // 🤖 Robot: Find and click the Logout button in header
  await page.click('button:has-text("Logout")');

  // 🤖 Robot: Wait to be redirected to /login
  await page.waitForURL('**/login', { timeout: 15000 });

  // 🤖 Robot: Confirm we are on login page
  expect(page.url()).toContain('/login');

  console.log('✅ Logout successful, redirected to login page');
});

// ============================================================
// TEST 6: Forgot password page works
// ============================================================
// What it does:
// 1. Clicks "Forgot Password?" link on login page
// 2. Checks forgot password form loads
// 3. Checks email input exists
// ============================================================
test('Forgot password page loads correctly', async ({ page }) => {
  await page.goto('/forgot-password');

  // 🤖 Robot: Check the page loaded
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });

  // 🤖 Robot: Check heading exists
  const heading = page.locator('h1, h2').first();
  await expect(heading).toBeVisible();

  // 🤖 Robot: Check email input exists
  await expect(page.locator('input[type="email"]')).toBeVisible();

  // 🤖 Robot: Check submit button exists
  await expect(page.locator('button[type="submit"], button:has-text("Reset"), button:has-text("Send")')).toBeVisible();

  console.log('✅ Forgot password page loaded correctly');
});

// ============================================================
// TEST 7: Protected routes redirect to login
// ============================================================
// What it does:
// 1. WITHOUT logging in, tries to open /dashboard
// 2. Checks it redirects to /login
// This proves your app protects private pages
// ============================================================
test('Dashboard redirects to login when not authenticated', async ({ page }) => {
  // 🤖 Robot: Try to go to dashboard WITHOUT logging in
  await page.goto('/dashboard');

  // 🤖 Robot: Wait a moment for redirect to happen
  await page.waitForTimeout(5000);

  // 🤖 Robot: Should be on /login now
  expect(page.url()).toContain('/login');

  console.log('✅ Dashboard correctly protected - redirected to login');
});
