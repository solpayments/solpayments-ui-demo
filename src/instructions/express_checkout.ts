import type { Connection, TransactionSignature } from '@solana/web3.js';
import { PublicKey, Transaction } from '@solana/web3.js';
import type { Result } from '../helpers/result';
import { failure } from '../helpers/result';
import type { WalletAdapter } from '../helpers/types';
import {
  awaitTransactionSignatureConfirmation,
  signAndSendTransaction,
} from '../helpers/transaction';
import { InstructionType } from '../helpers/instruction';
import { makeExpressCheckoutTransaction } from './utils';

interface ExpressCheckoutParams {
  amount: number;
  buyerTokenAccount: PublicKey /** the token account used to pay for this order */;
  connection: Connection;
  data?: string;
  merchantAccount: PublicKey;
  mint: PublicKey /** the mint in use; represents the currency */;
  orderId: string /** the unique order id */;
  programOwnerAccount: PublicKey;
  secret: string /** a secret or encrypted string to verify this order */;
  sponsorAccount: PublicKey;
  thisProgramId: string;
  wallet: WalletAdapter;
}

export const expressCheckout = async (
  params: ExpressCheckoutParams
): Promise<Result<TransactionSignature>> => {
  const {
    amount,
    buyerTokenAccount,
    connection,
    data,
    merchantAccount,
    mint,
    programOwnerAccount,
    orderId,
    thisProgramId,
    secret,
    sponsorAccount,
    wallet,
  } = params;
  if (!wallet.publicKey) {
    return failure(new Error('Wallet not connected'));
  }
  const programIdKey = new PublicKey(thisProgramId);
  const transaction = new Transaction({ feePayer: wallet.publicKey });

  try {
    transaction.add(
      await makeExpressCheckoutTransaction({
        amount,
        buyerTokenAccount,
        data,
        merchantAccount,
        mint,
        orderId,
        programId: programIdKey,
        programOwnerAccount,
        secret,
        sponsorAccount,
        signer: wallet.publicKey,
      })
    );
  } catch (error) {
    return failure(error);
  }

  const result = await signAndSendTransaction(connection, transaction, wallet, []);

  if (result.value) {
    awaitTransactionSignatureConfirmation(
      result.value,
      InstructionType.ExpressCheckout.toString(),
      connection
    );
  }

  return result;
};
