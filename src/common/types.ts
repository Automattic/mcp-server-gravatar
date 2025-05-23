/**
 * Default avatar options
 */
export enum DefaultAvatarOption {
  INITIALS = 'initials',
  COLOR = 'color',
  NOT_FOUND = '404',
  MYSTERY_PERSON = 'mp',
  IDENTICON = 'identicon',
  MONSTERID = 'monsterid',
  WAVATAR = 'wavatar',
  RETRO = 'retro',
  ROBOHASH = 'robohash',
  BLANK = 'blank',
}

/**
 * Avatar rating options
 */
export enum Rating {
  G = 'g',
  PG = 'pg',
  R = 'r',
  X = 'x',
}

/**
 * Configuration for the Gravatar API client
 */
export interface GravatarApiConfig {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Base API error response structure
 */
export interface ApiErrorResponse {
  status: number;
  message: string;
  response?: {
    status: number;
    statusText?: string;
    data?: unknown;
  };
}

/**
 * Error response for HTTP 400 Bad Request
 */
export interface ValidationErrorResponse extends ApiErrorResponse {
  errors?: Record<string, string[]>;
}

/**
 * Error response for HTTP 404 Not Found
 */
export interface ResourceNotFoundErrorResponse extends ApiErrorResponse {
  resource?: string;
}

/**
 * Error response for HTTP 401 Unauthorized
 */
export interface AuthenticationErrorResponse extends ApiErrorResponse {
  authType?: string;
  realm?: string;
}

/**
 * Error response for HTTP 403 Forbidden
 */
export interface PermissionErrorResponse extends ApiErrorResponse {
  requiredPermission?: string;
  userPermissions?: string[];
}

/**
 * Error response for HTTP 429 Too Many Requests
 */
export interface RateLimitErrorResponse extends ApiErrorResponse {
  resetAt?: string; // ISO date string
  retryAfter?: number; // seconds
}

/**
 * Type guard to check if an error is an API error response
 */
export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('status' in error || ('response' in error && typeof error.response === 'object'))
  );
}
