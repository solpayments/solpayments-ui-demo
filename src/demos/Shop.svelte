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
  export let amount = 10;
  export let secret = 'hunter2';
  const addressStore = writable<PublicKey | undefined>(undefined);
  const merchant = derived(merchantRegistry, ($merchantRegistry) => {
    if (addressStore && $addressStore) {
      return $merchantRegistry.get($addressStore.toString());
    }
    return null;
  });
</script>

<main class="shop">
  <h2>E-commerce Payment Processor</h2>
  {#if $connected}
    <div class="merchant-account">
      <h3>Create Merchant Account Merchant</h3>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
      <div class="row">
        <div class="column">
          {#if $merchant}
            <h4>Merchant Account Details</h4>
            <table>
              <tbody>
                <tr>
                  <th> Address </th>
                  <td>
                    {$merchant.address}
                    <br /><span class="tx-sm">The address of the merchant account on chain</span>
                  </td>
                </tr>
                <tr>
                  <th> Fee</th>
                  <td>
                    {$merchant.account.fee} SOL
                    <br /><span class="tx-sm">The transaction fee in SOL for this merchant</span>
                  </td>
                </tr>
              </tbody>
            </table>
          {:else}
            <MerchantComponent {addressStore} seed={MERCHANT} />
          {/if}
        </div>
      </div>
    </div>
    {#if tokenAccount && $merchant}
      <ExpressCheckout
        merchant={$merchant}
        orderId={`order-${new Date().valueOf()}`}
        {secret}
        {amount}
        buyerToken={tokenAccount}
      />
      <h3>Your Orders</h3>
      <Orders merchantAddress={$merchant.address} />
    {/if}
  {:else}
    <Wallet />
  {/if}
</main>
