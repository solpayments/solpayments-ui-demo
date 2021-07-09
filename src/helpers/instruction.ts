import type { Schema } from 'borsh';
import { Layout } from './borsh';
import type { Dictionary } from './types';
import {
  AMOUNT,
  CLOSE_ORDER_ACCOUNT,
  DATA,
  ENUM,
  FEE,
  INSTRUCTION,
  NAME,
  OPTION,
  ORDER_ID,
  QUANTITY,
  SECRET,
  SEED,
  STRING,
  STRUCT,
  U8,
  U64,
} from './constants';

export enum InstructionType {
  RegisterMerchant = 'RegisterMerchant',
  ExpressCheckout = 'ExpressCheckout',
  ChainCheckout = 'ChainCheckout',
  Withdraw = 'Withdraw',
  Subscribe = 'Subscribe',
  RenewSubscription = 'RenewSubscription',
  CancelSubscription = 'CancelSubscription',
}

export class Instruction extends Layout {
  constructor(prop: Dictionary) {
    let len = 0;
    if (Object.keys(prop).length > 1) {
      const item = Object.keys(prop)[Object.keys(prop).length - 1];
      len = (prop[item] as Uint8Array).length;
    }

    const schema: Schema = new Map([
      [
        Instruction,
        {
          kind: ENUM,
          field: INSTRUCTION,
          values: [
            [InstructionType.RegisterMerchant, [len]],
            [InstructionType.ExpressCheckout, [len]],
            [InstructionType.ChainCheckout, [len]],
            [InstructionType.Withdraw, [len]],
            [InstructionType.Subscribe, [len]],
            [InstructionType.RenewSubscription, [len]],
            [InstructionType.CancelSubscription, [len]],
          ],
        },
      ],
    ]);
    super(schema);
    Layout.assign(this, prop);
  }
}

export class InstructionData extends Layout {
  static schema: Record<InstructionType, Schema> = {
    [InstructionType.RegisterMerchant]: new Map([
      [
        InstructionData,
        {
          kind: STRUCT,
          fields: [
            [SEED, { kind: OPTION, type: STRING }],
            [FEE, { kind: OPTION, type: U64 }],
            [DATA, { kind: OPTION, type: STRING }],
          ],
        },
      ],
    ]),
    [InstructionType.ExpressCheckout]: new Map([
      [
        InstructionData,
        {
          kind: STRUCT,
          fields: [
            [AMOUNT, U64],
            [ORDER_ID, STRING],
            [SECRET, STRING],
            [DATA, { kind: OPTION, type: STRING }],
          ],
        },
      ],
    ]),
    [InstructionType.ChainCheckout]: new Map([
      [
        InstructionData,
        {
          kind: STRUCT,
          fields: [
            [AMOUNT, U64],
            ['order_items', STRING],
            [DATA, { kind: OPTION, type: STRING }],
          ],
        },
      ],
    ]),
    [InstructionType.Withdraw]: new Map([
      [
        InstructionData,
        {
          kind: STRUCT,
          fields: [[CLOSE_ORDER_ACCOUNT, U8]],
        },
      ],
    ]),
    [InstructionType.Subscribe]: new Map([
      [
        InstructionData,
        {
          kind: STRUCT,
          fields: [
            [NAME, STRING],
            [DATA, { kind: OPTION, type: STRING }],
          ],
        },
      ],
    ]),
    [InstructionType.RenewSubscription]: new Map([
      [
        InstructionData,
        {
          kind: STRUCT,
          fields: [[QUANTITY, U64]],
        },
      ],
    ]),
    [InstructionType.CancelSubscription]: new Map([
      [
        InstructionData,
        {
          kind: STRUCT,
          fields: [],
        },
      ],
    ]),
  };

  constructor(instructionType: InstructionType, prop: Dictionary) {
    super(InstructionData.schema[instructionType]);
    Layout.assign(this, prop);
  }
}
