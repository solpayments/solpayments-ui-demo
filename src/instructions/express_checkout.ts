import type {
  Account,
  Connection,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js';
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
import { WRAPPED_SOL_MINT } from '../helpers/solana';
import { getOrCreateSOLTokenAccount } from '../helpers/token';

interface ExpressCheckoutParams {
  amount: number;
  buyerTokenAccount?: PublicKey /** the token account used to pay for this order */;
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
  let tokenAccount: PublicKey | undefined = buyerTokenAccount;
  let beforeIxs: TransactionInstruction[] = [];
  let afterIxs: TransactionInstruction[] = [];
  let signers: Account[] = [];

  if (mint.toBase58() === WRAPPED_SOL_MINT.toBase58() || tokenAccount === undefined) {
    const wrappedSolResult = await getOrCreateSOLTokenAccount({
      amount,
      connection,
      wallet,
    });

    if (wrappedSolResult.value) {
      tokenAccount = wrappedSolResult.value.address;
      beforeIxs = wrappedSolResult.value.instructions;
      afterIxs = wrappedSolResult.value.cleanupInstructions;
      signers = wrappedSolResult.value.signers;
    }
  }

  // add the instructions to run before main instruction
  beforeIxs.forEach((element) => {
    transaction.add(element);
  });

  // add main instruction
  if (tokenAccount !== undefined) {
    try {
      transaction.add(
        await makeExpressCheckoutTransaction({
          amount,
          buyerTokenAccount: tokenAccount,
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
  }

  // add the instructions to run after main instruction
  afterIxs.forEach((element) => {
    transaction.add(element);
  });

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
