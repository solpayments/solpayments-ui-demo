<script lang="ts">
  import { derived } from 'svelte/store';
  import { Connection, PublicKey } from '@solana/web3.js';
  import {
    adapter,
    connected,
    merchantStore as merchant,
    programId as globalProgramId,
    solanaNetwork,
  } from '../stores';
  import { getMerchantByAddress } from '../helpers/api';
  import type { Packages } from '../helpers/data';
  import { registerMerchant } from '../instructions/register';
  import { FINALIZED, MERCHANT, PROCESSED } from '../helpers/constants';
  import TrasactionResult from './TrasactionResult.svelte';
  import type { Adapter } from '../stores';

  export let merchantTimeout = 2000;
  export let seed: string = MERCHANT;
  export let data: Packages | undefined = undefined;
  let registrationProcessing = false;
  let registrationResultTxId: string | undefined = undefined;

  const fetchMerchant = (connectedWallet: Adapter) => {
    if (connectedWallet && connectedWallet.publicKey) {
      PublicKey.createWithSeed(
        connectedWallet.publicKey,
        seed,
        new PublicKey($globalProgramId)
      ).then((merchantAddress) => {
        getMerchantByAddress({
          connection: new Connection($solanaNetwork, PROCESSED),
          publicKey: merchantAddress,
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
          connection: new Connection($solanaNetwork, FINALIZED),
          data: data ? JSON.stringify(data) : undefined,
          seed,
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
        fee: {$merchant.account.fee} ||&nbsp; data: {$merchant.account.data}
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
