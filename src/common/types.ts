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
