import type { Dictionaries, LocaleService } from './types.js';
export declare const JAPANESE = "ja";
/** Register transactionally, unwind partial activation and dispose in reverse order. */
export declare function registerJapanese(locale: LocaleService, dictionaries: Dictionaries): () => void;
