<script lang="ts">
  import { getContext } from 'svelte';
  import { Connection } from '@solana/web3.js';
  import { adapter, connected, userTokens, updateUserTokens } from '../stores';
  import { tokenMap } from '../stores/tokenRegistry';
  import { fetchTokenAccounts } from '../helpers/api';
  import { SINGLE_GOSSIP } from '../helpers/constants';
  import { TOKEN_PROGRAM_ID } from '../helpers/solana';
  import type { TokenFromApi } from '../helpers/solana';

  const solanaNetwork: string = getContext('solanaNetwork');

  let tokensPromise: Promise<void | TokenFromApi[]> | null = null;

  const loadTokens = () => {
    if ($adapter && $adapter.publicKey) {
      tokensPromise = fetchTokenAccounts({
        connection: new Connection(solanaNetwork, SINGLE_GOSSIP),
        ownerKey: $adapter.publicKey,
        programId: TOKEN_PROGRAM_ID,
      }).then((result) => {
        if (result.error) {
          throw result.error;
        } else {
          updateUserTokens(result.value.value, $tokenMap);
        }
      });
    }
  };
</script>

<main>
  {#if $connected}
    <button on:click={() => loadTokens()}> Load Tokens </button>

    {#if tokensPromise}
      {#await tokensPromise}
        <p>loading tokens</p>
      {:catch error}
        <p style="color: red">{error}</p>
      {/await}
    {/if}

    {#if $userTokens}
      <table>
        {#each $userTokens as userToken}
          <tr>
            <td>{userToken.name}</td>
            <td>{userToken.symbol}</td>
            <td>{userToken.account.data.parsed.info.tokenAmount.uiAmountString}</td>
          </tr>
        {/each}
      </table>
    {/if}
  {/if}
</main>
