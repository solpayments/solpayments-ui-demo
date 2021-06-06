import { Schema, deserialize, serialize } from 'borsh';
import { Buffer } from 'buffer';

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */

export abstract class Layout {
  private schema: Schema;
  constructor(schema: Schema) {
    this.schema = schema;
  }

  encode(): Buffer {
    return Buffer.from(serialize(this.schema, this));
  }

  static assign(ob: any, properties: any): void {
    Object.keys(properties).map((key: any) => {
      ob[key] = properties[key];
    });
  }

  static decode<T>(schema: Schema, classType: any, buf: Buffer): T {
    return deserialize(schema, classType, buf);
  }
}
