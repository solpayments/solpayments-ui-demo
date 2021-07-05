import { Buffer } from 'buffer';
import type { Connection } from '@solana/web3.js';
import {
  Account,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from '@solana/web3.js';
import { Result, success } from '../helpers/result';
import { failure } from '../helpers/result';
import { TOKEN_PROGRAM_ID } from '../helpers/solana';
import { Instruction, InstructionData, InstructionType } from '../helpers/instruction';
import { PDA_SEED } from '../helpers/constants';
import type { WalletAdapter } from '../helpers/types';
import { WRAPPED_SOL_MINT } from '../helpers/solana';
import { getOrCreateTokenAccount, getOrCreateSOLTokenAccount } from '../helpers/token';

interface ExpressCheckoutTxParams {
  amount: number;
  buyerTokenAccount: PublicKey /** the token account used to pay for this order */;
  data?: string;
  merchantAccount: PublicKey;
  mint: PublicKey /** the mint in use; represents the currency */;
  orderAccount: Account /** the account used to store the order details */;
  orderId: string /** the unique order id */;
  programId: PublicKey;
  programOwnerAccount: PublicKey;
  secret: string /** a secret or encrypted string to verify this order */;
  sponsorAccount: PublicKey;
  signer: PublicKey;
}

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

export const makeExpressCheckoutTransaction = async (
  params: ExpressCheckoutTxParams
): Promise<TransactionInstruction> => {
  const {
    amount,
    buyerTokenAccount,
    merchantAccount,
    mint,
    programOwnerAccount,
    orderId,
    orderAccount,
    programId,
    secret,
    sponsorAccount,
    signer,
  } = params;

  const data = params.data || null;
  const promiseResults = await Promise.all([
    PublicKey.findProgramAddress([Buffer.from(PDA_SEED)], programId),
    getSellerTokenAccountPubkey(orderAccount.publicKey, mint, programId),
  ]);
  const pda = promiseResults[0];
  const sellerTokenAccount = promiseResults[1];

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: signer, isSigner: true, isWritable: true },
      { pubkey: orderAccount.publicKey, isSigner: true, isWritable: true },
      { pubkey: merchantAccount, isSigner: false, isWritable: false },
      { pubkey: sellerTokenAccount[0], isSigner: false, isWritable: true },
      { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: programOwnerAccount, isSigner: false, isWritable: true },
      { pubkey: sponsorAccount, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: pda[0], isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data: new Instruction({
      instruction: InstructionType.ExpressCheckout,
      [InstructionType.ExpressCheckout]: new Uint8Array(
        new InstructionData(InstructionType.ExpressCheckout, {
          amount,
          order_id: orderId,
          secret,
          data,
        }).encode()
      ),
    }).encode(),
  });
};

export interface BaseCheckoutParams {
  amount: number;
  buyerTokenAccount?: PublicKey /** the token account used to pay for this order */;
  connection: Connection;
  data?: string;
  merchantAccount: PublicKey;
  mint: PublicKey /** the mint in use; represents the currency */;
  programOwnerAccount: PublicKey;
  sponsorAccount: PublicKey;
  thisProgramId: string;
  wallet: WalletAdapter;
}

export interface ExpressCheckoutParams extends BaseCheckoutParams {
  orderId: string /** the unique order id */;
  secret: string /** a secret or encrypted string to verify this order */;
}

interface CheckoutTransactionResult {
  transaction: Transaction;
  signers: Account[];
}

export const makeCheckoutTransaction = async (
  params: ExpressCheckoutParams
): Promise<Result<CheckoutTransactionResult>> => {
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
  const orderAccount = new Account();
  const transaction = new Transaction({ feePayer: wallet.publicKey });
  let tokenAccount: PublicKey | undefined = buyerTokenAccount;
  let beforeIxs: TransactionInstruction[] = [];
  let afterIxs: TransactionInstruction[] = [];
  let signers: Account[] = [orderAccount];

  if (!tokenAccount) {
    let getAccResult;
    if (mint.toBase58() === WRAPPED_SOL_MINT.toBase58()) {
      getAccResult = await getOrCreateSOLTokenAccount({
        amount,
        connection,
        wallet,
      });
    } else {
      getAccResult = await getOrCreateTokenAccount({
        connection,
        mint,
        wallet,
      });
    }

    if (getAccResult.value) {
      tokenAccount = getAccResult.value.address;
      beforeIxs = getAccResult.value.instructions;
      afterIxs = getAccResult.value.cleanupInstructions;
      signers = signers.concat(getAccResult.value.signers);
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
          orderAccount,
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

  return success({
    transaction,
    signers,
  });
};
