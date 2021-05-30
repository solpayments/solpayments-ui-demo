<script lang="ts">
  import { onDestroy } from 'svelte';
  import { derived } from 'svelte/store';
  import { Connection, PublicKey } from '@solana/web3.js';
  import { adapter, connected, programId as globalProgramId, solanaNetwork } from '../stores';
  import type { UserToken } from '../stores';
  import { tokenMap } from '../stores/tokenRegistry';
  import { transactionsMap, TxStatus } from '../stores/transaction';
  import { expressCheckout } from '../instructions/express_checkout';
  import { DEFAULT_DECIMALS, FINALIZED, PROGRAM_OWNER } from '../helpers/constants';
  import type { Merchant } from '../helpers/layout';
  import TrasactionResult from './TrasactionResult.svelte';

  let checkoutPromise: Promise<void | string> | null = null;
  let checkoutProcessing = false;
  let checkoutResultTxId: string | undefined = undefined;
  export let orderId: string;
  export let secret: string;
  export let buyerToken: UserToken | undefined = undefined;
  export let amount: number = 0;
  export let merchant: Merchant;
  export let mint: PublicKey;

  const token = derived(tokenMap, ($tokenMap) => {
    if ($tokenMap) {
      if (mint !== undefined) {
        return $tokenMap.get(mint.toBase58()) || null;
      } else if (buyerToken) {
        return $tokenMap.get(buyerToken.pubkey.toBase58()) || null;
      }
    }
    return null;
  });

  $: displayAmount = amount || 0;
  $: finalAmount = buyerToken
    ? amount * 10 ** buyerToken.account.data.parsed.info.tokenAmount.decimals
    : $token
    ? amount * 10 ** $token.decimals
    : amount * 10 ** DEFAULT_DECIMALS;

  $: tokenSymbol = buyerToken ? buyerToken.symbol : $token ? $token.symbol : '';

  // used to ensure this store subscription does not cause mem leak
  const unsubscribe = transactionsMap.subscribe((value) => {
    if (value && checkoutResultTxId && value.get(checkoutResultTxId)?.status != TxStatus.Unknown) {
      checkoutPromise = null;
    }
  });

  const handleCheckoutPromise = () => {
    checkoutProcessing = true;
    checkoutPromise = null;
    checkoutPromise =
      $adapter && $adapter.publicKey && merchant
        ? expressCheckout({
            amount: finalAmount,
            buyerTokenAccount: buyerToken?.pubkey,
            connection: new Connection($solanaNetwork, FINALIZED),
            merchantAccount: merchant.address,
            mint,
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

  onDestroy(unsubscribe);
</script>

<main>
  {#if $connected && merchant}
    <div class="row">
      <div class="column">
        <input type="number" min="0" bind:value={amount} />
        <button
          on:click={() => handleCheckoutPromise()}
          disabled={checkoutProcessing || checkoutPromise != null || !$token}
        >
          {#if checkoutProcessing || checkoutPromise != null}Processing{:else}Pay {displayAmount.toLocaleString()}
            {tokenSymbol} Now{/if}
        </button>
      </div>
    </div>

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
