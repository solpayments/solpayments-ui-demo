<script lang="ts">
  import { connected } from '../stores';
  import { links } from 'svelte-routing';
  import Wallet from '../components/Wallet/Wallet.svelte';
  import Tokens from '../components/Tokens.svelte';
</script>

{#if !$connected}
  <Wallet />
{:else}
  <Tokens showInfo={false} showButton={false} showTokens={false} />
  <div class="row" use:links>
    <div class="column">
      <h3>E-commerce platforms</h3>
      <p>
        Payment procesor meant to be integrated into e-commerce software such as Shopify,
        WooCommerce, etc.
      </p>
      <a class="button" href="/shop">Checkout demo</a>
    </div>
    <div class="column">
      <h3>Subscriptions</h3>
      <p>
        Create and manage subscriptions on-chain to monetize web3 apps, newsletters, membership
        websites, etc.
      </p>
      <a class="button" href="/subscriptions">Subscriptions demo</a>
    </div>
    <div class="column">
      <h3>Fundraising</h3>
      <p>
        Raise money from large groups of people for charity, kickstarter-style crowdfunding, or
        event initial SPL token sales.
      </p>
      <button disabled={true}>Fundraising demo (coming soon)</button>
    </div>
  </div>
{/if}
