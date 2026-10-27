import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['--test', 'tests/locale.test.mjs'], {
  stdio: 'inherit', env: { ...process.env, DSH_TEST_LOCALE_PACKAGE: 'dsh-locale-020', DSH_TEST_VERSION: '0.2.0-rc.2' },
});
process.exitCode = result.status ?? 1;
