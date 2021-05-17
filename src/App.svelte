<script lang="ts">
  import { setContext } from 'svelte'
  import { connectToWallet } from './helpers/wallet';
  import { adapter, connected } from './stores';
  import { registerMerchant } from './instructions/register';
  import { Connection, PublicKey } from '@solana/web3.js';
  import { SINGLE_GOSSIP } from './helpers/constants';
  import { getMerchantAccount } from './helpers/api';
  import { expressCheckout } from './instructions/express_checkout';
  import Wallet from './components/Wallet.svelte';
  import MerchantComponent from './components/Merchant.svelte';

  export let name: string;
  export let programId: string;

  setContext('solanaNetwork', 'http://localhost:8899');
</script>

<main>
  <h1>Hello {name}!</h1>
  <p>
    Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte
    apps.
  </p>

  <Wallet />

  <MerchantComponent />

  {#if $connected && $adapter?.publicKey}
    <!-- <p style="color: green">Connected to {$adapter.publicKey}</p>
    {#await getMerchantAccount({
      connection: new Connection('http://localhost:8899', SINGLE_GOSSIP),
      ownerKey: $adapter.publicKey,
      programId,
    })}
      <p>loading program accounts</p>
    {:then result}
      {console.log('>>>>>>>>>>> accounts ', result)}
      <p style="color: green">Done</p>
    {:catch error}
      {console.log('errrrrrrrrrrrrrrr ?? ', error)}
      <p style="color: red">{error}</p>
    {/await} -->

    <!-- {#await expressCheckout({
      amount: 100000,
      buyerTokenAccount: new PublicKey('29cG2PtMwhuN3tsGZj4yHCcVJcaBKoJAtFXw9KBuBF9V'),
      connection: new Connection('http://localhost:8899', SINGLE_GOSSIP),
      merchantAccount: new PublicKey('8JbSLSyLpsThT6zeXNk7CEYETtzxyBfEZQXWWuJtxrck'),
      mint: new PublicKey('9nNBhx15F6WkT94u6uyusnWXmnxQqVro9gGdEX95Vmuu'),
      orderId: 'order2',
      secret: 'hunter2',
      thisProgramId: programId,
      wallet: $adapter,
    })}
      <p>loading</p>
    {:then result}
      {console.log('CHECKOUT >>>>>>>>>>> ', result)}
      <p style="color: green">Done</p>
    {:catch error}
      {console.log('CHECKOUT errrrrrrrrrrrrrrr ?? ', error)}
      <p style="color: red">{error}</p>
    {/await} -->

    <!-- {#await registerMerchant({
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
    {/await} -->
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
