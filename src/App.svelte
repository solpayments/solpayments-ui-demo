<script lang="ts">
  import { SvelteToast } from '@zerodevx/svelte-toast';
  import { derived } from 'svelte/store';
  import { onMount } from 'svelte';
  import { links, Route, Router } from 'svelte-routing';
  import type { Packages } from './helpers/data';
  import { connected, solanaNetwork, userTokens } from './stores';
  import { getTokenRegistry } from './stores/tokenRegistry';
  import Button from './components/Wallet/Button.svelte';
  import Wallet from './components/Wallet/Wallet.svelte';
  import Tokens from './components/Tokens.svelte';
  import SubscriptionDemo from './demos/Subscription.svelte';
  import ShopDemo from './demos/Shop.svelte';
  import ShopCheckout from './demos/partial/ShopCheckout.svelte';
  import ShopOrders from './demos/partial/ShopOrders.svelte';
  import SubscribeDemo from './demos/partial/SubscribeDemo.svelte';
  import SubscriptionOrders from './demos/partial/SubscriptionOrders.svelte';
  import Home from './demos/Home.svelte';
  import './styles/normalize.css';
  import './styles/milligram.css';
  import './styles/solpayments.css';

  export let mintAddress: string;
  export let url = '';

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

  const toastOptions = { reversed: true, intro: { y: 192 } };

  solanaNetwork.update(() => 'http://localhost:8899');
  onMount(async () => getTokenRegistry());
</script>

<Router {url}>
  <SvelteToast options={toastOptions} />
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
              <SubscriptionDemo {subscriptionName} packages={subscriptionPackages} />
            </Route>
            <Route path="/subscriptions/customer">
              <SubscriptionDemo {subscriptionName} packages={subscriptionPackages}>
                <SubscribeDemo tokenAccount={$selectedToken} />
              </SubscriptionDemo>
            </Route>
            <Route path="/subscriptions/orders">
              <SubscriptionDemo {subscriptionName} packages={subscriptionPackages}>
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

<style>
  :root {
    --toastContainerTop: auto;
    --toastContainerRight: auto;
    --toastContainerBottom: 8rem;
    --toastContainerLeft: calc(50vw - 8rem);
  }
</style>
