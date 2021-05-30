<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { derived } from 'svelte/store';
  import { Connection, PublicKey } from '@solana/web3.js';
  import {
    adapter,
    clock,
    connected,
    programId as globalProgramId,
    solanaNetwork,
  } from '../stores';
  import { transactionsMap, TxStatus } from '../stores/transaction';
  import type { Adapter, UserToken } from '../stores';
  import { subscriptionRegistry } from '../stores/subscriptions';
  import { renew_subscription } from '../instructions/renew';
  import { subscribe } from '../instructions/subscribe';
  import { FINALIZED, PROCESSED, PROGRAM_OWNER } from '../helpers/constants';
  import { getClockAccount, getSubscriptionByAddress } from '../helpers/api';
  import type { Package } from '../helpers/data';
  import type { Merchant } from '../helpers/layout';
  import TrasactionResult from './TrasactionResult.svelte';

  export let subscriptionTimeout = 1000 * 10;
  export let clockTimeout = 1000 * 60;
  export let buyerToken: UserToken;
  export let merchant: Merchant;
  export let subscriptionName: string;
  export let subscriptionPackage: Package;
  const name = `${subscriptionName}:${subscriptionPackage.name}`;
  let subscriptionPromise: Promise<void | string> | null = null;
  let subscriptionProcessing = false;
  let subscriptionResultTxId: string | undefined = undefined;
  let subscriptionAddress: PublicKey | undefined = undefined;

  // used to ensure this store subscription does not cause mem leak
  const unsubscribe = transactionsMap.subscribe((value) => {
    if (
      value &&
      subscriptionResultTxId &&
      value.get(subscriptionResultTxId)?.status != TxStatus.Unknown
    ) {
      subscriptionPromise = null;
    }
  });

  const fetchSubscription = (connectedWallet: Adapter) => {
    if (connectedWallet && connectedWallet.publicKey) {
      PublicKey.createWithSeed(
        connectedWallet.publicKey,
        name,
        new PublicKey($globalProgramId)
      ).then((address) => {
        // update local address state
        subscriptionAddress = address;
        getSubscriptionByAddress({
          connection: new Connection($solanaNetwork, PROCESSED),
          publicKey: address,
        }).then((result) => {
          // update the subscription store with the subscription object
          if (result.error) {
            throw result.error;
          } else {
            subscriptionRegistry.update((existing) => {
              if (result.value) {
                existing.set(result.value.address.toString(), result.value);
              }
              return existing;
            });
          }
        });
      });
    }
  };

  const subscription = derived(subscriptionRegistry, ($subscriptionRegistry) => {
    if ($subscriptionRegistry && subscriptionAddress) {
      return $subscriptionRegistry.get(subscriptionAddress.toString()) || null;
    }
    return null;
  });

  const getSubscriptionOrBust = async (force: boolean = false) => {
    // try and get subscription if we dont have it or if its expired
    while (
      !$subscription ||
      force ||
      ($clock && $clock.unixTimestamp > $subscription.account.period_end)
    ) {
      fetchSubscription($adapter);
      // sleep
      await new Promise((r) => setTimeout(r, subscriptionTimeout));
    }
  };

  const handleSubscriptionPromise = () => {
    subscriptionProcessing = true;
    subscriptionPromise = null;
    subscriptionPromise =
      $adapter && $adapter.publicKey && merchant && buyerToken
        ? subscribe({
            amount: subscriptionPackage.price,
            buyerTokenAccount: buyerToken.pubkey,
            connection: new Connection($solanaNetwork, FINALIZED),
            merchantAccount: merchant.address,
            mint: new PublicKey(buyerToken.account.data.parsed.info.mint),
            name,
            programOwnerAccount: new PublicKey(PROGRAM_OWNER),
            sponsorAccount: merchant.account.sponsor,
            subscriptionAddress,
            thisProgramId: $globalProgramId,
            wallet: $adapter,
          })
            .then((result) => {
              if (result.error) {
                throw result.error;
              }
              subscriptionResultTxId = result.value;
              return result.value;
            })
            .finally(() => {
              subscriptionProcessing = false;
            })
        : null;
  };

  const handleRenewSubscriptionPromise = () => {
    subscriptionProcessing = true;
    subscriptionPromise = null;
    subscriptionPromise =
      $adapter && $adapter.publicKey && merchant && subscriptionAddress && buyerToken
        ? renew_subscription({
            amount: subscriptionPackage.price,
            buyerTokenAccount: buyerToken.pubkey,
            connection: new Connection($solanaNetwork, FINALIZED),
            merchantAccount: merchant.address,
            mint: new PublicKey(buyerToken.account.data.parsed.info.mint),
            name,
            programOwnerAccount: new PublicKey(PROGRAM_OWNER),
            sponsorAccount: merchant.account.sponsor,
            subscriptionAccount: subscriptionAddress,
            thisProgramId: $globalProgramId,
            wallet: $adapter,
          })
            .then((result) => {
              if (result.error) {
                throw result.error;
              }
              subscriptionResultTxId = result.value;
              return result.value;
            })
            .finally(() => {
              subscriptionProcessing = false;
            })
        : null;
  };

  const loadClock = () => {
    getClockAccount(new Connection($solanaNetwork, PROCESSED)).then((result) => {
      if (result && result.value) {
        clock.set(result.value);
      }
    });
  };

  const continuousClockReload = async () => {
    loadClock();
    await new Promise((r) => setTimeout(r, clockTimeout));
    continuousClockReload();
  };

  onMount(async () => {
    continuousClockReload();
    getSubscriptionOrBust();
  });

  onDestroy(unsubscribe);
</script>

<main>
  {#if $connected && merchant && buyerToken}
    <!-- TODO show ui friendly amount -->
    {#if $subscription}
      <button
        on:click={() => handleRenewSubscriptionPromise()}
        disabled={subscriptionProcessing || subscriptionPromise != null}
      >
        {#if subscriptionProcessing || subscriptionPromise != null}Processing{:else}
          Renew {subscriptionPackage.name} for {subscriptionPackage.price}
          {buyerToken.name}
        {/if}
      </button>
    {:else}
      <button
        on:click={() => handleSubscriptionPromise()}
        disabled={subscriptionProcessing || subscriptionPromise != null}
      >
        {#if subscriptionProcessing || subscriptionPromise != null}Processing{:else}
          Subscribe to {subscriptionPackage.name} for {subscriptionPackage.price}
          {buyerToken.name}
        {/if}
      </button>
    {/if}
    <p>Duration {subscriptionPackage.duration} seconds</p>

    {#if subscriptionPromise}
      {#await subscriptionPromise}
        <p>processing</p>
      {:then txId}
        <TrasactionResult {txId} sideEffect={getSubscriptionOrBust(true)} />
      {:catch error}
        <p style="color: red">{error}</p>
      {/await}
    {/if}
  {/if}

  {#if $subscription}
    <table>
      <tbody>
        <tr>
          <th> Address </th>
          <td>
            {$subscription.address}
          </td>
        </tr>
        <tr>
          <th> Name </th>
          <td>
            {$subscription.account.name}
          </td>
        </tr>
        <tr>
          <th> Date Joined </th>
          <td>{new Date($subscription.account.joined * 1000).toLocaleString()}</td>
        </tr>
        <tr>
          <th> Current Period Start </th>
          <td>{new Date($subscription.account.period_start * 1000).toLocaleString()}</td>
        </tr>
        <tr>
          {#if $clock && $subscription.account.period_end > $clock.unixTimestamp}
            <th style="color: green"> Active Until </th>
          {:else}
            <th style="color: red"> Ended On </th>
          {/if}
          <td>
            {new Date($subscription.account.period_end * 1000).toLocaleString()}
            <br /><span class="tx-sm">
              The {#if $clock && $subscription.account.period_end > $clock.unixTimestamp}current{:else}last{/if}
              period end date
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  {:else}
    <p style="color: orange">Not subscribed to {subscriptionPackage.name}</p>
  {/if}
</main>
