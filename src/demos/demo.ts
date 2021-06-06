import type { PublicKey } from '@solana/web3.js';
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { Package } from '../helpers/data';

export const shopAddressStore: Writable<PublicKey | undefined> = writable<PublicKey | undefined>(
  undefined
);

export const subscriptionAddressStore: Writable<PublicKey | undefined> = writable<
  PublicKey | undefined
>(undefined);

export const subscriptionPackages: Writable<Package[]> = writable<Package[]>([]);
