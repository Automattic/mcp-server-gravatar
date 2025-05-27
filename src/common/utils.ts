import crypto from 'crypto';

/**
 * Type that excludes empty strings
 */
type NonEmpty<T extends string> = T extends '' ? never : T;

/**
 * Error thrown when a required string parameter is empty, null, or undefined
 */
export class EmptyStringError extends Error {
  constructor() {
    super('Parameter is missing or empty');
    this.name = 'EmptyStringError';
  }
}

/**
 * Asserts that a string parameter is present and not empty
 * @param value The string to validate
 * @throws EmptyStringError if value is missing, null, undefined, empty, or whitespace-only
 */
export function assertNonEmpty<T extends string>(value: T): asserts value is NonEmpty<T> {
  if (!value || !value.trim()) {
    throw new EmptyStringError();
  }
}

/**
 * Normalizes a string by trimming whitespace and converting to lowercase
 * Validates that the input is a non-empty string first
 * @param input The string to normalize
 * @returns The normalized string
 */
export function normalize(input: string): string {
  assertNonEmpty(input);

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
 * Handles errors for email-based tools with consistent error formatting
 * @param error The error that occurred
 * @param email The email parameter value (for error context)
 * @param operation The operation being performed (e.g., "fetch profile", "fetch avatar")
 * @returns Formatted error response object
 */
export function handleEmailToolError(error: unknown, email: string, operation: string) {
  if (error instanceof EmptyStringError) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to ${operation}: Email parameter is missing or empty. Please provide a valid email address.`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Failed to ${operation} for email "${email}": ${error instanceof Error ? error.message : String(error)}`,
      },
    ],
    isError: true,
  };
}

/**
 * Handles errors for ID-based tools with consistent error formatting
 * @param error The error that occurred
 * @param identifier The identifier parameter value (for error context)
 * @param operation The operation being performed (e.g., "fetch profile", "fetch avatar")
 * @returns Formatted error response object
 */
export function handleIdToolError(error: unknown, identifier: string, operation: string) {
  if (error instanceof EmptyStringError) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to ${operation}: Identifier parameter is missing or empty. Please provide a valid identifier.`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Failed to ${operation} for identifier "${identifier}": ${error instanceof Error ? error.message : String(error)}`,
      },
    ],
    isError: true,
  };
}
