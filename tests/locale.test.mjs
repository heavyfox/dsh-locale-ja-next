import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { Context } from '@deepseek-ai/cordis';
import { build } from 'esbuild';
const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const baseline = JSON.parse(readFileSync(new URL('../resources/en-0.2.0-rc.2.json', import.meta.url))).dictionaries;
function loadBundle(filename, dependencies = {}) {
  let record;
  const sandbox = { window: { __ModuleLoader__: { load(value) { record = value; } } }, navigator: { languages: ['en-US'], language: 'en-US' }, console, queueMicrotask };
  vm.runInNewContext(readFileSync(filename, 'utf8'), sandbox, { filename: String(filename) });
  assert.ok(record?.factory, 'DSH ModuleLoader factory registered');
  return { id: record.id, exports: record.factory(id => {
    if (!(id in dependencies)) throw new Error('Unexpected runtime dependency: ' + id);
    return dependencies[id];
  }) };
}
function runtime() {
  // Load the real distributed DSH browser runtime; React UI dependencies are not executed.
  const exports = loadBundle(require.resolve('@deepseek-ai/dsh-client-locale/client'), {
    'react/jsx-runtime': {}, react: {}, '@deepseek-ai/dsh-client-ui-primitives': {}, '@deepseek-ai/dsh-client-store': {}
  }).exports;
  const locale = new exports.LocaleRuntime(new Context());
  for (const [ns, dictionary] of Object.entries(baseline)) locale.register(ns, 'en', dictionary);
  return locale;
}
const plugin = loadBundle(new URL('../lib/client.js', import.meta.url));
const localBuild = await build({ entryPoints: [fileURLToPath(new URL('../src/locale.ts', import.meta.url))], bundle: true, write: false, format: 'cjs', platform: 'node' });
const localModule = { exports: {} };
vm.runInNewContext(localBuild.outputFiles[0].text, { module: localModule, exports: localModule.exports });
const { registerJapanese } = localModule.exports;
test('host entry loads and manifest targets the tested DSH release', async () => {
  const host = await import('../lib/index.js');
  assert.equal(host.apply(), undefined);
  assert.equal(plugin.id, pkg.name);
  assert.equal(pkg.peerDependencies['@deepseek-ai/dsh-client-locale'], '0.2.0-rc.2');
  assert.equal(pkg.dsh.client.immediately, true);
  assert.equal(pkg.dsh.client.platform, 'web');
  assert.deepEqual([...plugin.exports.inject], ['locale']);
});
test('client activation registers Japanese; real Cordis unload removes language and dictionaries', async () => {
  const ctx = new Context();
  const locale = runtime(); ctx.provide('locale', locale);
  const fork = ctx.plugin(plugin.exports);
  await fork;
  assert.equal(locale.getLocale().locales.find(v => v.id === 'ja')?.label, '日本語');
  locale.setLocale('ja');
  assert.equal(locale.bind('settings.locale')('language.title'), '言語');
  assert.equal(locale.bind('common')('cancel'), 'キャンセル');
  assert.equal(locale.bind('workspace')('actions.archive'), 'アーカイブ');
  await fork.dispose();
  assert.equal(locale.getLocale().active, 'en');
  assert.ok(!locale.getLocale().locales.some(v => v.id === 'ja'));
  const second = ctx.plugin(plugin.exports); await second;
  assert.equal(locale.getLocale().active, 'ja', 'saved selection restored on reload');
  await second.dispose();
});
test('missing Japanese keys and unknown third-party namespaces fall back to real English dictionaries', () => {
  const locale = runtime();
  const dispose = registerJapanese(locale, { common: { cancel: 'キャンセル', loading: '' } });
  locale.register('third.party', 'en', { greeting: 'Hello {name}' });
  locale.setLocale('ja');
  assert.equal(locale.bind('common')('cancel'), 'キャンセル');
  assert.equal(locale.bind('common')('loading'), baseline.common.loading);
  assert.equal(locale.bind('third.party')('greeting', { name: 'DSH' }), 'Hello DSH');
  assert.equal(locale.resolveText({ en: 'English package description' }), 'English package description');
  dispose(); dispose();
});
test('failed activation rolls back partial registrations and preserves other owners', () => {
  const locale = runtime();
  const existing = locale.register('collision', 'ja', { owned: '既存' });
  assert.throws(() => registerJapanese(locale, { transient: { key: '一時' }, collision: { key: '競合' } }), /already has/);
  const transient = locale.register('transient', 'ja', { key: '再登録できる' }); transient();
  locale.addLanguage({ id: 'ja', label: '既存の日本語', fallback: 'en' });
  locale.setLocale('ja'); assert.equal(locale.bind('collision')('owned'), '既存');
  assert.throws(() => registerJapanese(locale, { transient: { key: '一時' } }), /already registered/);
  const another = locale.register('transient', 'ja', { key: '再登録できる' }); another(); existing();
});
test('every shipped translation uses a real key and preserves all placeholders', () => {
  const ja = JSON.parse(readFileSync(new URL('../src/translations/ja-JP.json', import.meta.url)));
  const names = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
  const locale = runtime(); const dispose = registerJapanese(locale, ja); locale.setLocale('ja');
  for (const [ns, dictionary] of Object.entries(ja)) for (const [key, value] of Object.entries(dictionary)) {
    assert.equal(typeof baseline[ns]?.[key], 'string', `${ns}.${key} exists`);
    assert.ok(value.trim(), `${ns}.${key} is nonempty`);
    assert.deepEqual(names(value), names(baseline[ns][key]), `${ns}.${key} placeholders`);
    assert.equal(locale.bind(ns)(key), value, `${ns}.${key} is retrievable`);
  }
  dispose();
});
