<script lang="ts">
  import { derived } from 'svelte/store';
  import { onMount } from 'svelte';
  import type { Packages } from '../helpers/data';
  import { adapter, connected, solanaNetwork, userTokens } from '../stores';
  import type { UserToken } from '../stores';
  import { getTokenRegistry } from '../stores/tokenRegistry';
  import { merchantRegistry } from '../stores/merchants';
  import Wallet from './components/Wallet.svelte';
  import MerchantComponent from './components/Merchant.svelte';
  import ExpressCheckout from './components/Checkout.svelte';
  import Subscribe from './components/Subscribe.svelte';
  import Tokens from './components/Tokens.svelte';
  import Orders from './components/Orders.svelte';

  export let merchantAddress: string;
  export let packages: Packages;
  export let subscriptionName: string;
  export let tokenAccount: UserToken;

  const subscriptionMerchant = derived(merchantRegistry, ($merchantRegistry) => {
    return $merchantRegistry.get(merchantAddress);
  });
</script>

<main class="subscriptions">
  <h1>Subscription Demo</h1>
  {#if $connected}
    <div class="merchant-account">
      <h2>Subscription Packages</h2>
      <MerchantComponent seed={subscriptionName} data={packages} />
    </div>
    {#if tokenAccount && $subscriptionMerchant}
      {#each packages.packages as subscriptionPackage}
        <Subscribe
          merchant={$subscriptionMerchant}
          {subscriptionName}
          {subscriptionPackage}
          buyerToken={tokenAccount}
        />
      {/each}
    {/if}
  {:else}
    <Wallet />
  {/if}
</main>
