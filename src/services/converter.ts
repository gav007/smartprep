/**
 * Converts a number from one base to another.
 * @param value The number to convert.
 * @param fromBase The base of the input number.
 * @param toBase The base to convert to.
 * @returns The converted number as a string.
 */
export async function convertBase(value: string, fromBase: number, toBase: number): Promise<string> {
  // TODO: Implement this by calling an API.

  return parseInt(value, fromBase).toString(toBase);
}
