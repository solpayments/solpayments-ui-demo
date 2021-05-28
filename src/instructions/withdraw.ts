import { Buffer } from 'buffer';
import type { Connection, TransactionSignature } from '@solana/web3.js';
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SYSVAR_CLOCK_PUBKEY,
} from '@solana/web3.js';
import { PDA_SEED } from '../helpers/constants';
import { TOKEN_PROGRAM_ID } from '../helpers/solana';
import type { Result } from '../helpers/result';
import { failure } from '../helpers/result';
import type { WalletAdapter } from '../helpers/types';
import {
  awaitTransactionSignatureConfirmation,
  signAndSendTransaction,
} from '../helpers/transaction';
import { Instruction, InstructionData, InstructionType } from '../helpers/instruction';

interface WithdrawParams {
  connection: Connection;
  merchantAccount: PublicKey;
  merchantTokenAccount: PublicKey;
  orderAccount: PublicKey;
  orderTokenAccount: PublicKey;
  thisProgramId: string;
  wallet: WalletAdapter;
}

export const withdraw = async (params: WithdrawParams): Promise<Result<TransactionSignature>> => {
  const {
    connection,
    merchantAccount,
    merchantTokenAccount,
    orderAccount,
    orderTokenAccount,
    thisProgramId,
    wallet,
  } = params;
  if (!wallet.publicKey) {
    return failure(new Error('Wallet not connected'));
  }
  const programIdKey = new PublicKey(thisProgramId);
  // get the program derived address
  const pda = await PublicKey.findProgramAddress([Buffer.from(PDA_SEED)], programIdKey);
  const transaction = new Transaction({ feePayer: wallet.publicKey });

  try {
    transaction.add(
      new TransactionInstruction({
        programId: programIdKey,
        keys: [
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: orderAccount, isSigner: false, isWritable: true },
          { pubkey: merchantAccount, isSigner: false, isWritable: false },
          { pubkey: orderTokenAccount, isSigner: false, isWritable: true },
          { pubkey: merchantTokenAccount, isSigner: false, isWritable: true },
          { pubkey: pda[0], isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: new Instruction({
          instruction: InstructionType.Withdraw,
          [InstructionType.Withdraw]: new Uint8Array(
            new InstructionData(InstructionType.Withdraw, {}).encode()
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
      InstructionType.Withdraw.toString(),
      connection
    );
  }

  return result;
};
