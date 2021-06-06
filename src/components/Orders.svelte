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
  import { PROCESSED } from '../helpers/constants';
  import { OrderStatus } from '../helpers/layout';
  import { abbreviateAddress } from '../helpers/utils';
  import Withdraw from './Withdraw.svelte';

  let ordersPromise: Promise<any> | null = null;
  export let ordersTimeout = 1000 * 30;
  export let merchantAddress: PublicKey;

  const getTokenSymbol = (mint: PublicKey): string => {
    const result = $tokenMap.get(mint.toString());
    return result ? result.symbol : abbreviateAddress(mint.toString());
  };

  const loadOrders = () => {
    if ($adapter && $adapter.publicKey && merchantAddress) {
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
    <button class="button button-outline button-small" on:click={() => loadOrders()}>
      Refresh
    </button>

    {#if ordersPromise}
      {#await ordersPromise}
        <!-- <p>loading orders</p> -->
      {:catch _error}
        <!-- <p style="color: red">{error}</p> -->
      {/await}
    {:else}
      <!-- <p>not loading orders</p> -->
    {/if}

    {#if $orderAccounts && $orderAccounts.length > 0}
      <table>
        <thead>
          <tr>
            <th>Created</th>
            <th>Status</th>
            <th>Expected</th>
            <th>Paid</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {#each $orderAccounts.sort((a, b) =>
            a.account.data.created < b.account.data.created ? 1 : -1
          ) as orderAccount}
            <tr>
              <td>{new Date(orderAccount.account.data.created * 1000).toLocaleString()}</td>
              <td>{OrderStatus[orderAccount.account.data.status]}</td>
              <td
                >{orderAccount.account.data.expectedAmount.toLocaleString()}
                {getTokenSymbol(orderAccount.account.data.mint)}</td
              >
              <td
                >{orderAccount.account.data.paidAmount.toLocaleString()}
                {getTokenSymbol(orderAccount.account.data.mint)}</td
              >
              <td>
                {#if orderAccount.account.data.status === OrderStatus.Paid}
                  <Withdraw orderInfo={orderAccount} />
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {/if}
</main>

<style>
  .button-small {
    font-size: 0.9rem;
    font-weight: 400;
    height: 2.5rem;
    line-height: 1rem;
    padding: 0rem 1rem;
  }
</style>
