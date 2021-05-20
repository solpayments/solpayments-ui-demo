import type { Schema } from 'borsh';
import { Layout } from './borsh';
import type { Dictionary } from './types';
import {
  AMOUNT,
  DATA,
  ENUM,
  FEE,
  INSTRUCTION,
  NAME,
  OPTION,
  ORDER_ID,
  SECRET,
  SEED,
  STRING,
  STRUCT,
  U64,
} from './constants';

export enum InstructionType {
  RegisterMerchant = 'RegisterMerchant',
  ExpressCheckout = 'ExpressCheckout',
  Subscribe = 'Subscribe',
  Withdraw = 'Withdraw',
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
            [InstructionType.Withdraw, [len]],
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
    [InstructionType.Withdraw]: new Map([
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
