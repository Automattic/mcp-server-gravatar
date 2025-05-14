import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Base class for all Gravatar API errors
 * Extends McpError to ensure MCP compliance
 */
export class GravatarError extends McpError {
  constructor(code: ErrorCode = ErrorCode.InternalError, message: string) {
    super(code, message);
    this.name = 'GravatarError';
  }
}

/**
 * Error thrown when the Gravatar API returns a 400 Bad Request response
 */
export class GravatarValidationError extends GravatarError {
  constructor(message: string) {
    super(ErrorCode.InvalidParams, `Validation Error: ${message}`);
    this.name = 'GravatarValidationError';
  }
}

/**
 * Error thrown when the Gravatar API returns a 404 Not Found response
 */
export class GravatarResourceNotFoundError extends GravatarError {
  constructor(message: string) {
    super(ErrorCode.InvalidRequest, `Resource Not Found: ${message}`);
    this.name = 'GravatarResourceNotFoundError';
  }
}

/**
 * Error thrown when the Gravatar API returns a 401 Unauthorized response
 */
export class GravatarAuthenticationError extends GravatarError {
  constructor(message: string) {
    super(ErrorCode.InvalidRequest, `Authentication Failed: ${message}`);
    this.name = 'GravatarAuthenticationError';
  }
}

/**
 * Error thrown when the Gravatar API returns a 403 Forbidden response
 */
export class GravatarPermissionError extends GravatarError {
  constructor(message: string) {
    super(ErrorCode.InvalidRequest, `Permission Denied: ${message}`);
    this.name = 'GravatarPermissionError';
  }
}

/**
 * Error thrown when the Gravatar API returns a 429 Too Many Requests response
 */
export class GravatarRateLimitError extends GravatarError {
  public resetAt: Date;

  constructor(message: string, resetAt: Date) {
    super(
      ErrorCode.InvalidRequest,
      `Rate Limit Exceeded: ${message}\nResets at: ${resetAt.toISOString()}`,
    );
    this.name = 'GravatarRateLimitError';
    this.resetAt = resetAt;
  }
}

/**
 * Checks if an error is a Gravatar API error
 */
export function isGravatarError(error: unknown): error is GravatarError {
  return error instanceof GravatarError;
}

/**
 * Maps an HTTP status code to the appropriate Gravatar error
 */
export async function mapHttpStatusToError(
  status: number,
  message: string,
): Promise<GravatarError> {
  switch (status) {
    case 400:
      return new GravatarValidationError(message);
    case 401:
      return new GravatarAuthenticationError(message);
    case 403:
      return new GravatarPermissionError(message);
    case 404:
      return new GravatarResourceNotFoundError(message);
    case 429:
      return new GravatarRateLimitError(message, new Date(Date.now() + 60000)); // Default to 1 minute
    default:
      return new GravatarError(ErrorCode.InternalError, message);
  }
}
