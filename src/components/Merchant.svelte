<script lang="ts">
  import { derived } from 'svelte/store';
  import { Connection } from '@solana/web3.js';
  import {
    adapter,
    connected,
    merchantStore as merchant,
    programId as globalProgramId,
    solanaNetwork,
  } from '../stores';
  import { getMerchantAccount } from '../helpers/api';
  import { registerMerchant } from '../instructions/register';
  import { MAX, SINGLE_GOSSIP } from '../helpers/constants';
  import TrasactionResult from './TrasactionResult.svelte';
  import type { Adapter } from '../stores';

  export let merchantTimeout = 2000;
  let registrationProcessing = false;
  let registrationResultTxId: string | undefined = undefined;

  const fetchMerchant = (connectedWallet: Adapter) => {
    if (connectedWallet && connectedWallet.publicKey) {
      // this promise tries to get the merchant account
      return getMerchantAccount({
        connection: new Connection($solanaNetwork, SINGLE_GOSSIP),
        ownerKey: connectedWallet.publicKey,
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
  };

  const getMerchantOrBust = async (connectedWallet: Adapter) => {
    while (!$merchant) {
      fetchMerchant(connectedWallet);
      // sleep
      await new Promise((r) => setTimeout(r, merchantTimeout));
    }
  };

  const merchantPromise = derived(adapter, ($adapter) => {
    if ($adapter && $adapter.publicKey) {
      fetchMerchant($adapter);
    }
    return null;
  });

  let registrationPromise: Promise<void | string> | null = null;
  const handleRegistrationPromise = () => {
    registrationProcessing = true;
    registrationPromise = $adapter
      ? registerMerchant({
          connection: new Connection($solanaNetwork, MAX),
          thisProgramId: $globalProgramId,
          wallet: $adapter,
        })
          .then((result) => {
            if (result.error) {
              throw result.error;
            }
            registrationResultTxId = result.value;
            return result.value;
          })
          .finally(() => {
            registrationProcessing = false;
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
      <p>
        owner: {$merchant.account.owner} ||&nbsp; sponsor: {$merchant.account.sponsor} ||&nbsp; fee:
        {$merchant.account.fee} ||&nbsp; data: {$merchant.account.data}
      </p>
    {:else if !registrationResultTxId}
      <button on:click={() => handleRegistrationPromise()} disabled={registrationProcessing}>
        {#if registrationProcessing}Registering Merchant{:else}Register Merchant{/if}
      </button>
    {/if}
  {/if}

  {#if registrationPromise}
    {#await registrationPromise}
      <p>registering merchant</p>
    {:then txId}
      <TrasactionResult {txId} sideEffect={getMerchantOrBust($adapter)} />
    {:catch error}
      <p style="color: red">{error}</p>
    {/await}
  {/if}
</main>
