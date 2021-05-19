<script lang="ts">
  import { onMount } from 'svelte';
  import { Connection } from '@solana/web3.js';
  import { adapter, connected, userTokens, solanaNetwork, updateUserTokens } from '../stores';
  import { tokenMap } from '../stores/tokenRegistry';
  import { fetchTokenAccounts } from '../helpers/api';
  import { PROCESSED } from '../helpers/constants';
  import { TOKEN_PROGRAM_ID } from '../helpers/solana';
  import type { TokenFromApi } from '../helpers/solana';

  let tokensPromise: Promise<void | TokenFromApi[]> | null = null;
  export let tokenTimeout = 5000;

  const loadTokens = () => {
    if ($adapter && $adapter.publicKey) {
      tokensPromise = fetchTokenAccounts({
        connection: new Connection($solanaNetwork, PROCESSED),
        ownerKey: $adapter.publicKey,
        programId: TOKEN_PROGRAM_ID,
      }).then((result) => {
        tokensPromise = null;
        if (result.error) {
          throw result.error;
        } else {
          updateUserTokens(result.value.value, $tokenMap);
        }
      });
    }
  };

  const continousTokenReload = async () => {
    loadTokens();
    await new Promise((r) => setTimeout(r, tokenTimeout));
    continousTokenReload();
  };

  onMount(async () => {
    continousTokenReload();
  });
</script>

<main>
  {#if $connected}
    <button on:click={() => loadTokens()}> Refresh Tokens </button>

    {#if tokensPromise}
      {#await tokensPromise}
        <p>loading tokens</p>
      {:catch error}
        <p style="color: red">{error}</p>
      {/await}
    {:else}
      <p>not refreshing tokens</p>
    {/if}

    {#if $userTokens}
      {#each $userTokens as userToken}
        <p>
          {userToken.name} ||&nbsp;
          {userToken.symbol} ||&nbsp;
          {userToken.account.data.parsed.info.tokenAmount.uiAmountString}
        </p>
      {/each}
    {/if}
  {/if}
</main>
