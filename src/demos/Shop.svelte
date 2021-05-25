<script lang="ts">
  import { derived, writable } from 'svelte/store';
  import { connected } from '../stores';
  import type { UserToken } from '../stores';
  import { merchantRegistry } from '../stores/merchants';
  import Wallet from '../components/Wallet/Wallet.svelte';
  import MerchantComponent from '../components/Merchant.svelte';
  import ExpressCheckout from '../components/Checkout.svelte';
  import Orders from '../components/Orders.svelte';
  import type { PublicKey } from '@solana/web3.js';
  import { MERCHANT } from '../helpers/constants';

  export let tokenAccount: UserToken;
  const addressStore = writable<PublicKey | undefined>(undefined);
  const merchant = derived(merchantRegistry, ($merchantRegistry) => {
    if (addressStore && $addressStore) {
      return $merchantRegistry.get($addressStore.toString());
    }
    return null;
  });
</script>

<main class="shop">
  <h1>Online Shop Demo</h1>
  {#if $connected}
    <div class="merchant-account">
      <h2>Register Merchant</h2>
      <MerchantComponent {addressStore} seed={MERCHANT} />
    </div>
    {#if tokenAccount && $merchant}
      <ExpressCheckout
        merchant={$merchant}
        orderId={`order-${new Date().valueOf()}`}
        secret="hunter2"
        amount={10}
        buyerToken={tokenAccount}
      />
      <h3>Your Orders</h3>
      <Orders merchantAddress={$merchant.address} />
    {/if}
  {:else}
    <Wallet />
  {/if}
</main>
