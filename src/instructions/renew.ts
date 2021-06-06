import type { TransactionSignature } from '@solana/web3.js';
import { PublicKey, TransactionInstruction, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import type { Result } from '../helpers/result';
import { failure } from '../helpers/result';
import {
  awaitTransactionSignatureConfirmation,
  signAndSendTransaction,
} from '../helpers/transaction';
import { Instruction, InstructionData, InstructionType } from '../helpers/instruction';
import type { OrderSubscription } from '../helpers/data';
import { makeCheckoutTransaction } from './utils';
import type { BaseCheckoutParams } from './utils';

interface RenewSubscribeParams extends BaseCheckoutParams {
  name: string;
  subscriptionAccount: PublicKey;
  quantity?: number;
}

export const renew_subscription = async (
  params: RenewSubscribeParams
): Promise<Result<TransactionSignature>> => {
  const { connection, merchantAccount, name, thisProgramId, subscriptionAccount, wallet } = params;
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

  const txResult = await makeCheckoutTransaction({
    ...params,
    data: JSON.stringify(orderData),
    orderId,
    secret: '',
  });
  if (txResult.error) {
    return txResult;
  }
  const { transaction, signers } = txResult.value;

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

  const result = await signAndSendTransaction(connection, transaction, wallet, signers);

  if (result.value) {
    awaitTransactionSignatureConfirmation(
      result.value,
      InstructionType.RenewSubscription.toString(),
      connection
    );
  }

  return result;
};
