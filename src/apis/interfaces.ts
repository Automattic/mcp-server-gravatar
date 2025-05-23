import type { Profile } from '../generated/gravatar-api/models/Profile.js';
import type { Interest } from '../generated/gravatar-api/models/Interest.js';

// API Client Interfaces
export interface IProfilesApiClient {
  getProfileById(params: { profileIdentifier: string }): Promise<Profile>;
}

export interface IExperimentalApiClient {
  getProfileInferredInterestsById(params: { profileIdentifier: string }): Promise<Interest[]>;
}
