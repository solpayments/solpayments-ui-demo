<script lang="ts">
  import { onMount } from 'svelte';
  import { Connection, PublicKey } from '@solana/web3.js';
  import {
    adapter,
    connected,
    orderAccounts,
    programId as globalProgramId,
    solanaNetwork,
  } from '../stores';
  import { tokenMap } from '../stores/tokenRegistry';
  import { getOrderAccounts } from '../helpers/api';
  import { MERCHANT, PROCESSED } from '../helpers/constants';

  let ordersPromise: Promise<any> | null = null;
  export let ordersTimeout = 1000 * 60;
  export let merchantSeed: string = MERCHANT;

  const loadOrders = () => {
    if ($adapter && $adapter.publicKey) {
      PublicKey.createWithSeed(
        $adapter.publicKey,
        merchantSeed,
        new PublicKey($globalProgramId)
      ).then((merchantAddress) => {
        ordersPromise = getOrderAccounts({
          connection: new Connection($solanaNetwork, PROCESSED),
          merchantKey: merchantAddress,
          programId: $globalProgramId,
          tokenRegistry: $tokenMap,
        }).then((result) => {
          ordersPromise = null;
          if (result.error) {
            throw result.error;
          } else {
            orderAccounts.update(() => result.value || []);
          }
        });
      });
    }
  };

  const continuousOrderReload = async () => {
    loadOrders();
    await new Promise((r) => setTimeout(r, ordersTimeout));
    continuousOrderReload();
  };

  onMount(async () => {
    continuousOrderReload();
  });
</script>

<main>
  {#if $connected}
    <button on:click={() => loadOrders()}> Refresh Orders </button>

    {#if ordersPromise}
      {#await ordersPromise}
        <p>loading orders</p>
      {:catch error}
        <p style="color: red">{error}</p>
      {/await}
    {:else}
      <p>not loading orders</p>
    {/if}

    {#if $orderAccounts}
      {#each $orderAccounts as orderAccount}
        <p>
          id: {orderAccount.account.data.orderId} ||&nbsp; secret: {orderAccount.account.data
            .secret} ||&nbsp; created: {orderAccount.account.data.created} ||&nbsp; modified: {orderAccount
            .account.data.modified} ||&nbsp; status: {orderAccount.account.data.status} ||&nbsp; paid:
          {orderAccount.account.data.paidAmount} ||&nbsp; expected: {orderAccount.account.data
            .expectedAmount} ||&nbsp; data: {orderAccount.account.data.data}
        </p>
      {/each}
    {/if}
  {/if}
</main>
