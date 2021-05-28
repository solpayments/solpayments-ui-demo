<script lang="ts">
  import type { PublicKey } from '@solana/web3.js';
  import { derived, writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import { links, Route, Router } from 'svelte-routing';
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
  import ShopCheckout from './demos/partial/ShopCheckout.svelte';
  import ShopOrders from './demos/partial/ShopOrders.svelte';
  import SubscribeDemo from './demos/partial/SubscribeDemo.svelte';
  import SubscriptionOrders from './demos/partial/SubscriptionOrders.svelte';
  import Home from './demos/Home.svelte';
  import Redirect from './components/helpers/Redirect.svelte';
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
  export let url = '';

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
<Router {url}>
  <header class="header">
    <div class="container">
      <div class="row">
        <div class="column" use:links>
          <Router>
            <a href="/" class="logo">SolPayments</a>
            <input class="menu-btn" type="checkbox" id="menu-btn" />
            <label class="menu-icon" for="menu-btn"><span class="navicon" /></label>
            <ul class="menu">
              <li><a href="/shop">Shop</a></li>
              <li><a href="/subscriptions">Subscription</a></li>
              <Button />
            </ul>
          </Router>
        </div>
      </div>
    </div>
  </header>
  <div class="container">
    <div class="row">
      <div class="column">
        <div id="solpayments">
          <Route path="/"><Home /></Route>

          {#if $connected}
            <Tokens showButton={false} showTokens={false} showInfo={false} />
          {/if}

          {#if $selectedToken}
            <Route path="/shop">
              <ShopDemo />
            </Route>
            <Route path="/shop/customer">
              <ShopDemo><ShopCheckout tokenAccount={$selectedToken} /></ShopDemo>
            </Route>
            <Route path="/shop/orders"
              ><ShopDemo><ShopOrders tokenAccount={$selectedToken} /></ShopDemo></Route
            >
            <Route path="/subscriptions">
              <SubscriptionDemo subscriptionName="demo" packages={subscriptionPackages} />
            </Route>
            <Route path="/subscriptions/customer">
              <SubscriptionDemo subscriptionName="demo" packages={subscriptionPackages}>
                <SubscribeDemo tokenAccount={$selectedToken} />
              </SubscriptionDemo>
            </Route>
            <Route path="/subscriptions/orders">
              <SubscriptionDemo subscriptionName="demo" packages={subscriptionPackages}>
                <SubscriptionOrders tokenAccount={$selectedToken} />
              </SubscriptionDemo>
            </Route>
          {:else}
            <Route path="/shop/*"><Wallet /></Route>
            <Route path="/subscriptions/*"><Wallet /></Route>
          {/if}
        </div>
      </div>
    </div>
  </div>
</Router>
