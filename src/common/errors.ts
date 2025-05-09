import { McpError } from '@modelcontextprotocol/sdk';

/**
 * Base class for all Gravatar API errors
 */
export class GravatarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GravatarError';
  }
}

/**
 * Error thrown when the Gravatar API returns a 400 Bad Request response
 */
export class GravatarValidationError extends GravatarError {
  constructor(message: string) {
    super(`Validation Error: ${message}`);
    this.name = 'GravatarValidationError';
  }
}

/**
 * Error thrown when the Gravatar API returns a 404 Not Found response
 */
export class GravatarResourceNotFoundError extends GravatarError {
  constructor(message: string) {
    super(`Resource Not Found: ${message}`);
    this.name = 'GravatarResourceNotFoundError';
  }
}

/**
 * Error thrown when the Gravatar API returns a 401 Unauthorized response
 */
export class GravatarAuthenticationError extends GravatarError {
  constructor(message: string) {
    super(`Authentication Failed: ${message}`);
    this.name = 'GravatarAuthenticationError';
  }
}

/**
 * Error thrown when the Gravatar API returns a 403 Forbidden response
 */
export class GravatarPermissionError extends GravatarError {
  constructor(message: string) {
    super(`Permission Denied: ${message}`);
    this.name = 'GravatarPermissionError';
  }
}

/**
 * Error thrown when the Gravatar API returns a 429 Too Many Requests response
 */
export class GravatarRateLimitError extends GravatarError {
  constructor(message: string, public resetAt: Date) {
    super(`Rate Limit Exceeded: ${message}`);
    this.name = 'GravatarRateLimitError';
  }
}

/**
 * Maps a Gravatar API error to an MCP error
 */
export function mapGravatarErrorToMcpError(error: GravatarError): McpError {
  if (error instanceof GravatarValidationError) {
    return new McpError({
      code: 'invalid_request',
      message: error.message
    });
  } else if (error instanceof GravatarResourceNotFoundError) {
    return new McpError({
      code: 'not_found',
      message: error.message
    });
  } else if (error instanceof GravatarAuthenticationError) {
    return new McpError({
      code: 'authentication_error',
      message: error.message
    });
  } else if (error instanceof GravatarPermissionError) {
    return new McpError({
      code: 'permission_denied',
      message: error.message
    });
  } else if (error instanceof GravatarRateLimitError) {
    return new McpError({
      code: 'rate_limit_exceeded',
      message: error.message,
      details: {
        resetAt: error.resetAt.toISOString()
      }
    });
  } else {
    return new McpError({
      code: 'internal_error',
      message: error.message || 'An unexpected error occurred'
    });
  }
}

/**
 * Checks if an error is a Gravatar API error
 */
export function isGravatarError(error: any): error is GravatarError {
  return error instanceof GravatarError;
}
