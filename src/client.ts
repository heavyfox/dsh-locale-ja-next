import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-locale/client';
import translations from './translations/ja-JP.json' with { type: 'json' };
import { registerJapanese } from './locale.js';
import { installJapaneseFont } from './font.js';
export const inject = ['locale'];
export function apply(ctx: Context): void {
  ctx.effect(() => registerJapanese(ctx.locale, translations));
  ctx.effect(() => installJapaneseFont(ctx.locale));
}
