import { Buffer } from 'buffer';
import type { Connection, TransactionSignature } from '@solana/web3.js';
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../helpers/solana';
import type { Result } from '../helpers/result';
import { failure } from '../helpers/result';
import type { WalletAdapter } from '../helpers/types';
import {
  awaitTransactionSignatureConfirmation,
  signAndSendTransaction,
} from '../helpers/transaction';
import { Instruction, InstructionData, InstructionType } from '../helpers/instruction';
import { MAX_SEED_LEN, PDA_SEED } from '../helpers/constants';

interface ExpressCheckoutParams {
  amount: number;
  buyerTokenAccount: PublicKey /** the token account used to pay for this order */;
  connection: Connection;
  merchantAccount: PublicKey;
  mint: PublicKey /** the mint in use; represents the currency */;
  orderId: string /** the unique order id */;
  secret: string /** a secret or encrypted string to verify this order */;
  thisProgramId: string;
  wallet: WalletAdapter;
}

export const getOrderAccountPubkey = async (
  orderId: string,
  wallet_pk: PublicKey,
  programIdKey: PublicKey
): Promise<PublicKey> => {
  return PublicKey.createWithSeed(wallet_pk, orderId.slice(0, MAX_SEED_LEN), programIdKey);
};

export const getSellerTokenAccountPubkey = async (
  orderAccount: PublicKey,
  mint: PublicKey,
  programIdKey: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [orderAccount.toBytes(), TOKEN_PROGRAM_ID.toBytes(), mint.toBytes()],
    programIdKey
  );
};

export const expressCheckout = async (
  params: ExpressCheckoutParams
): Promise<Result<TransactionSignature>> => {
  const {
    amount,
    buyerTokenAccount,
    connection,
    merchantAccount,
    mint,
    orderId,
    thisProgramId,
    secret,
    wallet,
  } = params;
  if (!wallet.publicKey) {
    return failure(new Error('Wallet not connected'));
  }
  const programIdKey = new PublicKey(thisProgramId);
  const orderAccount = await getOrderAccountPubkey(orderId, wallet.publicKey, programIdKey);
  const promiseResults = await Promise.all([
    PublicKey.findProgramAddress([Buffer.from(PDA_SEED)], programIdKey),
    getSellerTokenAccountPubkey(orderAccount, mint, programIdKey),
  ]);
  const pda = promiseResults[0];
  const sellerTokenAccount = promiseResults[1];

  const transaction = new Transaction({ feePayer: wallet.publicKey });

  try {
    transaction.add(
      new TransactionInstruction({
        programId: programIdKey,
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: orderAccount, isSigner: false, isWritable: true },
          { pubkey: merchantAccount, isSigner: false, isWritable: false },
          { pubkey: sellerTokenAccount[0], isSigner: false, isWritable: true },
          { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
          { pubkey: mint, isSigner: false, isWritable: false },
          { pubkey: pda[0], isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: new Instruction({
          instruction: InstructionType.ExpressCheckout,
          [InstructionType.ExpressCheckout]: new Uint8Array(
            new InstructionData(InstructionType.ExpressCheckout, {
              amount,
              order_id: orderId,
              secret,
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
      InstructionType.ExpressCheckout.toString(),
      connection
    );
  }

  return result;
};
