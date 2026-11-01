/**
 * Break-It round 2 (BI-SW1-01 + Watch): malformed array types, bool fields in the EIP-712 domain,
 * array-like objects in place of bool arrays, and the UI signing path that skipped the check.
 */
import fs from 'fs';
import path from 'path';
import { TypedDataUtils, SignTypedDataVersion } from '@metamask/eth-sig-util';
import { assertTypedDataBoolsStrict, TypedDataBoolError } from '@/utils/typedDataStrictBool';

const withField = (type: string, value: unknown) => ({
  types: {
    EIP712Domain: [{ name: 'name', type: 'string' }],
    Msg: [{ name: 'f', type }],
  },
  primaryType: 'Msg',
  domain: { name: 'T' },
  message: { f: value },
});

const ethSigUtilSigns = (td: any) => {
  try {
    TypedDataUtils.eip712Hash(td, SignTypedDataVersion.V4);
    return true;
  } catch {
    return false;
  }
};

describe('malformed array types (eth-sig-util: anything ending in "]" is an array)', () => {
  for (const type of ['bool[1 ]', 'bool[x]', 'bool[]]', 'bool[-1]']) {
    it(`rejects ${JSON.stringify(type)} carrying a string "false"`, () => {
      const td = withField(type, ['false']);
      // Documents what eth-sig-util would do if we let it through (not asserted: depends on version).
      // eslint-disable-next-line no-console
      if (ethSigUtilSigns(td)) console.log(`eth-sig-util signs ${type} with "false"`);
      expect(() => assertTypedDataBoolsStrict(td)).toThrow(TypedDataBoolError);
      expect(() => assertTypedDataBoolsStrict(JSON.stringify(td))).toThrow(TypedDataBoolError);
    });
  }
  it('still accepts well-formed bool[], bool[2], bool[2][] with real booleans', () => {
    expect(() => assertTypedDataBoolsStrict(withField('bool[]', [true, false]))).not.toThrow();
    expect(() => assertTypedDataBoolsStrict(withField('bool[2]', [true, false]))).not.toThrow();
    expect(() => assertTypedDataBoolsStrict(withField('bool[2][]', [[true, false]]))).not.toThrow();
  });
});

describe('bool fields in the EIP-712 domain', () => {
  const domainTd = (v: unknown) => ({
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'testnet', type: 'bool' },
      ],
      Msg: [{ name: 'x', type: 'uint256' }],
    },
    primaryType: 'Msg',
    domain: { name: 'T', testnet: v },
    message: { x: 1 },
  });
  it('rejects a string "false" in a domain bool', () => {
    expect(() => assertTypedDataBoolsStrict(domainTd('false'))).toThrow(TypedDataBoolError);
    expect(() => assertTypedDataBoolsStrict(JSON.stringify(domainTd('false')))).toThrow(TypedDataBoolError);
  });
  it('rejects when primaryType is EIP712Domain itself', () => {
    const td = { ...domainTd('false'), primaryType: 'EIP712Domain', message: { name: 'T', testnet: 'false' } };
    expect(() => assertTypedDataBoolsStrict(td)).toThrow(TypedDataBoolError);
  });
  it('accepts a real boolean in the domain', () => {
    expect(() => assertTypedDataBoolsStrict(domainTd(false))).not.toThrow();
  });
});

describe('bool arrays sent as plain / array-like objects', () => {
  for (const [label, v] of [
    ['{"0":"false"}', { 0: 'false' }],
    ['array-like {"0":"false","length":1}', { 0: 'false', length: 1 }],
    ['array-like of real booleans', { 0: false, length: 1 }],
    ['string "false"', 'false'],
  ] as const) {
    it(`rejects ${label} for bool[]`, () => {
      expect(() => assertTypedDataBoolsStrict(withField('bool[]', v))).toThrow(TypedDataBoolError);
      expect(() => assertTypedDataBoolsStrict(withField('bool[1]', v))).toThrow(TypedDataBoolError);
    });
  }
  it('rejects an array-like nested inside a struct array', () => {
    const td = {
      types: { EIP712Domain: [], Inner: [{ name: 'ok', type: 'bool[]' }], Msg: [{ name: 'items', type: 'Inner[]' }] },
      primaryType: 'Msg',
      domain: {},
      message: { items: [{ ok: { 0: 'false' } }] },
    };
    expect(() => assertTypedDataBoolsStrict(td)).toThrow(TypedDataBoolError);
  });
});

describe('UI signing path (wallet.signTypedData -> keyringService.signTypedMessage)', () => {
  const root = path.resolve(__dirname, '../..');
  const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
  it('keyringService.signTypedMessage runs the strict-bool guard before keyring.signTypedData', () => {
    const src = read('src/background/service/keyring/index.ts');
    const body = src.slice(src.indexOf('signTypedMessage(keyring'), src.indexOf('keyring.signTypedData(', src.indexOf('signTypedMessage(keyring')));
    expect(body).toMatch(/assertTypedDataForSigning\(\s*msgParams\.data/);
  });
  it('wallet.signTypedData has no other route to a keyring signature', () => {
    const src = read('src/background/controller/wallet.ts');
    const start = src.indexOf('signTypedData = async (');
    const body = src.slice(start, src.indexOf('signTypedDataWithUI', start));
    expect(body).toContain('keyringService.signTypedMessage(');
    expect(body).not.toMatch(/keyring\.signTypedData\(/);
  });
  it('the guard used there rejects string bools for V1, V3 and V4', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@/utils/typedDataStrictBool');
    expect(typeof mod.assertTypedDataForSigning).toBe('function');
    const v1 = [{ type: 'bool', name: 'ok', value: 'false' }];
    expect(() => mod.assertTypedDataForSigning(v1, 'V1')).toThrow(TypedDataBoolError);
    expect(() => mod.assertTypedDataForSigning(JSON.stringify(v1), undefined)).toThrow(TypedDataBoolError);
    for (const v of ['V3', 'V4']) {
      expect(() => mod.assertTypedDataForSigning(JSON.stringify(withField('bool', 'false')), v)).toThrow(TypedDataBoolError);
      expect(() => mod.assertTypedDataForSigning(withField('bool', false), v)).not.toThrow();
    }
  });
});
