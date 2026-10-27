import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const installed = process.argv[2];
if (!installed) throw new Error('Usage: pnpm check-compatibility <installed-dsh-root>');
const host = await import(pathToFileURL(join(resolve(installed), 'node_modules', '@deepseek-ai', 'dsh-app-boot', 'lib', 'index.js')).href);
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
assert.match(host.getDshRuntimeVersion(), /^0\.2\./);
assert.equal(host.evaluatePluginCompatibility(manifest), undefined);
for (const version of ['0.2.0-rc.2', '0.2.0', '0.2.1-rc.3', '0.2.1-rc.4', '0.2.2-rc.1', '0.2.99']) {
  assert.equal(host.evaluatePluginCompatibility(manifest, {}, version), undefined, `${version} must be accepted`);
}
for (const version of ['0.1.5-rc.2', '0.2.0-rc.1', '0.3.0-alpha.1', '0.3.0', '1.0.0']) {
  assert.ok(host.evaluatePluginCompatibility(manifest, {}, version), `${version} outside the supported line must be rejected`);
}
// Older 0.2.0 Hosts check DSH peers instead of engines.dsh.
const peersOnly = { ...manifest }; delete peersOnly.engines;
assert.equal(host.evaluatePluginCompatibility(peersOnly, {}, '0.2.1-rc.3'), undefined);
assert.ok(host.evaluatePluginCompatibility(peersOnly, {}, '0.3.0-alpha.1'));
console.log(`PASS: official ${host.getDshRuntimeVersion()} checker accepts the 0.2.x line and rejects 0.1.x/0.3.x; no exemptions`);
