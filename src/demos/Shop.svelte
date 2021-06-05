<script lang="ts">
  import { derived } from 'svelte/store';
  import { links } from 'svelte-routing';
  import { connected } from '../stores';
  import { merchantRegistry } from '../stores/merchants';
  import Wallet from '../components/Wallet/Wallet.svelte';
  import MerchantComponent from '../components/Merchant.svelte';
  import { MERCHANT } from '../helpers/constants';
  import { shopAddressStore as addressStore } from './demo';

  const merchant = derived(merchantRegistry, ($merchantRegistry) => {
    if (addressStore && $addressStore) {
      return $merchantRegistry.get($addressStore.toString());
    }
    return null;
  });
</script>

<main class="shop">
  {#if $connected}
    <h2>E-commerce Payment Processor Demo</h2>
    <div class="row">
      <div class="column column-25">
        <ol use:links>
          <li>
            <a href="/shop">
              {#if $merchant}Merchant Account{:else}Register Account{/if}
            </a>
          </li>
          {#if $merchant}
            <li><a href="/shop/customer">Customer Demo</a></li>
            <li><a href="/shop/orders">Manage Orders</a></li>
          {:else}
            <li>Customer Demo</li>
            <li>Manage Orders</li>
          {/if}
        </ol>
      </div>
      <div class="column">
        <slot>
          <div class="merchant-account">
            <h3>Merchant Account</h3>
            <p>
              This demo showcases a "Pay Now"/"Buy Now" button that is meant to be integrated in
              e-commerce software such as Shopify or WooCommerce.
            </p>
            <p>
              The process of setting this up starts with registering a merchant account with the
              SolPayments program.
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
                          <br /><span class="tx-sm"
                            >The address of the merchant account on chain</span
                          >
                        </td>
                      </tr>
                      <tr>
                        <th> Fee</th>
                        <td>
                          {$merchant.account.fee} SOL
                          <br /><span class="tx-sm"
                            >The transaction fee in SOL for this merchant</span
                          >
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
        </slot>
      </div>
    </div>
  {:else}
    <Wallet />
  {/if}
</main>
