import { writable } from 'svelte/store';
import type { Merchant } from '../helpers/layout';

export type MerchantMap = Map<string, Merchant>;

/** known merchants store */
export const merchantRegistry = writable<MerchantMap>(new Map());
