<script lang="ts">
  import { toast } from '@zerodevx/svelte-toast';
  import { solanaNetwork } from '../stores';
  import { transactionsMap, TxStatus } from '../stores/transaction';
  import { sleep } from '../helpers/utils';

  export let txTimeout = 1000 * 3;
  export let baseUrl = 'https://explorer.solana.com';
  export let txId: string | void;
  export let sideEffect: Promise<void> | null = null;
  export let baseMsg =
    txId && $solanaNetwork
      ? `<br/><a class="toast-link" href="${baseUrl}/tx/${txId}?cluster=custom&customUrl=${$solanaNetwork}" target="_blank">View on Solana Explorer</a>`
      : '';

  const notifyId = toast.push(`Loading, please wait...${baseMsg}`, {
    duration: 300,
    initial: 0,
    progress: 0,
    dismissable: false,
  });

  const STARTING = 0.2;
  const ALMOST = 0.9;
  const DONE = 1;

  let txName = '';

  transactionsMap.subscribe((value) => {
    if (value && txId && value.get(txId)) {
      txName = value.get(txId)?.name || '';
      toast.set(notifyId, { msg: `Processing ${txName}${baseMsg}`, progress: STARTING });
    }
    if (value && txId && value.get(txId)?.status == TxStatus.Success) {
      const theme = {
        '--toastProgressBackground': '#48BB78',
      };
      toast.set(notifyId, { msg: `Successful ${txName}${baseMsg}`, progress: ALMOST, theme });
      sleep(txTimeout).then(() => {
        toast.set(notifyId, { progress: DONE });
      });
    } else if (value && txId && value.get(txId)?.status == TxStatus.Fail) {
      const theme = {
        '--toastProgressBackground': '#FF0000',
      };
      toast.set(notifyId, { msg: `Failed ${txName}${baseMsg}`, progress: ALMOST, theme });
      sleep(txTimeout).then(() => {
        toast.set(notifyId, { progress: DONE });
      });
    }
  });
</script>

<main>
  {#if txId}
    {#if $transactionsMap.get(txId)?.status === TxStatus.Success}
      <!-- <p style="color: green">Success!</p> -->
      {#if sideEffect}
        {#await sideEffect}
          <p><!-- side effect loading --></p>
        {:then}
          <p><!-- side effect loaded --></p>
        {:catch}
          <p><!-- side effect load error --></p>
        {/await}
      {/if}
    {/if}
  {/if}
</main>
