import { PublicKey } from '@solana/web3.js';
import type { AccountInfo, Connection, ParsedAccountData } from '@solana/web3.js';
import type { Result } from './result';
import { failure, success } from './result';
import { SINGLE } from './constants';
import { MERCHANT_LAYOUT } from '../helpers/layout';
import type { Merchant } from '../helpers/layout';

interface GetProgramAccountsParams {
  connection: Connection;
  programId: string;
}

type FetchProgramAccountsResult = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer | ParsedAccountData>;
};

interface GetMerchantAccountParams {
  connection: Connection;
  ownerKey: PublicKey;
  programId: string;
}

interface GetOrderAccountParams {
  connection: Connection;
  merchantKey: PublicKey;
  programId: string;
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

export const fetchProgramAccounts = async (
  params: GetProgramAccountsParams
): Promise<Result<FetchProgramAccountsResult[]>> => {
  const { connection, programId } = params;
  const programIdKey = new PublicKey(programId);
  try {
    // const xxx = await connection.getProgramAccounts(programIdKey, SINGLE);
    // // const yyy = MerchantAccount.decode(MerchantAccount.schema, MerchantAccount, xxx[0].account.data as Buffer);
    // const zzz = MERCHANT_LAYOUT.decode(xxx[0].account.data);
    // debugger;
    return success(await connection.getProgramAccounts(programIdKey, SINGLE));
  } catch (error) {
    return failure(error);
  }
};
