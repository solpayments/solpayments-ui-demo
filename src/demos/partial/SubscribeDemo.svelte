<script lang="ts">
  import { derived } from 'svelte/store';
  import { connected } from '../../stores';
  import type { UserToken } from '../../stores';
  import { merchantRegistry } from '../../stores/merchants';
  import type { Packages } from '../../helpers/data';
  import Wallet from '../../components/Wallet/Wallet.svelte';
  import Subscribe from '../../components/Subscribe.svelte';
  import Redirect from '../../components/helpers/Redirect.svelte';
  import { subscriptionAddressStore as addressStore } from '../demo';

  export let tokenAccount: UserToken | undefined = undefined;
  let packages: Packages | undefined = undefined;

  const subscriptionMerchant = derived(merchantRegistry, ($merchantRegistry) => {
    if (addressStore && $addressStore) {
      return $merchantRegistry.get($addressStore.toString());
    }
    return null;
  });

  if ($subscriptionMerchant) {
    packages = JSON.parse($subscriptionMerchant.account.data);
  }
</script>

<main class="subscription-checkout">
  {#if $connected}
    {#if $subscriptionMerchant && packages}
      <div class="row">
        <div class="column">
          <h3>Subscriptions</h3>
          <p>
            Below is a simulation of how one may purchase and renew subscriptions on a decentralized
            web application.
          </p>
          <p>
            The subscriptions that appear on this page are those ones which has been registered
            previouslt in this demo.
          </p>
        </div>
      </div>
      {#each packages.packages as subscriptionPackage}
        <div class="row">
          <div class="column">
            <Subscribe
              merchant={$subscriptionMerchant}
              {subscriptionPackage}
              buyerToken={tokenAccount}
            />
          </div>
        </div>
      {/each}
    {:else}
      <Redirect to="/subscriptions" state={{ from: location }} />
    {/if}
  {:else}
    <Wallet />
  {/if}
</main>
