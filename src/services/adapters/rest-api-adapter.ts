import type { ProfilesApi } from '../../generated/gravatar-api/apis/ProfilesApi.js';
import type { ExperimentalApi } from '../../generated/gravatar-api/apis/ExperimentalApi.js';
import type { IProfileApiAdapter, IExperimentalApiAdapter } from './interfaces.js';
import { isApiErrorResponse } from '../../common/types.js';
import { mapHttpStatusToError } from '../../common/utils.js';
import type { Profile } from '../../generated/gravatar-api/models/Profile.js';
import type { Interest } from '../../generated/gravatar-api/models/Interest.js';

/**
 * Adapter for the Gravatar REST API
 * Implements both profile and experimental API interfaces
 */
export class RestApiAdapter implements IProfileApiAdapter, IExperimentalApiAdapter {
  constructor(
    private readonly profilesApi: ProfilesApi,
    private readonly experimentalApi: ExperimentalApi,
  ) {}

  /**
   * Get a profile by its identifier (hash)
   * @param hash The profile identifier (MD5 or SHA256 hash)
   * @returns The profile data
   */
  async getProfileById(hash: string): Promise<Profile> {
    try {
      console.error(`RestApiAdapter.getProfileById called with hash: ${hash}`);
      const response = await this.profilesApi.getProfileById({ profileIdentifier: hash });
      console.error(`Received response for hash ${hash}:`, response);
      return response;
    } catch (error: unknown) {
      console.error(`Error getting profile for hash ${hash}:`, error);
      if (isApiErrorResponse(error)) {
        const mappedError = await mapHttpStatusToError(
          error.response?.status || 500,
          error.message || 'Failed to fetch profile',
        );
        console.error(`Mapped error:`, mappedError);
        throw mappedError;
      }
      throw error;
    }
  }

  /**
   * Get inferred interests for a profile by its identifier (hash)
   * @param hash The profile identifier (MD5 or SHA256 hash)
   * @returns The inferred interests
   */
  async getInferredInterestsById(hash: string): Promise<Interest[]> {
    try {
      console.error(`RestApiAdapter.getInferredInterestsById called with hash: ${hash}`);
      const response = await this.experimentalApi.getProfileInferredInterestsById({
        profileIdentifier: hash,
      });
      console.error(`Received response for hash ${hash}:`, response);
      return response;
    } catch (error: unknown) {
      console.error(`Error getting inferred interests for hash ${hash}:`, error);
      if (isApiErrorResponse(error)) {
        const mappedError = await mapHttpStatusToError(
          error.response?.status || 500,
          error.message || 'Failed to fetch inferred interests',
        );
        console.error(`Mapped error:`, mappedError);
        throw mappedError;
      }
      throw error;
    }
  }
}
