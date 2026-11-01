/**
 * Regression: EIP-712 bool fields must be real booleans (vuln scan, Nov 2026).
 * eth-sig-util signs the STRING "false" as `true`, while the approval UI shows "false".
 */
import fs from 'fs';
import path from 'path';
import { TypedDataUtils, SignTypedDataVersion, typedSignatureHash } from '@metamask/eth-sig-util';
import {
  assertTypedDataBoolsStrict,
  assertTypedDataV1BoolsStrict,
  TypedDataBoolError,
} from '@/utils/typedDataStrictBool';

const typed = (approve: unknown, flags: unknown = [true]) => ({
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'chainId', type: 'uint256' },
    ],
    Inner: [{ name: 'ok', type: 'bool' }],
    Permit: [
      { name: 'spender', type: 'address' },
      { name: 'approved', type: 'bool' },
      { name: 'flags', type: 'bool[]' },
      { name: 'inner', type: 'Inner' },
    ],
  },
  primaryType: 'Permit',
  domain: { name: 'T', chainId: 1 },
  message: {
    spender: '0x000000000000000000000000000000000000dEaD',
    approved: approve,
    flags,
    inner: { ok: true },
  },
});
const hashV4 = (d: any) =>
  TypedDataUtils.eip712Hash(d, SignTypedDataVersion.V4).toString('hex');

describe('EIP-712 strict bool', () => {
  it('documents the bug: eth-sig-util signs "false" exactly like true', () => {
    expect(hashV4(typed('false'))).toBe(hashV4(typed(true)));
    expect(hashV4(typed('false'))).not.toBe(hashV4(typed(false)));
  });

  it('rejects a string "false"/"true", 0/1 or null in a bool field', () => {
    for (const bad of ['false', 'true', 0, 1, null, '']) {
      expect(() => assertTypedDataBoolsStrict(typed(bad))).toThrow(TypedDataBoolError);
      expect(() => assertTypedDataBoolsStrict(JSON.stringify(typed(bad)))).toThrow(TypedDataBoolError);
    }
  });

  it('rejects non-booleans inside bool[] and nested structs', () => {
    expect(() => assertTypedDataBoolsStrict(typed(true, [true, 'false']))).toThrow(/flags\[1\]/);
    const d: any = typed(true);
    d.message.inner.ok = 'false';
    expect(() => assertTypedDataBoolsStrict(d)).toThrow(/inner\.ok/);
  });

  it('accepts real booleans (display == sign)', () => {
    expect(() => assertTypedDataBoolsStrict(typed(false, [false, true]))).not.toThrow();
    expect(() => assertTypedDataBoolsStrict(JSON.stringify(typed(true)))).not.toThrow();
  });

  it('v1: rejects string bools, accepts real bools', () => {
    const v1 = (value: unknown) => [{ type: 'bool', name: 'ok', value }];
    expect(typedSignatureHash(v1(true) as any)).toBe(typedSignatureHash(v1('false') as any));
    expect(() => assertTypedDataV1BoolsStrict(v1('false'))).toThrow(TypedDataBoolError);
    expect(() => assertTypedDataV1BoolsStrict(v1(false))).not.toThrow();
  });

  it('is enforced before approval AND before signing in the provider controller', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../../src/background/controller/provider/controller.ts'),
      'utf8'
    );
    const section = (start: string, end: string) => {
      const i = src.indexOf(start);
      expect(i).toBeGreaterThan(-1);
      return src.slice(i, src.indexOf(end, i + start.length));
    };
    expect(section('const v1SignTypedDataVlidation', '\n};')).toMatch(/assertTypedDataV1BoolsStrict\(/);
    expect(section('const signTypedDataVlidation', '\n};')).toMatch(/assertTypedDataBoolsStrict\(jsonData\)/);
    const signer = section('_signTypedData = async', 'keyringService.signTypedMessage(');
    expect(signer).toMatch(/assertTypedDataBoolsStrict\(_data\)/);
    expect(signer).toMatch(/assertTypedDataV1BoolsStrict\(_data\)/);
  });
});
