import type { PublicKey } from '@solana/web3.js';
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export const shopAddressStore: Writable<PublicKey | undefined> = writable<PublicKey | undefined>(
  undefined
);

export const subscriptionAddressStore: Writable<PublicKey | undefined> = writable<
  PublicKey | undefined
>(undefined);
