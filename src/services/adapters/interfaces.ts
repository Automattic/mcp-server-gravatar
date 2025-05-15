import type { Profile } from '../../generated/gravatar-api/models/Profile.js';
import type { Interest } from '../../generated/gravatar-api/models/Interest.js';
import type { DefaultAvatarOption, Rating } from '../../common/types.js';

/**
 * Interface for the Profile API adapter
 */
export interface IProfileApiAdapter {
  /**
   * Get a profile by its identifier (hash)
   * @param hash The profile identifier (MD5 or SHA256 hash)
   * @returns The profile data
   */
  getProfileById(hash: string): Promise<Profile>;
}

/**
 * Interface for the Experimental API adapter
 */
export interface IExperimentalApiAdapter {
  /**
   * Get inferred interests for a profile by its identifier (hash)
   * @param hash The profile identifier (MD5 or SHA256 hash)
   * @returns The inferred interests
   */
  getInferredInterestsById(hash: string): Promise<Interest[]>;
}

/**
 * Interface for the Avatar API adapter
 */
export interface IAvatarApiAdapter {
  /**
   * Get an avatar by its identifier (hash)
   * @param hash The avatar identifier (MD5 or SHA256 hash)
   * @param size Optional size in pixels (1-2048)
   * @param defaultOption Optional default option if no avatar exists
   * @param forceDefault Optional flag to force the default option
   * @param rating Optional content rating filter
   * @returns The avatar image as a Buffer
   */
  getAvatarById(
    hash: string,
    size?: number,
    defaultOption?: DefaultAvatarOption,
    forceDefault?: boolean,
    rating?: Rating,
  ): Promise<Buffer>;
}
