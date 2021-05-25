<script lang="ts">
  import type { PublicKey } from '@solana/web3.js';
  import { derived, writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import type { Packages } from './helpers/data';
  import { connected, solanaNetwork, userTokens } from './stores';
  import { getTokenRegistry } from './stores/tokenRegistry';
  import { merchantRegistry } from './stores/merchants';
  import Button from './components/Wallet/Button.svelte';
  import Wallet from './components/Wallet/Wallet.svelte';
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

<header class="header">
  <div class="container">
    <div class="row">
      <div class="column">
        <a href="" class="logo">SolPayments</a>
        <input class="menu-btn" type="checkbox" id="menu-btn" />
        <label class="menu-icon" for="menu-btn"><span class="navicon" /></label>
        <ul class="menu">
          <li><a href="#work">Our Work</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#careers">Careers</a></li>
          <li><a href="#contact">Contact</a></li>
          <Button />
        </ul>
      </div>
    </div>
  </div>
</header>
<div class="container">
  <div class="row">
    <div class="column">
      <div id="solpayments">
        {#if !$connected}
          <Wallet />
        {:else}
          <h3>Tokens</h3>
          <Tokens />
        {/if}
      </div>
    </div>
  </div>
</div>
