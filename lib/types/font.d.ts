import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client';
/** Own a locale-scoped override of DSH's existing UI font token. */
export declare function installJapaneseFont(locale: Pick<LocaleRuntime, 'getLocale' | 'subscribe'>, doc?: Document | undefined): () => void;
