#!/usr/bin/env node
/**
 * sync-intros.js — Fetches candidate intro HTML from Zlife (Haiilo) API
 * and patches the INTROS object + CANDIDATES array in pages/who-we-are/index.html.
 *
 * Prerequisites:
 *   npm install playwright
 *
 * Usage:
 *   node sync-intros.js
 *
 * Logs are written to logs/<timestamp>.log with full detail.
 * Terminal output is minimal (progress + summary).
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ── Constants ─────────────────────────────────────────────────────────────
const SENDER_ID = '56266ee2-48ad-4b42-9d04-9dee0226c6ec';
const APP_ID    = 'd4091f04-f134-45f5-8634-bf1825d90007';
const BASE      = 'https://zlife.zalando.net';

const WIDGET_URL = (articleId) =>
  `${BASE}/web/blog-article/${articleId}/widgets/app-blog-${APP_ID}-${articleId}`;

const V1_PATH    = path.join(__dirname, 'pages/who-we-are/index.html');
const JSON_OUT   = path.join(__dirname, 'intros-synced.json');
const PHOTOS_DIR = path.join(__dirname, 'pages/who-we-are/photos');
const PHOTO_URL  = (fileId) => `${BASE}/web/senders/${SENDER_ID}/documents/${fileId}?type=XL`;
const LOGS_DIR   = path.join(__dirname, 'logs');

// ── Logger ────────────────────────────────────────────────────────────────
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
const logFile = path.join(LOGS_DIR, `${timestamp}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(msg, { console: toConsole = false } = {}) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  logStream.write(line + '\n');
  if (toConsole) console.log(msg);
}

function logSection(title) {
  log(`\n${'═'.repeat(60)}`, { console: true });
  log(`  ${title}`, { console: true });
  log('═'.repeat(60), { console: true });
}

// ── HTML cleanup ──────────────────────────────────────────────────────────
function cleanHtml(raw) {
  if (!raw) return '';
  let html = raw;

  // Convert bold spans to <strong> BEFORE stripping styles
  // Use function replacer to avoid $-backreference issues with emoji content
  html = html.replace(/<span\s+style="[^"]*font-weight:\s*(bold|[7-9]00)[^"]*">([\s\S]*?)<\/span>/gi, (_, _w, content) => `<strong>${content}</strong>`);

  // Convert italic spans to <em> BEFORE stripping styles
  html = html.replace(/<span\s+style="[^"]*font-style:\s*italic[^"]*">([\s\S]*?)<\/span>/gi, (_, content) => `<em>${content}</em>`);

  // Convert bold+italic (nested after above, or combined in one span)
  html = html.replace(/<strong><span\s+style="[^"]*font-style:\s*italic[^"]*">([\s\S]*?)<\/span><\/strong>/gi, (_, content) => `<strong><em>${content}</em></strong>`);

  // Strip remaining inline style attributes
  html = html.replace(/\s+style="[^"]*"/g, '');

  // Strip id="isPasted" artifacts
  html = html.replace(/\s+id="isPasted"/g, '');

  // Strip rel="nofollow" from links
  html = html.replace(/\s+rel="[^"]*"/g, '');

  // Collapse whitespace in tags
  html = html.replace(/<(\w+)\s+>/g, '<$1>');

  // Remove plain <span> wrappers (no attributes left after style stripping)
  html = html.replace(/<span>/g, '').replace(/<\/span>/g, '');

  // Remove empty tags
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<strong>\s*<\/strong>/g, '');
  html = html.replace(/<em>\s*<\/em>/g, '');

  // Normalize &nbsp; to regular spaces
  html = html.replace(/&nbsp;/g, ' ');

  // Trim whitespace between tags
  html = html.replace(/>\s+</g, '><');

  // Re-add newlines between block elements for readability
  html = html.replace(/<\/p><p>/g, '</p>\n<p>');
  html = html.replace(/<\/li><li>/g, '</li>\n<li>');
  html = html.replace(/<\/ul><p>/g, '</ul>\n<p>');
  html = html.replace(/<\/p><ul>/g, '</p>\n<ul>');
  html = html.replace(/<\/ol><p>/g, '</ol>\n<p>');
  html = html.replace(/<\/p><ol>/g, '</p>\n<ol>');

  return html.trim();
}

function normName(n) {
  return n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

// ── Main ──────────────────────────────────────────────────────────────────
(async () => {
  const sessionDir = path.join(__dirname, '.sync-session');

  log('Launching browser...', { console: true });
  let browser;
  try {
    browser = await chromium.launchPersistentContext(sessionDir, {
      headless: false,
      channel: 'chrome',
      args: ['--no-first-run', '--disable-blink-features=AutomationControlled'],
      timeout: 30000,
    });
  } catch (e) {
    log(`Failed to launch browser: ${e.message}`, { console: true });
    process.exit(1);
  }

  const page = browser.pages()[0] || await browser.newPage();

  // ── Step 1: Auth ──
  log('Navigating to Zlife...', { console: true });
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  async function checkAuth() {
    return page.evaluate(async (base) => {
      try {
        const r = await fetch(base + '/web/users/me', { credentials: 'include' });
        if (r.status !== 200) return false;
        const data = await r.json();
        return !!(data && data.id && data.displayName);
      } catch { return false; }
    }, BASE);
  }

  function waitForEnter(prompt) {
    return new Promise(resolve => {
      const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
      rl.question(prompt, () => { rl.close(); resolve(); });
    });
  }

  let authed = await checkAuth();
  if (!authed) {
    log('Login required.', { console: true });
    await waitForEnter('  Log in via the browser, then press ENTER here... ');
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    authed = await checkAuth();
  }
  if (!authed) {
    log('Still not authenticated. Aborting.', { console: true });
    await browser.close();
    process.exit(1);
  }

  // ══════════════════════════════════════════════════════════════════
  //  Step 2: Fetch article list
  // ══════════════════════════════════════════════════════════════════
  logSection('Fetching articles');

  const articles = [];
  let pageNum = 0;
  const PAGE_SIZE = 20;
  while (true) {
    const url = `${BASE}/web/senders/${SENDER_ID}/apps/${APP_ID}/blog/articles?_page=${pageNum}&_pageSize=${PAGE_SIZE}&_orderBy=publishDate,DESC&includePublished=true`;
    log(`  API: page ${pageNum} → ${url}`);
    const batch = await page.evaluate(async (u) => {
      const r = await fetch(u);
      const text = await r.text();
      try { return JSON.parse(text); } catch { return null; }
    }, url);
    if (!batch) { log('  Batch returned null, stopping.'); break; }
    const items = batch.content || batch;
    if (!Array.isArray(items) || items.length === 0) { log('  Empty page, stopping.'); break; }
    articles.push(...items);
    log(`  Page ${pageNum}: ${items.length} articles`, { console: true });
    if (items.length < PAGE_SIZE) break;
    pageNum++;
  }

  log(`Total articles: ${articles.length}`, { console: true });
  log('Article titles from listing:');
  for (const a of articles) {
    log(`  - "${a.title}" (id=${a.id})`);
  }

  if (articles.length === 0) {
    log('No articles found. Aborting.', { console: true });
    await browser.close();
    process.exit(1);
  }

  // ══════════════════════════════════════════════════════════════════
  //  Step 3: Fetch HTML content for each article
  // ══════════════════════════════════════════════════════════════════
  logSection('Fetching intros');

  const intros = {};
  let fetched = 0;
  let errors = 0;
  let skipped = 0;

  for (const article of articles) {
    const { id, title } = article;
    if (!title || !id) continue;

    log(`\n── ${title} (${id}) ──`);
    log(`  Widget URL: ${WIDGET_URL(id)}`);

    try {
      const widgetJson = await page.evaluate(async (url) => {
        const r = await fetch(url);
        return { status: r.status, ok: r.ok, body: r.ok ? await r.json() : await r.text() };
      }, WIDGET_URL(id));

      log(`  Widget response: status=${widgetJson.status}, ok=${widgetJson.ok}`);

      if (!widgetJson.ok) {
        log(`  ERROR: Widget returned status ${widgetJson.status}`);
        log(`  Response body: ${JSON.stringify(widgetJson.body).substring(0, 500)}`);
        errors++;
        continue;
      }

      const body = widgetJson.body;
      if (!body || !body.rows) {
        log(`  SKIP: no rows in widget response`);
        log(`  Widget keys: ${body ? Object.keys(body).join(', ') : 'null'}`);
        log(`  Widget body: ${JSON.stringify(body).substring(0, 500)}`);
        skipped++;
        continue;
      }

      // Extract html_content from the nested widget structure
      let htmlContent = '';
      let widgetCount = 0;
      for (const row of body.rows) {
        for (const col of row) {
          for (const widget of (col.widgets || [])) {
            widgetCount++;
            log(`  Widget #${widgetCount}: key="${widget.key}", hasSettings=${!!widget.settings}, hasHtmlContent=${!!(widget.settings && widget.settings.html_content)}`);
            if (widget.settings && widget.settings.html_content) {
              const raw = widget.settings.html_content;
              log(`  Raw html_content length: ${raw.length}`);
              log(`  Raw html_content preview: ${raw.substring(0, 300)}`);
              htmlContent += raw;
            }
          }
        }
      }

      if (!htmlContent) {
        log(`  SKIP: ${widgetCount} widgets found but no html_content in any`, { console: true });
        skipped++;
        continue;
      }

      const cleaned = cleanHtml(htmlContent);
      log(`  Cleaned HTML length: ${cleaned.length}`);
      log(`  Cleaned HTML preview: ${cleaned.substring(0, 300)}`);

      if (!cleaned) {
        log(`  SKIP: html_content was non-empty (${htmlContent.length} chars) but cleaned to empty`, { console: true });
        skipped++;
        continue;
      }

      intros[title] = cleaned;
      fetched++;

      if (fetched % 10 === 0) {
        log(`Progress: ${fetched} intros fetched...`, { console: true });
      }
    } catch (err) {
      log(`  ERROR: ${err.message}\n${err.stack}`);
      log(`  [error] ${title}: ${err.message}`, { console: true });
      errors++;
    }
  }

  log(`\nIntro summary: ${fetched} fetched, ${skipped} skipped, ${errors} errors`, { console: true });
  log('Intros collected for:');
  for (const name of Object.keys(intros)) log(`  ✓ "${name}"`);
  log('Missing intros:');
  for (const a of articles) {
    if (!intros[a.title]) log(`  ✗ "${a.title}" (id=${a.id})`);
  }

  // ══════════════════════════════════════════════════════════════════
  //  Step 4: Sync photos
  // ══════════════════════════════════════════════════════════════════
  logSection('Syncing photos');

  let photosUpdated = 0;
  let photosSkipped = 0;
  let photosNew = 0;
  let photosNoImage = 0;

  // Collect article metadata for CANDIDATES patching
  const articleMeta = {};

  for (const article of articles) {
    const { id, title } = article;
    if (!id || !title) continue;

    log(`\n── Photo: ${title} (${id}) ──`);

    // Fetch full article metadata
    let fileId = null;
    let metaRaw = null;
    try {
      const metaUrl = `${BASE}/web/senders/${SENDER_ID}/apps/${APP_ID}/blog/articles/${id}`;
      log(`  Meta URL: ${metaUrl}`);
      metaRaw = await page.evaluate(async (url) => {
        try {
          const r = await fetch(url, { credentials: 'include' });
          if (!r.ok) return { _status: r.status };
          return r.json();
        } catch (e) { return { _err: e.message }; }
      }, metaUrl);

      fileId = metaRaw && metaRaw.teaserImage && metaRaw.teaserImage.fileId;
      log(`  teaserImage: ${JSON.stringify(metaRaw && metaRaw.teaserImage)}`);
      log(`  fileId: ${fileId || 'null'}`);
    } catch (e) {
      log(`  Meta fetch error: ${e.message}`);
    }

    // Store for CANDIDATES patching
    // Check content by normalized name since API titles may differ
    const normTitle = normName(title);
    const hasContent = Object.keys(intros).some(k => normName(k) === normTitle);
    articleMeta[title] = { fileId: fileId || null, articleId: hasContent ? id : null };
    log(`  hasContent (norm "${normTitle}"): ${hasContent}`);
    log(`  articleMeta: ${JSON.stringify(articleMeta[title])}`);

    if (!fileId) {
      photosNoImage++;
      log(`  No teaserImage for this article`);
      continue;
    }

    const localJpg = path.join(PHOTOS_DIR, `${fileId}.jpg`);
    const localPng = path.join(PHOTOS_DIR, `${fileId}.png`);
    const localPath = fs.existsSync(localJpg) ? localJpg : fs.existsSync(localPng) ? localPng : null;
    log(`  Local file: ${localPath || 'not found'}`);

    try {
      const photoUrl = PHOTO_URL(fileId);
      log(`  Photo URL: ${photoUrl}`);

      const photoData = await page.evaluate(async (url) => {
        try {
          const r = await fetch(url, { credentials: 'include' });
          if (!r.ok) return { _err: 'HTTP ' + r.status };
          const buf = await r.arrayBuffer();
          return { bytes: Array.from(new Uint8Array(buf)), type: r.headers.get('content-type'), size: buf.byteLength };
        } catch (e) { return { _err: e.message }; }
      }, photoUrl);

      if (!photoData || photoData._err) {
        log(`  Download failed: ${photoData && photoData._err || 'null response'}`);
        continue;
      }
      if (!photoData.bytes.length) {
        log(`  Download failed: empty response`);
        continue;
      }

      log(`  Downloaded: ${photoData.size} bytes, type=${photoData.type}`);

      const ext = (photoData.type && photoData.type.includes('png')) ? 'png' : 'jpg';
      const destPath = path.join(PHOTOS_DIR, `${fileId}.${ext}`);
      const newBuffer = Buffer.from(photoData.bytes);

      if (localPath) {
        const existing = fs.readFileSync(localPath);
        if (existing.length === newBuffer.length && existing.equals(newBuffer)) {
          photosSkipped++;
          log(`  Unchanged (${existing.length} bytes)`);
          continue;
        }
        if (localPath !== destPath) fs.unlinkSync(localPath);
        photosUpdated++;
        log(`  UPDATED: ${localPath} → ${destPath} (${existing.length} → ${newBuffer.length} bytes)`, { console: true });
      } else {
        photosNew++;
        log(`  NEW: ${destPath} (${newBuffer.length} bytes)`, { console: true });
      }

      fs.writeFileSync(destPath, newBuffer);
    } catch (err) {
      log(`  Photo error: ${err.message}\n${err.stack}`);
    }
  }

  log(`\nPhotos: ${photosNew} new, ${photosUpdated} updated, ${photosSkipped} unchanged, ${photosNoImage} no image`, { console: true });

  // ══════════════════════════════════════════════════════════════════
  //  Step 5: Write JSON
  // ══════════════════════════════════════════════════════════════════
  fs.writeFileSync(JSON_OUT, JSON.stringify(intros, null, 2), 'utf8');
  log(`JSON written to ${JSON_OUT}`, { console: true });

  // ══════════════════════════════════════════════════════════════════
  //  Step 6: Remap INTROS keys to match CANDIDATES names, then patch HTML
  // ══════════════════════════════════════════════════════════════════
  logSection('Patching v1 HTML');

  let html = fs.readFileSync(V1_PATH, 'utf8');

  // Extract CANDIDATES entries from HTML: name, docId, viewId
  const candidateEntries = [...html.matchAll(/\["([^"]+)","[^"]*",(null|"[^"]*"),(null|"[^"]*")\]/g)];
  // Lookup by normalized name
  const candidateByNorm = {};
  // Lookup by viewId (article ID on zlife)
  const candidateByViewId = {};
  for (const m of candidateEntries) {
    const name = m[1];
    const viewId = m[3].replace(/"/g, '');
    candidateByNorm[normName(name)] = name;
    if (viewId && viewId !== 'null') candidateByViewId[viewId] = name;
  }

  // Build API article ID → title lookup for fallback matching
  const apiArticleIdToTitle = {};
  for (const a of articles) { if (a.id && a.title) apiArticleIdToTitle[a.id] = a.title; }

  // Remap intros: API title → canonical CANDIDATES name
  const remappedIntros = {};
  log('\n  INTROS key remapping:');
  for (const [apiTitle, content] of Object.entries(intros)) {
    const norm = normName(apiTitle);
    let canonicalName = candidateByNorm[norm];

    // Fallback: match by zlife article ID (viewId)
    if (!canonicalName) {
      // Find this article's ID from the articles list
      const article = articles.find(a => a.title === apiTitle);
      if (article && candidateByViewId[article.id]) {
        canonicalName = candidateByViewId[article.id];
        log(`    Remapped via viewId: "${apiTitle}" → "${canonicalName}" (article ${article.id})`, { console: true });
      }
    }

    if (canonicalName) {
      remappedIntros[canonicalName] = content;
      if (canonicalName !== apiTitle && !canonicalName.startsWith('Remapped')) {
        log(`    Remapped: "${apiTitle}" → "${canonicalName}"`, { console: true });
      } else if (canonicalName === apiTitle) {
        log(`    OK: "${apiTitle}"`);
      }
    } else {
      // No match — keep original key but warn
      remappedIntros[apiTitle] = content;
      log(`    WARNING: No CANDIDATES match for "${apiTitle}" (norm: "${norm}")`, { console: true });
    }
  }

  const introsStart = html.indexOf('const INTROS = {');
  const introsEnd   = html.indexOf('const CANDIDATES');

  if (introsStart === -1 || introsEnd === -1) {
    log(`ERROR: Could not find INTROS or CANDIDATES marker.`, { console: true });
  } else {
    log(`  INTROS: char ${introsStart} → ${introsEnd}`);

    const entries = Object.entries(remappedIntros).map(([name, content]) => {
      const escaped = content
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
      return `  ${JSON.stringify(name)}: \`${escaped}\``;
    });

    const newIntros = `const INTROS = {\n${entries.join(',\n')}\n}\n`;
    html = html.substring(0, introsStart) + newIntros + html.substring(introsEnd);
    log(`  INTROS patched (${entries.length} entries).`, { console: true });
  }

  // ══════════════════════════════════════════════════════════════════
  //  Step 7: Patch CANDIDATES array
  // ══════════════════════════════════════════════════════════════════
  logSection('Patching CANDIDATES');

  let candidatesUpdated = 0;
  const candidatesMatch = html.match(/const CANDIDATES = \[([\s\S]*?)\];/);

  if (!candidatesMatch) {
    log('ERROR: Could not find CANDIDATES array in HTML.', { console: true });
  } else {
    let candidatesBlock = candidatesMatch[1];

    const candidateLines = [...candidatesBlock.matchAll(/\["([^"]+)","([^"]*)",(null|"[^"]*"),(null|"[^"]*")\]/g)];
    const candByNorm = {};
    const candByViewId = {};
    for (const m of candidateLines) {
      candByNorm[normName(m[1])] = m;
      const vid = m[4].replace(/"/g, '');
      if (vid && vid !== 'null') candByViewId[vid] = m;
    }

    log(`  CANDIDATES entries in HTML: ${candidateLines.length}`);
    log(`  Article metadata entries: ${Object.keys(articleMeta).length}`);

    // Helper: find CANDIDATES match by name or viewId fallback
    function findCandidate(apiTitle, articleId) {
      let match = candByNorm[normName(apiTitle)];
      if (match) return { match, method: 'name' };
      if (articleId && candByViewId[articleId]) return { match: candByViewId[articleId], method: 'viewId' };
      return null;
    }

    // Log name matching
    log('\n  Name matching:');
    for (const [apiTitle, meta] of Object.entries(articleMeta)) {
      const result = findCandidate(apiTitle, meta.articleId);
      if (result) {
        log(`    ✓ API "${apiTitle}" → HTML "${result.match[1]}" (via ${result.method})`);
      } else {
        log(`    ✗ API "${apiTitle}" → NO MATCH`);
        const norm = normName(apiTitle);
        const similar = Object.keys(candByNorm).filter(k => k.includes(norm.split(' ')[0]));
        if (similar.length) log(`      Similar: ${similar.join(', ')}`);
      }
    }

    for (const [apiTitle, meta] of Object.entries(articleMeta)) {
      const result = findCandidate(apiTitle, meta.articleId);
      if (!result) continue;
      const match = result.match;

      const candidateName = match[1];
      const candidateRole = match[2];
      const oldDocId = match[3];
      const oldViewId = match[4];
      const newDocId = meta.fileId ? `"${meta.fileId}"` : 'null';
      const newViewId = meta.articleId ? `"${meta.articleId}"` : 'null';

      if (newDocId !== oldDocId || newViewId !== oldViewId) {
        const oldLine = match[0];
        const newLine = `["${candidateName}","${candidateRole}",${newDocId},${newViewId}]`;
        candidatesBlock = candidatesBlock.replace(oldLine, newLine);
        log(`  [update] ${candidateName}: docId ${oldDocId}→${newDocId}, viewId ${oldViewId}→${newViewId}`, { console: true });
        candidatesUpdated++;
      }
    }

    if (candidatesUpdated > 0) {
      html = html.replace(candidatesMatch[1], candidatesBlock);
      log(`  ${candidatesUpdated} CANDIDATES entries updated.`, { console: true });
    } else {
      log('  CANDIDATES: all entries up to date.', { console: true });
    }
  }

  fs.writeFileSync(V1_PATH, html, 'utf8');
  log('v1 HTML saved.', { console: true });

  await browser.close();
  log(`\nDone! Full log: ${logFile}`, { console: true });
  logStream.end();
})();
