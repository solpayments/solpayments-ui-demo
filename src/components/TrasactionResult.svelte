<script lang="ts">
  import { getContext } from 'svelte';
  import Explorer from './Explorer.svelte';
  import { transactionsMap, TxStatus } from '../stores/transaction';

  const solanaNetwork: string = getContext('solanaNetwork');
  export let txId: string | void;
  export let sideEffect: Promise<void> | null = null;
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
    <Explorer transactionId={txId} networkUrl={solanaNetwork} />
  {/if}
</main>
