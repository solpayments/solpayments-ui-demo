<script lang="ts">
  import { connected } from '../stores';
  import Wallet from '../components/Wallet/Wallet.svelte';
  import Tokens from '../components/Tokens.svelte';
</script>

{#if !$connected}
  <Wallet />
{:else}
  <Tokens showInfo={false} showButton={false} showTokens={false} />
{/if}
