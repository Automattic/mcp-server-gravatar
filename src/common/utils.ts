import crypto from 'crypto';

/**
 * Normalizes a string by trimming whitespace and converting to lowercase
 * @param input The string to normalize
 * @returns The normalized string
 */
export function normalize(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Generates a Gravatar identifier from any string
 * This normalizes the string and creates a SHA256 hash
 * @param input The string to convert to an identifier
 * @returns The Gravatar identifier (SHA256 hash)
 */
export function generateIdentifier(input: string): string {
  // Normalize the input and generate hash
  const normalizedInput = normalize(input);
  return crypto.createHash('sha256').update(normalizedInput).digest('hex');
}

/**
 * Validates a hash (SHA256 or MD5)
 * @param hash The hash to validate
 * @returns True if the hash is valid, false otherwise
 */
export function validateHash(hash: string): boolean {
  const hashRegex = /^([a-fA-F0-9]{32}|[a-fA-F0-9]{64})$/;
  return hashRegex.test(hash);
}
