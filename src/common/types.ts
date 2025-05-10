/**
 * Input parameters for profile-related operations
 */
export interface ProfileParams {
  hash?: string;
  email?: string;
}

/**
 * Input parameters for avatar-related operations
 */
export interface AvatarParams {
  hash?: string;
  email?: string;
  preferredSize?: number;
  defaultAvatarOption?: DefaultAvatarOption;
  forceDefault?: boolean;
  rating?: Rating;
  initials?: string;
  name?: string;
}

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
  BLANK = 'blank'
}

/**
 * Avatar rating options
 */
export enum Rating {
  G = 'g',
  PG = 'pg',
  R = 'r',
  X = 'x'
}

/**
 * Configuration for the Gravatar API client
 */
export interface GravatarApiConfig {
  apiKey?: string;
  baseUrl?: string;
}
