<script lang="ts">
  import { connected } from '../stores';
  import { links } from 'svelte-routing';
  import Wallet from '../components/Wallet/Wallet.svelte';
  import Tokens from '../components/Tokens.svelte';
</script>

{#if !$connected}
  <Wallet />
{:else}
  <div class="row">
    <div class="column">
      <Tokens showInfo={false} showButton={false} showTokens={false} />
    </div>
  </div>
  <div class="row">
    <div class="column">
      <h3>Welcome to SolPayments demo</h3>
      <p>
        SolPayments is a payment processing platform for crypto-currencies which allows individuals
        and businesses of all sizes to accept payments on their websites, online shops, and
        decentralized apps.
      </p>
      <p>
        We have the following demos ready for you to try out :). SolPayments is currently only on
        Solana's <strong>devnet</strong> network.
      </p>
      <p>You are going to need some SOL in your devnet wallet to go through the demo.</p>
      <a href="https://solfaucet.com/" target="_blank" class="button button-outline">Get some SOL</a
      >
      <hr />
    </div>
  </div>
  <div class="row" use:links>
    <div class="column">
      <h3>E-commerce</h3>
      <p>
        Payment procesor meant to be integrated into e-commerce software such as Shopify,
        WooCommerce, etc.
      </p>
      <a class="button" href="/shop">E-commerce demo</a>
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
