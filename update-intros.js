#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const BASE = '/Users/abdelrahman/IdeaProjects/gwc';
const V3_PATH = path.join(BASE, 'pages/who-we-are-v3/index.html');
const EXTRACTED_PATH = path.join(BASE, 'extracted-intros-all.json');

// Explicit mapping: extracted name -> INTROS key name (only where they differ)
const NAME_MAP = {
  'Lara Laila Garber': 'Lara Laila Gärber',
  'Lucia Morales': 'Lucía Morales',
  'Edgar Gomes Goncalves': 'Edgar Goncalves',
  'Sabine Hopmann Lopez': 'Sabine Hopmann López',
  'Hala al Kuwatly': 'Hala Al Kuwatly',
  'Ibere Floriano Rios': 'Iberê Floriano Rios',
  'Oezgue Fidan': 'Özgü Fidan',
  'Thorbjorn Knappe': 'Thorbjörn Knappe',
};

// Placeholder pages on zlife (only have "Get to Know X") — skip these
const PLACEHOLDERS = ['Casper Rutz', 'Youssef Hussien', 'Joe Tsui', 'Ross Simpson', 'Zainab Khalil'];

const extracted = JSON.parse(fs.readFileSync(EXTRACTED_PATH, 'utf8'));
let html = fs.readFileSync(V3_PATH, 'utf8');

// Find INTROS block boundaries
const introsStart = html.indexOf('const INTROS = {');
if (introsStart === -1) { console.error('Cannot find INTROS'); process.exit(1); }

let braceDepth = 0, introsEnd = -1, inTemplate = false;
for (let i = introsStart; i < html.length; i++) {
  if (html[i] === '`') { inTemplate = !inTemplate; continue; }
  if (inTemplate) continue;
  if (html[i] === '{') braceDepth++;
  else if (html[i] === '}') {
    braceDepth--;
    if (braceDepth === 0) {
      introsEnd = i + 1;
      if (html[i + 1] === ';') introsEnd++;
      break;
    }
  }
}
if (introsEnd === -1) { console.error('Cannot find INTROS end'); process.exit(1); }

// Parse existing entries
const oldBlock = html.substring(introsStart, introsEnd);
const existing = {};
const re = /^\s*"([^"]+)":\s*`([\s\S]*?)`,?\s*$/gm;
let m;
while ((m = re.exec(oldBlock)) !== null) existing[m[1]] = m[2];
console.log(`Existing INTROS: ${Object.keys(existing).length} entries`);

// Build new entries: start with existing, then overlay extracted
const final = { ...existing };
let updated = 0, added = 0;

for (const [extractedName, content] of Object.entries(extracted)) {
  if (PLACEHOLDERS.includes(extractedName)) continue;

  const introsKey = NAME_MAP[extractedName] || extractedName;
  const escaped = content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

  if (existing[introsKey]) {
    updated++;
  } else {
    added++;
    console.log(`  NEW: "${introsKey}"`);
  }
  final[introsKey] = escaped;
}

// Build new INTROS block
const lines = ['const INTROS = {'];
const entries = Object.entries(final);
for (let i = 0; i < entries.length; i++) {
  const [name, content] = entries[i];
  const comma = i < entries.length - 1 ? ',' : '';
  lines.push(`  "${name}": \`${content}\`${comma}`);
}
lines.push('};');

const newBlock = lines.join('\n');
const newHtml = html.substring(0, introsStart) + newBlock + html.substring(introsEnd);
fs.writeFileSync(V3_PATH, newHtml, 'utf8');

console.log(`\nUpdated: ${updated}, Added: ${added}, Total: ${Object.keys(final).length}`);
console.log(`Placeholders kept as-is: ${PLACEHOLDERS.join(', ')}`);
console.log(`Written: ${V3_PATH}`);
