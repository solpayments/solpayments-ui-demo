import { PublicKey } from '@solana/web3.js';
import type { AccountInfo, Connection, ParsedAccountData } from '@solana/web3.js';
import type { Result } from './result';
import { failure, success } from './result';
import { SINGLE } from './constants';

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
    return success(await connection.getParsedProgramAccounts(programIdKey, SINGLE));
  } catch (error) {
    return failure(error);
  }
};
