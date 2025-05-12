// No need to import McpError, we'll return formatted error objects directly

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
  constructor(
    message: string,
    public resetAt: Date,
  ) {
    super(`Rate Limit Exceeded: ${message}`);
    this.name = 'GravatarRateLimitError';
  }
}

/**
 * Maps a Gravatar API error to a formatted error message
 */
export function formatGravatarError(error: GravatarError): string {
  let message = `Gravatar API Error: ${error.message}`;

  if (error instanceof GravatarValidationError) {
    message = `Validation Error: ${error.message}`;
  } else if (error instanceof GravatarResourceNotFoundError) {
    message = `Not Found: ${error.message}`;
  } else if (error instanceof GravatarAuthenticationError) {
    message = `Authentication Failed: ${error.message}`;
  } else if (error instanceof GravatarPermissionError) {
    message = `Permission Denied: ${error.message}`;
  } else if (error instanceof GravatarRateLimitError) {
    message = `Rate Limit Exceeded: ${error.message}\nResets at: ${error.resetAt.toISOString()}`;
  }

  return message;
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
      return new GravatarError(message);
  }
}
