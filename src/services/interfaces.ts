import type { DefaultAvatarOption, Rating } from '../common/types.js';

// Profile client interface
export interface IProfileClient {
  getProfileById(params: { profileIdentifier: string }): Promise<any>;
}

// Profile service interface
export interface IProfileService {
  getProfileById(hash: string): Promise<any>;
  getProfileByEmail(email: string): Promise<any>;
}

// Experimental client interface
export interface IExperimentalClient {
  getProfileInferredInterestsById(params: { profileIdentifier: string }): Promise<any>;
}

// Experimental service interface
export interface IExperimentalService {
  getInferredInterestsById(hash: string): Promise<any>;
  getInferredInterestsByEmail(email: string): Promise<any>;
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
