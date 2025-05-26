/**
 * Common error utilities for the Gravatar MCP server
 *
 * Note: This server now uses AirBnB-style error handling where errors are returned
 * as content with isError: true rather than throwing custom error classes.
 * This approach provides cleaner error messages and better MCP client compatibility.
 */

/**
 * Checks if an error is a standard Error object
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safely extracts an error message from an unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
