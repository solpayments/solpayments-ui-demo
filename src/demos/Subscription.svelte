<script lang="ts">
  import { setContext } from 'svelte';
  import { links } from 'svelte-routing';
  import { derived } from 'svelte/store';
  import type { Packages } from '../helpers/data';
  import { connected } from '../stores';
  import { merchantRegistry } from '../stores/merchants';
  import Wallet from '../components/Wallet/Wallet.svelte';
  import MerchantComponent from '../components/Merchant.svelte';
  import { subscriptionAddressStore as addressStore } from './demo';

  export let packages: Packages;
  export let subscriptionName: string;

  const subscriptionMerchant = derived(merchantRegistry, ($merchantRegistry) => {
    if (addressStore && $addressStore) {
      return $merchantRegistry.get($addressStore.toString());
    }
    return null;
  });

  setContext('packages', packages);
  setContext('subscriptionName', subscriptionName);
</script>

<main class="subscriptions">
  <h1>Subscription Demo</h1>
  {#if $connected}
    <div class="row">
      <div class="column column-25">
        <ol use:links>
          <li>
            <a href="/subscriptions">
              {#if $subscriptionMerchant}Merchant Account{:else}Register Account{/if}
            </a>
          </li>
          {#if $subscriptionMerchant}
            <li><a href="/subscriptions/customer">Customer Demo</a></li>
            <li><a href="/subscriptions/orders">Manage Orders</a></li>
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
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
              dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum.
            </p>
            <div class="row">
              <div class="column">
                {#if $subscriptionMerchant}
                  <h4>Merchant Account Details</h4>
                  <table>
                    <tbody>
                      <tr>
                        <th> Address </th>
                        <td>
                          {$subscriptionMerchant.address}
                          <br /><span class="tx-sm"
                            >The address of the merchant account on chain</span
                          >
                        </td>
                      </tr>
                      <tr>
                        <th> Fee</th>
                        <td>
                          {$subscriptionMerchant.account.fee} SOL
                          <br /><span class="tx-sm"
                            >The transaction fee in SOL for this merchant</span
                          >
                        </td>
                      </tr>
                      <tr>
                        <th> Data</th>
                        <td>
                          <pre><code>
                          {JSON.stringify(JSON.parse($subscriptionMerchant.account.data), null, 2)}
                          </code></pre>
                          <br /><span class="tx-sm">The merchant data</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                {:else}
                  <MerchantComponent {addressStore} seed={subscriptionName} data={packages} />
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
