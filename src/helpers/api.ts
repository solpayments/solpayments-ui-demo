import { PublicKey } from '@solana/web3.js';
import type { AccountInfo, Connection, ParsedAccountData } from '@solana/web3.js';
import type { Result } from './result';
import { failure, success } from './result';
import { SINGLE } from './constants';
// import { MERCHANT_LAYOUT } from '../helpers/layout';

interface GetProgramAccountsParams {
  connection: Connection;
  programId: string;
}

type FetchProgramAccountsResult = {
  pubkey: PublicKey;
  account: AccountInfo<Buffer | ParsedAccountData>;
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
