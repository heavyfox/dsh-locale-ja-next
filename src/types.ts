import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client';
/** Public language-pack API only; no private fields or preference interception. */
export type LocaleService = Pick<LocaleRuntime, 'register' | 'addLanguage'>;
export type Dictionaries = Readonly<Record<string, Readonly<Record<string, string>>>>;
