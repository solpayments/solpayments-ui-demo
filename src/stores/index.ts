import { writable } from 'svelte/store';
import type { WalletAdapter } from '../helpers/types';

/** the wallet adapter from sollet, etc */
export const adapter = writable<WalletAdapter | undefined>(undefined);
/** is the wallet connected? */
export const walletConnected = writable<boolean>(false);

export const updateWallet = (details: WalletAdapter): void => {
  adapter.update((_) => {
    return details;
  });
};

export const setWalletConnected = (): void => {
  walletConnected.update((_) => true);
};

export const removeWallet = (): void => {
  adapter.update((_) => undefined);
  walletConnected.update((_) => false);
};
