<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Connection, PublicKey } from '@solana/web3.js';
  import { transactionsMap, TxStatus } from '../stores/transaction';
  import { adapter, connected, programId as globalProgramId, solanaNetwork } from '../stores';
  import { cancel } from '../instructions/cancel_subscription';
  import { FINALIZED, PROGRAM_OWNER } from '../helpers/constants';
  import type { OrderInfo } from '../helpers/layout';
  import TrasactionResult from './TrasactionResult.svelte';

  export let orderInfo: OrderInfo;
  export let subscriptionAccount: PublicKey | undefined;
  let cancelSubscriptionPromise: Promise<void | string> | null = null;
  let cancelSubscriptionProcessing = false;
  let cancelSubscriptionResultTxId: string | undefined = undefined;
  let hasError = false;

  // used to ensure this store subscription does not cause mem leak
  const unsubscribe = transactionsMap.subscribe((value) => {
    if (
      value &&
      cancelSubscriptionResultTxId &&
      value.get(cancelSubscriptionResultTxId)?.status != TxStatus.Unknown
    ) {
      cancelSubscriptionPromise = null;
    }
  });

  const handleCancelPromise = () => {
    hasError = false;
    cancelSubscriptionProcessing = true;
    cancelSubscriptionResultTxId = undefined;
    cancelSubscriptionPromise =
      $adapter && $adapter.publicKey && orderInfo && subscriptionAccount
        ? cancel({
            accountToReceiveSolRefund: new PublicKey(PROGRAM_OWNER),
            connection: new Connection($solanaNetwork, FINALIZED),
            merchantAccount: orderInfo.account.data.merchant,
            mint: orderInfo.account.data.mint,
            orderAccount: orderInfo.pubkey,
            orderTokenAccount: orderInfo.account.data.token,
            subscriptionAccount,
            thisProgramId: $globalProgramId,
            wallet: $adapter,
          })
            .then((result) => {
              if (result.error) {
                throw result.error;
              }
              cancelSubscriptionResultTxId = result.value;
              return result.value;
            })
            .finally(() => {
              cancelSubscriptionProcessing = false;
            })
        : null;
  };

  $: transactionDone =
    cancelSubscriptionResultTxId != undefined &&
    $transactionsMap.get(cancelSubscriptionResultTxId)?.status == TxStatus.Success;
  $: processing =
    (cancelSubscriptionProcessing || cancelSubscriptionResultTxId != undefined) &&
    !transactionDone &&
    !hasError;

  /** ensure you can retry after an error */
  const onError = () => {
    hasError = true;
    return null;
  };

  onDestroy(unsubscribe);
</script>

<main>
  {#if $connected && orderInfo}
    <div class="row">
      <div class="column">
        <button on:click={() => handleCancelPromise()} disabled={processing || transactionDone}>
          {#if processing}
            Processing
          {:else if transactionDone}
            Cancel Successful
          {:else}
            Cancel Subscription
          {/if}
        </button>
      </div>
    </div>

    {#if cancelSubscriptionPromise}
      {#await cancelSubscriptionPromise}
        <p>Cancelling Subscription</p>
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
