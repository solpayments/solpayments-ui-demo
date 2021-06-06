<script lang="ts">
  import { setContext } from 'svelte';
  import { links } from 'svelte-routing';
  import { derived } from 'svelte/store';
  import { connected } from '../stores';
  import { merchantRegistry } from '../stores/merchants';
  import Wallet from '../components/Wallet/Wallet.svelte';
  import MerchantComponent from '../components/Merchant.svelte';
  import PackagesForm from './partial/PackagesForm.svelte';
  import { subscriptionAddressStore as addressStore, subscriptionPackages } from './demo';

  export let subscriptionName: string;

  const subscriptionMerchant = derived(merchantRegistry, ($merchantRegistry) => {
    if (addressStore && $addressStore) {
      return $merchantRegistry.get($addressStore.toString());
    }
    return null;
  });

  $: packages = {
    packages: $subscriptionPackages,
  };

  setContext('subscriptionName', subscriptionName);
</script>

<main class="subscriptions">
  {#if $connected}
    <h2>Subscriptions Demo</h2>
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
              This demo showcases the process of setting up subscription packages as a merchant, as
              well as a simulation of how a customer could pay for a subscription in order to access
              premium content.
            </p>
            <p>
              The process of setting this up starts with registering a merchant account with the
              SolPayments program. During this merchant registration you specify the subscription
              packages and their price. Like so:
            </p>
            {#if !$subscriptionMerchant}
              <div class="row">
                <div class="column">
                  <PackagesForm />
                </div>
              </div>
            {/if}
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
                {:else if $subscriptionPackages.length > 0}
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
