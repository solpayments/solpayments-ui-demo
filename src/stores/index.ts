import { writable, derived } from 'svelte/store';
import type { WalletAdapter } from '../helpers/types';

type Adapter = WalletAdapter | undefined;

/** the wallet adapter from sollet, etc */
export const adapter = writable<Adapter>(undefined);
/** is the wallet connected? */
export const connected = derived(adapter, $adapter => {
  if ($adapter && $adapter.publicKey) {
    return true;
  }
  return false;
})
