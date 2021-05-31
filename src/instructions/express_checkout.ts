import type { TransactionSignature } from '@solana/web3.js';
import type { Result } from '../helpers/result';
import { failure } from '../helpers/result';
import {
  awaitTransactionSignatureConfirmation,
  signAndSendTransaction,
} from '../helpers/transaction';
import { InstructionType } from '../helpers/instruction';
import { makeCheckoutTransaction } from './utils';
import type { ExpressCheckoutParams } from './utils';

export const expressCheckout = async (
  params: ExpressCheckoutParams
): Promise<Result<TransactionSignature>> => {
  const { connection, wallet } = params;
  if (!wallet.publicKey) {
    return failure(new Error('Wallet not connected'));
  }
  const txResult = await makeCheckoutTransaction(params);
  if (txResult.error) {
    return txResult;
  }
  const { transaction, signers } = txResult.value;
  const result = await signAndSendTransaction(connection, transaction, wallet, signers);
  if (result.value) {
    awaitTransactionSignatureConfirmation(
      result.value,
      InstructionType.ExpressCheckout.toString(),
      connection
    );
  }
  return result;
};
