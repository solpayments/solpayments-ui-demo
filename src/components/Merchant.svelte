<script lang="ts">
  import { onDestroy } from 'svelte';
  import { derived } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import { Connection, PublicKey } from '@solana/web3.js';
  import { transactionsMap, TxStatus } from '../stores/transaction';
  import { adapter, connected, programId as globalProgramId, solanaNetwork } from '../stores';
  import { merchantRegistry } from '../stores/merchants';
  import { getMerchantByAddress } from '../helpers/api';
  import type { Packages } from '../helpers/data';
  import { registerMerchant } from '../instructions/register';
  import { FINALIZED, MERCHANT, PROCESSED } from '../helpers/constants';
  import TrasactionResult from './TrasactionResult.svelte';
  import type { Adapter } from '../stores';

  export let merchantTimeout = 2000;
  export let seed: string = MERCHANT;
  export let data: Packages | undefined = undefined;
  export let addressStore: Writable<PublicKey | undefined>;
  let registrationProcessing = false;
  let hasError = false;
  let registrationResultTxId: string | undefined = undefined;
  let registrationPromise: Promise<void | string> | null = null;

  // used to ensure this store subscription does not cause mem leak
  const unsubscribe = transactionsMap.subscribe((value) => {
    if (
      value &&
      registrationResultTxId &&
      value.get(registrationResultTxId)?.status != TxStatus.Unknown
    ) {
      registrationPromise = null;
    }
  });

  const fetchMerchant = (connectedWallet: Adapter) => {
    if (connectedWallet && connectedWallet.publicKey) {
      PublicKey.createWithSeed(
        connectedWallet.publicKey,
        seed,
        new PublicKey($globalProgramId)
      ).then((address) => {
        // update this merchant's address store
        addressStore.set(address);
        getMerchantByAddress({
          connection: new Connection($solanaNetwork, PROCESSED),
          publicKey: address,
        }).then((result) => {
          // update the merchant store with the merchant object
          if (result.error) {
            throw result.error;
          } else {
            merchantRegistry.update((existing) => {
              if (result.value) {
                existing.set(result.value.address.toString(), result.value);
              }
              return existing;
            });
          }
        });
      });
    }
  };

  const getMerchantOrBust = async (connectedWallet: Adapter) => {
    if ($addressStore) {
      while (!$merchantRegistry.get($addressStore.toString())) {
        fetchMerchant(connectedWallet);
        // sleep
        await new Promise((r) => setTimeout(r, merchantTimeout));
      }
    }
  };

  const merchant = derived(merchantRegistry, ($merchantRegistry) => {
    if ($merchantRegistry && $addressStore) {
      return $merchantRegistry.get($addressStore.toString()) || null;
    }
    return null;
  });

  const merchantPromise = derived(adapter, ($adapter) => {
    if ($adapter && $adapter.publicKey) {
      fetchMerchant($adapter);
    }
    return null;
  });

  const handleRegistrationPromise = () => {
    hasError = false;
    registrationProcessing = true;
    registrationResultTxId = undefined;
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

  $: processing = (registrationPromise != null || registrationProcessing) && !hasError;

  /** ensure you can retry after an error */
  const onError = () => {
    hasError = true;
    return null;
  };

  onDestroy(unsubscribe);
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
    {:else}
      <button on:click={() => handleRegistrationPromise()} disabled={processing}>
        {#if processing}Registering Merchant{:else}Register Merchant{/if}
      </button>
    {/if}
  {/if}

  {#if registrationPromise}
    {#await registrationPromise}
      <p>registering merchant</p>
    {:then txId}
      <TrasactionResult {txId} sideEffect={getMerchantOrBust($adapter)} />
    {:catch error}
      <!-- TODO: find better way to call this func, as this way is frowned upon in svelte-world-->
      {onError() || ''}
      <p style="color: red">{error}</p>
    {/await}
  {/if}
</main>
