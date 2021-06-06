<script lang="ts">
  import { onMount } from 'svelte';
  import { tokenMap } from '../../stores/tokenRegistry';
  import { DEFAULT_DECIMALS } from '../../helpers/constants';
  import { WRAPPED_SOL_MINT } from '../../helpers/solana';
  import { forHumans } from '../../helpers/utils';
  import { subscriptionPackages } from '../demo';
  import type { Package } from '../../helpers/data';

  $: solMint = $tokenMap.get(WRAPPED_SOL_MINT.toBase58());

  $: items = [
    { duration: 60 * 10, name: 'daily', price: 0.1 },
    { duration: 60 * 60 * 24 * 30, name: 'monthly', price: 0.2 },
    { duration: 60 * 60 * 24 * 365, name: 'yearly', price: 2 },
  ];

  function add() {
    items = items.concat({
      duration: 60 * 10,
      name: '',
      price: 100000000,
    });
  }

  function remove(index: number) {
    if (index > -1) {
      items.splice(index, 1);
    }
    // no idea why this line is necessary but without it items does not update
    items = items;
  }

  const validate = (input: Package[]): boolean => {
    if (input.length < 1) {
      return false;
    }
    let knownNames: string[] = [];
    for (let index = 0; index < input.length; index++) {
      const element = input[index];
      if (!element.duration || element.duration <= 0) {
        return false;
      }
      if (!element.price || element.price <= 0) {
        return false;
      }
      if (!element.name || element.name === '' || knownNames.includes(element.name)) {
        return false;
      }
      knownNames.push(element.name);
    }
    return true;
  };

  const prepareInput = (input: Package[]): Package[] => {
    return input.map((e) => {
      const decimals = solMint ? solMint.decimals : DEFAULT_DECIMALS;
      return {
        ...e,
        price: e.price * 10 ** decimals,
      };
    });
  };

  const validateAndStore = (input: Package[]): boolean => {
    const result = validate(input);
    subscriptionPackages.update(() => (result ? prepareInput(input) : []));
    return result;
  };

  $: valid = validateAndStore(items);

  onMount(async () => {
    subscriptionPackages.set(prepareInput(items));
  });
</script>

<div class="packages">
  <table>
    <thead>
      <th>Name</th>
      <th>Duration (seconds)</th>
      <th>Price (SOL)</th>
      <td />
    </thead>
    <tbody>
      {#each items as item, itemIndex}
        <tr>
          <td>
            <input name="name" type="text" bind:value={item.name} required={true} />
            <p>&nbsp;</p>
          </td>
          <td>
            <input
              name="duration"
              type="number"
              min="0"
              bind:value={item.duration}
              required={true}
            />
            <p>{forHumans(item.duration)}</p>
          </td>
          <td
            ><input name="price" type="number" min="0" bind:value={item.price} required={true} />
            <p>&nbsp;</p></td
          >
          <td>
            <button class="button button-clear" on:click={() => remove(itemIndex)}> remove </button>
            <p>&nbsp;</p>
          </td>
        </tr>
      {/each}
      <tr class="clearfix">
        <td colspan="3">
          <button class="button button-outline float-right" on:click={add}> Add Item </button>
        </td>
      </tr>
    </tbody>
  </table>
  <div class="clearfix" />
  {#if !valid}
    <p style="color: red">
      <strong>Invalid packages</strong>. Please ensure all packages have a name, duration, and
      price. No duplicate names allowed.
    </p>
  {/if}
</div>

<style>
  p {
    margin-bottom: 0;
  }
</style>
