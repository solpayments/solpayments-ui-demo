<script lang="ts">
  import { memoize } from 'lodash';
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
  import type { OrderSubscription } from '../helpers/data';
  import { Discriminator, OrderStatus } from '../helpers/layout';
  import type { Merchant, OrderInfo } from '../helpers/layout';
  import { abbreviateAddress, onInterval, sleep } from '../helpers/utils';
  import Withdraw from './Withdraw.svelte';
  import CancelSubscription from './CancelSubscription.svelte';

  let ordersPromise: Promise<any> | null = null;
  export let ordersTimeout = 1000 * 30;
  export let merchant: Merchant;

  const getTokenSymbol = (mint: PublicKey): string => {
    const result = $tokenMap.get(mint.toString());
    return result ? result.symbol : abbreviateAddress(mint.toString());
  };

  const loadOrders = () => {
    if ($adapter && $adapter.publicKey && merchant?.address) {
      ordersPromise = getOrderAccounts({
        connection: new Connection($solanaNetwork, PROCESSED),
        merchantKey: merchant.address,
        programId: $globalProgramId,
        tokenRegistry: $tokenMap,
      }).then((result) => {
        sleep(1000).then(() => {
          ordersPromise = null;
        });
        if (result.error) {
          throw result.error;
        } else {
          orderAccounts.update(() => result.value || []);
        }
      });
    }
  };

  const getSubscriptionAccount = memoize((orderInfo: OrderInfo) => {
    if (merchant.account.discriminator === Discriminator.MerchantSubscriptionWithTrial) {
      const orderData: OrderSubscription = JSON.parse(orderInfo.account.data.data);
      return new PublicKey(orderData.subscription);
    }
    return undefined;
  });

  $: processing = ordersPromise !== null;

  onInterval(() => loadOrders(), ordersTimeout);

  onMount(async () => {
    loadOrders();
  });
</script>

<main>
  {#if $connected}
    <button class="button button-outline button-small" on:click={() => loadOrders()}>
      {#if processing}Refreshing{:else}Refresh{/if}
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
                  <Withdraw
                    orderInfo={orderAccount}
                    subscriptionAccount={getSubscriptionAccount(orderAccount)}
                  />
                  {#if (getSubscriptionAccount(orderAccount))}
                  <hr />
                  <CancelSubscription
                    orderInfo={orderAccount}
                    subscriptionAccount={getSubscriptionAccount(orderAccount)}
                  />
                  {/if}
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
