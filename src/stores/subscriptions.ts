import { writable } from 'svelte/store';
import type { Subscription } from '../helpers/layout';

export type SubscriptionMap = Map<string, Subscription>;

/** known subscriptions store */
export const subscriptionRegistry = writable<SubscriptionMap>(new Map());
