<script lang="ts">
  import { connected } from '../stores';
  import Wallet from '../components/Wallet/Wallet.svelte';
  import Tokens from '../components/Tokens.svelte';
</script>

{#if !$connected}
  <Wallet />
{:else}
  <h3>Tokens</h3>
  <Tokens />
{/if}
