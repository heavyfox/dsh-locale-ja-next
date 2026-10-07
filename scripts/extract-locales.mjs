import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseData } from './static-data.mjs';
export function extractLocales(installedRoot) {
  const candidates = [installedRoot, join(installedRoot, 'node_modules', '@deepseek-ai')];
  const root = candidates.find(p => existsSync(join(p, 'dsh-client-locale', 'lib', 'client.js')));
  if (!root) throw new Error('Specify installed DSH root or its @deepseek-ai package directory');
  const dictionaries = {}, packages = {}, failures = [];
  for (const pkg of readdirSync(root).filter(p => p.startsWith('dsh-')).sort()) {
    const filename = join(root, pkg, 'lib', 'client.js');
    if (!existsSync(filename)) continue;
    const parsed = parseData(readFileSync(filename, 'utf8'));
    const { source, walk, evaluate, ts, declarations } = parsed;
    const add = (ns, dict) => {
      if (typeof ns !== 'string' || !dict || Object.values(dict).some(v => typeof v !== 'string')) throw new Error('Invalid dictionary');
      if (dictionaries[ns] && JSON.stringify(dictionaries[ns]) !== JSON.stringify(dict)) throw new Error(`Conflicting namespace ${ns}`);
      dictionaries[ns] = dict; packages[ns] = pkg;
    };
    walk(source, node => {
      if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression) || node.expression.name.text !== 'register') return;
      if (!/(?:^|\.)locale$/.test(node.expression.expression.getText(source))) return;
      try {
        const ns = evaluate(node.arguments[0]);
        if (node.arguments.length === 2) add(ns, evaluate(node.arguments[1]).en);
        else if (evaluate(node.arguments[1]) === 'en') add(ns, evaluate(node.arguments[2]));
      } catch (error) {
        // The directory browser's loop registers a static pair array.
        if (pkg === 'dsh-client-ui-directory-picker-browse' && declarations.has('dictionaries')) {
          try { add(evaluate(declarations.get('LOCALE_NS')[0].initializer), evaluate(declarations.get('dictionaries')[0].initializer).find(([id]) => id === 'en')[1]); }
          catch (inner) { failures.push(`${pkg}: ${inner.message}`); }
        } else failures.push(`${pkg}: ${error.message}`);
      }
    });
  }
  if (failures.length) throw new Error(failures.join('\n'));
  if (!dictionaries.common || !dictionaries['settings.locale']) throw new Error('Core namespaces not extracted');
  const version = JSON.parse(readFileSync(join(root, 'dsh-client-locale', 'package.json'), 'utf8')).version;
  return { version, packages, dictionaries };
}
if (resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Usage: pnpm extract-locales <installed-dsh-root> [output.json]');
  const result = extractLocales(resolve(process.argv[2]));
  const output = resolve(process.argv[3] ?? 'resources/en-0.2.0-rc.2.json');
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  console.log(`Extracted ${Object.keys(result.dictionaries).length} namespaces / ${Object.values(result.dictionaries).reduce((n, d) => n + Object.keys(d).length, 0)} keys from ${result.version} into ${output}`);
}
