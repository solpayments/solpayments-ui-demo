<script lang="ts">
  import { getContext } from 'svelte';
  import { Connection, PublicKey } from '@solana/web3.js';
  import {
    adapter,
    connected,
    merchantStore as merchant,
    programId as globalProgramId,
  } from '../stores';
  import { expressCheckout } from '../instructions/express_checkout';
  import { SINGLE_GOSSIP } from '../helpers/constants';

  const solanaNetwork: string = getContext('solanaNetwork');
  let checkoutPromise: Promise<void | string> | null = null;
  const handleCheckoutPromise = () => {
    checkoutPromise =
      $adapter && $merchant
        ? expressCheckout({
            amount: 100000,
            buyerTokenAccount: new PublicKey('29cG2PtMwhuN3tsGZj4yHCcVJcaBKoJAtFXw9KBuBF9V'),
            connection: new Connection(solanaNetwork, SINGLE_GOSSIP),
            merchantAccount: $merchant.address,
            mint: new PublicKey('9nNBhx15F6WkT94u6uyusnWXmnxQqVro9gGdEX95Vmuu'),
            orderId: 'order3',
            secret: 'hunter2',
            thisProgramId: $globalProgramId,
            wallet: $adapter,
          }).then((result) => {
            if (result.error) {
              throw result.error;
            }
            return result.value;
          })
        : null;
  };
</script>

<main>
  {#if $connected && $merchant}
    <button on:click={() => handleCheckoutPromise()}> Pay Now </button>

    {#if checkoutPromise}
      {#await checkoutPromise}
        <p>making payment</p>
      {:then txid}
        <p style="color: green">sucess! {txid}</p>
      {:catch error}
        <p style="color: red">{error}</p>
      {/await}
    {/if}
  {/if}
</main>
