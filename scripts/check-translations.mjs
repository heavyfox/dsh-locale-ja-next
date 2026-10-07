import { readFileSync, writeFileSync } from 'node:fs';
import { extractLocales } from './extract-locales.mjs';
const baseline = process.argv[2] ? extractLocales(process.argv[2]) : JSON.parse(readFileSync('resources/en-0.2.0-rc.2.json', 'utf8'));
const japanese = JSON.parse(readFileSync('src/translations/ja-JP.json', 'utf8'));
const missing = [], stale = [], invalid = []; let count = 0;
const placeholders = text => JSON.stringify([...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort());
for (const [ns, dictionary] of Object.entries(baseline.dictionaries)) for (const [key, english] of Object.entries(dictionary)) {
  count++;
  const text = japanese[ns]?.[key];
  if (text === undefined) missing.push(`${ns}.${key}`);
  else if (typeof text !== 'string' || !text.trim() || placeholders(text) !== placeholders(english)) invalid.push(`${ns}.${key}`);
}
for (const [ns, dictionary] of Object.entries(japanese)) for (const key of Object.keys(dictionary)) if (baseline.dictionaries[ns]?.[key] === undefined) stale.push(`${ns}.${key}`);
const report = { version: baseline.version, total: count, translated: count - missing.length - invalid.length, missing, stale, invalid };
writeFileSync('resources/coverage.json', JSON.stringify(report, null, 2) + '\n');
console.log(`DSH ${report.version}: ${report.translated}/${count} entries (${(100 * report.translated / count).toFixed(1)}%)`);
if (missing.length) console.log('Missing Japanese translations:\n' + missing.map(k => '- ' + k).join('\n'));
if (stale.length) console.error('Stale keys:\n' + stale.join('\n'));
if (invalid.length) console.error('Empty/invalid translations or placeholder mismatches:\n' + invalid.join('\n'));
// Remaining English fallbacks are explicit, reviewed data, not a false full-coverage pass.
const accepted = JSON.parse(readFileSync('resources/accepted-fallbacks.json', 'utf8'));
const added = missing.filter(k => !accepted.includes(k));
if (added.length || stale.length || invalid.length) process.exitCode = 1;
