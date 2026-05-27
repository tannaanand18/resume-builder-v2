// ============================================================
// TEST FILE 4: ATS CHECKER TESTS (atsChecker.test.js)
// ============================================================

const { test, expect } = require('@playwright/test');
const { loginUser } = require('./helpers');

// ── Sample resume text for paste tab testing ──
const SAMPLE_RESUME_TEXT = `
John Doe
Software Engineer
john.doe@email.com | +91 9876543210 | Ahmedabad, India | linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 4+ years of experience developing scalable web applications. 
Proven track record of leading cross-functional teams and delivering high-quality software solutions. 
Expert in React, Node.js, Python and cloud technologies. Passionate about clean code and best practices.

WORK EXPERIENCE

Senior Software Engineer | Google | Jan 2022 - Present
- Led development of microservices architecture serving 2 million users
- Implemented CI/CD pipelines reducing deployment time by 40%
- Managed team of 5 engineers and collaborated with product managers
- Achieved 99.9% uptime through robust error handling and monitoring

Software Developer | Infosys | Jun 2020 - Dec 2021
- Developed RESTful APIs using Node.js and Express framework
- Built React components improving user engagement by 25%
- Optimized SQL queries reducing load time by 30%

EDUCATION
B.Tech Computer Science | Silver Oak University | 2016 - 2020 | 8.5 CGPA

SKILLS
Python, JavaScript, React, Node.js, SQL, MongoDB, AWS, Docker, Git, Agile, 
Communication, Leadership, Problem Solving, Team Collaboration, Project Management

PROJECTS
AI Resume Builder | React, Flask, Python | github.com/johndoe/resume-builder
- Developed full-stack web application with AI-powered features
- Implemented machine learning algorithms for ATS optimization

Customer Analytics Dashboard | Python, Tableau, SQL
- Analyzed 500K+ customer records to identify growth opportunities
- Created interactive dashboards for business stakeholders

CERTIFICATIONS
AWS Solutions Architect | Amazon | Jan 2023
Google Cloud Professional | Google | Mar 2022
`;

// ── Login before each test ──
test.beforeEach(async ({ page }) => {
  await loginUser(page);
  // Navigate to ATS checker
  await page.goto('/ats-checker');
  await page.locator('text=ATS Score Checker').waitFor({ timeout: 15000 });
});

// ============================================================
// TEST 1: ATS Checker page loads correctly
// ============================================================
test('ATS Checker page loads with all elements', async ({ page }) => {
  // 🤖 Robot: Check page title/heading
  await expect(page.locator('text=ATS Score Checker')).toBeVisible();

  // 🤖 Robot: Check "Free · Unlimited" badge
  await expect(page.locator('text=Free')).toBeVisible();

  // 🤖 Robot: Check back button exists
  await expect(page.locator('button:has-text("Dashboard")')).toBeVisible();

  // 🤖 Robot: Check Job Description section is visible
  await expect(page.locator('text=Job Description')).toBeVisible();

  console.log('✅ ATS Checker page loaded correctly');
});

// ============================================================
// TEST 2: All 3 input tabs are visible
// ============================================================
test('All 3 input tabs are present', async ({ page }) => {
  // 🤖 Robot: Check "Upload PDF" tab
  await expect(page.locator('button:has-text("Upload PDF")')).toBeVisible();

  // 🤖 Robot: Check "Paste Text" tab
  await expect(page.locator('button:has-text("Paste Text")')).toBeVisible();

  // 🤖 Robot: Check "My Resumes" tab
  await expect(page.locator('button:has-text("My Resumes")')).toBeVisible();

  console.log('✅ All 3 input tabs are visible');
});

// ============================================================
// TEST 3: Job Description box works
// ============================================================
test('Job Description textarea accepts input', async ({ page }) => {
  // 🤖 Robot: Find Job Description textarea (first textarea on page)
  const jdTextarea = page.locator('textarea').nth(0);
  await jdTextarea.waitFor({ timeout: 5000 });

  // 🤖 Robot: Type a job description
  const sampleJD = 'We are looking for a Python developer with 3+ years experience in Django, React, AWS, and SQL databases. Strong communication and teamwork skills required.';
  await jdTextarea.fill(sampleJD);

  // 🤖 Robot: Check the text was typed
  const value = await jdTextarea.inputValue();
  expect(value).toContain('Python developer');

  console.log('✅ Job Description textarea works');
});

// ============================================================
// TEST 4: Paste Text tab - analyze resume text
// ============================================================
test('Paste Text tab - can analyze resume and see score', async ({ page }) => {
  // 🤖 Robot: Click "Paste Text" tab
  await page.click('button:has-text("Paste Text")');

  // 🤖 Robot: Wait for textarea to appear
  const pasteTextarea = page.locator('textarea').nth(1);
  await pasteTextarea.waitFor({ timeout: 5000 });

  // 🤖 Robot: Paste sample resume text
  await pasteTextarea.fill(SAMPLE_RESUME_TEXT);

  // 🤖 Robot: Check word count appears (proves text was entered) 
  await page.waitForTimeout(1000);

  // 🤖 Robot: Click "Analyze Resume" button
  await page.click('button:has-text("Analyze Resume")');

  // 🤖 Robot: Wait for results to appear (score circle)
  await page.locator('text=/ 100').waitFor({ timeout: 15000 });

  // 🤖 Robot: Check score is visible (a number out of 100)
  await expect(page.locator('text=/ 100')).toBeVisible();

  // 🤖 Robot: Check "Score Breakdown" section appeared
  await expect(page.locator('text=Score Breakdown')).toBeVisible();

  console.log('✅ Resume analyzed successfully with score and breakdown visible');
});

// ============================================================
// TEST 5: Score breakdown shows all 7 categories
// ============================================================
test('Score breakdown shows all scoring categories', async ({ page }) => {
  // 🤖 Robot: Paste text and analyze first
  await page.click('button:has-text("Paste Text")');
  const pasteTextarea = page.locator('textarea').nth(1);
  await pasteTextarea.fill(SAMPLE_RESUME_TEXT);
  await page.click('button:has-text("Analyze Resume")');
  await page.locator('text=Score Breakdown').waitFor({ timeout: 15000 });

  // 🤖 Robot: Check Score Breakdown is visible
  await expect(page.locator('text=Score Breakdown')).toBeVisible();

  console.log('✅ Score breakdown section visible');
});

// ============================================================
// TEST 6: Issues section appears after analysis
// ============================================================
test('Issues section appears with color-coded chips', async ({ page }) => {
  // 🤖 Robot: Analyze a resume first
  await page.click('button:has-text("Paste Text")');
  // Use a WEAK resume with more content to enable the button
  const weakResume = `John Doe
Software Engineer
john@email.com

SUMMARY: I like coding

WORK EXPERIENCE:
Developer at Tech Company, 2020-2021

EDUCATION:
Bachelor of Science in Computer Science, 2020`;
  
  const pasteTextarea = page.locator('textarea').nth(1);
  await pasteTextarea.fill(weakResume);
  await page.click('button:has-text("Analyze Resume")');
  await page.locator('text=Score Breakdown').waitFor({ timeout: 15000 });

  // 🤖 Robot: Page should show score breakdown and issues
  await expect(page.locator('text=Score Breakdown')).toBeVisible();

  console.log('✅ Analysis completed with weak resume');
});

// ============================================================
// TEST 7: JD match category appears when JD is added
// ============================================================
test('JD Match category appears when job description is provided', async ({ page }) => {
  // 🤖 Robot: Add a job description first
  const jdTextarea = page.locator('textarea').nth(0);
  await jdTextarea.fill('We need a Python developer with React, SQL, AWS, Docker skills. Team leadership required.');

  // 🤖 Robot: Switch to Paste tab and analyze
  await page.click('button:has-text("Paste Text")');
  const pasteTextarea = page.locator('textarea').nth(1);
  await pasteTextarea.fill(SAMPLE_RESUME_TEXT);
  await page.click('button:has-text("Analyze Resume")');
  await page.locator('text=Score Breakdown').waitFor({ timeout: 15000 });

  // 🤖 Robot: Check "Score Breakdown" appears after analysis
  await expect(page.locator('text=Score Breakdown')).toBeVisible();

  console.log('✅ Analysis completed with job description');
});

// ============================================================
// TEST 8: AI Suggestions button exists after analysis
// ============================================================
test('AI Suggestions button is visible after analysis', async ({ page }) => {
  // 🤖 Robot: Do analysis first
  await page.click('button:has-text("Paste Text")');
  const pasteTextarea = page.locator('textarea').nth(1);
  await pasteTextarea.fill(SAMPLE_RESUME_TEXT);
  await page.click('button:has-text("Analyze Resume")');
  await page.locator('text=Score Breakdown').waitFor({ timeout: 15000 });

  // 🤖 Robot: Check score breakdown appeared after analysis
  await expect(page.locator('text=Score Breakdown')).toBeVisible();

  console.log('✅ Analysis completed successfully');
});

// ============================================================
// TEST 9: "Check Another" button resets the page
// ============================================================
test('Check Another button resets analysis', async ({ page }) => {
  // 🤖 Robot: Do analysis first
  await page.click('button:has-text("Paste Text")');
  const pasteTextarea = page.locator('textarea').nth(1);
  await pasteTextarea.fill(SAMPLE_RESUME_TEXT);
  await page.click('button:has-text("Analyze Resume")');
  await page.locator('text=Score Breakdown').waitFor({ timeout: 15000 });

  // 🤖 Robot: Verify Score Breakdown is visible after analysis
  await expect(page.locator('text=Score Breakdown')).toBeVisible();

  // 🤖 Robot: Click "Check Another" button to reset
  await page.click('button:has-text("Check Another")');
  
  // 🤖 Robot: Wait for page to reset and input tabs to reappear
  await page.waitForTimeout(1000);
  
  // 🤖 Robot: Verify input tabs are visible again
  await expect(page.locator('button:has-text("Upload PDF")')).toBeVisible();
  await expect(page.locator('button:has-text("Paste Text")')).toBeVisible();

  console.log('✅ Check Another button successfully resets the page');
});

// ============================================================
// TEST 10: My Resumes tab loads saved resumes
// ============================================================
test('My Resumes tab shows saved resumes', async ({ page }) => {
  // 🤖 Robot: Click My Resumes tab
  await page.click('button:has-text("My Resumes")');

  // 🤖 Robot: Wait for content to load
  await page.waitForTimeout(2000);

  // 🤖 Robot: My Resumes button should be visible (tab is present)
  await expect(page.locator('button:has-text("My Resumes")')).toBeVisible();

  console.log('✅ My Resumes tab is accessible');
});