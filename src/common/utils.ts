import crypto from 'crypto';

/**
 * Normalizes a string by trimming whitespace and converting to lowercase
 * Handles undefined, null, and non-string inputs gracefully
 * @param input The input to normalize
 * @returns The normalized string
 */
export function normalize(input: string): string {
  // Handle undefined, null, or non-string inputs defensively
  if (input == null) {
    return '';
  }

  // Convert to string if it's not already a string
  const stringInput = String(input);

  return stringInput.trim().toLowerCase();
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
 * Validates that an email parameter is present and not empty
 * @param email The email parameter to validate
 * @throws Error if email is missing, null, undefined, or empty
 */
export function validateEmailParameter(email: any): void {
  if (email == null || email === '' || email === 'undefined') {
    throw new Error('Email parameter is missing or empty. Please provide a valid email address.');
  }
}
