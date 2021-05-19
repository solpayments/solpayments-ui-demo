import { PublicKey } from '@solana/web3.js';
import type { Connection } from '@solana/web3.js';
import type { Result } from './result';
import { failure, success } from './result';
import {
  MERCHANT_ACC_OWNER_FIELD_OFFSET,
  ORDER_ACC_MERCHANT_FIELD_OFFSET,
  SINGLE,
  SOL_DECIMALS,
} from './constants';
import { MERCHANT_LAYOUT, ORDER_LAYOUT } from '../helpers/layout';
import type { Merchant } from '../helpers/layout';
import type { TokenApiResult } from '../helpers/solana';
import type { OrderInfo } from '../helpers/layout';
import { getUiAmount } from '../helpers/utils';
import type { TokenMap } from '../stores/tokenRegistry';

interface Base {
  connection: Connection;
}

interface GetMerchantAccountParams extends Base {
  ownerKey: PublicKey;
  programId: string;
}

interface GetOrderAccountParams extends Base {
  merchantKey: PublicKey;
  programId: string;
  tokenRegistry: TokenMap;
}

interface GetTokenAccountParams extends Base {
  ownerKey: PublicKey;
  programId: PublicKey;
}

export const getMerchantAccount = async (
  params: GetMerchantAccountParams
): Promise<Result<Merchant | null>> => {
  const { connection, ownerKey, programId } = params;
  const programIdKey = new PublicKey(programId);

  try {
    const result = await connection.getProgramAccounts(programIdKey, {
      commitment: SINGLE,
      filters: [
        { memcmp: { offset: MERCHANT_ACC_OWNER_FIELD_OFFSET, bytes: ownerKey.toBase58() } },
      ],
    });

    if (result.length < 1) {
      return success(null);
    }

    const merchantData = MERCHANT_LAYOUT.decode(result[0].account.data);

    return success({
      address: result[0].pubkey,
      account: {
        ...merchantData,
        fee: getUiAmount(merchantData.fee, SOL_DECIMALS),
      },
    });
  } catch (error) {
    return failure(error);
  }
};

export const getOrderAccounts = async (
  params: GetOrderAccountParams
): Promise<Result<OrderInfo[]>> => {
  const { connection, merchantKey, programId, tokenRegistry } = params;
  const programIdKey = new PublicKey(programId);

  try {
    const result = await connection.getProgramAccounts(programIdKey, {
      commitment: SINGLE,
      filters: [
        { memcmp: { offset: ORDER_ACC_MERCHANT_FIELD_OFFSET, bytes: merchantKey.toBase58() } },
      ],
    });

    return success(
      await Promise.all(
        result.map(async (item) => {
          const orderData = ORDER_LAYOUT.decode(item.account.data);
          const thisToken = tokenRegistry.get(orderData.mint.toBase58());

          let decimals = 0;
          if (thisToken) {
            decimals = thisToken.decimals;
          } else {
            const mint = await connection.getParsedAccountInfo(orderData.mint).then((res) => {
              return res.value;
            });
            if (mint) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              decimals = (mint as any).data.parsed.info.decimals;
            }
          }

          return {
            ...item,
            account: {
              ...item.account,
              data: {
                ...orderData,
                expectedAmount: getUiAmount(orderData.expectedAmount, decimals),
                paidAmount: getUiAmount(orderData.paidAmount, decimals),
              },
            },
          };
        })
      )
    );
  } catch (error) {
    return failure(error);
  }
};

export const fetchTokenAccounts = async (
  params: GetTokenAccountParams
): Promise<Result<TokenApiResult>> => {
  const { connection, ownerKey, programId } = params;
  try {
    return success(await connection.getParsedTokenAccountsByOwner(ownerKey, { programId }, SINGLE));
  } catch (error) {
    return failure(error);
  }
};
