import crypto from 'crypto';
import { getUserAgent as getUniversalUserAgent } from 'universal-user-agent';
import { Configuration } from '../generated/gravatar-api/runtime.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { GravatarValidationError } from './errors.js';
import { VERSION } from './version.js';

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
 * Validates a hash (MD5 or SHA256)
 * @param hash The hash to validate
 * @returns True if the hash is valid, false otherwise
 */
export function validateHash(hash: string): boolean {
  const hashRegex = /^([a-fA-F0-9]{32}|[a-fA-F0-9]{64})$/;
  return hashRegex.test(hash);
}

/**
 * Generates an MD5 hash of an email address
 * @param email The email address to hash
 * @returns The MD5 hash of the email address
 */
export function generateMd5Hash(email: string): string {
  const normalizedEmail = normalizeEmail(email);
  return crypto.createHash('md5').update(normalizedEmail).digest('hex');
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

/**
 * Gets the User-Agent string for API requests
 * @returns The User-Agent string
 */
export function getUserAgent(): string {
  return `mcp-server-gravatar/v${VERSION} ${getUniversalUserAgent()}`;
}

/**
 * Gets the API key from the environment variables
 * Uses the environment variable name specified in securityConfig
 * @returns The API key or undefined if not set
 */
export async function getApiKey(): Promise<string | undefined> {
  const { securityConfig } = await import('../config/server-config.js');
  return process.env[securityConfig.apiKeyEnvVar];
}

/**
 * Creates a configuration object for API clients
 * Uses the API key from environment variables
 * @returns Configuration object with API key and User-Agent header
 */
export async function createApiConfiguration(): Promise<Configuration> {
  // Get API key from environment variable
  const apiKey = await getApiKey();

  // Create configuration with headers
  const config: {
    headers: { 'User-Agent': string };
    accessToken?: string;
  } = {
    headers: {
      'User-Agent': getUserAgent(),
    },
  };

  // Add API key if available
  if (apiKey) {
    config.accessToken = apiKey;
  }

  return new Configuration(config);
}

/**
 * Maps HTTP status codes to error types
 * @param status The HTTP status code
 * @param message The error message
 * @returns The appropriate error type
 */
export async function mapHttpStatusToError(status: number, message: string): Promise<Error> {
  // Import error types from errors.js
  const { GravatarResourceNotFoundError, GravatarRateLimitError, GravatarError } = await import(
    './errors.js'
  );

  switch (status) {
    case 404:
      return new GravatarResourceNotFoundError(message);
    case 429:
      return new GravatarRateLimitError(message, new Date(Date.now() + 60000)); // Assume 1 minute rate limit
    case 500:
      return new GravatarError(ErrorCode.InternalError, `Internal Server Error: ${message}`);
    default:
      return new GravatarError(ErrorCode.InternalError, `HTTP Error ${status}: ${message}`);
  }
}
