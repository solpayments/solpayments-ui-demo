import type { Connection } from '@solana/web3.js';
import {
  Account,
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

interface RegisterMerchantParams {
  connection: Connection;
  programId: string;
  wallet: WalletAdapter;
}

// Promise<Result<TransactionSignature>>

export const registerMerchant = async (
  params: RegisterMerchantParams
): Promise<Result<any>> => {
  const { connection, wallet, programId } = params;
  if (!wallet.publicKey) {
    return failure(new Error('Wallet not connected'));
  }
  const programIdKey = new PublicKey(programId);
  const merchant_pubkey = await PublicKey.createWithSeed(wallet.publicKey, MERCHANT, programIdKey);

  const transaction = new Transaction({ feePayer: wallet.publicKey });

  const signers: Account[] = [];
  const someAccount = new Account();
  try {
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: someAccount.publicKey,
        lamports:
          (await connection.getMinimumBalanceForRentExemption(
            165,
            "singleGossip"
          )),
        space: 165,
        programId: programIdKey,
      })
    );
  } catch (error) {
    return failure(error);
  }
  signers.push(someAccount);


  // try {
  //   transaction.add(
  //     new TransactionInstruction({
  //       programId: programIdKey,
  //       keys: [
  //         { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
  //         { pubkey: merchant_pubkey, isSigner: false, isWritable: true },
  //         { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  //         { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  //       ],
  //       data: Buffer.from(Uint8Array.of(0)),
  //     })
  //   );
  // } catch (error) {
  //   return failure(error);
  // }

  return await signAndSendTransaction(connection, transaction, wallet, []);
};
