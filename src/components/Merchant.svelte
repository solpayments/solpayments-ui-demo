<script lang="ts">
  import { getContext } from 'svelte';
  import { derived } from 'svelte/store';
  import { Connection } from '@solana/web3.js';
  import {
    adapter,
    connected,
    merchantStore as merchant,
    programId as globalProgramId,
  } from '../stores';
  import { getMerchantAccount } from '../helpers/api';
  import { registerMerchant } from '../instructions/register';
  import { SINGLE_GOSSIP } from '../helpers/constants';
  import TrasactionResult from './TrasactionResult.svelte';

  const solanaNetwork: string = getContext('solanaNetwork');

  const merchantPromise = derived(adapter, ($adapter) => {
    if ($adapter && $adapter.publicKey) {
      // this promise tries to get the merchant account
      return getMerchantAccount({
        connection: new Connection(solanaNetwork, SINGLE_GOSSIP),
        ownerKey: $adapter.publicKey,
        programId: $globalProgramId,
      }).then((result) => {
        // update the merchant store with the merchant object
        if (result.error) {
          throw result.error;
        } else {
          if (result.value) {
            merchant.update(() => result.value);
          }
        }
      });
    }
    return null;
  });

  let registrationPromise: Promise<void | string> | null = null;
  const handleRegistrationPromise = () => {
    registrationPromise = $adapter
      ? registerMerchant({
          connection: new Connection(solanaNetwork, SINGLE_GOSSIP),
          thisProgramId: $globalProgramId,
          wallet: $adapter,
        }).then((result) => {
          if (result.error) {
            throw result.error;
          }
          return result.value;
        })
      : null;
  };
</script>

<main>
  {#if $merchantPromise}
    {#await $merchantPromise}
      <p>Loading merchant account</p>
    {:catch error}
      <p style="color: red">{error}</p>
    {/await}
  {/if}
  {#if $connected}
    {#if $merchant}
      <p style="color: green">Merchant Address: {$merchant.address}</p>
    {:else}
      <button on:click={() => handleRegistrationPromise()}> Register Merchant </button>
    {/if}
  {/if}

  {#if registrationPromise}
    {#await registrationPromise}
      <p>registering merchant</p>
    {:then txId}
      <TrasactionResult {txId} />
    {:catch error}
      <p style="color: red">{error}</p>
    {/await}
  {/if}
</main>
