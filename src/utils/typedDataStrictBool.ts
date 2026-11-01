/**
 * Strict boolean check for EIP-712 typed data (eth_signTypedData v1/v3/v4).
 *
 * Why: @metamask/eth-sig-util signs a `bool` field via abi encoding, where the
 * STRING "false" is encoded as true (Boolean("false") === true). The approval
 * UI shows the raw JSON value ("false"), so the user would approve one value
 * and sign the opposite. We refuse any bool field whose value is not a real
 * JSON boolean, both before the approval popup opens and again right before
 * signing, so what is displayed is exactly what is signed.
 */

type TypedField = { name: string; type: string };
type Types = Record<string, TypedField[]>;

export class TypedDataBoolError extends Error {}

const fail = (path: string, value: unknown): never => {
  throw new TypedDataBoolError(
    `typed data field "${path}" has type bool but its value is not a boolean (got ${typeof value})`
  );
};

function checkValue(types: Types, type: string, value: unknown, path: string, depth: number) {
  if (depth > 64) throw new TypedDataBoolError('typed data is nested too deeply');
  // eth-sig-util treats ANY type ending in ']' as an array whose element type is everything
  // before the last '['. Only accept the well-formed `T[]` / `T[n]` forms; anything else
  // ('bool[1 ]', 'bool[x]', 'bool[]]', 'bool[-1]', ...) is refused before signing (BI-SW1-01).
  if (type.endsWith(']')) {
    const arr = /^([^\[\]]+(?:\[\d*\])*)\[(\d*)\]$/.exec(type);
    if (!arr) throw new TypedDataBoolError(`typed data field "${path}" has a malformed array type`);
    if (arr[1] !== type.slice(0, type.lastIndexOf('['))) {
      throw new TypedDataBoolError(`typed data field "${path}" has a malformed array type`);
    }
    if (value === undefined || value === null) return; // eth-sig-util rejects/handles missing arrays itself
    if (!Array.isArray(value)) {
      // only care when the element type contains a bool somewhere
      if (containsBool(types, arr[1], new Set())) fail(path, value);
      return;
    }
    // Array-likes / plain objects ({"0":"false"}) are not arrays: refused above when the element
    // type can hold a bool. Only real arrays are walked, element by element.
    value.forEach((v, i) => checkValue(types, arr[1], v, `${path}[${i}]`, depth + 1));
    return;
  }
  if (type === 'bool') {
    if (typeof value !== 'boolean') fail(path, value);
    return;
  }
  const fields = types[type];
  if (fields && value && typeof value === 'object') {
    for (const f of fields) {
      checkValue(types, f.type, (value as any)[f.name], `${path}.${f.name}`, depth + 1);
    }
  }
}

/** Parse a JSON string; malformed input is left for the existing checks / eth-sig-util to reject. */
function parseMaybe(data: unknown): unknown {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch {
    return undefined;
  }
}

function containsBool(types: Types, type: string, seen: Set<string>): boolean {
  const base = type.replace(/(\[\d*\])+$/, '');
  if (base === 'bool') return true;
  if (seen.has(base) || !types[base]) return false;
  seen.add(base);
  return types[base].some((f) => containsBool(types, f.type, seen));
}

/** v3/v4: `{ types, primaryType, domain, message }` (object or JSON string). Throws TypedDataBoolError. */
export function assertTypedDataBoolsStrict(data: unknown): void {
  const td = parseMaybe(data);
  if (!td || typeof td !== 'object') return;
  const { types, primaryType, domain, message } = td as any;
  if (!types || typeof types !== 'object') return;
  if (types.EIP712Domain && domain !== undefined) {
    checkValue(types, 'EIP712Domain', domain, 'domain', 0);
  }
  if (typeof primaryType === 'string' && primaryType !== 'EIP712Domain') {
    checkValue(types, primaryType, message, 'message', 0);
  }
}

/** v1 (legacy): `[{ type, name, value }]` (array or JSON string). Throws TypedDataBoolError. */
export function assertTypedDataV1BoolsStrict(data: unknown): void {
  const arr = parseMaybe(data);
  if (!Array.isArray(arr)) return;
  arr.forEach((item, i) => {
    if (item && typeof item === 'object') {
      checkValue({}, String(item.type), item.value, `[${i}].${item.name}`, 0);
    }
  });
}

/**
 * Single choke point used right before ANY typed-data signature (keyringService.signTypedMessage),
 * so UI-initiated paths (wallet.signTypedData / signTypedDataWithUI) cannot skip the check.
 */
export function assertTypedDataForSigning(data: unknown, version: unknown): void {
  if (version === 'V1' || version === undefined) assertTypedDataV1BoolsStrict(data);
  else assertTypedDataBoolsStrict(data);
}
