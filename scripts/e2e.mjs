import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const url = process.env.DSH_TEST_URL;
const version = process.env.DSH_TEST_VERSION ?? '0.2.1-rc.3';
if (!url) throw new Error('Set DSH_TEST_URL to the token URL printed by your isolated dsh web process');
const output = resolve(process.env.DSH_TEST_OUTPUT ?? 'test-results'); mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, locale: 'en-US' });
const page = await context.newPage();
const errors = []; page.on('pageerror', error => errors.push(error.message));
const shellTrigger = page.getByRole('button', { name: /^(Settings|設定|Account menu|アカウントメニュー)$/ });
const japaneseShell = page.getByRole('button', { name: /^(設定|アカウントメニュー)$/ });
const englishShell = page.getByRole('button', { name: /^(Settings|Account menu)$/ });
async function openSettings() {
  const direct = page.getByRole('button', { name: /^(Settings|設定)$/ });
  if (await direct.isVisible()) await direct.click();
  else {
    await page.getByRole('button', { name: /^(Account menu|アカウントメニュー)$/ }).click();
    await page.getByText(/^(Settings|設定)$/, { exact: true }).click();
  }
}
try {
  await page.goto(url);
  await expect(shellTrigger).toBeVisible();
  await page.waitForTimeout(1500); // Host onboarding arrives after the first shell render.
  // Initial release notice and API-key onboarding can be skipped without credentials.
  if (await page.getByRole('button', { name: 'Continue', exact: true }).isVisible()) await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const later = page.getByRole('button', { name: /^(Configure later|後で設定|あとで設定|後で設定する)$/ });
  await later.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await later.isVisible()) await later.click();
  await openSettings();
  const currentJapanese = page.getByRole('button', { name: '日本語', exact: true });
  if (await currentJapanese.isVisible()) {
    await currentJapanese.click(); await page.getByText('English', { exact: true }).click();
    await page.waitForTimeout(750); // Let the Host accept the previous language before another write.
  }
  await expect(page.locator('style[data-dsh-locale-ja-font]')).toHaveCount(0);
  const defaultFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  const codeFont = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--ds-font-family-code'));
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByText('日本語', { exact: true })).toBeVisible();
  await page.getByText('日本語', { exact: true }).click();
  await page.waitForTimeout(750);
  await expect(page.getByRole('button', { name: '一般', exact: true })).toBeVisible();
  await expect(page.getByText('言語', { exact: true })).toBeVisible();
  await expect(page.getByText('外観', { exact: true })).toBeVisible();
  await expect(page.getByText(`現在のバージョン：${version}`, { exact: true })).toBeVisible();
  if (!version.startsWith('0.2.0')) expect(await page.evaluate(() => window.__DSH_BOOT__?.release?.version)).toBe(version);
  await expect(page.locator('style[data-dsh-locale-ja-font]')).toHaveCount(1);
  const japaneseFont = await page.getByRole('button', { name: '一般', exact: true }).evaluate(element => getComputedStyle(element).fontFamily);
  expect(japaneseFont).toMatch(/^"?BIZ UDPGothic"?/);
  expect(await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--ds-font-family-code'))).toBe(codeFont);
  if (!version.startsWith('0.2.0')) {
    await page.evaluate(() => document.body.style.setProperty('--dsh-font-family-text', 'Meiryo'));
    expect(await page.getByRole('button', { name: '一般', exact: true }).evaluate(element => getComputedStyle(element).fontFamily)).toMatch(/^Meiryo/);
    await page.evaluate(() => document.body.style.removeProperty('--dsh-font-family-text'));
  }
  // Record the actual font used for Japanese glyphs when Chromium exposes it.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  await page.getByRole('button', { name: '一般', exact: true }).evaluate(element => element.setAttribute('data-dsh-font-probe', ''));
  const cdp = await context.newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const documentNode = await cdp.send('DOM.getDocument');
  const settingsNode = await cdp.send('DOM.querySelector', { nodeId: documentNode.root.nodeId, selector: '[data-dsh-font-probe]' });
  const renderedFonts = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: settingsNode.nodeId });
  writeFileSync(resolve(output, 'fonts.json'), JSON.stringify({ defaultFont, japaneseFont, renderedFonts: renderedFonts.fonts }, null, 2));
  await cdp.detach();
  await expect(page.getByRole('button', { name: '一般', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '日本語', exact: true })).toBeVisible();
  await page.screenshot({ path: resolve(output, 'settings-ja.png') });
  await page.getByRole('button', { name: '閉じる', exact: true }).click();
  await page.reload();
  await expect(japaneseShell).toBeVisible();
  await later.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await later.isVisible()) await later.click();
  await openSettings();
  await expect(page.getByRole('button', { name: '日本語', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '閉じる', exact: true }).click();
  // A fresh browser context proves that the preference lives on the Host.
  const fresh = await browser.newContext({ locale: 'en-US' });
  const other = await fresh.newPage(); await other.goto(url);
  await expect(other.getByRole('button', { name: /^(設定|アカウントメニュー)$/ })).toBeVisible();
  await fresh.close();
  await page.getByRole('button', { name: 'プラグイン', exact: true }).click();
  const installedTab = page.getByRole('tab', { name: 'インストール済み', exact: true });
  if (await installedTab.isVisible()) await installedTab.click();
  await expect(page.getByText('dsh-locale-ja-next', { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: resolve(output, 'plugins-ja.png') });
  const body = await page.locator('body').innerText();
  writeFileSync(resolve(output, 'plugins-visible-text.txt'), body);
  const checks = ['language catalog', 'Japanese settings', 'Japanese font override', 'code font preserved', 'English restores original font', 'reload persistence', 'fresh browser Host persistence', 'plugin management UI'];
  if (!version.startsWith('0.2.0')) checks.push('custom text font respected');
  if (process.argv.includes('--cleanup')) {
    await page.getByRole('switch', { name: 'dsh-locale-ja-nextを有効にする', exact: true }).click();
    await expect(englishShell).toBeVisible();
    await expect(page.locator('style[data-dsh-locale-ja-font]')).toHaveCount(0);
    expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toBe(defaultFont);
    await expect(page.getByRole('switch', { name: 'Enable dsh-locale-ja-next', exact: true })).toHaveAttribute('aria-checked', 'false');
    await openSettings();
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(page.getByText('日本語', { exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.screenshot({ path: resolve(output, 'disabled-en.png') });
    await page.getByRole('switch', { name: 'Enable dsh-locale-ja-next', exact: true }).click();
    await expect(japaneseShell).toBeVisible();
    await expect(page.locator('style[data-dsh-locale-ja-font]')).toHaveCount(1);
    await expect(page.getByRole('switch', { name: 'dsh-locale-ja-nextを有効にする', exact: true })).toHaveAttribute('aria-checked', 'true');
    checks.push('live disable removes Japanese and falls back to English', 'live enable restores Host preference');
  }
  if (errors.length) throw new Error('Browser errors: ' + errors.join('\n'));
  writeFileSync(resolve(output, 'e2e.json'), JSON.stringify({ passed: true, version, checks, browserErrors: errors }, null, 2));
  console.log('PASS: ' + checks.join(', ') + '; zero browser errors');
} catch (error) {
  writeFileSync(resolve(output, 'failure-visible-text.txt'), await page.locator('body').innerText());
  await page.screenshot({ path: resolve(output, 'failure.png') });
  throw error;
} finally { await browser.close(); }
