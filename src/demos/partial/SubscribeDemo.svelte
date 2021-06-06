<script lang="ts">
  import type { PublicKey } from '@solana/web3.js';
  import { getContext } from 'svelte';
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
  export let mint: PublicKey;
  let packages: Packages | undefined = undefined;

  const subscriptionName = getContext<string>('subscriptionName');

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
    {#if $subscriptionMerchant && packages && subscriptionName}
      <div class="row">
        {#each packages.packages as subscriptionPackage}
          <div class="column">
            <Subscribe
              merchant={$subscriptionMerchant}
              {mint}
              {subscriptionName}
              {subscriptionPackage}
              buyerToken={tokenAccount}
            />
          </div>
        {/each}
      </div>
    {:else}
      <Redirect to="/subscriptions" state={{ from: location }} />
    {/if}
  {:else}
    <Wallet />
  {/if}
</main>
