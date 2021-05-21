<script lang="ts">
  import { onMount } from 'svelte';
  import { derived } from 'svelte/store';
  import { Connection, PublicKey } from '@solana/web3.js';
  import {
    adapter,
    clock,
    connected,
    programId as globalProgramId,
    solanaNetwork,
    userTokens,
  } from '../stores';
  import type { Adapter, UserToken } from '../stores';
  import { subscriptionRegistry } from '../stores/subscriptions';
  import { subscribe } from '../instructions/subscribe';
  import { FINALIZED, PROCESSED, PROGRAM_OWNER } from '../helpers/constants';
  import { getClockAccount, getSubscriptionByAddress } from '../helpers/api';
  import type { Merchant } from '../helpers/layout';
  import TrasactionResult from './TrasactionResult.svelte';

  export let subscriptionTimeout = 1000 * 10;
  export let clockTimeout = 1000 * 60;
  export let buyerToken: UserToken;
  export let amount: number;
  export let merchant: Merchant;
  let subscriptionPromise: Promise<void | string> | null = null;
  let subscriptionProcessing = false;
  let subscriptionResultTxId: string | undefined = undefined;
  let subscriptionAddress: PublicKey | null = null;

  const fetchSubscription = (connectedWallet: Adapter) => {
    if (connectedWallet && connectedWallet.publicKey) {
      PublicKey.createWithSeed(
        connectedWallet.publicKey,
        'demo:basic',
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

  const getSubscriptionOrBust = async () => {
    while (!$subscription) {
      fetchSubscription($adapter);
      // sleep
      await new Promise((r) => setTimeout(r, subscriptionTimeout));
    }
  };

  const handleSubscriptionPromise = () => {
    subscriptionProcessing = true;
    subscriptionPromise = null;
    subscriptionPromise =
      $adapter && $adapter.publicKey && merchant && $userTokens.length > 0
        ? subscribe({
            amount: amount * 10 ** buyerToken.account.data.parsed.info.tokenAmount.decimals,
            buyerTokenAccount: buyerToken.pubkey,
            connection: new Connection($solanaNetwork, FINALIZED),
            merchantAccount: merchant.address,
            mint: new PublicKey(buyerToken.account.data.parsed.info.mint),
            programOwnerAccount: new PublicKey(PROGRAM_OWNER),
            sponsorAccount: merchant.account.sponsor,
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
</script>

<main>
  {#if $connected && merchant}
    {#if $userTokens.length > 0}
      {#if !subscriptionResultTxId}
        <button on:click={() => handleSubscriptionPromise()} disabled={subscriptionProcessing}>
          {#if subscriptionProcessing}Processing{:else}Subscribe Now{/if}
        </button>
      {/if}
    {:else}
      <p>select a token sir</p>
    {/if}

    {#if subscriptionPromise}
      {#await subscriptionPromise}
        <p>subscribing</p>
      {:then txId}
        <TrasactionResult {txId} />
      {:catch error}
        <p style="color: red">{error}</p>
      {/await}
    {/if}
  {/if}

  {#if $subscription}
    <p style="color: green">Subscription Address: {$subscription.address}</p>
    <p>
      name: {$subscription.account.name} ||&nbsp; joined: {new Date(
        $subscription.account.joined * 1000
      )} ||&nbsp; start:
      {new Date($subscription.account.period_start * 1000)} ||&nbsp; end: {new Date(
        $subscription.account.period_end * 1000
      )} ||&nbsp; data:
      {$subscription.account.data}
    </p>
    {#if $clock && $subscription.account.period_end > $clock.unixTimestamp}
      <p style="color: green">
        Subscription Active || active until: {new Date($subscription.account.period_end * 1000)}
      </p>
    {:else}
      <p style="color: red">
        Subscription Inactive || ended: {new Date($subscription.account.period_end * 1000)}
      </p>
    {/if}
  {/if}
</main>
