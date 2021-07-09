<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Connection, PublicKey } from '@solana/web3.js';
  import { transactionsMap, TxStatus } from '../stores/transaction';
  import { adapter, connected, programId as globalProgramId, solanaNetwork } from '../stores';
  import type { UserToken } from '../stores';
  import { withdraw } from '../instructions/withdraw';
  import { FINALIZED, PROGRAM_OWNER } from '../helpers/constants';
  import type { OrderInfo } from '../helpers/layout';
  import TrasactionResult from './TrasactionResult.svelte';

  export let merchantToken: UserToken | undefined = undefined;
  export let orderInfo: OrderInfo;
  let withdrawPromise: Promise<void | string> | null = null;
  let withdrawProcessing = false;
  let withdrawResultTxId: string | undefined = undefined;
  let hasError = false;

  // used to ensure this store subscription does not cause mem leak
  const unsubscribe = transactionsMap.subscribe((value) => {
    if (value && withdrawResultTxId && value.get(withdrawResultTxId)?.status != TxStatus.Unknown) {
      withdrawPromise = null;
    }
  });

  const handleWithdrawPromise = () => {
    hasError = false;
    withdrawProcessing = true;
    withdrawResultTxId = undefined;
    withdrawPromise =
      $adapter && $adapter.publicKey && orderInfo
        ? withdraw({
            accountToReceiveSolRefund: new PublicKey(PROGRAM_OWNER),
            closeOrderAccount: 0,
            connection: new Connection($solanaNetwork, FINALIZED),
            merchantAccount: orderInfo.account.data.merchant,
            merchantTokenAccount: merchantToken?.pubkey,
            mint: orderInfo.account.data.mint,
            orderAccount: orderInfo.pubkey,
            orderTokenAccount: orderInfo.account.data.token,
            thisProgramId: $globalProgramId,
            wallet: $adapter,
          })
            .then((result) => {
              if (result.error) {
                throw result.error;
              }
              withdrawResultTxId = result.value;
              return result.value;
            })
            .finally(() => {
              withdrawProcessing = false;
            })
        : null;
  };

  $: transactionDone =
    withdrawResultTxId != undefined &&
    $transactionsMap.get(withdrawResultTxId)?.status == TxStatus.Success;
  $: processing =
    (withdrawProcessing || withdrawResultTxId != undefined) && !transactionDone && !hasError;

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
        <button on:click={() => handleWithdrawPromise()} disabled={processing || transactionDone}>
          {#if processing}
            Processing
          {:else if transactionDone}
            Withdrawal Successful
          {:else}
            Withdraw
          {/if}
        </button>
      </div>
    </div>

    {#if withdrawPromise}
      {#await withdrawPromise}
        <p>withdrawing</p>
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
