import type { Connection, TransactionSignature } from '@solana/web3.js';
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from '@solana/web3.js';
import type { Result } from '../helpers/result';
import { failure } from '../helpers/result';
import type { WalletAdapter } from '../helpers/types';
import {
  awaitTransactionSignatureConfirmation,
  signAndSendTransaction,
} from '../helpers/transaction';
import { Instruction, InstructionData, InstructionType } from '../helpers/instruction';
import { MERCHANT } from '../helpers/constants';

interface RegisterMerchantParams {
  connection: Connection;
  data?: string;
  fee?: string;
  seed?: string;
  thisProgramId: string;
  wallet: WalletAdapter;
}

export const registerMerchant = async (
  params: RegisterMerchantParams
): Promise<Result<TransactionSignature>> => {
  const { connection, thisProgramId, wallet } = params;
  if (!wallet.publicKey) {
    return failure(new Error('Wallet not connected'));
  }
  const data = params.data || null;
  const fee = params.fee || null;
  const seed = params.seed || null;
  const programIdKey = new PublicKey(thisProgramId);
  const merchant_pubkey = await PublicKey.createWithSeed(wallet.publicKey, MERCHANT, programIdKey);

  const transaction = new Transaction({ feePayer: wallet.publicKey });
  // const transaction = new Transaction();

  // const signers: Account[] = [];
  // const someAccount = new Account();
  // try {
  //   transaction.add(
  //     // SystemProgram.createAccount({
  //     //   fromPubkey: wallet.publicKey,
  //     //   newAccountPubkey: someAccount.publicKey,
  //     //   lamports:
  //     //     (await connection.getMinimumBalanceForRentExemption(
  //     //       1650,
  //     //       "singleGossip"
  //     //     )),
  //     //   space: 1650,
  //     //   programId: programIdKey,
  //     // })
  //     SystemProgram.transfer({
  //       fromPubkey: wallet.publicKey,
  //       toPubkey: new PublicKey('3p2N9GkcbFcRQvL3UUpzJBPtjjbdjSjAw2YypPP83y38'),
  //       lamports: 2000000
  //     })
  //   );
  // } catch (error) {
  //   return failure(error);
  // }
  // signers.push(someAccount);

  try {
    transaction.add(
      new TransactionInstruction({
        programId: programIdKey,
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: merchant_pubkey, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: new Instruction({
          instruction: InstructionType.RegisterMerchant,
          [InstructionType.RegisterMerchant]: new Uint8Array(
            new InstructionData(InstructionType.RegisterMerchant, {
              seed,
              fee,
              data,
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
      InstructionType.RegisterMerchant.toString(),
      connection
    );
  }

  return result;
};
