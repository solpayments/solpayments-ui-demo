import type { Account, Connection, TransactionSignature } from '@solana/web3.js';
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SYSVAR_CLOCK_PUBKEY,
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
import type { OrderSubscription } from '../helpers/data';
import { makeExpressCheckoutTransaction } from './utils';
import { WRAPPED_SOL_MINT } from '../helpers/solana';
import { getOrCreateTokenAccount, getOrCreateSOLTokenAccount } from '../helpers/token';

interface SubscribeParams {
  amount: number;
  buyerTokenAccount?: PublicKey /** the token account used to pay for this order */;
  connection: Connection;
  data?: string;
  merchantAccount: PublicKey;
  mint: PublicKey /** the mint in use; represents the currency */;
  name: string;
  programOwnerAccount: PublicKey;
  sponsorAccount: PublicKey;
  subscriptionAddress?: PublicKey;
  thisProgramId: string;
  wallet: WalletAdapter;
}

export const subscribe = async (params: SubscribeParams): Promise<Result<TransactionSignature>> => {
  const {
    amount,
    buyerTokenAccount,
    connection,
    merchantAccount,
    mint,
    name,
    programOwnerAccount,
    thisProgramId,
    sponsorAccount,
    subscriptionAddress,
    wallet,
  } = params;
  if (!wallet.publicKey) {
    return failure(new Error('Wallet not connected'));
  }
  const data = params.data || null;
  const programIdKey = new PublicKey(thisProgramId);
  const subscriptionKey =
    subscriptionAddress || (await PublicKey.createWithSeed(wallet.publicKey, name, programIdKey));
  const orderData: OrderSubscription = {
    subscription: subscriptionKey.toString(),
  };
  const orderId = `${name}:${new Date().valueOf()}`;
  const orderKey = await PublicKey.createWithSeed(wallet.publicKey, orderId, programIdKey);

  // create and pay for order
  const transaction = new Transaction({ feePayer: wallet.publicKey });
  let tokenAccount: PublicKey | undefined = buyerTokenAccount;
  let beforeIxs: TransactionInstruction[] = [];
  let afterIxs: TransactionInstruction[] = [];
  let signers: Account[] = [];

  // add the instructions to run before main instruction
  beforeIxs.forEach((element) => {
    transaction.add(element);
  });

  if (!tokenAccount) {
    let getAccResult;
    if (mint.toBase58() === WRAPPED_SOL_MINT.toBase58()) {
      console.log('!111111111111111111111');
      getAccResult = await getOrCreateSOLTokenAccount({
        amount,
        connection,
        wallet,
      });
    } else {
      console.log('nnnnnnnnnnnnnnnnnnnnn');
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
      signers = getAccResult.value.signers;
    }
  }

  console.log('tokenAccount >>>> ', tokenAccount?.toBase58());
  console.log('beforeIxs >>>> ', beforeIxs);
  console.log('afterIxs >>>> ', afterIxs);
  console.log('signers >>>> ', signers);
  console.log('mint >>>> ', mint.toBase58());

  if (tokenAccount) {
    try {
      transaction.add(
        await makeExpressCheckoutTransaction({
          amount,
          buyerTokenAccount: tokenAccount,
          data: JSON.stringify(orderData),
          merchantAccount,
          mint,
          orderId,
          programId: programIdKey,
          programOwnerAccount,
          secret: '',
          sponsorAccount,
          signer: wallet.publicKey,
        })
      );
    } catch (error) {
      return failure(error);
    }
    // initialize subscription
    try {
      transaction.add(
        new TransactionInstruction({
          programId: programIdKey,
          keys: [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: subscriptionKey, isSigner: false, isWritable: true },
            { pubkey: merchantAccount, isSigner: false, isWritable: false },
            { pubkey: orderKey, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
          ],
          data: new Instruction({
            instruction: InstructionType.Subscribe,
            [InstructionType.Subscribe]: new Uint8Array(
              new InstructionData(InstructionType.Subscribe, {
                name,
                data,
              }).encode()
            ),
          }).encode(),
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

  const result = await signAndSendTransaction(connection, transaction, wallet, signers);

  if (result.value) {
    awaitTransactionSignatureConfirmation(
      result.value,
      InstructionType.Subscribe.toString(),
      connection
    );
  }

  return result;
};
