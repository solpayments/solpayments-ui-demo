import type { Schema } from 'borsh';
import { Layout } from './borsh';
import type { Dictionary } from './types';
import { ENUM, INSTRUCTION, STRUCT } from './constants';

export enum InstructionType {
  RegisterMerchant = 'RegisterMerchant',
  // ExpressCheckout = 'ExpressCheckout',
  // Withdraw = 'Withdraw',
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
          values: [[InstructionType.RegisterMerchant, [len]]],
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
