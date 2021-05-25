<script lang="ts">
  import type { PublicKey } from '@solana/web3.js';
  import { derived, writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import type { Packages } from './helpers/data';
  import { connected, solanaNetwork, userTokens } from './stores';
  import { getTokenRegistry } from './stores/tokenRegistry';
  import { merchantRegistry } from './stores/merchants';
  import Wallet from './components/Wallet.svelte';
  import MerchantComponent from './components/Merchant.svelte';
  import ExpressCheckout from './components/Checkout.svelte';
  import Subscribe from './components/Subscribe.svelte';
  import Tokens from './components/Tokens.svelte';
  import Orders from './components/Orders.svelte';
  import SubscriptionDemo from './demos/Subscription.svelte';
  import ShopDemo from './demos/Shop.svelte';
  import './styles/normalize.css';
  import './styles/milligram.css';
  import './styles/solpayments.css';
  export let name: string;
  export let orderId: string;
  export let secret: string;
  export let amount: number;
  export let mintAddress: string;

  const selectedToken = derived(userTokens, ($userTokens) => {
    const possible = $userTokens.filter(
      (item) => item.account.data.parsed.info.mint === mintAddress
    );
    if (possible.length > 0) {
      return possible[0];
    }
    return null;
  });

  const subscriptionName = 'demo';
  const subscriptionPackages: Packages = {
    packages: [
      { duration: 60 * 10, name: 'basic', price: 10000000 },
      { duration: 60 * 60 * 24 * 30, name: 'advanced', price: 20000000 },
    ],
  };

  const addressStore1 = writable<PublicKey | undefined>(undefined);
  const addressStore2 = writable<PublicKey | undefined>(undefined);

  const merchant = derived(merchantRegistry, ($merchantRegistry) => {
    if (addressStore1 && $addressStore1) {
      return $merchantRegistry.get($addressStore1.toString());
    }
    return null;
  });
  const subscriptionMerchant = derived(merchantRegistry, ($merchantRegistry) => {
    if (addressStore2 && $addressStore2) {
      return $merchantRegistry.get($addressStore2.toString());
    }
    return null;
  });

  solanaNetwork.update(() => 'http://localhost:8899');
  onMount(async () => getTokenRegistry());
</script>

<!-- <main>
  <Wallet />
  <Tokens />
  {#if $selectedToken}
    <SubscriptionDemo
      subscriptionName="demo2"
      tokenAccount={$selectedToken}
      packages={subscriptionPackages}
    />
    <ShopDemo tokenAccount={$selectedToken} />
  {/if}
</main> -->

<main>
  <h1>Hello {name}!</h1>
  <p>
    Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte
    apps.
  </p>

  <Wallet />

  {#if $connected}
    <h3>Register Merchant</h3>
    <MerchantComponent addressStore={addressStore1} />

    <h3>Tokens</h3>
    <Tokens />

    {#if $selectedToken}
      {#if $merchant}
        <ExpressCheckout
          merchant={$merchant}
          {orderId}
          {secret}
          {amount}
          buyerToken={$selectedToken}
        />
      {/if}
    {:else}
      <p style="color: red">Token account not found.</p>
    {/if}

    <hr />
    <h3>Subscription</h3>
    <MerchantComponent
      addressStore={addressStore2}
      seed={subscriptionName}
      data={subscriptionPackages}
    />

    {#if $selectedToken}
      {#if $subscriptionMerchant}
        <Subscribe
          merchant={$subscriptionMerchant}
          {subscriptionName}
          subscriptionPackage={subscriptionPackages.packages[0]}
          buyerToken={$selectedToken}
        />
      {/if}
    {:else}
      <p style="color: red">Token account not found.</p>
    {/if}

    <hr />
    {#if addressStore1 && $addressStore1}
      <h3>Orders</h3>
      <Orders merchantAddress={$addressStore1} />
    {/if}
  {:else}
    <p style="color: red">Not connected</p>
  {/if}
</main>
