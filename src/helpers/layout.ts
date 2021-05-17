import { struct, Layout } from 'buffer-layout';
import { publicKey, bool, i64, u8, u64, str } from '@project-serum/borsh';
import type { PublicKey } from '@solana/web3.js';

export interface MerchantAccount {
  isInitialized: boolean;
  ownerPubkey: PublicKey;
  sponsorPubkey: PublicKey;
}

export enum OrderStatus {
  Uninitialized = 0,
  Pending = 1,
  Paid = 2,
  Withdrawn = 3,
}

export interface OrderAccount {
  status: number;
  created: number;
  modified: number;
  merchantPubkey: PublicKey;
  mintPubkey: PublicKey;
  tokenPubkey: PublicKey;
  payerPubkey: PublicKey;
  expectedAmount: number;
  paidAmount: number;
  takeHomeAmount: number;
  feeAmount: number;
  orderId: string;
  secret: string;
}

export const MERCHANT_LAYOUT = struct([
  bool('isInitialized'),
  publicKey('ownerPubkey'),
  publicKey('sponsorPubkey'),
]) as Layout<MerchantAccount>;

export const ORDER_LAYOUT = struct([
  u8('status'),
  i64('created'),
  i64('modified'),
  publicKey('merchantPubkey'),
  publicKey('mintPubkey'),
  publicKey('tokenPubkey'),
  publicKey('payerPubkey'),
  u64('expectedAmount'),
  u64('paidAmount'),
  u64('takeHomeAmount'),
  u64('feeAmount'),
  str('orderId'),
  str('secret'),
]) as Layout<OrderAccount>;
