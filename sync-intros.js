#!/usr/bin/env node
/**
 * sync-intros.js — Fetches candidate intro HTML from Zlife (Haiilo) API
 * and patches the INTROS object in pages/who-we-are/index.html.
 *
 * Prerequisites:
 *   npm install playwright   (or:  npx playwright install chromium)
 *
 * Usage:
 *   node sync-intros.js
 *
 * The script:
 *  1. Launches Chromium using your existing Chrome profile (SSO session)
 *  2. Fetches the blog article list from Zlife API
 *  3. For each article, fetches the widget HTML content
 *  4. Cleans up the HTML (strips inline styles, preserves structure)
 *  5. Writes intros-synced.json (name → HTML mapping)
 *  6. Patches the INTROS object in pages/who-we-are/index.html
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ── Constants ─────────────────────────────────────────────────────────────
const SENDER_ID = '56266ee2-48ad-4b42-9d04-9dee0226c6ec';
const APP_ID    = 'd4091f04-f134-45f5-8634-bf1825d90007';
const BASE      = 'https://zlife.zalando.net';

const ARTICLES_URL = `${BASE}/web/senders/${SENDER_ID}/apps/${APP_ID}/blog/articles?_page=0&_pageSize=200&_orderBy=publishDate,DESC&includePublished=true`;
const WIDGET_URL   = (articleId) =>
  `${BASE}/web/blog-article/${articleId}/widgets/app-blog-${APP_ID}-${articleId}`;

const V1_PATH = path.join(__dirname, 'pages/who-we-are/index.html');
const JSON_OUT = path.join(__dirname, 'intros-synced.json');

// ── HTML cleanup ──────────────────────────────────────────────────────────
function cleanHtml(raw) {
  if (!raw) return '';

  let html = raw;

  // Strip inline style attributes (verbose Google Docs paste styles)
  html = html.replace(/\s+style="[^"]*"/g, '');

  // Strip id="isPasted" artifacts
  html = html.replace(/\s+id="isPasted"/g, '');

  // Collapse whitespace in tags
  html = html.replace(/<(\w+)\s+>/g, '<$1>');

  // Convert <span> wrappers to plain text (remove span tags entirely)
  html = html.replace(/<span>/g, '').replace(/<\/span>/g, '');

  // But preserve <strong>, <em>, <a>, <ul>, <ol>, <li>, <p>, <h1-6>
  // Remove empty <p></p> tags
  html = html.replace(/<p>\s*<\/p>/g, '');

  // Normalize &nbsp; to regular spaces
  html = html.replace(/&nbsp;/g, ' ');

  // Trim whitespace inside tags
  html = html.replace(/>\s+</g, '><');

  // But keep space between inline text
  html = html.replace(/<\/p><p>/g, '</p>\n<p>');
  html = html.replace(/<\/li><li>/g, '</li>\n<li>');
  html = html.replace(/<\/ul><p>/g, '</ul>\n<p>');
  html = html.replace(/<\/p><ul>/g, '</p>\n<ul>');
  html = html.replace(/<\/ol><p>/g, '</ol>\n<p>');
  html = html.replace(/<\/p><ol>/g, '</p>\n<ol>');

  // Strip font-weight:bold styled spans → <strong>
  // (already handled by removing style attrs, but bold <span> → nothing)
  // Keep <strong> and <em> that are already semantic

  return html.trim();
}

// ── Main ──────────────────────────────────────────────────────────────────
(async () => {
  console.log('Launching browser (using existing Chrome profile for SSO)...');

  // Use the default Chrome user data dir for SSO cookies
  const userDataDir = path.join(
    process.env.HOME, 'Library/Application Support/Google/Chrome'
  );

  let browser;
  try {
    browser = await chromium.launchPersistentContext(userDataDir, {
      headless: false,  // SSO may need visible browser
      channel: 'chrome',
      args: ['--no-first-run', '--disable-blink-features=AutomationControlled'],
      timeout: 30000,
    });
  } catch (e) {
    console.error('Failed to launch Chrome. Make sure Chrome is closed first.');
    console.error('(Playwright needs exclusive access to the Chrome profile)');
    console.error(e.message);
    process.exit(1);
  }

  const page = browser.pages()[0] || await browser.newPage();

  // ── Step 1: Navigate to Zlife to trigger SSO if needed ──
  console.log('Navigating to Zlife...');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });

  // Check if we're authenticated
  const meResp = await page.evaluate(async (url) => {
    const r = await fetch(url);
    return { status: r.status };
  }, `${BASE}/web/users/me`);

  if (meResp.status !== 200) {
    console.log('Not authenticated. Please log in in the browser window...');
    console.log('Waiting up to 120 seconds for SSO...');
    await page.waitForURL('**/zlife.zalando.net/**', { timeout: 120000 });
    await page.waitForTimeout(3000);
  }

  console.log('Authenticated. Fetching article list...');

  // ── Step 2: Fetch all articles ──
  const articlesJson = await page.evaluate(async (url) => {
    const r = await fetch(url);
    return r.json();
  }, ARTICLES_URL);

  // The response is either { content: [...] } or just an array
  const articles = articlesJson.content || articlesJson;
  console.log(`Found ${articles.length} articles.`);

  // ── Step 3: Fetch HTML content for each article ──
  const intros = {};
  let fetched = 0;
  let errors = 0;

  for (const article of articles) {
    const { id, title } = article;
    if (!title || !id) continue;

    try {
      const widgetJson = await page.evaluate(async (url) => {
        const r = await fetch(url);
        if (!r.ok) return null;
        return r.json();
      }, WIDGET_URL(id));

      if (!widgetJson || !widgetJson.rows) {
        console.log(`  [skip] ${title}: no widget content`);
        continue;
      }

      // Extract html_content from the nested widget structure
      let htmlContent = '';
      for (const row of widgetJson.rows) {
        for (const col of row) {
          for (const widget of (col.widgets || [])) {
            if (widget.settings && widget.settings.html_content) {
              htmlContent += widget.settings.html_content;
            }
          }
        }
      }

      if (!htmlContent) {
        console.log(`  [skip] ${title}: empty html_content`);
        continue;
      }

      const cleaned = cleanHtml(htmlContent);
      intros[title] = cleaned;
      fetched++;

      if (fetched % 10 === 0) {
        console.log(`  Fetched ${fetched}/${articles.length}...`);
      }
    } catch (err) {
      console.log(`  [error] ${title}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone: ${fetched} intros fetched, ${errors} errors.`);

  // ── Step 4: Write JSON output ──
  fs.writeFileSync(JSON_OUT, JSON.stringify(intros, null, 2), 'utf8');
  console.log(`Written to ${JSON_OUT}`);

  // ── Step 5: Patch v1 HTML ──
  console.log('Patching pages/who-we-are/index.html...');

  let html = fs.readFileSync(V1_PATH, 'utf8');

  // Find the INTROS object in the script
  const introsStart = html.indexOf('const INTROS = {');
  const introsEnd   = html.indexOf('\n};', introsStart);

  if (introsStart === -1 || introsEnd === -1) {
    console.error('Could not find INTROS object in v1 HTML. Skipping patch.');
  } else {
    // Build new INTROS block
    const entries = Object.entries(intros).map(([name, content]) => {
      // Escape backticks and ${} for template literals
      const escaped = content
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
      return `  ${JSON.stringify(name)}: \`${escaped}\``;
    });

    const newIntros = `const INTROS = {\n${entries.join(',\n')}\n}`;

    html = html.substring(0, introsStart) + newIntros + html.substring(introsEnd + 3);

    fs.writeFileSync(V1_PATH, html, 'utf8');
    console.log('v1 HTML patched successfully.');
  }

  await browser.close();
  console.log('Browser closed. All done!');
})();
