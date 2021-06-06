<script lang="ts">
  import { onMount } from 'svelte';
  import { Connection } from '@solana/web3.js';
  import { adapter, connected, userTokens, solanaNetwork, updateUserTokens } from '../stores';
  import { tokenMap } from '../stores/tokenRegistry';
  import { fetchTokenAccounts } from '../helpers/api';
  import { PROCESSED } from '../helpers/constants';
  import { TOKEN_PROGRAM_ID } from '../helpers/solana';
  import { onInterval } from '../helpers/utils';
  import type { TokenFromApi } from '../helpers/solana';

  export let showButton = true;
  export let showTokens = true;
  export let showInfo = true;
  export let tokenTimeout = 1000 * 15;
  let tokensPromise: Promise<void | TokenFromApi[]> | null = null;

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

  onInterval(() => loadTokens(), tokenTimeout);

  onMount(async () => {
    loadTokens();
  });
</script>

<main>
  {#if $connected}
    {#if showButton}
      <button on:click={() => loadTokens()}> Refresh Tokens </button>
    {/if}

    {#if tokensPromise}
      {#await tokensPromise}
        {#if showInfo}<p>loading tokens</p>{/if}
      {:catch error}
        {#if showInfo}<p style="color: red">{error}</p>{/if}
      {/await}
    {:else if showInfo}<p>not refreshing tokens</p>{/if}

    {#if $userTokens && showTokens}
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
