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
  import { transactionsMap, TxStatus } from '../stores/transaction';
  import { expressCheckout } from '../instructions/express_checkout';
  import { FINALIZED, PROGRAM_OWNER } from '../helpers/constants';
  import type { Merchant } from '../helpers/layout';
  import TrasactionResult from './TrasactionResult.svelte';

  let checkoutPromise: Promise<void | string> | null = null;
  let checkoutProcessing = false;
  let checkoutResultTxId: string | undefined = undefined;
  export let orderId: string;
  export let secret: string;
  export let buyerToken: UserToken;
  export let amount: number;
  export let merchant: Merchant;

  transactionsMap.subscribe((value) => {
    if (value && checkoutResultTxId && value.get(checkoutResultTxId)?.status != TxStatus.Unknown) {
      checkoutPromise = null;
    }
  });

  const handleCheckoutPromise = () => {
    checkoutProcessing = true;
    checkoutPromise = null;
    checkoutPromise =
      $adapter && $adapter.publicKey && merchant && $userTokens.length > 0
        ? expressCheckout({
            amount: amount * 10 ** buyerToken.account.data.parsed.info.tokenAmount.decimals,
            buyerTokenAccount: buyerToken.pubkey,
            connection: new Connection($solanaNetwork, FINALIZED),
            merchantAccount: merchant.address,
            mint: new PublicKey(buyerToken.account.data.parsed.info.mint),
            orderId,
            programOwnerAccount: new PublicKey(PROGRAM_OWNER),
            secret,
            sponsorAccount: merchant.account.sponsor,
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
  {#if $connected && merchant}
    {#if buyerToken}
      <div class="row">
        <div class="column">
          <input type="number" bind:value={amount} />
          <button
            on:click={() => handleCheckoutPromise()}
            disabled={checkoutProcessing || checkoutPromise != null}
          >
            {#if checkoutProcessing || checkoutPromise != null}Processing{:else}Pay {amount.toLocaleString()}
              {buyerToken.name} Now{/if}
          </button>
        </div>
      </div>
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
