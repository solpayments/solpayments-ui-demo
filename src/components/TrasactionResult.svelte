<script lang="ts">
  import { toast } from '@zerodevx/svelte-toast';
  import Explorer from './Explorer.svelte';
  import { solanaNetwork } from '../stores';
  import { transactionsMap, TxStatus } from '../stores/transaction';

  export let baseUrl = 'https://explorer.solana.com';
  export let txId: string | void;
  export let sideEffect: Promise<void> | null = null;

  const sleep = (t: number) => new Promise((resolve) => setTimeout(resolve, t));

  let baseMsg =
    txId && $solanaNetwork
      ? `<br/><a href="${baseUrl}/tx/${txId}?cluster=custom&customUrl=${$solanaNetwork}" target="_blank">View on Solana</a>`
      : '';

  const id = toast.push(`Loading, please wait...${baseMsg}`, {
    duration: 300,
    initial: 0,
    progress: 0,
    dismissable: false,
  });

  transactionsMap.subscribe((value) => {
    if (value && txId && value.get(txId)) {
      toast.set(id, { msg: `Processing${baseMsg}`, progress: 0.2 });
    }
    if (value && txId && value.get(txId)?.status == TxStatus.Success) {
      const theme = {
        '--toastBackground': '#48BB78',
        '--toastProgressBackground': '#2F855A',
      };
      toast.set(id, { msg: `Success${baseMsg}`, progress: 0.9, theme });
      sleep(2000).then(() => {
        toast.set(id, { msg: `Success${baseMsg}`, progress: 1, theme });
      });
    } else if (value && txId && value.get(txId)?.status == TxStatus.Fail) {
      toast.set(id, { msg: `Failed${baseMsg}`, progress: 0.9 });
    }
  });
</script>

<main>
  {#if txId}
    {#if $transactionsMap.get(txId)?.status === TxStatus.Success}
      <p style="color: green">Success!</p>
      {#if sideEffect}
        {#await sideEffect}
          <p><!-- side effect loading --></p>
        {:then}
          <p><!-- side effect loaded --></p>
        {:catch}
          <p><!-- side effect load error --></p>
        {/await}
      {/if}
    {:else if $transactionsMap.get(txId)?.status === TxStatus.Fail}
      <p style="color: red">Fail!</p>
    {:else}
      <p>Pending!</p>
    {/if}
    <Explorer transactionId={txId} networkUrl={$solanaNetwork} />
  {/if}
</main>
