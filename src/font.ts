import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client';

const FONT_STACK = '"BIZ UDPGothic", "Meiryo", "Hiragino Sans", "Noto Sans JP", "Yu Gothic UI", sans-serif';

/** Own a locale-scoped override of DSH's existing UI font token. */
export function installJapaneseFont(
  locale: Pick<LocaleRuntime, 'getLocale' | 'subscribe'>,
  doc: Document | undefined = typeof document === 'undefined' ? undefined : document,
): () => void {
  if (!doc) return () => {};
  const style = doc.createElement('style');
  style.dataset.dshLocaleJaFont = '';
  style.textContent = `:root { --dsw-font-family: ${FONT_STACK} !important; }`;
  const sync = (): void => {
    if (locale.getLocale().active.toLowerCase().split('-')[0] === 'ja') {
      if (!style.isConnected) doc.head.appendChild(style);
    } else {
      style.remove();
    }
  };
  sync();
  const unsubscribe = locale.subscribe(sync);
  return () => { unsubscribe(); style.remove(); };
}
