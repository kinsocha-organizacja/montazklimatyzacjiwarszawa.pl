// Synchronizuje navbar we wszystkich stronach HTML w public/ z src/components/Navbar.astro.
// Uruchom po KAŻDEJ zmianie w Navbar.astro:  node scripts/sync-navbar.cjs
// Podmienia: blok <nav class="navbar" id="navbar">...</nav>, skrypt <script data-proklima-nav>
// oraz public/navbar-style.css (kopia reguł navbara z public/css/style-index.css z kolorami na sztywno).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');

const navAstro = fs.readFileSync(path.join(ROOT, 'src/components/Navbar.astro'), 'utf8');
const navMatch = navAstro.match(/<nav class="navbar" id="navbar">[\s\S]*?<\/nav>/);
const jsMatch = navAstro.match(/<script>([\s\S]*?)<\/script>/);
if (!navMatch || !jsMatch) throw new Error('Navbar.astro: nie znaleziono <nav> lub <script>');
const NAV_HTML = navMatch[0];
const NAV_SCRIPT = `<script data-proklima-nav>\n${jsMatch[1].trim()}\n</script>`;

const SKIP_ROOT = new Set(['index.html', 'g-tech.html']);
const listHtml = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.html')).map(f => path.join(dir, f)) : [];
const files = [
  ...listHtml(PUB).filter(f => !SKIP_ROOT.has(path.basename(f))),
  ...listHtml(path.join(PUB, 'gree')),
  ...listHtml(path.join(PUB, 'rotenso')),
  ...listHtml(path.join(PUB, 'haier')),
];

let changed = 0;
for (const file of files) {
  const orig = fs.readFileSync(file, 'utf8');
  let html = orig.replace(/<nav class="navbar" id="navbar">[\s\S]*?<\/nav>/, NAV_HTML);
  if (html.includes('data-proklima-nav')) {
    html = html.replace(/<script data-proklima-nav>[\s\S]*?<\/script>/, NAV_SCRIPT);
  } else {
    html = html.replace('</body>', NAV_SCRIPT + '\n</body>');
  }
  if (html !== orig) { fs.writeFileSync(file, html, 'utf8'); changed++; }
}

// navbar-style.css z reguł style-index.css
const si = fs.readFileSync(path.join(PUB, 'css/style-index.css'), 'utf8').split(/\r?\n/);
const startIdx = si.findIndex(l => /^\s*\.navbar\s*\{/.test(l));
const heroIdx = si.findIndex((l, i) => i > startIdx && /\/\* === HERO === \*\//.test(l));
const mobStart = si.findIndex(l => /Ukrycie tekstu logo w zakresie 769-865px/.test(l));
const mobNavEnd = si.findIndex((l, i) => i > mobStart && /\.nav-phone \{ display: none; \}/.test(l));
const logoStart = si.findIndex(l => /NOWE LOGO Z EMOJI/.test(l));
const logoEnd = si.findIndex((l, i) => i > logoStart && /^\s*\.contact-grid\s*\{/.test(l));
if ([startIdx, heroIdx, mobStart, mobNavEnd, logoStart, logoEnd].some(i => i < 0)) throw new Error('style-index.css: nie znaleziono zakresów navbara');
const shadow = (si.join('\n').match(/--shadow:\s*([^;]+);/) || [])[1] || '0 4px 20px rgba(0,0,0,0.08)';
const VARS = { '--accent-light': '#3b82f6', '--accent': '#2563eb', '--primary': '#1a3a5c', '--text': '#1e293b', '--card': '#ffffff', '--border': '#e2e8f0', '--bg': '#f8fafc', '--muted': '#718096', '--shadow': shadow.trim() };
const inline = lines => lines.map(l => l.replace(/^ {4}/, '')).join('\n').replace(/var\((--[a-z-]+)\)/g, (m, v) => VARS[v] || m);
const css = `/* ============================================
   NAVBAR - wspólny dla stron HTML w public/
   GENEROWANY przez scripts/sync-navbar.cjs z css/style-index.css.
   Nie edytować ręcznie - zmiany robić w style-index.css i uruchomić skrypt.
   ============================================ */
${inline(si.slice(startIdx, heroIdx))}
${inline(si.slice(logoStart, logoEnd))}
${inline(si.slice(mobStart, mobNavEnd + 1))}
}
/* reset listy: style-index.css ma globalny reset ul, style.css produktów nie */
.nav-links { margin: 0; padding: 0; list-style: none; }
.nav-dropdown-menu { margin: 0; list-style: none; }
`;
fs.writeFileSync(path.join(PUB, 'navbar-style.css'), css, 'utf8');

console.log(`navbar: sprawdzono ${files.length} plików, zmieniono ${changed}; navbar-style.css odświeżony`);
