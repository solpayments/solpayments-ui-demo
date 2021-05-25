<script lang="ts">
  import { adapter, connected } from '../../stores';
  import { connectToWallet } from '../../helpers/wallet';
  import { abbreviateAddress } from '../../helpers/utils';

  let promise: Promise<void> | null;
  const handleConnect = () => {
    promise = connectToWallet().then(() => {
      promise = null;
    });
  };
  const handleDisconnect = () => {
    promise = null;
    adapter.update(() => undefined);
  };
</script>

{#if !$connected}
  <li>
    <button class="button button-outline" on:click|preventDefault={() => handleConnect()}>
      {#if !$connected && promise != null}
        {#await promise}
          Connecting...
        {:then _pubkey}
          <span style="color: green">Connected to {$adapter && $adapter.publicKey}</span>
        {:catch error}
          <span style="color: red">{error}</span>
        {/await}
      {:else}
        Connect
      {/if}
    </button>
  </li>
{:else}
  <li>
    <button
      class="button button-outline"
      title="Disconnect {$adapter && $adapter.publicKey}"
      on:click|preventDefault={() => handleDisconnect()}
    >
      {#if $adapter && $adapter.publicKey}
        {abbreviateAddress($adapter.publicKey.toString())}
      {:else}
        Disconnect
      {/if}
    </button>
  </li>
{/if}
