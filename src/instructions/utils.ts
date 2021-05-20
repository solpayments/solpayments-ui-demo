import { Buffer } from 'buffer';
import {
  PublicKey,
  TransactionInstruction,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../helpers/solana';
import { Instruction, InstructionData, InstructionType } from '../helpers/instruction';
import { MAX_SEED_LEN, PDA_SEED } from '../helpers/constants';

interface ExpressCheckoutTxParams {
  amount: number;
  buyerTokenAccount: PublicKey /** the token account used to pay for this order */;
  data?: string;
  merchantAccount: PublicKey;
  mint: PublicKey /** the mint in use; represents the currency */;
  orderId: string /** the unique order id */;
  programId: PublicKey;
  programOwnerAccount: PublicKey;
  secret: string /** a secret or encrypted string to verify this order */;
  sponsorAccount: PublicKey;
  signer: PublicKey;
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
    programId,
    secret,
    sponsorAccount,
    signer,
  } = params;

  const data = params.data || null;
  const orderAccount = await getOrderAccountPubkey(orderId, signer, programId);
  const promiseResults = await Promise.all([
    PublicKey.findProgramAddress([Buffer.from(PDA_SEED)], programId),
    getSellerTokenAccountPubkey(orderAccount, mint, programId),
  ]);
  const pda = promiseResults[0];
  const sellerTokenAccount = promiseResults[1];

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: signer, isSigner: true, isWritable: true },
      { pubkey: orderAccount, isSigner: false, isWritable: true },
      { pubkey: merchantAccount, isSigner: false, isWritable: false },
      { pubkey: sellerTokenAccount[0], isSigner: false, isWritable: true },
      { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: programOwnerAccount, isSigner: false, isWritable: true },
      { pubkey: sponsorAccount, isSigner: false, isWritable: true },
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
          data,
        }).encode()
      ),
    }).encode(),
  });
};
