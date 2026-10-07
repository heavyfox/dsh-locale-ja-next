import type { Dictionaries, LocaleService } from './types.js';
export const JAPANESE = 'ja';
/** Register transactionally, unwind partial activation and dispose in reverse order. */
export function registerJapanese(locale: LocaleService, dictionaries: Dictionaries): () => void {
  const disposers: (() => void)[] = [];
  let disposed = false;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    for (const release of disposers.reverse()) release();
  };
  try {
    for (const [namespace, dictionary] of Object.entries(dictionaries)) {
      const safe = Object.fromEntries(Object.entries(dictionary).filter(([, value]) => typeof value === 'string' && value.trim().length > 0));
      if (Object.keys(safe).length) disposers.push(locale.register(namespace, JAPANESE, safe));
    }
    // Add the language last so a saved preference activates complete dictionaries.
    disposers.push(locale.addLanguage({ id: JAPANESE, label: '日本語', fallback: 'en' }));
    return dispose;
  } catch (error) { dispose(); throw error; }
}
