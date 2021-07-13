import { struct, Layout } from 'buffer-layout';
import { publicKey, i64, u8, u64, str } from '@project-serum/borsh';
import type { AccountInfo, PublicKey } from '@solana/web3.js';

export enum Discriminator {
  Uninitialized = 0,
  Merchant = 10,
  MerchantSubscription = 11,
  MerchantSubscriptionWithTrial = 12,
  MerchantChainCheckout = 15,
  OrderExpressCheckout = 20,
  OrderChainCheckout = 21,
  Subscription = 30,
  Closed = 255,
}

export interface MerchantAccount {
  discriminator: number;
  owner: PublicKey;
  sponsor: PublicKey;
  fee: number;
  data: string;
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
  Cancelled = 4,
}

export interface OrderAccount {
  discriminator: number;
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
  Cancelled = 2,
}

export interface SubscriptionAccount {
  discriminator: number;
  status: number;
  owner: PublicKey;
  merchant: PublicKey;
  name: string;
  joined: number;
  periodStart: number;
  periodEnd: number;
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
  u8('discriminator'),
  publicKey('owner'),
  publicKey('sponsor'),
  u64('fee'),
  str('data'),
]) as Layout<MerchantAccount>;

export const ORDER_LAYOUT = struct([
  u8('discriminator'),
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
  u8('discriminator'),
  u8('status'),
  publicKey('owner'),
  publicKey('merchant'),
  str('name'),
  i64('joined'),
  i64('periodStart'),
  i64('periodEnd'),
  str('data'),
]) as Layout<SubscriptionAccount>;
