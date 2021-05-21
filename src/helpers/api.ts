import { PublicKey } from '@solana/web3.js';
import type { Connection } from '@solana/web3.js';
import type { Result } from './result';
import { failure, success } from './result';
import {
  MERCHANT_ACC_OWNER_FIELD_OFFSET,
  ORDER_ACC_MERCHANT_FIELD_OFFSET,
  CONFIRMED,
  SOL_DECIMALS,
} from './constants';
import { MERCHANT_LAYOUT, ORDER_LAYOUT, SUBSCRIPTION_LAYOUT } from '../helpers/layout';
import type { Merchant, Subscription } from '../helpers/layout';
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

interface GetByAddressParams extends Base {
  publicKey: PublicKey;
}

/** Gets one merchant account using its address */
export const getMerchantByAddress = async (
  params: GetByAddressParams
): Promise<Result<Merchant | null>> => {
  const { connection, publicKey } = params;

  try {
    const result = await connection.getAccountInfo(publicKey, CONFIRMED);
    if (!result) {
      return success(null);
    }
    const merchantData = MERCHANT_LAYOUT.decode(result.data);
    return success({
      address: publicKey,
      account: {
        ...merchantData,
        fee: getUiAmount(merchantData.fee, SOL_DECIMALS),
      },
    });
  } catch (error) {
    return failure(error);
  }
};

/** Gets merchant accounts */
export const getMerchantAccounts = async (
  params: GetMerchantAccountParams
): Promise<Result<Merchant[] | null>> => {
  const { connection, ownerKey, programId } = params;
  const programIdKey = new PublicKey(programId);

  try {
    const result = await connection.getProgramAccounts(programIdKey, {
      commitment: CONFIRMED,
      filters: [
        { memcmp: { offset: MERCHANT_ACC_OWNER_FIELD_OFFSET, bytes: ownerKey.toBase58() } },
      ],
    });
    if (result.length < 1) {
      return success(null);
    }
    return success(
      result.map((item) => {
        const merchantData = MERCHANT_LAYOUT.decode(item.account.data);
        return {
          address: result[0].pubkey,
          account: {
            ...merchantData,
            fee: getUiAmount(merchantData.fee, SOL_DECIMALS),
          },
        };
      })
    );
  } catch (error) {
    return failure(error);
  }
};

/** Gets order accounts */
export const getOrderAccounts = async (
  params: GetOrderAccountParams
): Promise<Result<OrderInfo[]>> => {
  const { connection, merchantKey, programId, tokenRegistry } = params;
  const programIdKey = new PublicKey(programId);

  try {
    const result = await connection.getProgramAccounts(programIdKey, {
      commitment: CONFIRMED,
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

/** Gets SPL token accounts */
export const fetchTokenAccounts = async (
  params: GetTokenAccountParams
): Promise<Result<TokenApiResult>> => {
  const { connection, ownerKey, programId } = params;
  try {
    return success(
      await connection.getParsedTokenAccountsByOwner(ownerKey, { programId }, CONFIRMED)
    );
  } catch (error) {
    return failure(error);
  }
};

/** Gets one subscription account using its address */
export const getSubscriptionByAddress = async (
  params: GetByAddressParams
): Promise<Result<Subscription | null>> => {
  const { connection, publicKey } = params;
  try {
    const result = await connection.getAccountInfo(publicKey, CONFIRMED);
    if (!result) {
      return success(null);
    }
    return success({
      address: publicKey,
      account: SUBSCRIPTION_LAYOUT.decode(result.data),
    });
  } catch (error) {
    return failure(error);
  }
};
