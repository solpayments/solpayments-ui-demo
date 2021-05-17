import type { Account, Connection, Transaction, TransactionSignature } from '@solana/web3.js';
import type { WalletAdapter } from './types';
import { failure, success, Result } from './result';

const MAX = 'max';
const SINGLE = 'single';

/**
 * @param connection - the connection to the blockchain
 * @param transaction - the transaction to sign and send
 * @param wallet - the wallet (represents the person doing the transaction)
 * @param signers - the accounts to sign the transaction (optional)
 */
export async function signAndSendTransaction(
  connection: Connection,
  transaction: Transaction,
  wallet: WalletAdapter,
  signers: Array<Account> = []
): Promise<Result<TransactionSignature>> {
  if (!wallet.publicKey) {
    return failure(new Error('Wallet not connected'));
  }

  try {
    transaction.recentBlockhash = (await connection.getRecentBlockhash(MAX)).blockhash;
  } catch (error) {
    return failure(error);
  }

  // transaction.setSigners(
  //     // fee payed by the wallet owner
  //     wallet.publicKey,
  //     ...signers.map((s) => s.publicKey)
  // );

  if (signers.length > 0) {
    transaction.partialSign(...signers);
  }

  try {
    transaction = await wallet.signTransaction(transaction);
  } catch (error) {
    return failure(error);
  }

  let rawTransaction;
  try {
    rawTransaction = transaction.serialize();
  } catch (error) {
    return failure(error);
  }

  let result;
  try {
    result = await connection.sendRawTransaction(rawTransaction, {
      preflightCommitment: SINGLE,
    });
  } catch (error) {
    return failure(error);
  }

  return success(result);
}
