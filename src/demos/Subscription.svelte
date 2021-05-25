<script lang="ts">
  import { derived, writable } from 'svelte/store';
  import type { Packages } from '../helpers/data';
  import { connected } from '../stores';
  import type { UserToken } from '../stores';
  import { merchantRegistry } from '../stores/merchants';
  import Wallet from '../components/Wallet/Wallet.svelte';
  import MerchantComponent from '../components/Merchant.svelte';
  import Subscribe from '../components/Subscribe.svelte';
  import type { PublicKey } from '@solana/web3.js';

  export let packages: Packages;
  export let subscriptionName: string;
  export let tokenAccount: UserToken;
  const addressStore = writable<PublicKey | undefined>(undefined);
  const subscriptionMerchant = derived(merchantRegistry, ($merchantRegistry) => {
    if (addressStore && $addressStore) {
      return $merchantRegistry.get($addressStore.toString());
    }
    return null;
  });
</script>

<main class="subscriptions">
  <h1>Subscription Demo</h1>
  {#if $connected}
    <div class="merchant-account">
      <h2>Subscription Packages</h2>
      <MerchantComponent {addressStore} seed={subscriptionName} data={packages} />
    </div>
    {#if tokenAccount && $subscriptionMerchant}
      {#each packages.packages as subscriptionPackage}
        <Subscribe
          merchant={$subscriptionMerchant}
          {subscriptionName}
          {subscriptionPackage}
          buyerToken={tokenAccount}
        />
      {/each}
    {/if}
  {:else}
    <Wallet />
  {/if}
</main>
