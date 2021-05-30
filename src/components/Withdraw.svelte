<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Connection } from '@solana/web3.js';
  import { transactionsMap, TxStatus } from '../stores/transaction';
  import { adapter, connected, programId as globalProgramId, solanaNetwork } from '../stores';
  import type { UserToken } from '../stores';
  import { withdraw } from '../instructions/withdraw';
  import { FINALIZED } from '../helpers/constants';
  import type { OrderInfo } from '../helpers/layout';
  import TrasactionResult from './TrasactionResult.svelte';

  let withdrawPromise: Promise<void | string> | null = null;
  let withdrawProcessing = false;
  let withdrawResultTxId: string | undefined = undefined;
  export let merchantToken: UserToken;
  export let orderInfo: OrderInfo;

  // used to ensure this store subscription does not cause mem leak
  const unsubscribe = transactionsMap.subscribe((value) => {
    if (value && withdrawResultTxId && value.get(withdrawResultTxId)?.status != TxStatus.Unknown) {
      withdrawPromise = null;
    }
  });

  const handleWithdrawPromise = () => {
    withdrawProcessing = true;
    withdrawPromise = null;
    withdrawPromise =
      $adapter && $adapter.publicKey && orderInfo && merchantToken
        ? withdraw({
            connection: new Connection($solanaNetwork, FINALIZED),
            merchantAccount: orderInfo.account.data.merchant,
            merchantTokenAccount: merchantToken.pubkey,
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

  onDestroy(unsubscribe);
</script>

<main>
  {#if $connected && orderInfo}
    {#if merchantToken}
      <div class="row">
        <div class="column">
          <button
            on:click={() => handleWithdrawPromise()}
            disabled={withdrawProcessing || withdrawResultTxId != undefined}
          >
            {#if withdrawProcessing || withdrawResultTxId != undefined}Processing{:else}Withdraw {orderInfo.account.data.paidAmount.toLocaleString()}
              {merchantToken.name} Now{/if}
          </button>
        </div>
      </div>
    {:else}
      <p>select a token sir</p>
    {/if}

    {#if withdrawPromise}
      {#await withdrawPromise}
        <p>withdrawing</p>
      {:then txId}
        <TrasactionResult {txId} />
      {:catch error}
        <p style="color: red">{error}</p>
      {/await}
    {/if}
  {/if}
</main>
