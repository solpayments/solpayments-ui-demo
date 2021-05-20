<script lang="ts">
  import { derived } from 'svelte/store';
  import { onMount } from 'svelte';
  import type { Packages } from './helpers/data';
  import { connected, solanaNetwork, userTokens } from './stores';
  import { getTokenRegistry } from './stores/tokenRegistry';
  import { merchantRegistry } from './stores/merchants';
  import Wallet from './components/Wallet.svelte';
  import MerchantComponent from './components/Merchant.svelte';
  import ExpressCheckout from './components/Checkout.svelte';
  import Tokens from './components/Tokens.svelte';
  import Orders from './components/Orders.svelte';

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

  const subscriptionSeed = 'demo';
  const subscriptionPackages: Packages = {
    packages: [
      { duration: 60 * 60 * 24 * 30, name: 'basic', price: 100000 },
      { duration: 60 * 60 * 24 * 30, name: 'advanced', price: 200000 },
    ],
  };

  const merchant = derived(merchantRegistry, ($merchantRegistry) => {
    return $merchantRegistry.get('Ahe29QiZfwGsMAt8BjRxuBLLWsdLVAyLzBwarVCWx2Rf');
  });

  solanaNetwork.update(() => 'http://localhost:8899');
  onMount(async () => getTokenRegistry());
</script>

<main>
  <h1>Hello {name}!</h1>
  <p>
    Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte
    apps.
  </p>

  <Wallet />

  {#if $connected}
    <h3>Register Merchant</h3>
    <MerchantComponent />

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
    <MerchantComponent seed={subscriptionSeed} data={subscriptionPackages} />

    <hr />
    <h3>Orders</h3>
    <Orders />
  {:else}
    <p style="color: red">Not connected</p>
  {/if}
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
