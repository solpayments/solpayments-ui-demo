<script lang="ts">
  import { Connection, PublicKey } from '@solana/web3.js';
  import {
    adapter,
    connected,
    merchantStore as merchant,
    programId as globalProgramId,
    solanaNetwork,
    userTokens,
  } from '../stores';
  import type { UserToken } from '../stores';
  import { expressCheckout } from '../instructions/express_checkout';
  import { MAX, PROGRAM_OWNER } from '../helpers/constants';
  import TrasactionResult from './TrasactionResult.svelte';

  let checkoutPromise: Promise<void | string> | null = null;
  let checkoutProcessing = false;
  let checkoutResultTxId: string | undefined = undefined;
  export let orderId: string;
  export let secret: string;
  export let buyerToken: UserToken;
  export let amount: number;

  const handleCheckoutPromise = () => {
    checkoutProcessing = true;
    checkoutPromise =
      $adapter && $merchant && $userTokens.length > 0
        ? expressCheckout({
            amount: amount * 10 ** buyerToken.account.data.parsed.info.tokenAmount.decimals,
            buyerTokenAccount: buyerToken.pubkey,
            connection: new Connection($solanaNetwork, MAX),
            merchantAccount: $merchant.address,
            mint: new PublicKey(buyerToken.account.data.parsed.info.mint),
            orderId,
            programOwnerAccount: new PublicKey(PROGRAM_OWNER),
            secret,
            sponsorAccount: $merchant.account.sponsorPubkey,
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
