<script lang="ts">
  import { derived } from 'svelte/store';
  import { connected } from '../../stores';
  import { merchantRegistry } from '../../stores/merchants';
  import Wallet from '../../components/Wallet/Wallet.svelte';
  import Orders from '../../components/Orders.svelte';
  import Redirect from '../../components/helpers/Redirect.svelte';
  import { subscriptionAddressStore as addressStore } from '../demo';

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
      <h3>Manage Orders</h3>
      <p>
        Here, you can view all of the successfully placed orders to keep track of payments that you
        have received from your customers.
      </p>
      <p>You can also withdraw the amounts received to your own wallet.</p>
      <Orders merchantAddress={$merchant.address} />
    {:else}
      <Redirect to="/subscriptions" state={{ from: location }} />
    {/if}
  {:else}
    <Wallet />
  {/if}
</main>
