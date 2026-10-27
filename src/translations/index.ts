import current from './ja-JP.json' with { type: 'json' };
import legacy from './legacy-0.2.0.json' with { type: 'json' };
import type { Dictionaries } from '../types.js';

/** Older Hosts omit release identity; preserve their original placeholders. */
export function japaneseDictionaries(hostVersion?: string): Dictionaries {
  if (hostVersion && !/^0\.2\.0(?:-|$)/u.test(hostVersion) && hostVersion !== '0.2.1-alpha.1') return current;
  const result = { ...current } as Record<string, Record<string, string>>;
  for (const [namespace, dictionary] of Object.entries(legacy)) result[namespace] = { ...result[namespace], ...dictionary };
  return result;
}
