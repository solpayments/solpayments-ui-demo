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
  import { hash } from '../helpers/utils';
  import TrasactionResult from './TrasactionResult.svelte';

  export let secret: string;
  export let buyerToken: UserToken | undefined = undefined;
  export let amount = 0;
  export let merchant: Merchant;
  export let mint: PublicKey;
  let checkoutPromise: Promise<void | string> | null = null;
  let checkoutProcessing = false;
  let checkoutResultTxId: string | undefined = undefined;
  let hasError = false;
  $: orderId = `order-${new Date().valueOf()}`;

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
    hasError = false;
    checkoutProcessing = true;
    checkoutResultTxId = undefined;
    checkoutPromise =
      $adapter && $adapter.publicKey && merchant
        ? expressCheckout({
            amount: finalAmount,
            buyerTokenAccount: buyerToken?.pubkey,
            connection: new Connection($solanaNetwork, FINALIZED),
            merchantAccount: merchant.address,
            mint,
            orderId: hash(`${merchant.address}`),
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
              // dirty hack to ensure you can do multiple orders in demo
              orderId = orderId + 1;
              return result.value;
            })
            .finally(() => {
              checkoutProcessing = false;
            })
        : null;
  };

  let showAmount = false;
  const showTheAmount = () => {
    showAmount = !showAmount;
  };

  $: processing = (checkoutProcessing || checkoutPromise != null) && !hasError;
  $: disabled = processing || (!$token && !buyerToken);

  /** ensure you can retry after an error */
  const onError = () => {
    hasError = true;
    return null;
  };

  onDestroy(unsubscribe);
</script>

<main>
  {#if $connected && merchant}
    {#if showAmount}
      <div class="row">
        <div class="column column-25">
          <fieldset>
            <label for="amount">Amount</label>
            <input name="amount" type="number" min="0" bind:value={amount} {disabled} />
          </fieldset>
        </div>
      </div>
    {/if}
    <div class="row">
      <div class="column">
        <button on:click={() => handleCheckoutPromise()} {disabled}>
          {#if processing}Processing{:else}Pay {displayAmount.toLocaleString()}
            {tokenSymbol} Now{/if}
        </button>
      </div>
    </div>
    {#if !processing}
      <div class="row">
        <div class="column">
          <button class="button button-clear button-small" on:click={showTheAmount}>
            {#if showAmount}
              Hide Amount
            {:else}
              Change Amount
            {/if}
          </button>
        </div>
      </div>
    {/if}

    {#if checkoutPromise}
      {#await checkoutPromise}
        <p>making payment</p>
      {:then txId}
        <TrasactionResult {txId} />
      {:catch error}
        <!-- TODO: find better way to call this func, as this way is frowned upon in svelte-world-->
        {onError() || ''}
        <p style="color: red">{error}</p>
      {/await}
    {/if}
  {/if}
</main>

<style>
  .button-small {
    font-size: 0.9rem;
    font-weight: 400;
    height: 1.5rem;
    line-height: 1rem;
    padding: 0rem 1rem;
  }
</style>
