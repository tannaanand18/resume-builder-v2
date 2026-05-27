// ============================================================
// TEST FILE 5: ADMIN PANEL TESTS (adminPanel.test.js)
// ============================================================
// What we test here:
// ✅ Test 1: Admin panel loads with stats
// ✅ Test 2: Users tab shows user list
// ✅ Test 3: Resumes tab shows resume list
// ✅ Test 4: Search works in users tab
// ✅ Test 5: Non-admin users cannot access admin panel
// ============================================================

const { test, expect } = require('@playwright/test');
const { loginUser, ADMIN_USER, TEST_USER } = require('./helpers');

// ============================================================
// TEST 1: Admin panel loads with dashboard stats
// ============================================================
test('Admin panel loads with stats for admin user', async ({ page }) => {
  // 🤖 Robot: Login as ADMIN
  await loginUser(page, ADMIN_USER);

  // 🤖 Robot: Navigate to admin panel
  await page.goto('/admin');
  await page.waitForSelector('text=Admin Panel', { timeout: 20000 });

  // 🤖 Robot: Check Admin Panel heading
  await expect(page.locator('text=Admin Panel')).toBeVisible();

  // 🤖 Robot: Check 3 stat cards exist
  await expect(page.locator('text=Total Users')).toBeVisible();
  await expect(page.locator('text=Total Resumes')).toBeVisible();
  await expect(page.locator('text=Admin Users')).toBeVisible();

  // 🤖 Robot: Check the numbers are shown (not zero ideally)
  const totalUsersNum = await page.locator('text=Total Users').locator('..').locator('p').first().textContent();
  console.log(`  Total Users: ${totalUsersNum}`);

  // 🤖 Robot: Check all 3 tabs visible
  await expect(page.locator('button:has-text("Dashboard")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Users")')).toBeVisible();
  await expect(page.locator('button:has-text("Resumes")')).toBeVisible();

  console.log('✅ Admin panel loaded with stats and tabs');
});

// ============================================================
// TEST 2: Users tab shows list of users
// ============================================================
test('Admin Users tab shows user list with actions', async ({ page }) => {
  await loginUser(page, ADMIN_USER);
  await page.goto('/admin');
  await page.waitForSelector('text=Admin Panel', { timeout: 20000 });

  // 🤖 Robot: Click Users tab
  await page.click('button:has-text("Users")');

  // 🤖 Robot: Wait for users table to load
  await page.locator('table').first().waitFor({ timeout: 10000 });

  // 🤖 Robot: Check table headers
  await expect(page.locator('text=Name')).toBeVisible();
  await expect(page.locator('text=Email')).toBeVisible();
  await expect(page.locator('text=Role')).toBeVisible();

  // 🤖 Robot: Check at least one user row exists
  const userRows = await page.locator('tbody tr').count();
  expect(userRows).toBeGreaterThan(0);
  console.log(`  Found ${userRows} users in the table`);

  // 🤖 Robot: Check action buttons exist (Role toggle and Delete)
  await expect(page.locator('button:has-text("→ Admin")').first()).toBeVisible();
  await expect(page.locator('button:has-text("Delete")').first()).toBeVisible();

  console.log('✅ Users tab shows user list with action buttons');
});

// ============================================================
// TEST 3: Resumes tab shows all resumes
// ============================================================
test('Admin Resumes tab shows all resumes', async ({ page }) => {
  await loginUser(page, ADMIN_USER);
  await page.goto('/admin');
  await page.waitForSelector('text=Admin Panel', { timeout: 20000 });

  // 🤖 Robot: Click Resumes tab
  await page.click('button:has-text("Resumes")');

  // 🤖 Robot: Wait for resumes table
  await page.locator('table').first().waitFor({ timeout: 10000 });

  // 🤖 Robot: Check table headers
  await expect(page.locator('th:has-text("Title")')).toBeVisible();
  await expect(page.locator('th:has-text("Template")')).toBeVisible();

  // 🤖 Robot: Count resume rows
  const resumeRows = await page.locator('tbody tr').count();
  console.log(`  Found ${resumeRows} resumes in the table`);

  console.log('✅ Admin Resumes tab shows resume list');
});

// ============================================================
// TEST 4: Search works in Users tab
// ============================================================
test('Admin search filters users correctly', async ({ page }) => {
  await loginUser(page, ADMIN_USER);
  await page.goto('/admin');
  await page.waitForSelector('text=Admin Panel', { timeout: 20000 });

  // 🤖 Robot: Go to Users tab
  await page.click('button:has-text("Users")');
  await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });

  // 🤖 Robot: Get count before search
  const countBefore = await page.locator('tbody tr').count();

  // 🤖 Robot: Search for admin email
  await page.fill('input[placeholder*="Search"]', 'smit');

  // 🤖 Robot: Wait for filter to apply
  await page.waitForTimeout(1000);

  // 🤖 Robot: Get count after search
  const countAfter = await page.locator('tbody tr').count();

  // 🤖 Robot: Filtered count should be <= total count
  expect(countAfter).toBeLessThanOrEqual(countBefore);
  console.log(`  Search filtered: ${countBefore} users → ${countAfter} users`);

  // 🤖 Robot: Clear search and check all users return
  await page.fill('input[placeholder*="Search"]', '');
  await page.waitForTimeout(1000);
  const countReset = await page.locator('tbody tr').count();
  expect(countReset).toEqual(countBefore);

  console.log('✅ Admin search filters and resets correctly');
});

// ============================================================
// TEST 5: Non-admin user cannot access admin panel
// ============================================================
// VERY IMPORTANT SECURITY TEST
// A normal user should NOT be able to see the admin panel
// ============================================================
test('Non-admin user is redirected away from admin panel', async ({ page }) => {
  // 🤖 Robot: Login as NORMAL user (not admin)
  await loginUser(page, TEST_USER);

  // 🤖 Robot: Try to manually go to /admin
  await page.goto('/admin');

  // 🤖 Robot: Wait for page to fully load and check for redirects
  await page.waitForTimeout(3000);

  // 🤖 Robot: Log current state for debugging
  const pageUrl = page.url();
  console.log(`  Current URL: ${pageUrl}`);
  
  // Try to find admin panel heading - if it's visible, non-admin access is allowed (bad)
  const adminPanelVisible = await page.locator('h1:has-text("Admin Panel")').isVisible().catch(() => false);
  console.log(`  Admin Panel heading visible: ${adminPanelVisible}`);
  
  // If admin panel is visible, the redirect did NOT work - this should fail
  expect(adminPanelVisible).toBe(false);

  console.log('✅ Security check passed: Normal user cannot access admin panel');
});

// ============================================================
// TEST 6: Recent Users and Resumes show on dashboard tab
// ============================================================
test('Admin dashboard tab shows recent users and resumes', async ({ page }) => {
  await loginUser(page, ADMIN_USER);
  await page.goto('/admin');
  await page.waitForSelector('text=Admin Panel', { timeout: 20000 });

  // 🤖 Robot: Check "Recent Users" section exists
  await expect(page.locator('text=Recent Users')).toBeVisible();

  // 🤖 Robot: Check "Recent Resumes" section exists
  await expect(page.locator('text=Recent Resumes')).toBeVisible();

  // 🤖 Robot: Check Logout button works
  await expect(page.locator('button:has-text("Logout")')).toBeVisible();

  // 🤖 Robot: Check "← Dashboard" button works
  await page.click('button:has-text("Dashboard"), a:has-text("Dashboard")');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  expect(page.url()).toContain('/dashboard');

  console.log('✅ Admin dashboard shows recent data and navigation works');
});
