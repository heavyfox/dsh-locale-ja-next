import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const installed = process.argv[2];
if (!installed) throw new Error('Usage: pnpm check-compatibility <installed-dsh-root>');
const host = await import(pathToFileURL(join(resolve(installed), 'node_modules', '@deepseek-ai', 'dsh-app-boot', 'lib', 'index.js')).href);
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
assert.equal(host.getDshRuntimeVersion(), '0.2.0-rc.2');
assert.equal(host.evaluatePluginCompatibility(manifest), undefined);
for (const version of ['0.1.5-rc.2', '0.2.0-rc.1', '0.2.0', '0.2.1-alpha.1']) {
  assert.ok(host.evaluatePluginCompatibility(manifest, {}, version), `untested ${version} must be rejected`);
}
console.log('PASS: official rc.2 compatibility checker accepts rc.2 and rejects untested versions; no exemptions');
