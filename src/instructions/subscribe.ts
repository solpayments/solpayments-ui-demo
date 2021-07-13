import { Buffer } from 'buffer';
import type { TransactionSignature } from '@solana/web3.js';
import {
  Account,
  PublicKey,
  TransactionInstruction,
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
import type { BaseCheckoutParams } from './utils';

interface SubscribeParams extends BaseCheckoutParams {
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

  let subscriptionKey: PublicKey;
  if (subscriptionAddress) {
    subscriptionKey = subscriptionAddress;
  } else {
    const subscriptionPda = await PublicKey.findProgramAddress(
      [wallet.publicKey.toBuffer(), merchantAccount.toBuffer(), Buffer.from(name)],
      programIdKey
    );
    subscriptionKey = subscriptionPda[0];
  }

  const orderData: OrderSubscription = {
    subscription: subscriptionKey.toString(),
  };
  const orderId = `${name}:${new Date().valueOf()}`;
  const orderAccount = new Account();

  const txResult = await makeCheckoutTransaction({
    ...params,
    data: JSON.stringify(orderData),
    inputOrderAccount: orderAccount,
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
          { pubkey: orderAccount.publicKey, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
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
