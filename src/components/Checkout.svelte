<script lang="ts">
  import { getContext } from 'svelte';
  import { Connection, PublicKey } from '@solana/web3.js';
  import {
    adapter,
    connected,
    merchantStore as merchant,
    programId as globalProgramId,
    userTokens,
  } from '../stores';
  import { expressCheckout } from '../instructions/express_checkout';
  import { SINGLE_GOSSIP } from '../helpers/constants';
  import Explorer from './Explorer.svelte';

  const solanaNetwork: string = getContext('solanaNetwork');
  let checkoutPromise: Promise<void | string> | null = null;
  const handleCheckoutPromise = () => {
    checkoutPromise =
      $adapter && $merchant && $userTokens.length > 0
        ? expressCheckout({
            amount: 17 * 10 ** $userTokens[0].account.data.parsed.info.tokenAmount.decimals,
            buyerTokenAccount: $userTokens[0].pubkey,
            connection: new Connection(solanaNetwork, SINGLE_GOSSIP),
            merchantAccount: $merchant.address,
            mint: new PublicKey($userTokens[0].account.data.parsed.info.mint),
            orderId: 'order2',
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
    {#if $userTokens.length > 0}
      <button on:click={() => handleCheckoutPromise()}> Pay Now </button>
    {:else}
      <p>select a token sir</p>
    {/if}

    {#if checkoutPromise}
      {#await checkoutPromise}
        <p>making payment</p>
      {:then txid}
        <p style="color: green">sucess!</p>
        {#if txid}
          <Explorer transactionId={txid} networkUrl={solanaNetwork} />
        {/if}
      {:catch error}
        <p style="color: red">{error}</p>
      {/await}
    {/if}
  {/if}
</main>
