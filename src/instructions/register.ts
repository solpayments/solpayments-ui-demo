import type { Connection } from '@solana/web3.js';
import {
  // Account,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from '@solana/web3.js';
import type { Result } from '../helpers/result';
import { failure } from '../helpers/result';
import type { WalletAdapter } from '../helpers/types';
import { signAndSendTransaction } from '../helpers/transaction';

const MERCHANT = 'merchant';
// // const TOKEN_PROGRAM_ID = new PublicKey(
// //   "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
// // );

interface RegisterMerchantParams {
  connection: Connection;
  thisProgramId: string;
  wallet: WalletAdapter;
}

// Promise<Result<TransactionSignature>>
export const registerMerchant = async (
  params: RegisterMerchantParams
): Promise<Result<any>> => {
  const { connection, thisProgramId,  wallet } = params;
  if (!wallet.publicKey) {
    return failure(new Error('Wallet not connected'));
  }
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
        // data: Buffer.from(Uint8Array.of(0)),
      })
    );
  } catch (error) {
    return failure(error);
  }

  return await signAndSendTransaction(connection, transaction, wallet, []);
};
