<script lang="ts">
  import { Connection, PublicKey } from '@solana/web3.js';
  import {
    adapter,
    connected,
    programId as globalProgramId,
    solanaNetwork,
    userTokens,
  } from '../stores';
  import type { UserToken } from '../stores';
  import { subscribe } from '../instructions/subscribe';
  import { FINALIZED, PROGRAM_OWNER } from '../helpers/constants';
  import type { Merchant } from '../helpers/layout';
  import TrasactionResult from './TrasactionResult.svelte';

  let subscriptionPromise: Promise<void | string> | null = null;
  let subscriptionProcessing = false;
  let subscriptionResultTxId: string | undefined = undefined;
  export let buyerToken: UserToken;
  export let amount: number;
  export let merchant: Merchant;

  console.log('merchant >>>>>>>>>>>>>>> ', merchant.account.owner.toString());

  const handleSubscriptionPromise = () => {
    subscriptionProcessing = true;
    subscriptionPromise = null;
    subscriptionPromise =
      $adapter && $adapter.publicKey && merchant && $userTokens.length > 0
        ? subscribe({
            amount: amount * 10 ** buyerToken.account.data.parsed.info.tokenAmount.decimals,
            buyerTokenAccount: buyerToken.pubkey,
            connection: new Connection($solanaNetwork, FINALIZED),
            merchantAccount: merchant.address,
            mint: new PublicKey(buyerToken.account.data.parsed.info.mint),
            programOwnerAccount: new PublicKey(PROGRAM_OWNER),
            sponsorAccount: merchant.account.sponsor,
            thisProgramId: $globalProgramId,
            wallet: $adapter,
          })
            .then((result) => {
              if (result.error) {
                throw result.error;
              }
              subscriptionResultTxId = result.value;
              return result.value;
            })
            .finally(() => {
              subscriptionProcessing = false;
            })
        : null;
  };
</script>

<main>
  {#if $connected && merchant}
    {#if $userTokens.length > 0}
      {#if !subscriptionResultTxId}
        <button on:click={() => handleSubscriptionPromise()} disabled={subscriptionProcessing}>
          {#if subscriptionProcessing}Processing{:else}Subscribe Now{/if}
        </button>
      {/if}
    {:else}
      <p>select a token sir</p>
    {/if}

    {#if subscriptionPromise}
      {#await subscriptionPromise}
        <p>subscribing</p>
      {:then txId}
        <TrasactionResult {txId} />
      {:catch error}
        <p style="color: red">{error}</p>
      {/await}
    {/if}
  {/if}
</main>
