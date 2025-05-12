import type { DefaultAvatarOption, Rating } from '../common/types.js';
import type { Profile } from '../generated/gravatar-api/models/Profile.js';
import type { Interest } from '../generated/gravatar-api/models/Interest.js';

// Profile client interface
export interface IProfileClient {
  getProfileById(params: { profileIdentifier: string }): Promise<Profile>;
}

// Profile service interface
export interface IProfileService {
  getProfileById(hash: string): Promise<Profile>;
  getProfileByEmail(email: string): Promise<Profile>;
}

// Experimental client interface
export interface IExperimentalClient {
  getProfileInferredInterestsById(params: { profileIdentifier: string }): Promise<Interest[]>;
}

// Experimental service interface
export interface IExperimentalService {
  getInferredInterestsById(hash: string): Promise<Interest[]>;
  getInferredInterestsByEmail(email: string): Promise<Interest[]>;
}

// Avatar service interface
export interface IAvatarService {
  getAvatarById(
    hash: string,
    size?: number,
    defaultOption?: DefaultAvatarOption,
    forceDefault?: boolean,
    rating?: Rating
  ): Promise<Buffer>;

  getAvatarByEmail(
    email: string,
    size?: number,
    defaultOption?: DefaultAvatarOption,
    forceDefault?: boolean,
    rating?: Rating
  ): Promise<Buffer>;
}
