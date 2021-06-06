import { struct, Layout } from 'buffer-layout';
import { publicKey, i64, u8, u64, str } from '@project-serum/borsh';
import type { AccountInfo, PublicKey } from '@solana/web3.js';

export interface MerchantAccount {
  status: number;
  owner: PublicKey;
  sponsor: PublicKey;
  fee: number;
  data: string;
}

export enum MerchantStatus {
  Uninitialized = 0,
  Initialized = 1,
}

export interface Merchant {
  address: PublicKey;
  account: MerchantAccount;
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
  merchant: PublicKey;
  mint: PublicKey;
  token: PublicKey;
  payer: PublicKey;
  expectedAmount: number;
  paidAmount: number;
  orderId: string;
  secret: string;
  data: string;
}

export enum SubscriptionStatus {
  Uninitialized = 0,
  Initialized = 1,
}

export interface SubscriptionAccount {
  status: number;
  owner: PublicKey;
  merchant: PublicKey;
  name: string;
  joined: number;
  period_start: number;
  period_end: number;
  data: string;
}

export interface Subscription {
  address: PublicKey;
  account: SubscriptionAccount;
}

export interface OrderInfo {
  pubkey: PublicKey;
  account: AccountInfo<OrderAccount>;
}

export const MERCHANT_LAYOUT = struct([
  u8('status'),
  publicKey('owner'),
  publicKey('sponsor'),
  u64('fee'),
  str('data'),
]) as Layout<MerchantAccount>;

export const ORDER_LAYOUT = struct([
  u8('status'),
  i64('created'),
  i64('modified'),
  publicKey('merchant'),
  publicKey('mint'),
  publicKey('token'),
  publicKey('payer'),
  u64('expectedAmount'),
  u64('paidAmount'),
  str('orderId'),
  str('secret'),
  str('data'),
]) as Layout<OrderAccount>;

export const SUBSCRIPTION_LAYOUT = struct([
  u8('status'),
  publicKey('owner'),
  publicKey('merchant'),
  str('name'),
  i64('joined'),
  i64('period_start'),
  i64('period_end'),
  str('data'),
]) as Layout<SubscriptionAccount>;
