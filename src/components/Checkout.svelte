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
  import TrasactionResult from './TrasactionResult.svelte';

  const solanaNetwork: string = getContext('solanaNetwork');
  let checkoutPromise: Promise<void | string> | null = null;
  let checkoutProcessing = false;
  let checkoutResultTxId: string | undefined = undefined;

  const handleCheckoutPromise = () => {
    checkoutProcessing = true;
    checkoutPromise =
      $adapter && $merchant && $userTokens.length > 0
        ? expressCheckout({
            amount: 17 * 10 ** $userTokens[0].account.data.parsed.info.tokenAmount.decimals,
            buyerTokenAccount: $userTokens[0].pubkey,
            connection: new Connection(solanaNetwork, SINGLE_GOSSIP),
            merchantAccount: $merchant.address,
            mint: new PublicKey($userTokens[0].account.data.parsed.info.mint),
            orderId: '4',
            secret: 'hunter2',
            thisProgramId: $globalProgramId,
            wallet: $adapter,
          })
            .then((result) => {
              if (result.error) {
                throw result.error;
              }
              checkoutResultTxId = result.value;
              return result.value;
            })
            .finally(() => {
              checkoutProcessing = false;
            })
        : null;
  };
</script>

<main>
  {#if $connected && $merchant}
    {#if $userTokens.length > 0}
      {#if !checkoutResultTxId}
        <button on:click={() => handleCheckoutPromise()} disabled={checkoutProcessing}>
          {#if checkoutProcessing}Processing{:else}Pay Now{/if}
        </button>
      {/if}
    {:else}
      <p>select a token sir</p>
    {/if}

    {#if checkoutPromise}
      {#await checkoutPromise}
        <p>making payment</p>
      {:then txId}
        <TrasactionResult {txId} />
      {:catch error}
        <p style="color: red">{error}</p>
      {/await}
    {/if}
  {/if}
</main>
