import { PublicKey } from '@solana/web3.js';
import type { Connection } from '@solana/web3.js';
import type { Result } from './result';
import { failure, success } from './result';
import { SINGLE } from './constants';
import { MERCHANT_LAYOUT } from '../helpers/layout';
import type { Merchant } from '../helpers/layout';
import type { TokenApiResult } from '../helpers/solana';

interface Base {
  connection: Connection;
}

interface GetMerchantAccountParams extends Base {
  ownerKey: PublicKey;
  programId: string;
}

interface GetOrderAccountParams extends Base {
  merchantKey: PublicKey;
  programId: string;
}

interface GetTokenAccountParams extends Base {
  ownerKey: PublicKey;
  programId: PublicKey;
}

export const getMerchantAccount = async (
  params: GetMerchantAccountParams
): Promise<Result<Merchant | null>> => {
  const { connection, ownerKey, programId } = params;
  const programIdKey = new PublicKey(programId);

  try {
    const result = await connection.getProgramAccounts(programIdKey, {
      commitment: SINGLE,
      filters: [{ memcmp: { offset: 1, bytes: ownerKey.toBase58() } }],
    });

    if (result.length < 1) {
      return success(null);
    }

    return success({
      address: result[0].pubkey,
      account: MERCHANT_LAYOUT.decode(result[0].account.data),
    });
  } catch (error) {
    return failure(error);
  }
};

export const getOrderAccounts = async (
  params: GetOrderAccountParams
): Promise<Result<Merchant | null>> => {
  const { connection, merchantKey, programId } = params;
  const programIdKey = new PublicKey(programId);

  try {
    const result = await connection.getProgramAccounts(programIdKey, {
      commitment: SINGLE,
      filters: [{ memcmp: { offset: 3, bytes: merchantKey.toBase58() } }],
    });

    if (result.length < 1) {
      return success(null);
    }

    return success({
      address: result[0].pubkey,
      account: MERCHANT_LAYOUT.decode(result[0].account.data),
    });
  } catch (error) {
    return failure(error);
  }
};

export const fetchTokenAccounts = async (
  params: GetTokenAccountParams
): Promise<Result<TokenApiResult>> => {
  const { connection, ownerKey, programId } = params;
  try {
    return success(await connection.getParsedTokenAccountsByOwner(ownerKey, { programId }, SINGLE));
  } catch (error) {
    return failure(error);
  }
};
