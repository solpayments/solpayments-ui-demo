import { derived, writable } from 'svelte/store';
import type { WalletAdapter } from '../helpers/types';
import type { Merchant } from '../helpers/layout';
import type { TokenFromApi } from '../helpers/solana';
import { abbreviateAddress } from '../helpers/utils';
import type { TokenMap } from './tokenRegistry';

type Adapter = WalletAdapter | undefined;

interface UserToken extends TokenFromApi {
  name?: string;
  icon?: string;
  symbol?: string;
}

/** the wallet adapter from sollet, etc */
export const adapter = writable<Adapter>(undefined);
/** is the wallet connected? */
export const connected = derived(adapter, ($adapter) => {
  if ($adapter && $adapter.publicKey) {
    return true;
  }
  return false;
});
/** the wallet adapter from sollet, etc */
export const merchantStore = writable<Merchant | null>(null);
/** the user's tokens */
export const userTokens = writable<UserToken[]>([]);
/** the immutable program id */
export const programId = writable<string>('8RqbzUupLSSdTGCzkZsFjUwUupWuu2Jph5x4LeU1wV7C');

// helpers
export const updateUserTokens = (userTokenList: TokenFromApi[], allTokens: TokenMap): void => {
  userTokens.update(() =>
    userTokenList.map((userToken) => {
      const possibleToken = allTokens.get(userToken.pubkey.toBase58());
      return {
        ...userToken,
        icon: possibleToken?.logoURI,
        name: possibleToken
          ? possibleToken.name
          : abbreviateAddress(userToken.account.data.parsed.info.mint),
        symbol: possibleToken
          ? possibleToken.symbol
          : abbreviateAddress(userToken.account.data.parsed.info.mint),
      };
    })
  );
};
