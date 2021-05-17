<script lang="ts">
  import { setContext } from 'svelte';
  import { connected } from './stores';
  import Wallet from './components/Wallet.svelte';
  import MerchantComponent from './components/Merchant.svelte';
  import ExpressCheckout from './components/Checkout.svelte';

  export let name: string;

  setContext('solanaNetwork', 'http://localhost:8899');
</script>

<main>
  <h1>Hello {name}!</h1>
  <p>
    Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte
    apps.
  </p>

  <Wallet />

  {#if $connected}
    <MerchantComponent />

    <ExpressCheckout />
  {:else}
    <p style="color: red">Not connected</p>
  {/if}
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
