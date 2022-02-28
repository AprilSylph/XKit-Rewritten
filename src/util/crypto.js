/**
 * @returns {string} Eight psuedo-random 8-bit hexadecimal numbers
 */
export const getRandomHexString = () => {
  const typedArray = new Uint8Array(8);
  crypto.getRandomValues(typedArray);
  return [...typedArray].map(number => number.toString(16).padStart(2, '0')).join('');
};

/**
 * Get a hexadecimal SHA-256 hash of a given string
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string
 * @param {string} data - A USVString containing the data to hash
 * @returns {Promise<string>} Hexadecimal string representing the data's SHA-256 digest
 */
export const sha256 = async data => {
  const msgUint8 = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};
