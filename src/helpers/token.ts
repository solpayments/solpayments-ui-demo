import type { Connection, AccountInfo } from '@solana/web3.js';
import { Account, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { AccountLayout, Token } from '@solana/spl-token';
import { CONFIRMED } from './constants';
import { ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, TOKEN_PROGRAM_ID, WRAPPED_SOL_MINT } from './solana';
import type { Result } from './result';
import { failure, success } from './result';
import type { WalletAdapter } from './types';

interface GetOrCreateTokenAccountParams {
  amount: number;
  connection: Connection;
  wallet: WalletAdapter;
}

interface GetOrCreateTokenAccountResult {
  address: PublicKey;
  instructions: TransactionInstruction[];
  cleanupInstructions: TransactionInstruction[];
  signers: Account[];
}

/**
 * Get or create the associated token account for the native mint
 */
export const getOrCreateSOLTokenAccount = async (
  params: GetOrCreateTokenAccountParams
): Promise<Result<GetOrCreateTokenAccountResult>> => {
  const { amount, connection, wallet } = params;

  if (!wallet.publicKey) {
    return failure(new Error('Wallet not connected'));
  }

  const instructions: TransactionInstruction[] = [];
  const cleanupInstructions: TransactionInstruction[] = [];
  let possibleTokenAccount: AccountInfo<Buffer> | null = null;
  const newAccount = new Account();

  const closeAccountIx = Token.createCloseAccountInstruction(
    TOKEN_PROGRAM_ID,
    newAccount.publicKey,
    wallet.publicKey,
    wallet.publicKey,
    []
  );

  try {
    possibleTokenAccount = await connection.getAccountInfo(newAccount.publicKey, CONFIRMED);
  } catch (error) {
    return failure(error);
  }

  if (!possibleTokenAccount) {
    // create the account
    instructions.push(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: newAccount.publicKey,
        lamports: await Token.getMinBalanceRentForExemptAccount(connection),
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
      })
    );
    // Send lamports to it (these will be wrapped into native tokens by the token program)
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: newAccount.publicKey,
        lamports: amount,
      })
    );
    // Assign the new account to the native token mint.
    // the account will be initialized with a balance equal to the native token balance.
    // (i.e. amount)
    instructions.push(
      Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        WRAPPED_SOL_MINT,
        newAccount.publicKey,
        wallet.publicKey
      )
    );
  }
  // consensus is to destroy the native mint account after all instructions
  cleanupInstructions.push(closeAccountIx);

  return success({
    address: newAccount.publicKey,
    instructions,
    cleanupInstructions,
    signers: [newAccount],
  });
};

/**
 * Derives the associated token address for the given wallet address and token mint.
 * @param owner Wallet address
 * @param mint Mint address
 * Get or create the associated token account for the native mint
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
