<script lang="ts">
  import { derived } from 'svelte/store';
  import { connected } from '../../stores';
  import type { UserToken } from '../../stores';
  import { merchantRegistry } from '../../stores/merchants';
  import Wallet from '../../components/Wallet/Wallet.svelte';
  import ExpressCheckout from '../../components/Checkout.svelte';
  import Redirect from '../../components/helpers/Redirect.svelte';
  import { shopAddressStore as addressStore } from '../demo';

  export let tokenAccount: UserToken;
  export let amount = 10;
  export let secret = 'hunter2';

  const merchant = derived(merchantRegistry, ($merchantRegistry) => {
    if (addressStore && $addressStore) {
      return $merchantRegistry.get($addressStore.toString());
    }
    return null;
  });
</script>

<main class="shop-checkout">
  {#if $connected}
    {#if tokenAccount && $merchant}
      <ExpressCheckout
        merchant={$merchant}
        orderId={`order-${new Date().valueOf()}`}
        {secret}
        {amount}
        buyerToken={tokenAccount}
      />
    {:else}
      <Redirect to="/shop" state={{ from: location }} />
    {/if}
  {:else}
    <Wallet />
  {/if}
</main>
