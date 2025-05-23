import crypto from 'crypto';
import { GravatarValidationError } from './errors.js';

/**
 * Normalizes an email address by trimming whitespace and converting to lowercase
 * @param email The email address to normalize
 * @returns The normalized email address
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates an email address using a regular expression
 * @param email The email address to validate
 * @returns True if the email address is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Generates a Gravatar identifier from an email address
 * This normalizes the email and creates a SHA256 hash
 * @param email The email address to convert to an identifier
 * @returns The Gravatar identifier (SHA256 hash)
 * @throws GravatarValidationError if the email is invalid
 */
export function generateIdentifierFromEmail(email: string): string {
  // Normalize the email first
  const normalizedEmail = normalizeEmail(email);

  // Validate the normalized email
  if (!validateEmail(normalizedEmail)) {
    throw new GravatarValidationError('Invalid email format');
  }

  // Hash the normalized email
  return generateSha256Hash(normalizedEmail);
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

/**
 * Generates a SHA256 hash of an email address
 * @param email The email address to hash
 * @returns The SHA256 hash of the email address
 */
export function generateSha256Hash(email: string): string {
  const normalizedEmail = normalizeEmail(email);
  return crypto.createHash('sha256').update(normalizedEmail).digest('hex');
}
