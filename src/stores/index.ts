import { derived, writable } from 'svelte/store';
import type { WalletAdapter } from '../helpers/types';

type Adapter = WalletAdapter | undefined;

/** the wallet adapter from sollet, etc */
export const adapter = writable<Adapter>(undefined);
/** is the wallet connected? */
export const connected = derived(adapter, ($adapter) => {
  if ($adapter && $adapter.publicKey) {
    return true;
  }
  return false;
});
/** the immutable program id */
export const programId = writable<string>('8RqbzUupLSSdTGCzkZsFjUwUupWuu2Jph5x4LeU1wV7C');
