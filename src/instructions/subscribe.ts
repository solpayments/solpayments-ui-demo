import type { TransactionSignature } from '@solana/web3.js';
import {
  PublicKey,
  TransactionInstruction,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from '@solana/web3.js';
import type { Result } from '../helpers/result';
import { failure } from '../helpers/result';
import {
  awaitTransactionSignatureConfirmation,
  signAndSendTransaction,
} from '../helpers/transaction';
import { Instruction, InstructionData, InstructionType } from '../helpers/instruction';
import type { OrderSubscription } from '../helpers/data';
import { makeCheckoutTransaction } from './utils';
import type { ExpressCheckoutParams } from './utils';

interface SubscribeParams extends ExpressCheckoutParams {
  name: string;
  subscriptionAddress?: PublicKey;
}

export const subscribe = async (params: SubscribeParams): Promise<Result<TransactionSignature>> => {
  const { connection, merchantAccount, name, thisProgramId, subscriptionAddress, wallet } = params;
  if (!wallet.publicKey) {
    return failure(new Error('Wallet not connected'));
  }

  const programIdKey = new PublicKey(thisProgramId);
  const data = params.data || null;
  const subscriptionKey =
    subscriptionAddress || (await PublicKey.createWithSeed(wallet.publicKey, name, programIdKey));
  const orderData: OrderSubscription = {
    subscription: subscriptionKey.toString(),
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

  // initialize subscription
  try {
    transaction.add(
      new TransactionInstruction({
        programId: programIdKey,
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: subscriptionKey, isSigner: false, isWritable: true },
          { pubkey: merchantAccount, isSigner: false, isWritable: false },
          { pubkey: orderKey, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: new Instruction({
          instruction: InstructionType.Subscribe,
          [InstructionType.Subscribe]: new Uint8Array(
            new InstructionData(InstructionType.Subscribe, {
              name,
              data,
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
      InstructionType.Subscribe.toString(),
      connection
    );
  }

  return result;
};
