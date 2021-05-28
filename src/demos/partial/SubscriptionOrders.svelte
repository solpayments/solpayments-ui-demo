<script lang="ts">
  import { derived } from 'svelte/store';
  import { connected } from '../../stores';
  import type { UserToken } from '../../stores';
  import { merchantRegistry } from '../../stores/merchants';
  import Wallet from '../../components/Wallet/Wallet.svelte';
  import Orders from '../../components/Orders.svelte';
  import Redirect from '../../components/helpers/Redirect.svelte';
  import { subscriptionAddressStore as addressStore } from '../demo';

  export let tokenAccount: UserToken;

  const merchant = derived(merchantRegistry, ($merchantRegistry) => {
    if (addressStore && $addressStore) {
      return $merchantRegistry.get($addressStore.toString());
    }
    return null;
  });
</script>

<main class="subscription-checkout">
  {#if $connected}
    {#if $merchant}
      <Orders merchantToken={tokenAccount} merchantAddress={$merchant.address} />
    {:else}
      <Redirect to="/subscriptions" state={{ from: location }} />
    {/if}
  {:else}
    <Wallet />
  {/if}
</main>
