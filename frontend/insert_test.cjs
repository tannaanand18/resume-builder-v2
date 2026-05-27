const fs = require('fs');
let src = fs.readFileSync('src/tests/ResumeBuilder.test.jsx', 'utf8');
const lines = src.split('\n');

// Find the TEMPLATE ALIAS STYLES comment line
const aliasIdx = lines.findIndex(l => l.includes('TEMPLATE ALIAS STYLES'));
console.log('Found TEMPLATE ALIAS STYLES at line', aliasIdx + 1);

// Insert the new test block before that line
const newBlock = [
  '',
  '// ────────── TEMPLATE RENDERING: NULL NAME FALLBACK ──────────',
  '',
  'describe("template rendering with null name", () => {',
  '  test.each(UNIQUE_STYLES)("renders %s template with empty full_name", async (style) => {',
  '    global.fetch = createFetchMock(style, true, { nullName: true });',
  '    renderPage();',
  '    await waitFor(() => {',
  '      expect(screen.getByPlaceholderText("Resume Title")).toHaveValue("Test Resume");',
  '    });',
  '  });',
  '});',
];

lines.splice(aliasIdx, 0, ...newBlock);
fs.writeFileSync('src/tests/ResumeBuilder.test.jsx', lines.join('\n'), 'utf8');
console.log('Inserted null name test block before line', aliasIdx + 1);
