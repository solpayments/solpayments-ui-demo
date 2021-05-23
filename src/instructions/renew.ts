import type { Connection, TransactionSignature } from '@solana/web3.js';
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SYSVAR_CLOCK_PUBKEY,
} from '@solana/web3.js';
import type { Result } from '../helpers/result';
import { failure } from '../helpers/result';
import type { WalletAdapter } from '../helpers/types';
import {
  awaitTransactionSignatureConfirmation,
  signAndSendTransaction,
} from '../helpers/transaction';
import { Instruction, InstructionData, InstructionType } from '../helpers/instruction';
import type { OrderSubscription } from '../helpers/data';
import { makeExpressCheckoutTransaction } from './utils';

interface RenewSubscribeParams {
  amount: number;
  buyerTokenAccount: PublicKey /** the token account used to pay for this order */;
  connection: Connection;
  merchantAccount: PublicKey;
  mint: PublicKey /** the mint in use; represents the currency */;
  name: string;
  programOwnerAccount: PublicKey;
  sponsorAccount: PublicKey;
  subscriptionAccount: PublicKey;
  thisProgramId: string;
  quantity?: number;
  wallet: WalletAdapter;
}

export const renew_subscription = async (
  params: RenewSubscribeParams
): Promise<Result<TransactionSignature>> => {
  const {
    amount,
    buyerTokenAccount,
    connection,
    merchantAccount,
    mint,
    name,
    programOwnerAccount,
    thisProgramId,
    sponsorAccount,
    subscriptionAccount,
    wallet,
  } = params;
  if (!wallet.publicKey) {
    return failure(new Error('Wallet not connected'));
  }
  const quantity = params.quantity || 1;
  const programIdKey = new PublicKey(thisProgramId);
  const orderData: OrderSubscription = {
    subscription: subscriptionAccount.toString(),
  };
  const orderId = `${name}:${new Date().valueOf()}`;
  const orderKey = await PublicKey.createWithSeed(wallet.publicKey, orderId, programIdKey);

  // create and pay for order
  const transaction = new Transaction({ feePayer: wallet.publicKey });
  try {
    transaction.add(
      await makeExpressCheckoutTransaction({
        amount,
        buyerTokenAccount,
        data: JSON.stringify(orderData),
        merchantAccount,
        mint,
        orderId,
        programId: programIdKey,
        programOwnerAccount,
        secret: '',
        sponsorAccount,
        signer: wallet.publicKey,
      })
    );
  } catch (error) {
    return failure(error);
  }
  // renew subscription
  try {
    transaction.add(
      new TransactionInstruction({
        programId: programIdKey,
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: subscriptionAccount, isSigner: false, isWritable: true },
          { pubkey: merchantAccount, isSigner: false, isWritable: false },
          { pubkey: orderKey, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: new Instruction({
          instruction: InstructionType.RenewSubscription,
          [InstructionType.RenewSubscription]: new Uint8Array(
            new InstructionData(InstructionType.RenewSubscription, {
              quantity,
            }).encode()
          ),
        }).encode(),
      })
    );
  } catch (error) {
    return failure(error);
  }

  const result = await signAndSendTransaction(connection, transaction, wallet, []);

  if (result.value) {
    awaitTransactionSignatureConfirmation(
      result.value,
      InstructionType.RenewSubscription.toString(),
      connection
    );
  }

  return result;
};
