import type { Connection, AccountInfo } from '@solana/web3.js';
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { Token } from '@solana/spl-token';
import { CONFIRMED } from './constants';
import { ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, TOKEN_PROGRAM_ID, WRAPPED_SOL_MINT } from './solana';
import type { Result } from './result';
import { failure, success } from './result';
import type { WalletAdapter } from './types';

interface GetOrCreateTokenAccountParams {
  connection: Connection;
  mint: PublicKey;
  wallet: WalletAdapter;
}

interface GetOrCreateTokenAccountResult {
  address: PublicKey;
  instructions: TransactionInstruction[];
  cleanupInstructions: TransactionInstruction[];
}

/**
 * Derives the associated token address for the given wallet address and token mint.
 * @param owner Wallet address
 * @param mint Mint address
 */
export async function getAssociatedTokenAddress(
  owner: PublicKey,
  mint: PublicKey
): Promise<PublicKey> {
  const [address] = await PublicKey.findProgramAddress(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
  );
  return address;
}

/**
 * Instruction to create the associated token address for the given wallet address and token mint.
 *
 * @param payer Account to use to pay for fees
 * @param owner Wallet address for the new associated token address
 * @param mint Mint address for the new associated token address
 */
export async function createAssociatedTokenAccount(
  payer: PublicKey,
  owner: PublicKey,
  mint: PublicKey
): Promise<TransactionInstruction> {
  const associatedTokenAddress = await getAssociatedTokenAddress(owner, mint);
  return new TransactionInstruction({
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  });
}

/**
 * Get or create the associated token account for a given mint
 */
export const getOrCreateTokenAccount = async (
  params: GetOrCreateTokenAccountParams
): Promise<Result<GetOrCreateTokenAccountResult>> => {
  const { connection, mint, wallet } = params;

  if (!wallet.publicKey) {
    return failure(new Error('Wallet not connected'));
  }

  const instructions: TransactionInstruction[] = [];
  const cleanupInstructions: TransactionInstruction[] = [];
  const address = await getAssociatedTokenAddress(wallet.publicKey, mint);
  let possibleTokenAccount: AccountInfo<Buffer> | null = null;

  try {
    possibleTokenAccount = await connection.getAccountInfo(address, CONFIRMED);
  } catch (error) {
    return failure(error);
  }

  if (!possibleTokenAccount) {
    instructions.push(await createAssociatedTokenAccount(wallet.publicKey, wallet.publicKey, mint));
  }
  if (mint === WRAPPED_SOL_MINT) {
    cleanupInstructions.push(
      Token.createCloseAccountInstruction(
        TOKEN_PROGRAM_ID,
        address,
        wallet.publicKey,
        wallet.publicKey,
        []
      )
    );
  }

  return success({
    address,
    instructions,
    cleanupInstructions,
  });
};
