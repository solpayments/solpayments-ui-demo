import { struct, Layout } from 'buffer-layout';
import { publicKey, bool } from '@project-serum/borsh';
import type { PublicKey } from '@solana/web3.js';

export interface MerchantAccount {
  isInitialized: boolean;
  ownerPubkey: PublicKey;
  sponsorPubkey: PublicKey;
}

export const MERCHANT_LAYOUT = struct([
  bool('isInitialized'),
  publicKey('ownerPubkey'),
  publicKey('sponsorPubkey'),
]) as Layout<MerchantAccount>;
