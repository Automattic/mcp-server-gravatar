import type { DefaultAvatarOption, Rating } from '../common/types.js';
import type { Profile } from '../generated/gravatar-api/models/Profile.js';
import type { Interest } from '../generated/gravatar-api/models/Interest.js';

// API Client Interfaces
export interface IProfilesApiClient {
  getProfileById(params: { profileIdentifier: string }): Promise<Profile>;
}

export interface IExperimentalApiClient {
  getProfileInferredInterestsById(params: { profileIdentifier: string }): Promise<Interest[]>;
}

// Fetch type for GravatarImageService
export type FetchFunction = typeof fetch;

// Profile service interface
export interface IProfileService {
  getProfileById(hash: string): Promise<Profile>;
  getProfileByEmail(email: string): Promise<Profile>;
}

// Experimental service interface
export interface IExperimentalService {
  getInferredInterestsById(hash: string): Promise<Interest[]>;
  getInferredInterestsByEmail(email: string): Promise<Interest[]>;
}

// Gravatar image service interface
export interface IGravatarImageService {
  getAvatarById(
    hash: string,
    size?: number,
    defaultOption?: DefaultAvatarOption,
    forceDefault?: boolean,
    rating?: Rating,
  ): Promise<Buffer>;

  getAvatarByEmail(
    email: string,
    size?: number,
    defaultOption?: DefaultAvatarOption,
    forceDefault?: boolean,
    rating?: Rating,
  ): Promise<Buffer>;
}
