<script lang="ts">
  import { connectToWallet } from './helpers/wallet';
  import { walletConnected, store as adapter, setWalletConnected } from './stores';
  import { registerMerchant } from './instructions/register';
  import { Connection } from '@solana/web3.js';
  import { SINGLE_GOSSIP } from './helpers/constants';
  import { fetchProgramAccounts } from './helpers/api';
  // import { MERCHANT_LAYOUT } from './helpers/layout';

  export let name: string;
  export let programId: string;
</script>

<main>
  <h1>Hello {name}!</h1>
  <p>
    Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte
    apps.
  </p>

  <button on:click={() => setWalletConnected()}> Connect </button>

  {#if $walletConnected}
    {#await connectToWallet()}
      <p>loading</p>
    {:then _pubkey}
      <p style="color: green">Done</p>
    {:catch error}
      <p style="color: red">{error}</p>
    {/await}
  {/if}

  {#if $adapter?.publicKey}
    <p style="color: green">Connected to {$adapter.publicKey}</p>

    {#await fetchProgramAccounts({
      connection: new Connection('http://localhost:8899', SINGLE_GOSSIP),
      programId,
    })}
      <p>loading program accounts</p>
    {:then result}
      {console.log('>>>>>>>>>>> accounts ', result)}
      <p style="color: green">Done</p>
    {:catch error}
      {console.log('errrrrrrrrrrrrrrr ?? ', error)}
      <p style="color: red">{error}</p>
    {/await}

    {#await registerMerchant({
      connection: new Connection('http://localhost:8899', SINGLE_GOSSIP),
      thisProgramId: programId,
      wallet: $adapter,
    })}
      <p>loading</p>
    {:then result}
      {console.log('>>>>>>>>>>> ', result)}
      <p style="color: green">Done</p>
    {:catch error}
      {console.log('errrrrrrrrrrrrrrr ?? ', error)}
      <p style="color: red">{error}</p>
    {/await}
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
