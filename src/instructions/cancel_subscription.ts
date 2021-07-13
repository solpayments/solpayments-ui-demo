import { Buffer } from 'buffer';
import type { Connection, TransactionSignature } from '@solana/web3.js';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { PDA_SEED } from '../helpers/constants';
import { TOKEN_PROGRAM_ID, WRAPPED_SOL_MINT } from '../helpers/solana';
import { getOrCreateTokenAccount, getOrCreateSOLTokenAccount } from '../helpers/token';
import type { Result } from '../helpers/result';
import { failure } from '../helpers/result';
import type { WalletAdapter } from '../helpers/types';
import {
  awaitTransactionSignatureConfirmation,
  signAndSendTransaction,
} from '../helpers/transaction';
import { Instruction, InstructionData, InstructionType } from '../helpers/instruction';

interface CancelSubscriptionParams {
  accountToReceiveSolRefund: PublicKey;
  connection: Connection;
  merchantAccount: PublicKey;
  mint: PublicKey;
  orderAccount: PublicKey;
  orderTokenAccount: PublicKey;
  subscriptionAccount: PublicKey;
  thisProgramId: string;
  wallet: WalletAdapter;
}

export const cancel = async (
  params: CancelSubscriptionParams
): Promise<Result<TransactionSignature>> => {
  const {
    accountToReceiveSolRefund,
    connection,
    merchantAccount,
    mint,
    orderAccount,
    orderTokenAccount,
    subscriptionAccount,
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

  let getAccResult;
  if (mint.toBase58() === WRAPPED_SOL_MINT.toBase58()) {
    getAccResult = await getOrCreateSOLTokenAccount({
      amount: 0,
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
    // add the instructions to run before main instruction
    getAccResult.value.instructions.forEach((element) => {
      transaction.add(element);
    });

    try {
      transaction.add(
        new TransactionInstruction({
          programId: programIdKey,
          keys: [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: subscriptionAccount, isSigner: false, isWritable: true },
            { pubkey: merchantAccount, isSigner: false, isWritable: false },
            { pubkey: orderAccount, isSigner: false, isWritable: true },
            { pubkey: orderTokenAccount, isSigner: false, isWritable: true },
            { pubkey: getAccResult.value.address, isSigner: false, isWritable: true },
            { pubkey: accountToReceiveSolRefund, isSigner: false, isWritable: true },
            { pubkey: pda[0], isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          ],
          data: new Instruction({
            instruction: InstructionType.CancelSubscription,
            [InstructionType.CancelSubscription]: new Uint8Array(
              new InstructionData(InstructionType.CancelSubscription, {}).encode()
            ),
          }).encode(),
        })
      );
    } catch (error) {
      return failure(error);
    }

    // add the instructions to run after main instruction
    getAccResult.value.cleanupInstructions.forEach((element) => {
      transaction.add(element);
    });

    const result = await signAndSendTransaction(
      connection,
      transaction,
      wallet,
      getAccResult.value.signers
    );

    if (result.value) {
      awaitTransactionSignatureConfirmation(
        result.value,
        InstructionType.Withdraw.toString(),
        connection
      );
    }

    return result;
  } else {
    return failure(new Error('Could not get token account'));
  }
};
