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
 * Type guard to check if an error is an API error response
 */
export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('status' in error || ('response' in error && typeof error.response === 'object'))
  );
}
