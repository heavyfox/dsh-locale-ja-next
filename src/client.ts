import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-locale/client';
import { japaneseDictionaries } from './translations/index.js';
import { registerJapanese } from './locale.js';
import { installJapaneseFont } from './font.js';
export const inject = ['locale'];
export function apply(ctx: Context): void {
  // Public boot graph release identity was added in the 0.2.1 line.
  const boot = typeof window === 'undefined' ? undefined : (window as Window & {
    __DSH_BOOT__?: { release?: { version?: string } };
  }).__DSH_BOOT__;
  ctx.effect(() => registerJapanese(ctx.locale, japaneseDictionaries(boot?.release?.version)));
  ctx.effect(() => installJapaneseFont(ctx.locale));
}
