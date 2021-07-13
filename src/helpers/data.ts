/** Subscription package */
export interface Package {
  duration: number /** in seconds */;
  mint: string;
  name: string;
  price: number;
  trial?: number;
}

/** Subscription packages */
export interface Packages {
  packages: Package[];
}

/** Used in order account data field to tie the order to a subscription */
export interface OrderSubscription {
  subscription: string;
}
