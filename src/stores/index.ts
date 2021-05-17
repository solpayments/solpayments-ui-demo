import { writable } from 'svelte/store';
import type { WalletAdapter } from '../helpers/types';

export const store = writable<WalletAdapter | undefined>(undefined);
export const walletConnected = writable<boolean>(false);

export const updateWallet = (details: WalletAdapter): void => {
  store.update((_) => {
    return details;
  });
};

export const setWalletConnected = (): void => {
  walletConnected.update((_) => true);
};

export const removeWallet = (): void => {
  store.update((_) => undefined);
  walletConnected.update((_) => false);
};
