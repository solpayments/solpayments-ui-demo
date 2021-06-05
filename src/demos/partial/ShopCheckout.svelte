<script lang="ts">
  import type { PublicKey } from '@solana/web3.js';
  import { derived } from 'svelte/store';
  import { connected } from '../../stores';
  import type { UserToken } from '../../stores';
  import { merchantRegistry } from '../../stores/merchants';
  import Wallet from '../../components/Wallet/Wallet.svelte';
  import ExpressCheckout from '../../components/Checkout.svelte';
  import Redirect from '../../components/helpers/Redirect.svelte';
  import { shopAddressStore as addressStore } from '../demo';

  export let tokenAccount: UserToken | undefined = undefined;
  export let mint: PublicKey;
  export let amount = 0.1;
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
    {#if mint && $merchant}
      <h3>Express Checkout</h3>
      <p>
        Below is a simulation of the last step of a typical online shopping experience i.e. you have
        already selected your products and are now at the last step where you are making the
        payment.
      </p>
      <p>Try it out below :)</p>
      <ExpressCheckout merchant={$merchant} {secret} {mint} {amount} buyerToken={tokenAccount} />
      <p class="tx-sm">
        ** for the purpose of this demo, the currency is set to SOL, but you can use any Solana
        token.
      </p>
    {:else}
      <Redirect to="/shop" state={{ from: location }} />
    {/if}
  {:else}
    <Wallet />
  {/if}
</main>
